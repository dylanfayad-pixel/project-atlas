# Project Atlas — Testing and CI

## Automated Test Suites

Project Atlas currently registers seven CTest suites.

| Test | Coverage |
|---|---|
| atlas_startup | Application initialization |
| market_bar_validation | OHLCV validity and non-finite prices |
| csv_reader | Valid CSV loading and capacity hints |
| csv_error_handling | File, header, numeric and OHLCV errors; CRLF |
| date_validation | Calendar dates and leap years |
| csv_chronology | Ordering, duplicates and invalid dates |
| csv_column_validation | Missing/extra columns and numeric extremes |

The CSV column suite includes malformed prices, overflow,
NaN, negative volume, and unsigned volume overflow.

Temporary test directories are created using mkdtemp
and cleaned up using RAII. This helper is Linux/POSIX-specific.

## Debug Verification

    cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
    cmake --build build --parallel 2
    ctest --test-dir build --parallel 2 --output-on-failure

## Release Verification

    cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
    cmake --build build-release --parallel 2
    ctest --test-dir build-release --parallel 2 --output-on-failure

Both configurations have passed all seven suites locally.

## Continuous Integration

GitHub Actions uses Ubuntu 24.04 and a Debug/Release
build matrix.

Each job configures CMake, builds the project,
and runs the registered CTest suites.

The workflow uses actions/checkout@v4. A previous
Node.js runtime deprecation warning remains a
maintenance item.

A successful local build does not establish CI success.
The final GitHub workflow must be verified after pushing.

## Remaining Limitations

The current suite is not exhaustive.

Additional future testing may include:

- Fuzz testing
- Sanitizers
- Extremely long CSV fields
- Resource exhaustion
- Cross-platform compatibility
- Large-scale adversarial inputs
- Additional performance regression coverage

Passing tests does not imply production readiness.
