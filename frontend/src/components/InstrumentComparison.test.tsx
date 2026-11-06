// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { InstrumentComparison } from './InstrumentComparison'
import type { ResearchDataset } from '../lib/researchSession'

afterEach(() => cleanup())

function dataset(
  id: string,
  closes: number[],
): ResearchDataset {
  const bars = closes.map((close, index) => ({
    timestamp: new Date(
      Date.UTC(2026, 0, index + 1),
    ).toISOString().slice(0, 10),
    open: close,
    high: close,
    low: close,
    close,
    volume: 1000,
  }))

  return {
    id,
    source: 'uploaded-csv',
    filename: `${id}.csv`,
    symbol: id.toUpperCase(),
    exchange: null,
    instrumentVerified: false,
    timeframe: '1d',
    bars,
    firstTimestamp: bars[0].timestamp,
    lastTimestamp: bars[bars.length - 1].timestamp,
  }
}

describe('Multi-instrument comparison dashboard', () => {
  it('shows insufficient-data guidance', () => {
    render(<InstrumentComparison datasets={[]} />)

    expect(
      screen.getByText(/at least two instruments/i),
    ).toBeInTheDocument()
  })

  it('displays aligned historical comparisons', () => {
    render(
      <InstrumentComparison datasets={[
        dataset('a', [100, 110, 120]),
        dataset('b', [200, 210, 220]),
      ]} />,
    )

    const panel = screen.getByRole('region', {
      name: 'Instrument Comparison',
    })

    expect(within(panel).getByText('A')).toBeInTheDocument()
    expect(within(panel).getByText('B')).toBeInTheDocument()
    expect(within(panel).getByText('20.00%')).toBeInTheDocument()
    expect(within(panel).getByText('10.00%')).toBeInTheDocument()
  })

  it('reports limited comparison quality', () => {
    render(
      <InstrumentComparison datasets={[
        dataset('a', Array(30).fill(100)),
        dataset('b', Array(30).fill(100)),
      ]} />,
    )

    expect(screen.getByText('LIMITED')).toBeInTheDocument()
  })

  it('does not generate investment recommendations', () => {
    render(
      <InstrumentComparison datasets={[
        dataset('a', [100, 110, 120]),
        dataset('b', [200, 210, 220]),
      ]} />,
    )

    expect(
      screen.getByText(/no trading recommendations/i),
    ).toBeInTheDocument()
  })
})
