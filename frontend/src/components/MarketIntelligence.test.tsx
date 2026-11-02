// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import {
  cleanup,
  render,
  screen,
  within,
} from '@testing-library/react'
import { MarketIntelligence } from './MarketIntelligence'
import type { ResearchDataset } from '../lib/researchSession'

// Explicit cleanup prevents earlier renders from
// interfering with subsequent component assertions.
afterEach(() => {
  cleanup()
})

// Construct deterministic observations for UI tests.
function dataset(closes: number[]): ResearchDataset {
  const bars = closes.map((close, index) => ({
    timestamp: new Date(
      Date.UTC(2025, 0, index + 1),
    ).toISOString().slice(0, 10),
    open: close,
    high: close,
    low: close,
    close,
    volume: 1000,
  }))

  return {
    id: 'test-dataset',
    source: 'uploaded-csv',
    filename: 'sample.csv',
    symbol: null,
    exchange: null,
    instrumentVerified: false,
    timeframe: '1d',
    bars,
    firstTimestamp: bars[0].timestamp,
    lastTimestamp: bars[bars.length - 1].timestamp,
  }
}

describe('Market Intelligence dashboard', () => {
  it('displays calculated market metrics', () => {
    render(
      <MarketIntelligence dataset={dataset([100, 110, 120])} />,
    )

    const dashboard = screen.getByRole('region', {
      name: 'Market Intelligence',
    })

    expect(
      within(dashboard).getByText('Market Intelligence'),
    ).toBeInTheDocument()

    expect(
      within(dashboard).getByText('20.00%'),
    ).toBeInTheDocument()

    expect(
      within(dashboard).getByText('120.00'),
    ).toBeInTheDocument()
  })

  it('shows insufficient-data states', () => {
    render(
      <MarketIntelligence dataset={dataset([100])} />,
    )

    expect(
      screen.getAllByText('Insufficient data').length,
    ).toBeGreaterThan(0)
  })

  it('displays the research limitations', () => {
    render(
      <MarketIntelligence dataset={dataset([100, 105, 110])} />,
    )

    const dashboard = screen.getByRole('region', {
      name: 'Market Intelligence',
    })

    expect(
      within(dashboard).getByText(
        /not predictions or investment recommendations/i,
      ),
    ).toBeInTheDocument()
  })
})
