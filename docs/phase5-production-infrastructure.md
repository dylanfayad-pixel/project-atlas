# Phase 5.6 — Production Backtesting Infrastructure

## Status

Implemented and verified locally.

Public backend deployment and live production verification
remain pending.

## Objective

Extend Atlas Terminal from local historical backtesting
to an authenticated, containerized C++ execution service
accessible through a same-origin API gateway.

## Architecture

```text
React Atlas Terminal
        |
        v
POST /api/backtest
        |
        v
Vercel Node.js API Gateway
        |
        | HTTPS + service credential (production)
        v
Managed Docker Backend (deployment pending)
        |
        v
Python HTTP Adapter
        |
        v
C++20 Backtesting CLI
        |
        v
Historical Strategy Evaluation
        |
        v
Portfolio Simulation + Risk Analytics
        |
        v
Versioned JSON Response
        |
        v
Gateway Response Validation
        |
        v
Atlas Terminal Results
```

## Implemented Components

- Multi-stage Docker build for the C++20 CLI.
- Non-root Python runtime container.
- Docker health endpoint and health-check configuration.
- Read-only container operation verified locally.
- Configurable production authentication requirement.
- Constant-time service-key comparison.
- Bounded HTTP handler concurrency.
- Maximum two concurrent C++ executions per instance.
- Request validation and execution timeouts.
- Same-origin Node.js API gateway.
- Production HTTPS configuration requirement.
- Gateway service-key forwarding.
- Bounded gateway request and upstream response sizes.
- Redirect rejection.
- Runtime validation of financial response schemas.
- Railway deployment configuration.

## Production Environment Variables

Backend:

| Variable | Purpose |
|---|---|
| ATLAS_BACKTEST_ENV | Set to production |
| ATLAS_BACKTEST_SERVICE_KEY | Shared secret, at least 32 characters |
| ATLAS_BACKTEST_HOST | HTTP bind address |
| ATLAS_BACKTEST_BINARY | C++ executable path |
| PORT | HTTP listener port |

Gateway:

| Variable | Purpose |
|---|---|
| ATLAS_BACKTEST_URL | HTTPS URL of the deployed backend |
| ATLAS_BACKTEST_SERVICE_KEY | Matching server-side credential |

Never commit actual service credentials.

## Verification

Latest reported local results:

| Test | Result |
|---|---|
| C++ CTest | 28/28 passed |
| Python HTTP | 15/15 passed |
| Standard frontend Vitest | 195/195 passed |
| Gateway-to-Docker integration | 1/1 passed |
| TypeScript | Passed |
| ESLint | Passed |
| Frontend production build | Passed |
| Git whitespace checks | Passed |

The Docker smoke test verifies:

- Container health.
- Actual C++ historical backtesting.
- Rejection of invalid requests.

The authenticated gateway integration test verifies
a real request through Node.js, Docker, Python, and C++.

These are local results. The updated CI workflow has
not yet been verified on GitHub.

## Security Boundaries

Production startup requires a configured service key.

The gateway requires HTTPS and a service credential
in production.

The backend independently checks authentication.

Gateway hostname restrictions are defense in depth,
not a complete SSRF prevention mechanism.

Distributed rate limiting and production edge traffic
controls remain deployment requirements.

The current Python HTTP server is not intended to
serve as an unrestricted public internet edge.

## Financial Limitations

- No real brokerage connectivity or live order execution.
- Simplified next-bar simulated fills.
- Floating-point financial accounting.
- No complete order-book or market-impact model.
- No independently validated profitable strategy.
- Synthetic five-bar tests establish functional
  correctness, not statistical significance.
- Historical results do not guarantee future returns.

## Deployment Status

The Railway configuration exists in railway.json.

The Docker image has been built and verified locally.

The public Docker backend has not yet been deployed.

The Vercel frontend has not yet been verified against
a deployed production C++ execution service.

Phase 5.6 must not be marked complete until production
deployment, end-to-end verification, CI, and documentation
checks have succeeded.

## Planned Research Improvements

- Ticker-symbol historical data retrieval.
- Additional market-data providers and timeframes.
- Expanded C++ trading strategy library.
- Automated strategy comparison and ranking.
- Out-of-sample and walk-forward validation.
- Explainable historical BUY and SELL visualization.
- Professional Atlas Terminal redesign.
- Explicit NO QUALIFYING STRATEGY outcomes when
  research evidence is insufficient.
