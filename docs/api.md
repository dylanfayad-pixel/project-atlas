# Project Atlas — JSON Contract and API Boundary

## Current Status — Phase 5.5

Atlas supports local HTTP historical backtesting.

The browser sends validated daily OHLCV observations
and strategy configuration through Vite to a local
Python adapter.

The adapter invokes the C++ backtesting CLI and
returns the resulting JSON.

This endpoint is not deployed as a public
production service.

## Local Backtesting Endpoint

Browser development route:

`POST /local-backtest`

Python service route:

`POST http://127.0.0.1:8765/backtest`

### Request fields

| Field | Description |
|---|---|
| bars | Array of validated daily OHLCV observations |
| strategy | buy-and-hold or sma-crossover |
| capital | Positive initial capital |
| commission | Nonnegative fixed commission |
| slippage_bps | Adverse slippage in basis points |
| fast | Fast SMA period |
| slow | Slow SMA period |

Each observation requires:

`timestamp, open, high, low, close, volume`

The local adapter limits requests to 10,000 bars
and a maximum 2 MiB body.

### Response

The top-level response contains:

- `response_version: 1`
- `signals`
- `portfolio`

The portfolio uses JSON schema version 3.

Signals represent strategy decisions, not
necessarily executed fills.

### HTTP error behavior

- 400: Invalid request or unsupported configuration.
- 404: Unknown endpoint.
- 413: Request body exceeds allowed limits.
- 422: C++ execution rejected the request.
- 503: Backtest engine unavailable.
- 504: Execution timeout.

The current Python adapter uses a five-second
subprocess timeout.

### Security boundary

The adapter binds to loopback and is intended
only for local development.

Public deployment requires authentication,
resource isolation, abuse protection, and
additional security testing.

See [Phase 5.5 engineering documentation](
phase5-local-backtesting.md).

## Schema Version

The portfolio exporter supports three schema versions:

- `schema_version: 1` — legacy portfolio results.
- `schema_version: 2` — portfolio results with execution costs.
- `schema_version: 3` — execution costs and risk reporting.

The frontend accepts all three versions. The active
portfolio dashboard fixture uses schema v3.

Schema v2 adds these top-level fields:

| Field | Meaning |
|---|---|
| `total_commission` | Sum of commissions on executed fills |
| `total_slippage_cost` | Sum of adverse execution-price costs |
| `total_execution_cost` | Commission plus slippage |

Each v2 trade also includes `commission_paid` and
`slippage_cost`.

The exporter checks that aggregate costs agree with
the recorded trade costs.

See [Phase 3 execution engineering](phase3-execution.md).

## Top-Level Fields

| Field | Meaning |
|---|---|
| schema_version | Version of the JSON structure |
| strategy | Name of the evaluated strategy |
| initial_capital | Starting simulated capital |
| final_equity | Final portfolio value |
| net_profit | Final equity minus initial capital |
| total_return_pct | Percentage return |
| maximum_drawdown_pct | Largest peak-to-trough decline |
| equity_curve | Historical portfolio observations |
| trades | Simulated executed fills |

## Equity Observations

Each equity observation contains:

- index
- timestamp
- cash
- shares
- equity

Equity represents cash plus the market value of
the simulated position.

## Simulated Trades

Each trade contains:

- index
- timestamp
- side
- price
- quantity

Supported sides are BUY and SELL.

These represent simulated fills, not real orders.

## C++ Exporter

Implementation:

`src/portfolio_json_exporter.cpp`

The exporter produces the machine-readable portfolio
results consumed by the frontend.

## Frontend Validation

Implementation:

`frontend/src/lib/portfolioData.ts`

The frontend validates the schema version, numeric
fields, equity observations, and trade records.

Invalid responses are rejected before rendering.

## Integration Verification

Run from the repository root:

```bash
python3 scripts/verify_portfolio_json.py \
  --executable build-release/atlas_portfolio_demo
```

The integration script executes the C++ demonstration
and validates its JSON output.

## Schema v2 Integration Verification

From the repository root:

```bash
python3 scripts/verify_portfolio_json_v2.py \
  --executable build-release/atlas_portfolio_demo
```

The verifier executes the real C++ demonstration, parses
its JSON, reconciles financial values, and checks the
committed frontend fixture.

The website supports local Python/C++ backtesting.
No production-hosted backtesting endpoint is deployed.

## Phase 4.2 Execution Configuration

The C++ portfolio simulator accepts an `ExecutionConfig`
with commission, slippage, maximum entry allocation,
and maximum entry exposure settings.

These settings affect simulated execution behavior.

They are not currently exposed as user-configurable
HTTP API parameters.

The existing portfolio JSON v1/v2 contracts remain
unchanged by this milestone.

The JSON output does not yet include a dedicated
risk-control configuration or exposure history.

See [Phase 4.2 risk controls](phase4-risk-controls.md).

## Phase 4.3 Drawdown Configuration

The C++ `ExecutionConfig` supports:

- `max_drawdown_fraction`
- `liquidate_on_drawdown`

The drawdown threshold is a fraction greater than zero
and at most 1.0; 1.0 disables the circuit breaker.

These settings are not HTTP API parameters.

The current JSON v1/v2 contracts remain unchanged.
They do not expose circuit-breaker activation events,
breach timestamps, or liquidation reasons.

See [drawdown controls](phase4-drawdown-controls.md).

## Future HTTP API

A future backend will accept user-selected strategy
configurations and return simulation results.

Before public deployment, it will require:

- Strict input validation.
- Resource and execution-time limits.
- Safe request isolation.
- Controlled dataset access.
- Error handling and logging.
- Reproducible simulation configurations.
- Security and deployment testing.

No production-hosted C++ backtesting endpoint is currently available.

## Limitations

The current portfolio model uses simplified execution
assumptions and floating-point financial values.

JSON validity does not establish profitability,
production readiness, or real-market execution accuracy.

## JSON Schema v3 — Risk Reporting

Schema v3 preserves the cost-aware fields introduced
in schema v2.

It adds three top-level reporting objects:

| Field | Description |
|---|---|
| `risk_metrics` | Quantitative statistics and sampling assumptions |
| `exposure` | Historical position exposure and observed maximum |
| `risk_controls` | Execution policy configuration and risk events |

Risk metrics include volatility, Sharpe, downside
deviation, and Sortino.

Undefined statistics are represented as JSON `null`.

Risk-control events use the following types:

- `DRAWDOWN_BREACH`
- `LIQUIDATION_EXECUTED`
- `LIQUIDATION_REJECTED`

A breach is observed at bar close.

Liquidation may execute at the following bar's open.

Executed liquidation events must correspond to
recorded SELL fills.

The browser validates schema v3 before rendering.

The active JSON v3 demonstration fixture is synthetic.

See [Phase 4.4 risk reporting](phase4-risk-reporting.md).

## Phase 5.3 — Historical Market-Data API Foundation

The repository includes a serverless GET endpoint:

`/api/market-data`

Supported query parameters:

- `symbol`
- `start`
- `end`
- `timeframe` (daily only)

Requests are validated before provider execution.

The implementation includes provider timeouts,
structured error responses, response validation,
and an experimental Massive HTTP adapter.

The production handler currently uses a null
provider and returns a provider-not-configured
response for valid requests.

No public live market-data service is enabled.

See [Phase 5.3 documentation](
phase5-data-first-workspace.md).
