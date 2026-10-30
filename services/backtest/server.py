"""Local-only HTTP adapter for the Atlas C++ backtesting CLI."""

import json
import math
import re
import os
import subprocess
import tempfile

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
BINARY = ROOT / "build" / "atlas_backtest_cli"

MAX_BODY_BYTES = 2 * 1024 * 1024
MAX_BARS = 10000
TIMEOUT_SECONDS = 5


DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def validate_bars(bars):
    """Reject malformed or inconsistent OHLCV observations."""
    if not isinstance(bars, list) or not 1 <= len(bars) <= MAX_BARS:
        raise ValueError("Invalid observation count")

    previous_date = None
    required = {
        "timestamp", "open", "high", "low", "close", "volume"
    }

    for bar in bars:
        if not isinstance(bar, dict) or set(bar) != required:
            raise ValueError("Invalid observation fields")

        date = bar["timestamp"]

        if not isinstance(date, str) or not DATE_PATTERN.fullmatch(date):
            raise ValueError("Invalid observation date")

        if previous_date is not None and date <= previous_date:
            raise ValueError("Dates must be strictly increasing")

        previous_date = date

        prices = [
            bar["open"], bar["high"],
            bar["low"], bar["close"]
        ]

        if any(
            type(value) not in (int, float)
            or not math.isfinite(value)
            or value <= 0
            for value in prices
        ):
            raise ValueError("Invalid OHLC prices")

        opening, high, low, closing = prices

        if high < max(opening, closing, low):
            raise ValueError("Invalid high price")

        if low > min(opening, closing, high):
            raise ValueError("Invalid low price")

        volume = bar["volume"]

        if (
            type(volume) is not int
            or volume < 0
            or volume > 2**64 - 1
        ):
            raise ValueError("Invalid volume")


def validate_config(payload):
    """Validate numerical parameters before invoking C++."""
    allowed = {
        "bars", "strategy", "capital",
        "commission", "slippage_bps",
        "fast", "slow",
    }

    if not isinstance(payload, dict) or set(payload) - allowed:
        raise ValueError("Unsupported request fields")

    config = {}

    for key, default in (
        ("capital", 10000.0),
        ("commission", 0.0),
        ("slippage_bps", 0.0),
    ):
        value = payload.get(key, default)

        if type(value) not in (int, float):
            raise ValueError("Invalid numerical configuration")

        if not math.isfinite(value):
            raise ValueError("Non-finite configuration")

        config[key] = value

    if (
        config["capital"] <= 0
        or config["commission"] < 0
        or not 0 <= config["slippage_bps"] < 10000
    ):
        raise ValueError("Invalid execution configuration")

    for key, default in (("fast", 3), ("slow", 5)):
        value = payload.get(key, default)

        if type(value) is not int or not 1 <= value <= 100000:
            raise ValueError("Invalid SMA period")

        config[key] = value

    if config["fast"] >= config["slow"]:
        raise ValueError("Fast SMA must be shorter than slow SMA")

    return config


class BacktestHandler(BaseHTTPRequestHandler):
    """Validate requests and execute only the approved Atlas CLI."""

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")

        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/backtest":
            self.send_json(404, {"error": "Not found"})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))

            if length <= 0 or length > MAX_BODY_BYTES:
                self.send_json(413, {"error": "Invalid request size"})
                return

            payload = json.loads(self.rfile.read(length))

            bars = payload["bars"]
            strategy = payload["strategy"]
            config = validate_config(payload)

            validate_bars(bars)

            if strategy not in ("buy-and-hold", "sma-crossover"):
                raise ValueError("Unsupported strategy")

            columns = (
                "timestamp",
                "open",
                "high",
                "low",
                "close",
                "volume",
            )

            with tempfile.TemporaryDirectory() as directory:
                csv_path = Path(directory) / "data.csv"

                with csv_path.open("w", encoding="utf-8") as output:
                    output.write(",".join(columns) + "\n")

                    for bar in bars:
                        if not isinstance(bar, dict):
                            raise ValueError("Invalid observation")

                        output.write(
                            ",".join(str(bar[key]) for key in columns)
                            + "\n"
                        )

                arguments = [
                    str(BINARY),
                    str(csv_path),
                    strategy,
                    "--capital", str(config["capital"]),
                    "--commission", str(config["commission"]),
                    "--slippage-bps", str(config["slippage_bps"]),
                    "--fast", str(config["fast"]),
                    "--slow", str(config["slow"]),
                ]

                result = subprocess.run(
                    arguments,
                    capture_output=True,
                    text=True,
                    timeout=TIMEOUT_SECONDS,
                    check=False,
                )

                if result.returncode != 0:
                    self.send_json(
                        422,
                        {"error": "Backtest execution rejected"},
                    )
                    return

                self.send_json(200, json.loads(result.stdout))

        except (KeyError, TypeError, ValueError, json.JSONDecodeError):
            self.send_json(400, {"error": "Invalid backtest request"})
        except subprocess.TimeoutExpired:
            self.send_json(504, {"error": "Backtest timed out"})
        except OSError:
            self.send_json(503, {"error": "Backtest engine unavailable"})


if __name__ == "__main__":
    # Development-only listener; never bind publicly.
    server = ThreadingHTTPServer(
        ("127.0.0.1", 8765),
        BacktestHandler,
    )

    print("Atlas local backtest service: http://127.0.0.1:8765")
    server.serve_forever()
