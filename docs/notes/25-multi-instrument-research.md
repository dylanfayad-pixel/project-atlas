# Learning Guide 25 — Multi-Instrument Research

## Overview

Atlas Intelligence supports research across multiple
independent historical datasets.

Each dataset retains its own observations, metadata,
and unique identifier.

## Research Collection

The collection is managed by researchCollection.ts.

It supports:

- Adding datasets.
- Selecting an active dataset.
- Replacing datasets.
- Removing datasets.
- Enforcing a 20-dataset capacity limit.
- Preserving independent instrument metadata.

App.tsx owns the collection state.

A synchronous reference is used to prevent closely
timed imports from bypassing capacity checks.

## Shared-Date Alignment

Historical comparisons use dates available across
all instruments in the comparison population.

This prevents comparisons over inconsistent
observation windows.

Missing observations are not fabricated.

## Comparative Risk

alignedRiskAnalytics.ts calculates descriptive
historical measurements over aligned observations.

Metrics include:

- Historical closing-price return.
- Annualized historical volatility when supported.
- Maximum closing-price drawdown.
- Shared observation counts.

## Comparison Quality

comparisonQuality.ts evaluates shared history,
date coverage, and ranking eligibility.

Comparisons with insufficient observations
do not receive historical-return rankings.

## Screening

instrumentScreening.ts filters and sorts
already-aligned analytical results.

Screening does not modify underlying datasets
or recalculate the common date window.

Historical-return rankings are established
before filtering, preserving their original
positions when instruments are hidden.

## Validation

InstrumentScreeningControls.tsx validates
numeric thresholds.

Invalid thresholds display an error and
do not replace the previous valid filter.

Reset clears screening thresholds and errors.

## Important Limitations

- Results describe historical observations.
- Rankings do not predict future performance.
- Instrument metadata is user-provided.
- Historical returns exclude dividends.
- Research collections are stored in browser memory.
- Refreshing the page clears imported datasets.
- No trading recommendations are generated.

## Relevant Source Files

- frontend/src/lib/researchCollection.ts
- frontend/src/lib/alignedRiskAnalytics.ts
- frontend/src/lib/comparisonQuality.ts
- frontend/src/lib/instrumentScreening.ts
- frontend/src/components/DatasetSelector.tsx
- frontend/src/components/InstrumentComparison.tsx
- frontend/src/components/InstrumentScreeningControls.tsx

## Interview Questions

1. Why must instruments use shared observation dates?
2. Why should screening not recalculate the date window?
3. How are dataset identities kept independent?
4. Why are historical rankings calculated before filtering?
5. Why should missing volatility not be treated as zero?
6. How does the application prevent collection-capacity races?
