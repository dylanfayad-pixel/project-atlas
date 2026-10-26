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

## Capacity Optimization Benchmark

Project Atlas includes a controlled experiment comparing
CSV ingestion with and without vector-capacity reservation.

### Prerequisites

- Linux
- C++20 compiler
- CMake 3.20 or newer
- Python 3
- GNU time (for peak RSS measurements)

### Generate the dataset

Run from the repository root:

```bash
python3 scripts/generate_benchmark_data.py
```

This creates a deterministic synthetic dataset containing
100,000 OHLCV records.

The generated benchmark dataset is excluded from Git.
The generator script is tracked for reproducibility.

### Build the benchmark

```bash
cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
cmake --build build-release --parallel 2
```

### Compare ingestion performance

```bash
./build-release/benchmark_capacity
```

The benchmark compares:

- Unreserved: capacity_hint = 0
- Reserved: capacity_hint = 100000

It performs three warm-up pairs followed by 15 measured
pairs with alternating execution order.

The output includes median execution times, throughput,
and the percentage difference.

### Compare peak memory usage

Each mode runs in a separate process.

```bash
/usr/bin/time -f "Peak RSS: %M KiB" \
    ./build-release/benchmark_capacity_memory unreserved

/usr/bin/time -f "Peak RSS: %M KiB" \
    ./build-release/benchmark_capacity_memory reserved
```

Repeat each command multiple times to observe variability.

### Correctness verification

```bash
ctest --test-dir build-release --output-on-failure
```

All six registered test suites should pass.

### Reproducibility considerations

Performance results may vary because of:

- CPU architecture and clock frequency
- Virtual machine scheduling
- Compiler and optimization settings
- Operating system and filesystem caching
- Background system activity
- Memory allocation behavior

Benchmark results should always identify the workload,
environment, build configuration, and measurement method.

See [Performance Report](performance.md) for the
measured results and their limitations.
