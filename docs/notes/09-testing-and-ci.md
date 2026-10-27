# 09 — Testing and Continuous Integration

## Why Testing Matters

Tests verify that software behaves as expected.

For quantitative software, incorrect calculations
can produce misleading financial conclusions.

## Unit Tests

Unit tests check individual components.

Examples include:

- Market-data validation
- SMA crossover signals
- Portfolio accounting
- Performance metrics
- JSON serialization

## Integration Tests

Integration tests verify that multiple components
work correctly together.

Atlas includes a Python integration test that
runs the C++ portfolio demonstration and parses
its exported JSON.

## Regression Tests

Regression tests help prevent previously fixed
bugs from returning.

For example, Atlas tests rejection of invalid
market prices and non-finite financial values.

## CTest

CTest runs the C++ test executables registered
through CMake.

Current locally verified count: 17 suites.

## Vitest

Vitest runs frontend TypeScript tests.

Current locally verified count: 10 tests.

## Continuous Integration

GitHub Actions automatically builds and tests
code after pushes and pull requests.

The configured workflow includes:

- C++ Debug build and tests
- C++ Release build and tests
- Frontend tests, lint, and production build

The updated workflow still requires verification
on GitHub after the next push.

## Useful Commands

```bash
cmake --build build --parallel 2
ctest --test-dir build --output-on-failure

cmake --build build-release --parallel 2
ctest --test-dir build-release --output-on-failure

cd frontend
npm run test
npm run lint
npm run build
```

## Interview Practice

1. What is a unit test?
2. What is an integration test?
3. What is regression testing?
4. Why test Debug and Release builds?
5. What does GitHub Actions automate?

## Learning Resources

- https://cmake.org/cmake/help/latest/manual/ctest.1.html
- https://vitest.dev/guide/
- https://docs.github.com/en/actions
