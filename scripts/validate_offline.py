"""Generate fresh offline reports using this environment, then verify them."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    (ROOT / "artifacts").mkdir(exist_ok=True)
    cli = ["-m", "xuheng.cli"]
    tasks = [
        ["scripts/build_mendeley_case.py"],
        [*cli, "run", "--scenario", "data/demo_factory.json", "--incident", "data/incidents/supplier_delay.json", "--output", "artifacts/demo_run.json"],
        [*cli, "evaluate", "--scenario", "data/demo_factory.json", "--suite", "data/adversarial_suite.json", "--output", "artifacts/adversarial_report.json"],
        [*cli, "run-agent", "--case-dir", "data/cases/delivery_crisis", "--replay", "data/model_replays/delivery_crisis.json", "--output", "artifacts/agent_demo_run.json"],
        [*cli, "evaluate-agent", "--cases", "data/evals/agent_cases.json", "--replay", "data/model_replays/agent_eval_v1.json", "--output", "artifacts/agent_eval_report.json"],
        [*cli, "diagnose-request", "--scenario", "data/cases/delivery_crisis/scenario.json", "--incident", "data/cases/delivery_crisis/incident.json", "--product", "prd_sensor_node", "--requested-units", "240", "--due-hour", "112", "--output", "artifacts/infeasible_diagnostic.json"],
        [*cli, "run-graph", "--case-dir", "data/cases/mendeley_drill", "--replay", "data/model_replays/mendeley_drill.json", "--output", "artifacts/public_data_graph_run.json"],
        [*cli, "run-drill", "--case-dir", "data/cases/mendeley_drill", "--replay", "data/model_replays/mendeley_drill.json", "--seed", "20260810", "--output", "artifacts/chaos_drill_run.json"],
        ["scripts/run_showcase_comparison.py"],
        ["scripts/run_integration_validation.py"],
        ["scripts/verify_artifacts.py"],
    ]
    for args in tasks:
        print("Running:", " ".join(args), flush=True)
        subprocess.run([sys.executable, "-X", "utf8", *args], cwd=ROOT, check=True)


if __name__ == "__main__":
    main()
