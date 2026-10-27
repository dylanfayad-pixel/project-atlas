# Project Atlas — JSON Contract and API Boundary

## Current Status

Project Atlas exports portfolio results from C++ to JSON.

The React dashboard currently reads a static demonstration
JSON file. A live HTTP backend API is not implemented yet.

## Schema Version

The current portfolio JSON contract uses:

`schema_version: 1`

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
