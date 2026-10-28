# Project Atlas — JSON Contract and API Boundary

## Current Status

Project Atlas exports portfolio results from C++ to JSON.

The React dashboard currently reads a static demonstration
JSON file. A live HTTP backend API is not implemented yet.

## Schema Version

The portfolio exporter supports two schema versions:

- `schema_version: 1` — legacy portfolio results.
- `schema_version: 2` — portfolio results with execution costs.

The frontend accepts both versions. The active cost-aware
dashboard fixture uses schema v2.

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

The website currently reads static JSON. There is no
public HTTP backtesting endpoint.

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

No public HTTP API endpoint is currently available.

## Limitations

The current portfolio model uses simplified execution
assumptions and floating-point financial values.

JSON validity does not establish profitability,
production readiness, or real-market execution accuracy.
