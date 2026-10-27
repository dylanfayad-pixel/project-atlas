#!/usr/bin/env python3
"""Verify the C++ portfolio demo's JSON output contract."""

import argparse
import json
import math
import subprocess
import tempfile
from pathlib import Path


def close(actual, expected):
    """Compare financial values using a small numeric tolerance."""
    return math.isclose(
        actual, expected, rel_tol=1e-9, abs_tol=1e-8
    )


def verify(data):
    """Check the known synthetic demonstration results."""
    assert data["schema_version"] == 1
    assert data["strategy"] == "SMA Crossover (3/5)"

    assert close(data["initial_capital"], 10000)
    assert close(data["final_equity"], 4000)
    assert close(data["net_profit"], -6000)
    assert close(data["total_return_pct"], -60)
    assert close(data["maximum_drawdown_pct"], 60)

    equity = data["equity_curve"]
    trades = data["trades"]

    assert len(equity) == 12
    assert len(trades) == 2

    # The final equity observation must match the summary.
    assert close(equity[-1]["equity"], data["final_equity"])

    # Validate the known next-bar execution events.
    assert trades[0]["timestamp"] == "Day 9"
    assert trades[0]["side"] == "BUY"
    assert close(trades[0]["price"], 10)

    assert trades[1]["timestamp"] == "Day 12"
    assert trades[1]["side"] == "SELL"
    assert close(trades[1]["price"], 4)

    # Every recorded financial value must be finite.
    for point in equity:
        for field in ("cash", "shares", "equity"):
            assert math.isfinite(point[field])

    for trade in trades:
        assert math.isfinite(trade["price"])
        assert math.isfinite(trade["quantity"])

    print("Portfolio JSON integration verification passed.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--executable",
        default="build-release/atlas_portfolio_demo",
    )
    args = parser.parse_args()

    executable = Path(args.executable).resolve()

    if not executable.is_file():
        raise SystemExit(
            f"Portfolio demo executable not found: {executable}"
        )

    # Run in a temporary directory so generated output never
    # modifies tracked repository fixtures.
    with tempfile.TemporaryDirectory(
        prefix="atlas-json-test-"
    ) as directory:
        subprocess.run(
            [str(executable)],
            cwd=directory,
            check=True,
            capture_output=True,
            text=True,
            timeout=30,
        )

        output = Path(directory) / "atlas_portfolio.json"

        with output.open(encoding="utf-8") as file:
            data = json.load(file)

        verify(data)


if __name__ == "__main__":
    main()
