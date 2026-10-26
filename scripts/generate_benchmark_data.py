#!/usr/bin/env python3

import argparse
import csv
from datetime import date, timedelta
from pathlib import Path


def generate(output: Path, rows: int) -> None:
    if rows < 1 or rows > 100000:
        raise ValueError("Rows must be between 1 and 100000")

    output.parent.mkdir(parents=True, exist_ok=True)

    start = date(2000, 1, 1)

    with output.open("w", newline="") as file:
        writer = csv.writer(file)

        writer.writerow([
            "timestamp", "open", "high",
            "low", "close", "volume"
        ])

        for i in range(rows):
            current = start + timedelta(days=i)

            base = 100.0 + (i % 100) * 0.1

            writer.writerow([
                current.isoformat(),
                f"{base:.2f}",
                f"{base + 2.0:.2f}",
                f"{base - 1.0:.2f}",
                f"{base + 1.0:.2f}",
                1000000 + (i % 1000)
            ])

    print(f"Generated {rows:,} records: {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--rows", type=int, default=100000)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/benchmark_100k.csv")
    )

    args = parser.parse_args()
    generate(args.output, args.rows)
