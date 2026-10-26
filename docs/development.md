# Project Atlas — Development Guide

## Environment

Primary development environment:

- Kali Linux ARM64 virtual machine
- GCC 15.2.0
- C++20
- CMake 3.20+
- Python 3 for synthetic dataset generation

Mac Terminal connects to Kali using SSH.
VS Code Remote SSH is optional and not required.

## Build and Test

Debug:

    cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
    cmake --build build --parallel 2
    ctest --test-dir build --output-on-failure

Release:

    cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
    cmake --build build-release --parallel 2
    ctest --test-dir build-release --output-on-failure

## Generate Benchmark Data

Run from the repository root:

    python3 scripts/generate_benchmark_data.py \
        --rows 100000 \
        --output data/benchmark_100k.csv

The generated dataset contains synthetic consecutive
calendar-day records, not real exchange trading sessions.

Generated benchmark data is excluded from Git.

## Performance Benchmarks

Run from the repository root:

    ./build-release/benchmark_csv
    ./build-release/benchmark_large_csv
    ./build-release/benchmark_capacity

Measure peak RSS:

    /usr/bin/time -v ./build-release/benchmark_large_csv

Capacity comparison:

    /usr/bin/time -f "Peak RSS: %M KiB" \
        ./build-release/benchmark_capacity_memory reserved

    /usr/bin/time -f "Peak RSS: %M KiB" \
        ./build-release/benchmark_capacity_memory unreserved

## CPU Profiling

Profiling is optional.

Configure:

    cmake -S . -B build-profile \
        -DCMAKE_BUILD_TYPE=Release \
        -DATLAS_BUILD_PROFILING=ON \
        -DCMAKE_CXX_FLAGS="-pg -g -fno-omit-frame-pointer" \
        -DCMAKE_EXE_LINKER_FLAGS="-pg"

Build:

    cmake --build build-profile --target profile_csv

Run:

    ./build-profile/profile_csv

Generate a GNU gprof report:

    gprof ./build-profile/profile_csv gmon.out

Instrumented profiling results must not be compared
directly against ordinary Release benchmark timings.

## Fixed-Size Splitter Experiment

The original vector splitter was compared with the
fixed-size array implementation using the same
100,000-record synthetic dataset.

The measured median ingestion-time reduction was 40.05%.

See performance.md for detailed methodology and caveats.

## Contribution Checklist

1. Make a controlled source change.
2. Run Debug and Release correctness tests.
3. Measure performance changes against a baseline.
4. Update all affected repository documentation.
5. Check generated files and secrets are excluded.
6. Review staged changes before committing.
7. Push and verify both GitHub Actions jobs.

## Optional CSV Splitting Microbenchmark

The isolated CSV splitting experiment is disabled
by default to keep normal builds focused.

Enable it using:

```bash
cmake -S . -B build-release \
  -DCMAKE_BUILD_TYPE=Release \
  -DATLAS_BUILD_MICROBENCHMARKS=ON

cmake --build build-release --parallel 2

./build-release/benchmark_split
```

The experiment compares dynamic vector field storage
against fixed-size array field storage.

It is a microbenchmark, not a complete CSV ingestion test.

Results should not be interpreted as end-to-end
market-data processing throughput.
