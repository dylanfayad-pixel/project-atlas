"""Local-only HTTP adapter for the Atlas C++ backtesting CLI."""

import json
import hmac
import math
import re
import os
import subprocess
import tempfile
import threading

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
# Production containers may install the CLI outside the build tree.
BINARY = Path(
    os.environ.get(
        "ATLAS_BACKTEST_BINARY",
        str(ROOT / "build" / "atlas_backtest_cli"),
    )
)

MAX_BODY_BYTES = 2 * 1024 * 1024
MAX_BARS = 10000
TIMEOUT_SECONDS = 5

# Bound expensive C++ executions per service process.
MAX_CONCURRENT_BACKTESTS = 2
EXECUTION_SLOTS = threading.BoundedSemaphore(
    MAX_CONCURRENT_BACKTESTS
)


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


class BoundedHTTPServer(ThreadingHTTPServer):
    """Limit active HTTP handler threads per service instance."""

    daemon_threads = True
    block_on_close = False

    MAX_ACTIVE_HANDLERS = 8

    def __init__(self, server_address, handler_class):
        self.handler_slots = threading.BoundedSemaphore(
            self.MAX_ACTIVE_HANDLERS
        )
        super().__init__(server_address, handler_class)

    def process_request(self, request, client_address):
        # Bound how long a client can stall a socket operation.
        request.settimeout(5)

        # Reject excess connections before creating a new thread.
        if not self.handler_slots.acquire(blocking=False):
            self.shutdown_request(request)
            return

        try:
            super().process_request(request, client_address)
        except BaseException:
            self.handler_slots.release()
            raise

    def process_request_thread(self, request, client_address):
        try:
            super().process_request_thread(
                request,
                client_address,
            )
        finally:
            self.handler_slots.release()


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

    def do_GET(self):
        # Health checks never execute user-supplied workloads.
        if self.path != "/health":
            self.send_json(404, {"error": "Not found"})
            return

        if BINARY.is_file() and os.access(BINARY, os.X_OK):
            self.send_json(200, {
                "status": "ok",
                "service": "atlas-backtest",
            })
        else:
            self.send_json(503, {
                "status": "unavailable",
                "service": "atlas-backtest",
            })

    def do_POST(self):
        if self.path != "/backtest":
            self.send_json(404, {"error": "Not found"})
            return

        # A configured service key protects the execution endpoint.
        # Local development remains usable without a key.
        expected_key = os.environ.get(
            "ATLAS_BACKTEST_SERVICE_KEY", ""
        )

        if expected_key:
            supplied_key = self.headers.get(
                "X-Atlas-Service-Key", ""
            )

            if not hmac.compare_digest(
                supplied_key,
                expected_key,
            ):
                self.send_json(
                    401,
                    {"error": "Unauthorized"},
                )
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

                # Reject excess execution work rather than queueing
                # unbounded C++ subprocesses.
                if not EXECUTION_SLOTS.acquire(blocking=False):
                    self.send_json(
                        503,
                        {"error": "Backtest service busy"},
                    )
                    return

                try:
                    result = subprocess.run(
                        arguments,
                        capture_output=True,
                        text=True,
                        timeout=TIMEOUT_SECONDS,
                        check=False,
                    )
                finally:
                    EXECUTION_SLOTS.release()

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
    # Production must never start without gateway authentication.
    environment = os.environ.get(
        "ATLAS_BACKTEST_ENV",
        "development",
    )
    service_key = os.environ.get(
        "ATLAS_BACKTEST_SERVICE_KEY",
        "",
    )

    if environment not in ("development", "production"):
        raise ValueError("Invalid backtest environment")

    if environment == "production" and len(service_key) < 32:
        raise ValueError(
            "Production requires a service key of at least 32 characters"
        )

    # Development defaults to loopback; containers explicitly set
    # their bind address through ATLAS_BACKTEST_HOST.
    host = os.environ.get(
        "ATLAS_BACKTEST_HOST",
        "127.0.0.1",
    )
    port = int(os.environ.get("PORT", "8765"))

    if not 1 <= port <= 65535:
        raise ValueError("Invalid HTTP port")

    server = BoundedHTTPServer(
        (host, port),
        BacktestHandler,
    )

    print(f"Atlas backtest service: http://{host}:{port}")
    server.serve_forever()
