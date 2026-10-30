"""Automated HTTP integration tests for Atlas backtesting."""

import os
import json
import math
import sys
import threading
from unittest.mock import patch
import unittest
import urllib.error
import urllib.request

from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from server import BacktestHandler, BINARY, BoundedHTTPServer


class BacktestHttpTests(unittest.TestCase):
    """Exercise the HTTP-to-C++ execution boundary."""

    @classmethod
    def setUpClass(cls):
        if not BINARY.is_file():
            raise RuntimeError(
                "Build atlas_backtest_cli before HTTP tests"
            )

        cls.server = BoundedHTTPServer(
            ("127.0.0.1", 0),
            BacktestHandler,
        )

        cls.port = cls.server.server_address[1]

        cls.thread = threading.Thread(
            target=cls.server.serve_forever,
            daemon=True,
        )
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def request(self, payload):
        body = json.dumps(payload).encode("utf-8")

        request = urllib.request.Request(
            f"http://127.0.0.1:{self.port}/backtest",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(
                request, timeout=10
            ) as response:
                return response.status, json.load(response)
        except urllib.error.HTTPError as error:
            return error.code, json.loads(error.read())

    def valid_bars(self):
        return [
            {
                "timestamp": "2026-02-02",
                "open": 100,
                "high": 105,
                "low": 95,
                "close": 100,
                "volume": 1000,
            },
            {
                "timestamp": "2026-02-03",
                "open": 110,
                "high": 115,
                "low": 105,
                "close": 110,
                "volume": 1000,
            },
            {
                "timestamp": "2026-02-04",
                "open": 120,
                "high": 130,
                "low": 115,
                "close": 125,
                "volume": 1000,
            },
        ]

    def test_health_endpoint(self):
        request = urllib.request.Request(
            f"http://127.0.0.1:{self.port}/health",
            method="GET",
        )

        with urllib.request.urlopen(
            request, timeout=10
        ) as response:
            result = json.load(response)

            self.assertEqual(response.status, 200)
            self.assertEqual(result["status"], "ok")
            self.assertEqual(
                result["service"],
                "atlas-backtest",
            )

    def test_unknown_health_route(self):
        request = urllib.request.Request(
            f"http://127.0.0.1:{self.port}/unknown",
            method="GET",
        )

        with self.assertRaises(
            urllib.error.HTTPError
        ) as caught:
            urllib.request.urlopen(
                request, timeout=10
            )

        self.assertEqual(caught.exception.code, 404)

    def test_busy_service_rejects_execution(self):
        # Occupy all execution slots without starting C++.
        from server import EXECUTION_SLOTS, MAX_CONCURRENT_BACKTESTS

        acquired = 0
        try:
            for _ in range(MAX_CONCURRENT_BACKTESTS):
                self.assertTrue(
                    EXECUTION_SLOTS.acquire(blocking=False)
                )
                acquired += 1

            status, result = self.request({
                "strategy": "buy-and-hold",
                "bars": self.valid_bars(),
            })

            self.assertEqual(status, 503)
            self.assertEqual(
                result["error"],
                "Backtest service busy",
            )
        finally:
            for _ in range(acquired):
                EXECUTION_SLOTS.release()

    def test_handler_limit_rejects_excess_connection(self):
        # Occupy every handler slot without starting threads.
        slots = self.server.handler_slots
        acquired = 0

        try:
            for _ in range(self.server.MAX_ACTIVE_HANDLERS):
                self.assertTrue(slots.acquire(blocking=False))
                acquired += 1

            self.assertFalse(slots.acquire(blocking=False))
        finally:
            for _ in range(acquired):
                slots.release()

    def test_handler_capacity_recovers_after_request(self):
        # Verify that completed requests restore handler capacity
        # without inspecting private semaphore internals.
        request = urllib.request.Request(
            f"http://127.0.0.1:{self.port}/health",
            method="GET",
        )

        for _ in range(3):
            with urllib.request.urlopen(
                request, timeout=10
            ) as response:
                self.assertEqual(response.status, 200)

        # The server must remain capable of handling new work.
        status, result = self.request({
            "strategy": "buy-and-hold",
            "bars": self.valid_bars(),
        })

        self.assertEqual(status, 200)
        self.assertEqual(result["response_version"], 1)

    def test_service_key_authentication(self):
        # Authentication must reject requests without the
        # configured server-side service credential.
        payload = json.dumps({
            "strategy": "buy-and-hold",
            "bars": self.valid_bars(),
        }).encode("utf-8")

        url = f"http://127.0.0.1:{self.port}/backtest"

        with patch.dict(
            "os.environ",
            {"ATLAS_BACKTEST_SERVICE_KEY": "test-secret"},
        ):
            request = urllib.request.Request(
                url,
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )

            with self.assertRaises(
                urllib.error.HTTPError
            ) as caught:
                urllib.request.urlopen(
                    request, timeout=10
                )

            self.assertEqual(caught.exception.code, 401)

            authorized = urllib.request.Request(
                url,
                data=payload,
                headers={
                    "Content-Type": "application/json",
                    "X-Atlas-Service-Key": "test-secret",
                },
                method="POST",
            )

            with urllib.request.urlopen(
                authorized, timeout=10
            ) as response:
                self.assertEqual(response.status, 200)

    def test_production_requires_service_key(self):
        # Production must fail before binding a network port.
        import subprocess
        import sys

        environment = os.environ.copy()
        environment["ATLAS_BACKTEST_ENV"] = "production"
        environment.pop("ATLAS_BACKTEST_SERVICE_KEY", None)

        result = subprocess.run(
            [sys.executable, str(Path(__file__).with_name("server.py"))],
            env=environment,
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn(
            "Production requires a service key",
            result.stderr,
        )

    def test_valid_backtest(self):
        status, result = self.request({
            "strategy": "buy-and-hold",
            "bars": self.valid_bars(),
        })

        self.assertEqual(status, 200)
        self.assertEqual(result["response_version"], 1)
        self.assertEqual(len(result["signals"]), 3)

        portfolio = result["portfolio"]

        self.assertEqual(len(portfolio["trades"]), 1)

        self.assertTrue(math.isclose(
            portfolio["final_equity"],
            (10000 / 110) * 125,
            rel_tol=1e-10,
        ))

    def test_custom_execution_configuration(self):
        status, result = self.request({
            "strategy": "buy-and-hold",
            "bars": self.valid_bars(),
            "capital": 20000,
            "commission": 2,
            "slippage_bps": 10,
        })

        self.assertEqual(status, 200)

        portfolio = result["portfolio"]

        self.assertEqual(portfolio["initial_capital"], 20000)
        self.assertEqual(portfolio["total_commission"], 2)
        self.assertGreater(portfolio["total_slippage_cost"], 0)

    def test_invalid_capital(self):
        status, _ = self.request({
            "strategy": "buy-and-hold",
            "bars": self.valid_bars(),
            "capital": -100,
        })

        self.assertEqual(status, 400)

    def test_invalid_sma_periods(self):
        status, _ = self.request({
            "strategy": "sma-crossover",
            "bars": self.valid_bars(),
            "fast": 10,
            "slow": 5,
        })

        self.assertEqual(status, 400)

    def test_unknown_configuration_field(self):
        status, _ = self.request({
            "strategy": "buy-and-hold",
            "bars": self.valid_bars(),
            "execute_command": "invalid",
        })

        self.assertEqual(status, 400)

    def test_invalid_high_price(self):
        bars = self.valid_bars()
        bars[0]["high"] = 90

        status, _ = self.request({
            "strategy": "buy-and-hold",
            "bars": bars,
        })

        self.assertEqual(status, 400)

    def test_duplicate_dates(self):
        bars = self.valid_bars()
        bars[1]["timestamp"] = bars[0]["timestamp"]

        status, _ = self.request({
            "strategy": "buy-and-hold",
            "bars": bars,
        })

        self.assertEqual(status, 400)

    def test_unsupported_strategy(self):
        status, _ = self.request({
            "strategy": "unsupported",
            "bars": self.valid_bars(),
        })

        self.assertEqual(status, 400)


if __name__ == "__main__":
    unittest.main(verbosity=2)
