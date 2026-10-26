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
