# 07 — Frontend Architecture

## What Is the Atlas Terminal Frontend?

Atlas Terminal is the visual interface for Project Atlas.

It uses React, TypeScript, Vite, and Recharts to display
historical market signals and simulated portfolio results.

## How React Works

React builds interfaces from reusable components.

A component is a function that describes part of the UI.

For example, `PortfolioAnalytics` displays financial
metrics, an equity chart, and executed trades.

## Important Concepts

### Components

Components divide the application into smaller,
independently maintainable pieces.

### Props

Props pass information from one component to another.

### State

State stores information that can change while
the application is running.

### useEffect

`useEffect` allows React to synchronize with
external systems, including fetching JSON data.

### TypeScript

TypeScript checks types before the application runs.

Atlas validates external JSON because TypeScript
types alone do not validate network responses.

## Current Components

| Component | Responsibility |
|---|---|
| App | Main application state and data loading |
| Sidebar | Workspace navigation |
| MetricCards | Summary statistics |
| PriceChart | Historical price visualization |
| SignalTable | Trading signal history |
| PortfolioAnalytics | Equity and simulated trades |
| WorkspaceContent | Selected workspace view |

## Lazy Loading

Atlas loads chart components separately using
React.lazy and Suspense.

This reduces the initial JavaScript bundle.

Recorded initial bundle sizes:

- Before: 593.43 kB
- After: 236.89 kB

This is a reduction of approximately 60.1% in
uncompressed initial bundle size.

It is not a measured page-load-time improvement.

## Current Data Source

The dashboard reads static CSV and JSON fixtures.

It does not yet send backtest requests to a live API.

## Interview Practice

1. What is a React component?
2. What is the difference between props and state?
3. Why validate JSON at runtime?
4. What is lazy loading?
5. Why separate the C++ engine from React?

## Source Code

- `frontend/src/App.tsx`
- `frontend/src/components/WorkspaceContent.tsx`
- `frontend/src/components/PortfolioAnalytics.tsx`
- `frontend/src/lib/portfolioData.ts`

## Learning Resources

- https://react.dev/learn
- https://www.typescriptlang.org/docs/
- https://vite.dev/guide/
