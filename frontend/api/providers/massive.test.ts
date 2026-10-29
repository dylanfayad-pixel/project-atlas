// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { normalizeMassiveResponse } from './massive'
import type {
  HistoricalDataRequest,
} from '../../src/lib/historicalDataRequest'

const request: HistoricalDataRequest = {
  symbol: 'AAPL',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  timeframe: '1d',
}

function validResponse() {
  return {
    ticker: 'AAPL',
    results: [{
      t: Date.parse('2025-01-02T00:00:00Z'),
      o: 100,
      h: 105,
      l: 98,
      c: 103,
      v: 1000,
    }],
  }
}

describe('Massive aggregate normalization', () => {
  it('converts provider bars to Atlas OHLCV', () => {
    const result = normalizeMassiveResponse(
      validResponse(),
      request,
      false,
      '2026-10-29T00:00:00Z'
    )

    expect(result.provider).toBe('massive')
    expect(result.bars[0].timestamp).toBe('2025-01-02')
    expect(result.bars[0].close).toBe(103)
  })

  it('preserves adjustment metadata', () => {
    const result = normalizeMassiveResponse(
      validResponse(),
      request,
      true,
      '2026-10-29T00:00:00Z'
    )

    expect(result.adjusted).toBe(true)
  })

  it('rejects mismatched tickers', () => {
    expect(() =>
      normalizeMassiveResponse(
        { ...validResponse(), ticker: 'MSFT' },
        request,
        false,
        '2026-10-29T00:00:00Z'
      )
    ).toThrow()
  })

  it('rejects responses with additional pages', () => {
    expect(() =>
      normalizeMassiveResponse(
        {
          ...validResponse(),
          next_url: 'https://api.massive.com/next',
        },
        request,
        false,
        '2026-10-29T00:00:00Z'
      )
    ).toThrow()
  })

  it('accepts responses without pagination', () => {
    const result = normalizeMassiveResponse(
      validResponse(),
      request,
      false,
      '2026-10-29T00:00:00Z'
    )

    expect(result.bars).toHaveLength(1)
  })

  it('rejects missing observations', () => {
    expect(() =>
      normalizeMassiveResponse(
        { ticker: 'AAPL', results: [] },
        request,
        false,
        '2026-10-29T00:00:00Z'
      )
    ).toThrow()
  })

  it('rejects invalid epoch timestamps', () => {
    const response = validResponse()
    response.results[0].t = Number.NaN

    expect(() =>
      normalizeMassiveResponse(
        response,
        request,
        false,
        '2026-10-29T00:00:00Z'
      )
    ).toThrow()
  })

  it('rejects negative timestamps', () => {
    const response = validResponse()
    response.results[0].t = -1

    expect(() =>
      normalizeMassiveResponse(
        response,
        request,
        false,
        '2026-10-29T00:00:00Z'
      )
    ).toThrow()
  })

  it('rejects fractional timestamps', () => {
    const response = validResponse()
    response.results[0].t = 123.45

    expect(() =>
      normalizeMassiveResponse(
        response,
        request,
        false,
        '2026-10-29T00:00:00Z'
      )
    ).toThrow()
  })

  it('rejects invalid numeric fields', () => {
    const response = validResponse()
    response.results[0].c = Number.NaN

    expect(() =>
      normalizeMassiveResponse(
        response,
        request,
        false,
        '2026-10-29T00:00:00Z'
      )
    ).toThrow()
  })
})
