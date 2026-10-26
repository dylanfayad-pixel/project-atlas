# Testing and continuous integration

## Run locally

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build --parallel 2
ctest --test-dir build --output-on-failure
cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
cmake --build build-release --parallel 2
ctest --test-dir build-release --output-on-failure
```

## CTest suites

| Name | Coverage |
|---|---|
| `atlas_startup` | Banner contains expected initialization text |
| `market_bar_validation` | Valid/invalid OHLCV, NaN, zero volume |
| `csv_reader` | Five-row tracked synthetic fixture and field checks |
| `csv_error_handling` | Missing file, header/field/numeric/OHLC errors and CRLF regression |
| `date_validation` | Valid dates, leap years, malformed dates |
| `csv_chronology` | Invalid dates, duplicate/out-of-order rows, valid ordered input |

`market_bar_validation` uses always-on `require` checks rather than Release-disabled `assert`. All suites are registered with CTest. Error tests use temporary files; they are not a substitute for exhaustive parser fuzzing.

## CI

`.github/workflows/ci.yml` runs on pushes and pull requests using `ubuntu-24.04` with a Debug/Release matrix, installs CMake/GCC/Ninja, builds, and runs CTest. The archived workflow uses `actions/checkout@v4`, which has previously produced a Node.js runtime deprecation warning; evaluate a compatible upgrade in a separate CI maintenance change. Do not claim a workflow passed until its run completes successfully.

## Gaps

Missing robust tests for extremely long fields, empty datasets, numeric extremes, quoted CSV, adversarial inputs, concurrent temp file collisions, and performance regressions. Current CI does not include sanitizers, fuzzing or cross-platform builds.

## Capacity-Hint Regression Coverage

The CSV reader supports optional preallocation through
the `capacity_hint` parameter.

The existing CSV reader test verifies that:

- The default reader successfully loads the sample dataset.
- A reader using a capacity hint loads the same number of records.
- Both modes return identical timestamps.
- Both modes return identical OHLCV values.

This is a correctness test, not a performance test.

The capacity optimization must not change the records
returned by the CSV reader.

### Performance Benchmark Verification

Project Atlas also provides:

- `benchmark_capacity`: 15 paired timing trials comparing
  reserved and unreserved ingestion.
- `benchmark_capacity_memory`: separate-process memory
  measurement for each mode.

These are benchmark executables, not CTest test suites.

### Run All Automated Tests

Debug:

    cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
    cmake --build build --parallel 2
    ctest --test-dir build --output-on-failure

Release:

    cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
    cmake --build build-release --parallel 2
    ctest --test-dir build-release --output-on-failure

Both configurations currently contain six registered
CTest suites.

GitHub Actions builds and tests both configurations.

See [Performance Report](performance.md) for benchmark
methodology, measured results, and limitations.
