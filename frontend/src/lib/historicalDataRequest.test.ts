import { describe, expect, it } from 'vitest'
import {
  createHistoricalDataRequest,
} from './historicalDataRequest'

describe('Historical market-data request validation', () => {
  it('normalizes the ticker', () => {
    expect(
      createHistoricalDataRequest(
        ' aapl ',
        '2025-01-01',
        '2025-12-31'
      ).symbol
    ).toBe('AAPL')
  })

  it('sets the supported daily timeframe', () => {
    const request = createHistoricalDataRequest(
      'SPY',
      '2025-01-01',
      '2025-12-31'
    )

    expect(request.timeframe).toBe('1d')
  })

  it('rejects invalid ticker characters', () => {
    expect(() =>
      createHistoricalDataRequest(
        'AAPL!',
        '2025-01-01',
        '2025-12-31'
      )
    ).toThrow()
  })

  it('rejects malformed dates', () => {
    expect(() =>
      createHistoricalDataRequest(
        'AAPL',
        '01/01/2025',
        '2025-12-31'
      )
    ).toThrow()
  })

  it('rejects impossible calendar dates', () => {
    expect(() =>
      createHistoricalDataRequest(
        'AAPL',
        '2025-02-30',
        '2025-12-31'
      )
    ).toThrow()
  })

  it('rejects reversed date ranges', () => {
    expect(() =>
      createHistoricalDataRequest(
        'AAPL',
        '2025-12-31',
        '2025-01-01'
      )
    ).toThrow()
  })

  it('rejects excessively long ranges', () => {
    expect(() =>
      createHistoricalDataRequest(
        'AAPL',
        '2015-01-01',
        '2025-01-01'
      )
    ).toThrow()
  })

  it('allows a single historical date', () => {
    const request = createHistoricalDataRequest(
      'SPY',
      '2025-01-02',
      '2025-01-02'
    )

    expect(request.startDate).toBe(request.endDate)
  })
})
