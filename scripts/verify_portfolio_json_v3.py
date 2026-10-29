#!/usr/bin/env python3
"""Validate the C++ JSON v3 reporting contract."""

import json
import math
import subprocess
import sys


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def finite(value):
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
    )


def reject_constant(value):
    raise ValueError(f"Invalid JSON constant: {value}")


def main():
    if len(sys.argv) != 2:
        raise SystemExit(
            "Usage: verify_portfolio_json_v3.py <generator>"
        )

    output = subprocess.check_output(
        [sys.argv[1]], text=True
    )

    data = json.loads(
        output,
        parse_constant=reject_constant,
    )

    require(data["schema_version"] == 3,
            "Incorrect schema version")

    require(finite(data["initial_capital"]),
            "Invalid initial capital")

    require(finite(data["final_equity"]),
            "Invalid final equity")

    require(
        math.isclose(
            data["final_equity"],
            7000.0,
            rel_tol=1e-9,
        ),
        "Unexpected final equity",
    )

    require(
        math.isclose(
            data["net_profit"],
            data["final_equity"] - data["initial_capital"],
            rel_tol=1e-9,
            abs_tol=1e-9,
        ),
        "Net profit reconciliation failed",
    )

    require(
        math.isclose(
            data["total_execution_cost"],
            data["total_commission"]
            + data["total_slippage_cost"],
            rel_tol=1e-9,
            abs_tol=1e-9,
        ),
        "Execution cost reconciliation failed",
    )

    equity = data["equity_curve"]
    trades = data["trades"]

    require(len(equity) == 4,
            "Incorrect equity observation count")

    require(len(trades) == 2,
            "Incorrect trade count")

    risk = data["risk_metrics"]

    require(
        risk["return_observations"] == len(equity) - 1,
        "Risk observation count mismatch",
    )

    for key in (
        "annualized_volatility_pct",
        "sharpe_ratio",
        "downside_deviation_pct",
        "sortino_ratio",
    ):
        value = risk[key]
        require(
            value is None or finite(value),
            f"Invalid risk metric: {key}",
        )

    exposure = data["exposure"]
    observations = exposure["observations"]

    require(
        len(observations) == len(equity),
        "Exposure observation count mismatch",
    )

    fractions = []

    for point, observation in zip(equity, observations):
        require(
            point["index"] == observation["index"],
            "Exposure index mismatch",
        )

        require(
            point["timestamp"] == observation["timestamp"],
            "Exposure timestamp mismatch",
        )

        fraction = observation["fraction"]

        require(
            finite(fraction) and 0.0 <= fraction <= 1.0,
            "Invalid exposure fraction",
        )

        fractions.append(fraction)

    require(
        math.isclose(
            exposure["maximum_observed_fraction"],
            max(fractions, default=0.0),
            rel_tol=1e-9,
            abs_tol=1e-9,
        ),
        "Maximum exposure reconciliation failed",
    )

    controls = data["risk_controls"]
    events = controls["events"]

    require(len(events) == 2,
            "Incorrect risk-event count")

    require(
        events[0]["type"] == "DRAWDOWN_BREACH",
        "Missing drawdown breach",
    )

    require(
        events[1]["type"] == "LIQUIDATION_EXECUTED",
        "Missing liquidation event",
    )

    require(
        events[0]["index"] < events[1]["index"],
        "Risk-event chronology invalid",
    )

    sell_fills = [
        trade for trade in trades
        if trade["side"] == "SELL"
        and trade["index"] == events[1]["index"]
    ]

    require(
        len(sell_fills) == 1,
        "Liquidation event lacks unique SELL fill",
    )

    print("Portfolio JSON v3 integration verification passed.")


if __name__ == "__main__":
    main()
