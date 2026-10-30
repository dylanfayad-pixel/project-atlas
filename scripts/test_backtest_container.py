"""End-to-end smoke test for the containerized Atlas C++ service."""

import json
import subprocess
import time
import urllib.error
import urllib.request
import uuid


IMAGE = "atlas-backtest:ci"
NAME = f"atlas-backtest-ci-{uuid.uuid4().hex[:12]}"


def docker(*args):
    """Execute Docker commands and fail on unsuccessful operations."""
    return subprocess.run(
        ["docker", *args],
        check=True,
        text=True,
        capture_output=True,
    )


def request(url, payload=None):
    """Send a local HTTP request and return status plus JSON."""
    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST" if payload is not None else "GET",
    )

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, json.load(error)


def main():
    """Build, run, verify, and clean up the test container."""
    docker("build", "-t", IMAGE, ".")

    try:
        docker(
            "run", "-d",
            "--name", NAME,
            "--read-only",
            "--tmpfs", "/tmp:rw,noexec,nosuid,size=32m",
            "--cap-drop", "ALL",
            "--security-opt", "no-new-privileges",
            "--memory", "256m",
            "--cpus", "1",
            "-p", "127.0.0.1::8765",
            IMAGE,
        )

        port_output = docker("port", NAME, "8765/tcp").stdout.strip()
        port = int(port_output.rsplit(":", 1)[1])
        base = f"http://127.0.0.1:{port}"

        # Wait for application readiness rather than assuming
        # the HTTP listener starts immediately.
        for _ in range(30):
            try:
                status, health = request(base + "/health")
                if status == 200 and health["status"] == "ok":
                    break
            except (OSError, ValueError):
                pass
            time.sleep(1)
        else:
            raise RuntimeError("Container never became healthy")

        print("PASS: Container health")

        bars = [
            ("2026-01-05", 100, 105, 98, 103, 1500000),
            ("2026-01-06", 103, 108, 101, 106, 1700000),
            ("2026-01-07", 106, 107, 99, 101, 1400000),
            ("2026-01-08", 101, 104, 97, 99, 1650000),
            ("2026-01-09", 99, 103, 96, 102, 1800000),
        ]

        payload = {
            "bars": [
                dict(zip(
                    ("timestamp", "open", "high", "low", "close", "volume"),
                    row,
                ))
                for row in bars
            ],
            "strategy": "buy-and-hold",
            "capital": 10000,
            "commission": 0,
            "slippage_bps": 0,
            "fast": 3,
            "slow": 5,
        }

        status, result = request(base + "/backtest", payload)
        assert status == 200
        assert result["response_version"] == 1
        assert abs(
            result["portfolio"]["final_equity"] -
            9902.912621359224
        ) < 0.01
        assert len(result["portfolio"]["trades"]) == 1

        print("PASS: Containerized C++ backtest")

        payload["capital"] = -100
        status, _ = request(base + "/backtest", payload)
        assert status == 400

        print("PASS: Invalid request rejected")

    finally:
        subprocess.run(
            ["docker", "rm", "-f", NAME],
            capture_output=True,
            check=False,
        )


if __name__ == "__main__":
    main()
