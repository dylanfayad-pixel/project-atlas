# Development and reproducibility

## Environment

The original development environment is Kali Linux ARM64 running in a macOS-hosted VM. VS Code Remote SSH was attempted but postponed; a Mac terminal connecting to Kali over SSH is sufficient. Build instructions are not tied to SSH or macOS.

Dependencies: C++20 compiler, CMake >=3.20, Python 3 for benchmark data generation; GNU `time` is optional for RSS measurements. GitHub CI additionally uses Ninja.

## Clean builds

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build --parallel 2
ctest --test-dir build --output-on-failure
cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
cmake --build build-release --parallel 2
ctest --test-dir build-release --output-on-failure
```

## Deterministic data

`data/sample_ohlcv.csv` is a tracked five-record synthetic fixture. Generate the ignored large fixture from the repository root:

```bash
python3 scripts/generate_benchmark_data.py --rows 100000 --output data/benchmark_100k.csv
wc -l data/benchmark_100k.csv
```

The generator produces 100,000 consecutive **calendar days** from 2000-01-01, not real trading sessions; values are synthetic. Python `csv.writer` may emit CRLF, which the C++ reader accepts. Do not commit generated large datasets or secrets.

## Benchmark commands

```bash
./build-release/benchmark_csv
./build-release/benchmark_large_csv
/usr/bin/time -v ./build-release/benchmark_large_csv
```

Run from repository root because benchmark file paths are relative. Repeat runs on an idle machine, record CPU/VM, compiler, flags and cache conditions, and never compare different workloads as if they were identical.

## Contribution checklist

1. Make one controlled change; inspect `git diff`.
2. Run Debug and Release tests.
3. Benchmark only when performance-related and retain baseline data.
4. Update README phase status, architecture, testing, performance, setup, roadmap and limitations where affected.
5. Confirm ignored generated files and secrets are not staged.
6. Commit, push and verify both GitHub Actions jobs.
