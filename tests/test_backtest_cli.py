"""Integration checks for the Atlas C++ backtesting CLI."""

import json
import math
import subprocess
import sys
import tempfile
from pathlib import Path


def invoke(binary, csv_path, *arguments):
    """Run the CLI without a shell or arbitrary command execution."""
    return subprocess.run(
        [str(binary), str(csv_path), *arguments],
        capture_output=True,
        text=True,
        timeout=10,
        check=False,
    )


def require(condition, message):
    """Fail the integration suite with a useful explanation."""
    if not condition:
        raise AssertionError(message)


def main():
    binary = Path(sys.argv[1]).resolve()

    with tempfile.TemporaryDirectory() as directory:
        csv_path = Path(directory) / "observations.csv"
        csv_path.write_text(
            "timestamp,open,high,low,close,volume\n"
            "2026-01-05,100,105,98,103,1000000\n"
            "2026-01-06,103,108,101,107,1100000\n"
            "2026-01-07,107,110,104,105,1200000\n"
            "2026-01-08,105,109,102,108,1050000\n"
            "2026-01-09,108,112,106,111,1250000\n"
            "2026-01-12,111,114,109,113,1300000\n"
            "2026-01-13,113,116,110,112,1150000\n"
            "2026-01-14,112,115,108,109,1400000\n",
            encoding="utf-8",
        )

        result = invoke(
            binary,
            csv_path,
            "buy-and-hold",
            "--capital", "20000",
            "--commission", "2",
            "--slippage-bps", "10",
        )

        require(result.returncode == 0, result.stderr)

        response = json.loads(result.stdout)
        require(
            response["response_version"] == 1,
            "Wrong backtest response version",
        )
        require(
            len(response["signals"]) == 8,
            "Incorrect signal history length",
        )
        data = response["portfolio"]

        require(data["schema_version"] == 3, "Wrong schema")
        require(data["initial_capital"] == 20000, "Wrong capital")
        require(len(data["trades"]) == 1, "Expected one trade")
        require(data["total_commission"] == 2, "Wrong commission")

        require(
            math.isclose(
                data["final_equity"],
                21141.790248586367,
                rel_tol=1e-10,
            ),
            "Incorrect final equity",
        )

        require(
            math.isclose(
                data["total_return_pct"],
                5.708951242931826,
                rel_tol=1e-10,
            ),
            "Incorrect net return",
        )

        invalid_cases = [
            ("buy-and-hold", "--capital", "-100"),
            ("buy-and-hold", "--capital", "nan"),
            ("buy-and-hold", "--commission", "-1"),
            ("buy-and-hold", "--slippage-bps", "10000"),
            ("sma-crossover", "--fast", "10", "--slow", "5"),
            ("sma-crossover", "--fast", "0"),
            ("unsupported",),
            ("buy-and-hold", "--capital", "10000",
             "--capital", "20000"),
            ("buy-and-hold", "--commission", "1",
             "--commission", "2"),
        ]

        for arguments in invalid_cases:
            result = invoke(binary, csv_path, *arguments)
            require(
                result.returncode != 0,
                f"Invalid configuration accepted: {arguments}",
            )

        oversized_path = Path(directory) / "oversized.csv"

        with oversized_path.open("wb") as output:
            output.truncate(17 * 1024 * 1024)

        oversized = invoke(
            binary,
            oversized_path,
            "buy-and-hold",
        )

        require(
            oversized.returncode != 0,
            "Oversized CSV was accepted",
        )

        # Independently derived next-bar execution reference.
        reference_path = Path(directory) / "reference.csv"
        reference_path.write_text(
            "\n".join([
                "timestamp,open,high,low,close,volume",
                "2026-02-02,100,105,95,100,1000",
                "2026-02-03,110,115,105,110,1000",
                "2026-02-04,120,130,115,125,1000",
            ]) + "\n",
            encoding="utf-8",
        )

        reference = invoke(
            binary,
            reference_path,
            "buy-and-hold",
            "--capital", "1000",
        )

        require(reference.returncode == 0, reference.stderr)

        reference_response = json.loads(reference.stdout)
        reference_data = reference_response["portfolio"]

        require(
            reference_response["signals"][0]["signal"] == "BUY",
            "Expected initial BUY signal",
        )

        expected_equity = (1000.0 / 110.0) * 125.0
        expected_return = (
            (expected_equity / 1000.0) - 1.0
        ) * 100.0

        require(
            math.isclose(
                reference_data["final_equity"],
                expected_equity,
                rel_tol=1e-10,
            ),
            "Next-bar final equity calculation is incorrect",
        )

        require(
            math.isclose(
                reference_data["total_return_pct"],
                expected_return,
                rel_tol=1e-10,
            ),
            "Next-bar return calculation is incorrect",
        )

        require(
            len(reference_data["trades"]) == 1,
            "Expected exactly one executed BUY",
        )

        require(
            math.isclose(
                reference_data["trades"][0]["price"],
                110.0,
                rel_tol=1e-10,
            ),
            "BUY executed at the wrong price",
        )

        print("PASS: Backtest CLI integration checks")


if __name__ == "__main__":
    main()
