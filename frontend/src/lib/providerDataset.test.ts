import { describe, expect, it } from 'vitest'
import { createProviderDataset } from './providerDataset'
import type { HistoricalDataResponse } from './historicalDataResponse'

function response(): HistoricalDataResponse {
  return {
    schema_version: 1,
    symbol: 'AAPL',
    provider: 'massive',
    timeframe: '1d',
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    adjusted: false,
    retrieved_at: '2026-11-06T00:00:00Z',
    bars: [
      {
        timestamp: '2025-01-02',
        open: 100,
        high: 105,
        low: 98,
        close: 103,
        volume: 1000,
      },
      {
        timestamp: '2025-01-03',
        open: 103,
        high: 108,
        low: 101,
        close: 106,
        volume: 1200,
      },
    ],
  }
}

describe('Provider research datasets', () => {
  it('preserves provider source and ticker identity', () => {
    const dataset = createProviderDataset(response())

    expect(dataset.source).toBe('provider')
    expect(dataset.symbol).toBe('AAPL')
    expect(dataset.timeframe).toBe('1d')
    expect(dataset.instrumentVerified).toBe(false)
  })

  it('preserves historical date boundaries', () => {
    const dataset = createProviderDataset(response())

    expect(dataset.firstTimestamp).toBe('2025-01-02')
    expect(dataset.lastTimestamp).toBe('2025-01-03')
    expect(dataset.bars).toHaveLength(2)
  })

  it('does not share mutable observation objects', () => {
    const original = response()
    const dataset = createProviderDataset(original)

    expect(dataset.bars[0]).not.toBe(original.bars[0])

    dataset.bars[0].close = 99

    expect(original.bars[0].close).toBe(103)
  })

  it('creates independent dataset identities', () => {
    const first = createProviderDataset(response())
    const second = createProviderDataset(response())

    expect(first.id).not.toBe(second.id)
  })

  it('preserves provider provenance', () => {
    const dataset = createProviderDataset(response())

    expect(dataset.provenance).toEqual({
      provider: 'massive',
      retrievedAt: '2026-11-06T00:00:00Z',
      adjusted: false,
      requestedStartDate: '2025-01-01',
      requestedEndDate: '2025-12-31',
    })
  })

  it('rejects empty provider datasets', () => {
    const invalid = response()
    invalid.bars = []

    expect(() => createProviderDataset(invalid)).toThrow(
      'Cannot create an empty provider dataset.',
    )
  })
})
