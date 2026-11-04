// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { ResearchInsightsPanel } from './ResearchInsightsPanel'
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
    id: 'insights-test',
    source: 'uploaded-csv',
    filename: 'insights.csv',
    symbol: null,
    exchange: null,
    instrumentVerified: false,
    timeframe: '1d',
    bars,
    firstTimestamp: bars[0].timestamp,
    lastTimestamp: bars[bars.length - 1].timestamp,
  }
}

describe('Research Insights dashboard', () => {
  it('explains bullish historical conditions', () => {
    const closes = Array.from(
      { length: 80 },
      (_, index) => 100 + index,
    )

    render(<ResearchInsightsPanel dataset={dataset(closes)} />)

    const panel = screen.getByRole('region', {
      name: 'Research Insights',
    })

    expect(
      within(panel).getByText('Bullish Historical Trend'),
    ).toBeInTheDocument()

    expect(
      within(panel).getByText('Elevated RSI Momentum'),
    ).toBeInTheDocument()
  })

  it('explains insufficient data honestly', () => {
    render(<ResearchInsightsPanel dataset={dataset([100, 105])} />)

    const panel = screen.getByRole('region', {
      name: 'Research Insights',
    })

    expect(
      within(panel).getByText('Trend Classification Unavailable'),
    ).toBeInTheDocument()

    expect(
      within(panel).getByText('Momentum Indicator Unavailable'),
    ).toBeInTheDocument()
  })

  it('displays research limitations', () => {
    render(<ResearchInsightsPanel dataset={dataset(Array(80).fill(100))} />)

    const panel = screen.getByRole('region', {
      name: 'Research Insights',
    })

    expect(
      within(panel).getByText(/not forecasts/i),
    ).toBeInTheDocument()
  })
})
