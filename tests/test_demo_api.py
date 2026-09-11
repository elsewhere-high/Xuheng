import json
import threading
import pytest
from urllib.request import Request, urlopen

from xuheng.demo_api import CASE, DemoApiApplication, DemoApiService
from xuheng.graph import XuhengGraph
from xuheng.llm import ReplayLanguageModel


class InteractiveReplayModel(ReplayLanguageModel):
    def complete_structured(self, *, replay_key, system_prompt, user_text, schema):
        return super().complete_structured(
            replay_key="mendeley_seat_delay_email",
            system_prompt=system_prompt,
            user_text=user_text,
            schema=schema,
        )


def replay_graph_factory() -> XuhengGraph:
    return XuhengGraph(
        scenario_path=CASE / "scenario.json",
        knowledge_paths=[
            CASE / "customer_sla.md",
            CASE / "procurement_policy.md",
            CASE / "safety_policy.md",
        ],
        model=InteractiveReplayModel(
            CASE.parents[1] / "model_replays/mendeley_drill.json"
        ),
    )


def request_json(base_url: str, method: str, path: str, payload=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    request = Request(
        base_url + path,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    with urlopen(request, timeout=10) as response:
        return response.status, json.loads(response.read().decode("utf-8"))


def test_offline_entry_uses_fixed_source_and_rejects_custom_input():
    application = DemoApiApplication()
    with pytest.raises(ValueError, match="固定"):
        application.run_agent({"mode": "replay", "text": "pretend this arbitrary input was analyzed"})
    with pytest.raises(ValueError, match="固定"):
        application.run_agent({"mode": "replay", "case_id": "unknown"})
    with pytest.raises(ValueError, match="8"):
        application.run_agent({"mode": "live", "text": "short"})
    run = application.run_agent({"mode": "replay", "case_id": "seat_delay"})
    assert run["run_mode"] == "replay"
    assert run["result"]["status"] == "awaiting_approval"
    assert all(plan["evidence"]["verified"] for plan in run["result"]["plans"])
    with pytest.raises(ValueError, match="审批决定"):
        application.approve({"session_id": run["session_id"], "decision": "skip"})
    rejected = application.approve({"session_id": run["session_id"], "decision": "reject"})
    assert rejected["result"]["status"] == "rejected"
    assert rejected["result"]["work_orders"] == []
    with pytest.raises(ValueError):
        application.run_integration({"session_id": run["session_id"]})


def test_health_keeps_model_and_erpnext_configuration_independent(monkeypatch):
    monkeypatch.setattr("xuheng.demo_api.load_runtime_credentials", lambda: None)
    monkeypatch.setenv("XUHENG_LLM_BASE_URL", "https://model.example.test/v1")
    monkeypatch.setenv("XUHENG_LLM_MODEL", "test-model")
    monkeypatch.setenv("XUHENG_API_KEY", "model-secret")
    for key in (
        "XUHENG_ERPNEXT_BASE_URL",
        "XUHENG_ERPNEXT_API_KEY",
        "XUHENG_ERPNEXT_API_SECRET",
        "XUHENG_ERPNEXT_CREDENTIAL_FILE",
    ):
        monkeypatch.delenv(key, raising=False)
    health = DemoApiApplication(graph_factory=replay_graph_factory).health()
    assert health["live_model_configured"] is True
    assert health["model_name"] == "test-model"
    assert health["erpnext_configured"] is False
    assert "model-secret" not in json.dumps(health)


def test_erpnext_revision_change_keeps_old_approval_invalid_on_later_polls(monkeypatch):
    before = {
        "source_revision": "erpnext:before",
        "content_hash": "before",
        "entities": {"Work Order": [], "Job Card": [], "Material Request": []},
    }
    after = {
        "source_revision": "erpnext:after",
        "content_hash": "after",
        "entities": {
            "Work Order": [{"name": "MFG-WO-1", "status": "In Process"}],
            "Job Card": [{"name": "JOB-1", "status": "Open"}],
            "Material Request": [],
        },
    }

    class SnapshotAdapter:
        def execution_snapshot(self, _watch_scope=None):
            return after

    application = DemoApiApplication(graph_factory=replay_graph_factory)
    application.sessions["session_feedback"] = {
        "result": {
            "workflow": {"approval": {"approval_id": "approval_old"}},
            "work_orders": [{"work_order_id": "old_draft"}],
        },
        "erpnext_baseline": before,
        "erpnext_watch_scope": {"Work Order": ["MFG-WO-1"], "Material Request": []},
        "erpnext_approval_invalidated": False,
    }
    monkeypatch.setattr(
        application,
        "_erpnext_runtime",
        lambda: (None, SnapshotAdapter(), None),
    )
    first = application.check_erpnext_feedback({"session_id": "session_feedback"})
    second = application.check_erpnext_feedback({"session_id": "session_feedback"})
    assert first["delta"]["changed"] is True
    assert second["delta"]["changed"] is False
    assert first["reconciliation"]["previous_approval_valid"] is False
    assert second["reconciliation"]["previous_approval_valid"] is False
    assert second["reconciliation"]["new_commands_blocked"] is True
    assert second["reconciliation"]["work_orders"] == []


def test_judge_api_runs_graph_approval_and_real_http_contract_sandbox():
    application = DemoApiApplication(graph_factory=replay_graph_factory)
    service = DemoApiService(application=application, port=0)
    thread = threading.Thread(target=service.serve_forever, daemon=True)
    thread.start()
    try:
        status, contracts = request_json(service.base_url, "GET", "/api/v1/contracts")
        assert status == 200
        assert any(row["path"] == "/sandbox/v1/commands" for row in contracts["routes"])
        assert len(contracts["vendor_official_evidence"]) == 4
        assert all(
            item["links"] and all(link["url"].startswith("https://") for link in item["links"])
            for item in contracts["vendor_official_evidence"]
        )

        status, run = request_json(
            service.base_url,
            "POST",
            "/api/v1/agent/run",
            {
                "text": (
                    "The public Mendeley seat supplier cannot dispatch for the next "
                    "48 hours. Please assess affected orders."
                )
            },
        )
        assert status == 200
        assert run["run_mode"] == "replay"
        assert run["result"]["status"] == "awaiting_approval"
        assert run["result"]["impact"]["affected_orders"]

        status, approved = request_json(
            service.base_url,
            "POST",
            "/api/v1/agent/approve",
            {"session_id": run["session_id"], "profile": "balanced"},
        )
        assert status == 200
        assert approved["result"]["status"] == "completed"
        assert approved["result"]["work_orders"]

        status, integrated = request_json(
            service.base_url,
            "POST",
            "/api/v1/integration/run",
            {
                "session_id": run["session_id"],
                "profile": "kingdee_blacklake_contract_profile",
            },
        )
        assert status == 200
        report = integrated["report"]
        assert report["http_boundary"]["command_posts"] == 2
        assert report["http_boundary"]["callback_posts"] == 2
        assert report["overall_business_status"] == "PARTIALLY_APPLIED"
        assert {item["business_status"] for item in report["transport_acks"]} == {"PENDING"}
        assert {item["business_status"] for item in report["callbacks"]} == {"APPLIED", "REJECTED"}
        assert report["replan"]["status"] == "awaiting_approval"
        assert report["old_approval_reused"] is False
    finally:
        service.close()
        thread.join(timeout=2)
