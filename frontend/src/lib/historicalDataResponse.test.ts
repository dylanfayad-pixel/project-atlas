import { describe, expect, it } from 'vitest'
import {
  parseHistoricalDataResponse,
  validateHistoricalResponseForRequest,
} from './historicalDataResponse'

function validResponse() {
  return {
    schema_version: 1,
    symbol: 'AAPL',
    provider: 'test-provider',
    timeframe: '1d',
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    adjusted: false,
    retrieved_at: '2026-10-29T00:00:00Z',
    bars: [
      {
        timestamp: '2025-01-02',
        open: 100,
        high: 105,
        low: 98,
        close: 103,
        volume: 1000,
      },
    ],
  }
}

describe('Historical provider response validation', () => {
  it('accepts a valid historical response', () => {
    const result = parseHistoricalDataResponse(
      validResponse()
    )

    expect(result.symbol).toBe('AAPL')
    expect(result.bars).toHaveLength(1)
  })

  it('rejects unsupported schemas', () => {
    expect(() =>
      parseHistoricalDataResponse({
        ...validResponse(),
        schema_version: 2,
      })
    ).toThrow()
  })

  it('rejects unsupported timeframes', () => {
    expect(() =>
      parseHistoricalDataResponse({
        ...validResponse(),
        timeframe: '1m',
      })
    ).toThrow()
  })

  it('requires adjustment metadata', () => {
    expect(() =>
      parseHistoricalDataResponse({
        ...validResponse(),
        adjusted: null,
      })
    ).toThrow()
  })

  it('rejects empty observations', () => {
    expect(() =>
      parseHistoricalDataResponse({
        ...validResponse(),
        bars: [],
      })
    ).toThrow()
  })

  it('rejects invalid price relationships', () => {
    const response = validResponse()
    response.bars[0].high = 99

    expect(() =>
      parseHistoricalDataResponse(response)
    ).toThrow()
  })

  it('rejects observations outside the date range', () => {
    const response = validResponse()
    response.bars[0].timestamp = '2024-12-31'

    expect(() =>
      parseHistoricalDataResponse(response)
    ).toThrow()
  })

  it('rejects invalid retrieval timestamps', () => {
    expect(() =>
      parseHistoricalDataResponse({
        ...validResponse(),
        retrieved_at: 'invalid',
      })
    ).toThrow()
  })
})


describe('Historical request-response matching', () => {
  const expected = {
    symbol: 'AAPL',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    timeframe: '1d' as const,
  }

  it('accepts a matching response', () => {
    const response = validateHistoricalResponseForRequest(
      validResponse(),
      expected
    )

    expect(response.symbol).toBe('AAPL')
  })

  it('rejects the wrong ticker', () => {
    expect(() =>
      validateHistoricalResponseForRequest(
        { ...validResponse(), symbol: 'MSFT' },
        expected
      )
    ).toThrow()
  })

  it('rejects a mismatched start date', () => {
    expect(() =>
      validateHistoricalResponseForRequest(
        {
          ...validResponse(),
          start_date: '2025-02-01',
        },
        expected
      )
    ).toThrow()
  })

  it('rejects a mismatched end date', () => {
    expect(() =>
      validateHistoricalResponseForRequest(
        {
          ...validResponse(),
          end_date: '2025-11-30',
        },
        expected
      )
    ).toThrow()
  })
})
