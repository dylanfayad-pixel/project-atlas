// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DataProvenancePanel } from './DataProvenancePanel'
import { createProviderDataset } from '../lib/providerDataset'
import { createUploadedDataset } from '../lib/researchSession'
import type { HistoricalDataResponse } from '../lib/historicalDataResponse'

const response: HistoricalDataResponse = {
  schema_version: 1,
  symbol: 'AAPL',
  provider: 'massive',
  timeframe: '1d',
  start_date: '2025-01-01',
  end_date: '2025-12-31',
  adjusted: false,
  retrieved_at: '2026-11-06T00:00:00Z',
  bars: [{
    timestamp: '2025-01-02',
    open: 100,
    high: 105,
    low: 98,
    close: 103,
    volume: 1000,
  }],
}

afterEach(cleanup)

describe('Data provenance panel', () => {
  it('displays recorded provider metadata', () => {
    render(
      <DataProvenancePanel
        dataset={createProviderDataset(response)}
      />,
    )

    expect(screen.getByText('massive')).toBeInTheDocument()
    expect(screen.getByText('Unadjusted')).toBeInTheDocument()
    expect(
      screen.getByText('2026-11-06T00:00:00Z'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('2025-01-01 — 2025-12-31'),
    ).toBeInTheDocument()
  })

  it('does not display provider metadata for CSV datasets', () => {
    const dataset = createUploadedDataset(
      'sample.csv',
      response.bars,
    )

    const { container } = render(
      <DataProvenancePanel dataset={dataset} />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
