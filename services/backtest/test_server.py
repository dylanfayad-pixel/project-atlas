"""Automated HTTP integration tests for Atlas backtesting."""

import json
import math
import sys
import threading
import unittest
import urllib.error
import urllib.request

from pathlib import Path
from http.server import ThreadingHTTPServer

sys.path.insert(0, str(Path(__file__).resolve().parent))

from server import BacktestHandler, BINARY


class BacktestHttpTests(unittest.TestCase):
    """Exercise the HTTP-to-C++ execution boundary."""

    @classmethod
    def setUpClass(cls):
        if not BINARY.is_file():
            raise RuntimeError(
                "Build atlas_backtest_cli before HTTP tests"
            )

        cls.server = ThreadingHTTPServer(
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
