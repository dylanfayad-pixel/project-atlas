# Atlas Terminal

Atlas Terminal is the React and TypeScript frontend
for Project Atlas, a C++20 quantitative research and
historical backtesting project.

## Technology Stack

- React
- TypeScript
- Vite
- Recharts
- Lucide icons
- Vitest
- ESLint

## Current Features

- Interactive market-data visualization.
- Historical BUY, SELL, and HOLD signal display.
- Portfolio performance summary.
- Equity-curve visualization.
- Simulated trade history.
- Runtime portfolio JSON validation.
- Lazy-loaded chart components.

## Local Setup

Requirements: Node.js and npm.

From the repository root:

```bash
cd frontend
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Verification

```bash
npm run test
npm run lint
npm run build
```

## Current Data Sources

The frontend currently reads:

- `public/data/demo_signals.csv`
- `public/data/demo_portfolio.json`

These are demonstration fixtures.

The portfolio JSON originates from the C++ engine,
but the website does not yet invoke C++ directly.

## Important Architecture Boundary

The frontend displays previously generated results.

A backend API for running visitor-selected backtests
has not yet been implemented.

## Project Documentation

See the repository root README and:

- `docs/architecture.md`
- `docs/api.md`
- `docs/testing.md`
- `docs/notes/README.md`

## Limitations

This is an educational research interface.

The demonstration uses synthetic market data and
simplified simulated execution.

No real trades are placed.
