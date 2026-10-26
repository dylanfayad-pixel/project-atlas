# Project Atlas — Performance Benchmarks

## Benchmark 001: Repeated Small-File CSV Ingestion

### Objective

Measure the execution time and throughput of repeated
CSV parsing and market data validation operations.

### Environment

- Operating system: Kali Linux Rolling
- Architecture: ARM64 (aarch64)
- Environment: Virtual machine on macOS
- Compiler: GCC 15.2.0
- Language: C++20
- Build configuration: Release
- Build system: CMake

### Workload

- Dataset: data/sample_ohlcv.csv
- Dataset type: Synthetic daily OHLCV
- Records per file: 5
- Warm-up iterations: 2,000
- Measured iterations per trial: 20,000
- Number of trials: 7
- Records processed per trial: 100,000

Each iteration opens, parses, validates, and closes
the same five-record CSV file.

### Results

| Trial | Time (ms) | Records/second |
|---|---:|---:|
| 1 | 58.150 | 1,719,688 |
| 2 | 57.632 | 1,735,151 |
| 3 | 57.896 | 1,727,224 |
| 4 | 58.502 | 1,709,353 |
| 5 | 58.540 | 1,708,236 |
| 6 | 59.222 | 1,688,573 |
| 7 | 58.875 | 1,698,523 |

### Summary

- Minimum time: 57.632 ms
- Median time: 58.502 ms
- Mean time: 58.402 ms
- Maximum time: 59.222 ms
- Median-based throughput: 1,709,353 records/second

### Reproduction

Configure and build:

    cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
    cmake --build build-release --parallel 2

Run from the repository root:

    ./build-release/benchmark_csv

### Interpretation

The measurements represent repeated ingestion of a
small CSV file, including file-opening overhead.

They must not be interpreted as sustained throughput
for parsing a single large dataset.

Performance may vary with CPU scheduling, virtualization,
caching, compiler settings, and hardware.

### Future Work

- Benchmark larger single-file workloads
- Measure memory usage
- Compare Debug and Release builds
- Profile parsing and validation costs
- Evaluate optimization opportunities

---

## Benchmark 002: Large-File CSV Ingestion

### Objective

Measure end-to-end CSV ingestion throughput for a single synthetic dataset containing 100,000 OHLCV records.

### Workload

- Dataset: `data/benchmark_100k.csv`
- Records per file: 100,000
- Warm-up runs: 2
- Measured runs: 7
- Timing source: `std::chrono::steady_clock`
- Build configuration: Release

Each trial opens, parses, validates, and materializes the CSV records.

### Results

Observed across three benchmark executions:

| Execution | Median latency (ms) | Median throughput (records/s) | Peak RSS (KB) |
|---|---:|---:|---:|
| 1 | 24.158 | 4,139,365 | 21,804 |
| 2 | 24.338 | 4,108,829 | 19,884 |
| 3 | 23.944 | 4,176,366 | 20,752 |

Peak RSS values were observed externally and represent process peak resident memory, not solely the memory allocated for CSV records.

### Reproduction

From the repository root:

```bash
cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
cmake --build build-release --parallel 2
./build-release/benchmark_large_csv
```

### Interpretation

The results indicate approximately 4.1 million records per second for this synthetic 100,000-record workload in the tested environment.

These are end-to-end ingestion measurements, not isolated parser throughput or a guarantee of sustained production performance. Operating-system caching, virtual-machine scheduling, hardware, and dataset characteristics may affect the results.

### Future Improvements

- Validate representative parsed field values during benchmarking.
- Profile CPU hotspots and memory allocations.
- Evaluate larger datasets and streaming ingestion.
- Compare optimized implementations against a correctness baseline.

---

## Benchmark 002: Large-File CSV Ingestion

### Objective

Measure the performance of reading, parsing, validating,
and storing 100,000 synthetic OHLCV records from one CSV file.

### Workload

- Dataset: data/benchmark_100k.csv
- Dataset size: approximately 4.6 MB
- Records: 100,000
- Warm-up runs: 2
- Measured trials: 7
- Build: C++20 Release
- Architecture: ARM64 Linux virtual machine

The dataset is generated using:

    python3 scripts/generate_benchmark_data.py

The generated CSV is excluded from Git. The generator script
is retained for reproducibility.

### Initial Timing Results

| Metric | Value |
|---|---:|
| Minimum | 24.366 ms |
| Median | 24.497 ms |
| Mean | 24.513 ms |
| Maximum | 24.717 ms |
| Median-based throughput | 4,082,107 records/s |

### Memory Measurements

Peak resident memory measured using GNU time:

| Trial | Peak RSS |
|---|---:|
| 1 | 20,912 KiB |
| 2 | 19,560 KiB |
| 3 | 19,860 KiB |

Peak RSS includes application and runtime memory, not
only memory allocated by the CSV parser.

### Reproduction

Generate the dataset:

    python3 scripts/generate_benchmark_data.py

Build:

    cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
    cmake --build build-release --parallel 2

Benchmark:

    ./build-release/benchmark_large_csv

Measure peak memory:

    /usr/bin/time -v ./build-release/benchmark_large_csv

### Interpretation

Large-file ingestion achieved higher measured throughput
than repeated ingestion of a five-record file.

The workloads are different, so the difference should
not be described as an optimization speedup.

Results depend on hardware, virtualization, compiler
configuration, operating system, and caching behavior.

The benchmark includes file reading, parsing, validation,
and allocation of in-memory market records.

### Future Improvements

- Measure memory allocation behavior
- Profile CSV parsing hotspots
- Evaluate vector capacity reservation
- Compare alternative numeric parsing methods
- Introduce larger datasets
- Investigate streaming ingestion
