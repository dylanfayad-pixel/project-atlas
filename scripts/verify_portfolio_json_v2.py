#!/usr/bin/env python3
"""Verify genuine C++ schema v2 output and its frontend fixture."""

import argparse
import json
import math
import subprocess
import tempfile
from pathlib import Path


def close(actual: float, expected: float) -> bool:
    """Compare financial results with a strict numerical tolerance."""
    return math.isclose(
        actual, expected, rel_tol=1e-9, abs_tol=1e-8
    )


def verify(data: dict) -> None:
    """Validate the cost-aware portfolio's core accounting."""
    if data.get("schema_version") != 2:
        raise ValueError("Expected schema version 2")

    if not data.get("equity_curve"):
        raise ValueError("Missing equity observations")

    if not isinstance(data.get("trades"), list):
        raise ValueError("Missing trade records")

    financial_fields = (
        "initial_capital",
        "final_equity",
        "net_profit",
        "total_return_pct",
        "maximum_drawdown_pct",
        "total_commission",
        "total_slippage_cost",
        "total_execution_cost",
    )

    for field in financial_fields:
        value = data[field]
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"Invalid financial field: {field}")
        if not math.isfinite(value):
            raise ValueError(f"Non-finite financial field: {field}")

    commissions = sum(
        trade["commission_paid"] for trade in data["trades"]
    )
    slippage = sum(
        trade["slippage_cost"] for trade in data["trades"]
    )

    if not close(commissions, data["total_commission"]):
        raise ValueError("Commission reconciliation failed")

    if not close(slippage, data["total_slippage_cost"]):
        raise ValueError("Slippage reconciliation failed")

    if not close(
        commissions + slippage,
        data["total_execution_cost"],
    ):
        raise ValueError("Total execution cost reconciliation failed")

    if not close(
        data["final_equity"],
        data["equity_curve"][-1]["equity"],
    ):
        raise ValueError("Final equity reconciliation failed")

    if not close(
        data["net_profit"],
        data["final_equity"] - data["initial_capital"],
    ):
        raise ValueError("Net profit reconciliation failed")

    expected_return = (
        data["final_equity"] / data["initial_capital"] - 1
    ) * 100

    if not close(data["total_return_pct"], expected_return):
        raise ValueError("Return reconciliation failed")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--executable", required=True)
    parser.add_argument(
        "--fixture",
        default="frontend/public/data/demo_portfolio_v2.json",
    )
    args = parser.parse_args()

    executable = Path(args.executable).resolve()
    fixture = Path(args.fixture).resolve()

    if not executable.is_file():
        raise SystemExit(f"Executable not found: {executable}")

    if not fixture.is_file():
        raise SystemExit(f"Frontend fixture not found: {fixture}")

    # Run in a temporary directory to avoid modifying the repository.
    with tempfile.TemporaryDirectory() as directory:
        subprocess.run(
            [str(executable), "--cost-demo"],
            cwd=directory,
            check=True,
            capture_output=True,
            text=True,
            timeout=30,
        )

        output = Path(directory) / "atlas_portfolio_v2.json"

        # json.loads catches malformed escaping and invalid syntax.
        generated = json.loads(output.read_text(encoding="utf-8"))
        expected = json.loads(fixture.read_text(encoding="utf-8"))

        verify(generated)
        verify(expected)

        if generated != expected:
            raise ValueError(
                "Frontend fixture differs from C++ engine output"
            )

    print("Portfolio JSON v2 integration verification passed.")


if __name__ == "__main__":
    main()
