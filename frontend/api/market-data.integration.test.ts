// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createMarketDataHandler } from './market-data'
import {
  MarketDataProviderError,
} from './providers/types'
import type {
  HistoricalMarketDataProvider,
} from './providers/types'

const validUrl =
  '/api/market-data?symbol=AAPL&start=2025-01-01&end=2025-12-31'

function validResponse() {
  return {
    schema_version: 1 as const,
    symbol: 'AAPL',
    provider: 'test-provider',
    timeframe: '1d' as const,
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    adjusted: false,
    retrieved_at: '2026-10-29T00:00:00Z',
    bars: [{
      timestamp: '2025-01-02',
      open: 100,
      high: 105,
      low: 98,
      close: 103,
      volume: 1000,
    }],
  }
}

// Invoke the actual HTTP handler with a controlled
// response object and no external server.
async function invoke(
  provider: HistoricalMarketDataProvider,
  url = validUrl
) {
  const headers: Record<string, string> = {}
  let output = ''

  const request = {
    method: 'GET',
    url,
  } as IncomingMessage

  const response = Object.assign(new EventEmitter(), {
    statusCode: 200,
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value
      return this
    },
    end(value?: string) {
      output = value ?? ''
      return this
    },
  }) as unknown as ServerResponse

  await createMarketDataHandler(provider)(request, response)

  return {
    status: response.statusCode,
    headers,
    body: JSON.parse(output),
  }
}

function mockProvider(
  fetchDailyBars: HistoricalMarketDataProvider['fetchDailyBars']
): HistoricalMarketDataProvider {
  return {
    name: 'test-provider',
    fetchDailyBars,
  }
}

describe('Market-data HTTP provider integration', () => {
  it('returns validated historical observations', async () => {
    const result = await invoke(
      mockProvider(async () => validResponse())
    )

    expect(result.status).toBe(200)
    expect(result.body.symbol).toBe('AAPL')
    expect(result.body.bars).toHaveLength(1)
    expect(result.body.provider).toBe('test-provider')
  })

  it('rejects mismatched provider instruments', async () => {
    const result = await invoke(
      mockProvider(async () => ({
        ...validResponse(),
        symbol: 'MSFT',
      }))
    )

    expect(result.status).toBe(502)
    expect(result.body.code).toBe('INVALID_UPSTREAM_DATA')
  })

  it('maps provider rate limits to HTTP 429', async () => {
    const result = await invoke(
      mockProvider(async () => {
        throw new MarketDataProviderError(
          'Provider rate limit exceeded.',
          'UPSTREAM_RATE_LIMIT'
        )
      })
    )

    expect(result.status).toBe(429)
    expect(result.body.code).toBe('UPSTREAM_RATE_LIMIT')
  })

  it('maps provider timeouts to HTTP 504', async () => {
    const result = await invoke(
      mockProvider(async () => {
        throw new MarketDataProviderError(
          'Provider timed out.',
          'UPSTREAM_TIMEOUT'
        )
      })
    )

    expect(result.status).toBe(504)
    expect(result.body.code).toBe('UPSTREAM_TIMEOUT')
  })

  it('maps unavailable providers to HTTP 503', async () => {
    const result = await invoke(
      mockProvider(async () => {
        throw new Error('Network unavailable')
      })
    )

    expect(result.status).toBe(503)
    expect(result.body.code).toBe('UPSTREAM_UNAVAILABLE')
  })

  it('rejects invalid upstream prices with HTTP 502', async () => {
    const invalid = validResponse()
    invalid.bars[0].high = 99

    const result = await invoke(
      mockProvider(async () => invalid)
    )

    expect(result.status).toBe(502)
    expect(result.body.code).toBe('INVALID_UPSTREAM_DATA')
  })

  it('does not invoke providers for invalid requests', async () => {
    let calls = 0

    const result = await invoke(
      mockProvider(async () => {
        calls += 1
        return validResponse()
      }),
      '/api/market-data?symbol=BAD!&start=2025-01-01&end=2025-12-31'
    )

    expect(result.status).toBe(400)
    expect(calls).toBe(0)
  })
})
