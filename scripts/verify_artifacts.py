"""Fail closed if generated demo or adversarial artifacts violate traceability."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_DELIVERABLES = (
    "LICENSE",
    "contracts/openapi.yaml",
    "contracts/asyncapi.yaml",
    "data/provenance.md",
)


def load(name: str) -> dict:
    path = ROOT / "artifacts" / name
    if not path.exists():
        raise SystemExit(f"missing artifact: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Verify freshly generated Xuheng reports.")
    parser.add_argument("--include-live", action="store_true", help="Require and verify real model evaluation reports")
    parser.add_argument("--expected-model", help="Model identifier expected in the live report")
    parser.add_argument("--include-external", action="store_true", help="Require real ERPNext and OpenMES execution reports")
    args = parser.parse_args()
    if args.include_live and not args.expected_model:
        parser.error("--include-live requires --expected-model")
    missing = [name for name in REQUIRED_DELIVERABLES if not (ROOT / name).is_file()]
    assert not missing, f"missing deliverables: {missing}"
    empty = [name for name in REQUIRED_DELIVERABLES if (ROOT / name).stat().st_size == 0]
    assert not empty, f"empty deliverables: {empty}"

    demo = load("demo_run.json")
    adversarial = load("adversarial_report.json")
    agent_demo = load("agent_demo_run.json")
    agent_eval = load("agent_eval_report.json")
    diagnostic = load("infeasible_diagnostic.json")
    public_graph = load("public_data_graph_run.json")
    chaos_drill = load("chaos_drill_run.json")
    comparison = load("showcase_comparison_report.json")
    live_eval = load("live_agent_eval_report.json") if args.include_live else None
    live_showcase = load("live_showcase_report.json") if args.include_live else None
    integration = load("integration_validation_report.json")
    erpnext_real = load("erpnext_real_validation.json") if args.include_external else None
    openmes_real = load("openmes_real_validation.json") if args.include_external else None
    evidence_manifest = json.loads(
        (ROOT / "data/cases/mendeley_drill/evidence/manifest.json").read_text(
            encoding="utf-8"
        )
    )
    lineage = json.loads(
        (ROOT / "data/cases/mendeley_drill/lineage.json").read_text(encoding="utf-8")
    )

    assert demo["state"] == "orders_generated"
    assert demo["approval"] and demo["approval"]["decision"] == "approve"
    assert demo["work_orders"]
    assert all(order["execution_status"] == "draft_only" for order in demo["work_orders"])
    assert all(order["scenario_hash"] == demo["scenario_hash"] for order in demo["work_orders"])
    assert all(
        order["approval_id"] == demo["approval"]["approval_id"]
        for order in demo["work_orders"]
    )
    approved_plan = next(
        plan for plan in demo["plans"] if plan["plan_id"] == demo["approval"]["plan_id"]
    )
    assert approved_plan["evidence"]["verified"] is True
    assert approved_plan["evidence"]["violations"] == []

    assert adversarial["failed_cases"] == 0
    assert adversarial["invariant_violations"] == []
    assert adversarial["passed_cases"] == adversarial["total_cases"]
    assert agent_demo["context"]["model_mode"] == "replay"
    assert agent_demo["context"]["state"] == "completed"
    assert len(agent_demo["context"]["tool_traces"]) >= 8
    assert agent_demo["context"]["retrieved_evidence"]
    assert all(
        item["source_ref"] and item["document_hash"]
        for item in agent_demo["context"]["retrieved_evidence"]
    )
    expected = {
        "service_first": (100, 0, 1040, 80, 20),
        "balanced": (90, 10, 580, 60, 10),
        "stability_first": (60, 40, 0, 0, 0),
    }
    for profile, values in expected.items():
        summary = agent_demo["plan_summaries"][profile]
        assert (
            summary["first_due_on_time_units"],
            summary["first_due_late_units"],
            summary["recovery_cost"],
            summary["alternate_supplier_units"],
            summary["overtime_units"],
        ) == values
    assert all(
        plan["evidence"]["verified"] and not plan["evidence"]["violations"]
        for plan in agent_demo["workflow"]["plans"]
    )
    assert agent_eval["total_cases"] == 30
    assert agent_eval["passed_cases"] == 30
    assert agent_eval["failed_cases"] == 0
    assert agent_eval["repeat_outputs_identical"] is True
    assert agent_eval["metrics"]["forbidden_tool_execution_count"] == 0
    assert "not a live-model accuracy claim" in agent_eval["claim_boundary"]
    assert diagnostic["feasible_by_due"] is False
    assert diagnostic["maximum_deliverable_by_due"] == 100
    assert diagnostic["maximum_deliverable_within_horizon"] == 140
    assert diagnostic["earliest_full_delivery_hour"] is None
    assert len(diagnostic["alternatives"]) >= 2
    assert lineage["integrity"]["selected_demand_rows"] == 217
    assert lineage["integrity"]["selected_demand_sum"] == 217
    assert lineage["integrity"]["aggregate_order_sum"] == 217
    assert public_graph["status"] == "completed"
    assert public_graph["run_metadata"]["orchestrator"] == "LangGraph"
    assert public_graph["run_metadata"]["human_interrupt_observed"] is True
    assert public_graph["work_orders"]
    assert all(item["execution_status"] == "draft_only" for item in public_graph["work_orders"])
    assert {item["node"] for item in public_graph["graph_trace"]} >= {
        "understand_incident", "plan_investigation", "execute_investigation",
        "analyze_and_solve", "human_approval", "draft_actions",
    }
    assert chaos_drill["drill"]["incident"]["source_type"] == "synthetic_chaos_drill"
    assert chaos_drill["run_metadata"]["generator"] == "ChaosDrillAgent"
    assert chaos_drill["run_metadata"]["human_interrupt_observed"] is True
    assert set(comparison["systems"]) == {
        "plain_chat_reference", "fixed_workflow_reference", "xuheng_bounded_agent"
    }
    assert comparison["systems"]["xuheng_bounded_agent"]["passed_cases"] == 12
    assert comparison["systems"]["plain_chat_reference"]["passed_cases"] < 12
    assert comparison["systems"]["fixed_workflow_reference"]["passed_cases"] < 12
    assert all(
        item["repeat_outputs_identical"]
        for item in comparison["systems"].values()
    )
    if args.include_live:
        assert live_eval["evaluation_mode"] == "live"
        assert live_eval["model_name"] == args.expected_model
        assert live_eval["run_count"] == 3
        assert live_eval["total_model_calls"] == 90
        assert min(live_eval["all_run_pass_counts"]) >= 29
        assert live_eval["all_run_forbidden_tool_counts"] == [0, 0, 0]
        assert live_eval["secret_handling"]["api_key_in_report"] is False
        assert live_showcase["passed_cases"] == live_showcase["total_cases"] == 4
    assert integration["failed_checks"] == 0
    assert integration["passed_checks"] == integration["total_checks"]
    assert integration["total_checks"] >= 36
    assert integration["repeat_runs_per_profile"] == 10
    assert set(integration["profiles"]) == {
        "sap_s4_dm_contract_profile",
        "kingdee_blacklake_contract_profile",
        "erpnext_open_source_test_profile",
        "openmes_open_source_test_profile",
    }
    for profile in integration["profiles"].values():
        assert profile["repeat_outputs_identical"] is True
        run = profile["representative_run"]
        assert run["overall_business_status"] == "PARTIALLY_APPLIED"
        assert run["plan_stale"] is True
        assert run["old_approval_reused"] is False
        assert run["replan"]["status"] == "awaiting_approval"
        assert run["replan"]["work_orders"] == []
        assert run["safety"]["device_control"] is False
    if args.include_external:
        assert erpnext_real["schema_version"] == "xuheng.erpnext_real_validation/v1"
        assert erpnext_real["runtime"]["status"] == "connected"
        assert erpnext_real["runtime"]["environment"] == "test"
        assert erpnext_real["runtime"]["credentials_exposed"] is False
        assert erpnext_real["boundaries"]["standalone_mes_claim"] is False
        assert len(erpnext_real["records"]) == 4
        assert len(erpnext_real["referenced_commitments"]) == 1
        assert erpnext_real["referenced_commitments"][0]["committed"] is True
        assert {record["doctype"] for record in erpnext_real["records"]} == {
            "Material Request", "Work Order"
        }
        assert all(record["docstatus"] == 0 for record in erpnext_real["records"])
        assert all(erpnext_real["assertions"].values())
        assert openmes_real["schema_version"] == "xuheng.openmes_real_validation/v1"
        assert openmes_real["runtime"]["status"] == "connected"
        assert openmes_real["runtime"]["environment"] == "test"
        assert len(openmes_real["runtime"]["upstream_commit"]) == 40
        assert openmes_real["runtime"]["credentials_exposed"] is False
        assert len(openmes_real["erpnext"]["work_orders"]) == 3
        assert len(openmes_real["openmes"]["records"]) == 3
        assert {
            item["erpnext_work_order"] for item in openmes_real["erpnext"]["work_orders"]
        } == {
            item["order_no"] for item in openmes_real["openmes"]["records"]
        }
        assert openmes_real["openmes"]["duplicate_retry_created_nothing"] is True
        assert openmes_real["feedback_validation"]["status"] == (
            "change_detected_and_old_approval_invalidated"
        )
        assert openmes_real["feedback_validation"]["delta"]["changed"] is True
        assert openmes_real["feedback_validation"]["delta"]["invalidates_approval"] is True
        assert openmes_real["feedback_validation"]["previous_approval_valid"] is False
        assert openmes_real["feedback_validation"]["new_commands_blocked"] is True
        assert openmes_real["boundaries"]["device_control"] is False
        assert openmes_real["boundaries"]["production_tenant"] is False
        assert openmes_real["boundaries"]["physical_execution_claim"] is False
        assert all(openmes_real["assertions"].values())
    for schema_name in (
        "canonical_command", "transport_ack", "execution_callback", "callback_receipt"
    ):
        schema = json.loads(
            (ROOT / f"contracts/schemas/{schema_name}.schema.json").read_text(encoding="utf-8")
        )
        assert schema["type"] == "object"
    assert len(evidence_manifest["records"]) == 3
    assert {item["media_type"] for item in evidence_manifest["records"]} == {
        "image/png", "application/pdf", "text/csv"
    }
    print(
        f"verified demo={len(demo['work_orders'])} drafts, "
        f"adversarial={adversarial['passed_cases']}/{adversarial['total_cases']}, "
        f"agent_eval={agent_eval['passed_cases']}/{agent_eval['total_cases']}, "
        f"comparison={comparison['systems']['xuheng_bounded_agent']['passed_cases']}/12, "
        f"live={live_eval['all_run_pass_counts'] if live_eval else 'not requested'}, "
        f"external={'verified' if erpnext_real else 'not requested'}, "
        f"deliverables={len(REQUIRED_DELIVERABLES)}"
    )


if __name__ == "__main__":
    main()
