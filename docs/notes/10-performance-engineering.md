# 10 — Performance Engineering

## What Is Performance Engineering?

Performance engineering measures and improves
software efficiency.

Important dimensions include:

- Execution time
- Throughput
- Memory consumption
- Resource utilization
- Predictability

## Benchmarking

A benchmark measures a program under a
defined workload and environment.

Atlas includes synthetic CSV ingestion benchmarks.

## Throughput

Throughput measures work completed per unit of time.

Example:

100,000 records processed in 0.025 seconds.

Throughput = 100,000 / 0.025

Result = 4,000,000 records per second.

## Vector Capacity Reservation

A vector may reallocate memory as it grows.

Calling `reserve()` can reduce reallocations
when the expected number of records is known.

Atlas measured capacity reservation using
controlled synthetic benchmarks.

## Fixed-Size CSV Splitting

Each Atlas CSV row contains six fields.

A fixed-size array can avoid dynamic field-storage
allocations associated with a vector-based splitter.

The optimization was benchmarked separately.

## Profiling

Profiling investigates where a program spends time.

Atlas has performed an initial CPU profiling
investigation, documented in `docs/performance.md`.

## Frontend Code Splitting

React chart components are lazy-loaded.

The initial JavaScript bundle decreased from
593.43 kB to 236.89 kB.

This does not establish a proportional reduction
in actual page-load time.

## Important Benchmarking Rules

- Compare equivalent workloads.
- Record the compiler and hardware.
- Use repeated measurements.
- Report the measurement method.
- Avoid claiming universal speedups.
- Preserve historical benchmark results.
- Distinguish synthetic from production workloads.

## Interview Practice

1. What is throughput?
2. What does `std::vector::reserve()` do?
3. Why can fixed-size arrays improve performance?
4. What is profiling?
5. Why are microbenchmarks not equivalent to end-to-end tests?

## Source Code

- `src/csv_reader.cpp`
- `benchmarks/benchmark_capacity.cpp`
- `benchmarks/benchmark_split.cpp`
- `frontend/src/components/WorkspaceContent.tsx`

## Further Reading

See `docs/performance.md` for measured results,
methodology, and reproducibility limitations.
