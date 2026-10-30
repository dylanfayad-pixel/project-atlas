# 22 — Production CI/CD and Release Engineering

## What is CI/CD?

Continuous Integration automatically verifies changes.

Continuous Delivery prepares tested changes for release.

Continuous Deployment automatically publishes approved
changes when deployment is configured.

## Atlas CI Architecture

GitHub Actions verifies:

- C++ Debug builds.
- C++ Release builds.
- Python HTTP integration tests.
- Frontend Vitest tests.
- TypeScript compilation.
- ESLint.
- Production frontend builds.
- Docker smoke tests.
- Authenticated gateway-to-C++ integration.

## Important Commands

```bash
ctest --test-dir build --output-on-failure
python3 services/backtest/test_server.py
```

Frontend:

```bash
cd frontend
npm run test
npm run lint
npm run build
```

Docker integration:

```bash
sudo env PATH="$PATH" npm run test:integration
```

## Release Checklist

1. Verify all tests.
2. Review source changes.
3. Check for secrets and generated files.
4. Update documentation.
5. Commit and push.
6. Verify GitHub Actions.
7. Deploy the backend.
8. Verify the public API.
9. Record release limitations.

## Reproducibility

A reproducible release records the source revision,
dependency versions, build configuration,
test results, and deployment environment.

## Interview Questions

1. What is the difference between CI and CD?
2. Why test Debug and Release builds?
3. What is a smoke test?
4. Why separate Docker integration tests from unit tests?

## Additional Learning

Video search: GitHub Actions CI/CD official tutorial.

Reference: https://docs.github.com/en/actions
