// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MarketRegimePanel } from './MarketRegimePanel'
import type { ResearchDataset } from '../lib/researchSession'

afterEach(() => cleanup())

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
    id: 'regime-test',
    source: 'uploaded-csv',
    filename: 'regime.csv',
    symbol: null,
    exchange: null,
    instrumentVerified: false,
    timeframe: '1d',
    bars,
    firstTimestamp: bars[0].timestamp,
    lastTimestamp: bars[bars.length - 1].timestamp,
  }
}

describe('Market Regime dashboard', () => {
  it('displays bullish trend classification', () => {
    const closes = Array.from(
      { length: 80 },
      (_, index) => 100 + index,
    )

    render(<MarketRegimePanel dataset={dataset(closes)} />)

    const panel = screen.getByRole('region', {
      name: 'Market Regime',
    })

    expect(within(panel).getByText('Bullish Trend')).toBeInTheDocument()
    expect(within(panel).getByText('Normal Volatility')).toBeInTheDocument()
  })

  it('displays insufficient-data states', () => {
    render(<MarketRegimePanel dataset={dataset([100, 105])} />)

    const panel = screen.getByRole('region', {
      name: 'Market Regime',
    })

    expect(
      within(panel).getAllByText('Insufficient Data'),
    ).toHaveLength(2)
  })

  it('shows classification evidence and limitations', () => {
    render(<MarketRegimePanel dataset={dataset(Array(80).fill(100))} />)

    const panel = screen.getByRole('region', {
      name: 'Market Regime',
    })

    expect(within(panel).getByText('Classification Evidence'))
      .toBeInTheDocument()

    expect(
      within(panel).getByText(/not predictions/i),
    ).toBeInTheDocument()
  })
})
