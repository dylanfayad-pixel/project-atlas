// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  executeProviderRequest,
  PROVIDER_TIMEOUT_MS,
} from './execute'
import {
  MarketDataProviderError,
} from './types'
import type {
  HistoricalMarketDataProvider,
} from './types'
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

function provider(
  fetchDailyBars: HistoricalMarketDataProvider['fetchDailyBars']
): HistoricalMarketDataProvider {
  return {
    name: 'test-provider',
    fetchDailyBars,
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('Provider execution', () => {
  it('accepts a valid provider response', async () => {
    const result = await executeProviderRequest(
      provider(async () => validResponse()),
      request
    )

    expect(result.symbol).toBe('AAPL')
    expect(result.bars).toHaveLength(1)
  })

  it('rejects a mismatched ticker', async () => {
    await expect(
      executeProviderRequest(
        provider(async () => ({
          ...validResponse(),
          symbol: 'MSFT',
        })),
        request
      )
    ).rejects.toMatchObject({
      code: 'INVALID_UPSTREAM_DATA',
    })
  })

  it('rejects invalid market prices', async () => {
    const invalid = validResponse()
    invalid.bars[0].high = 99

    await expect(
      executeProviderRequest(
        provider(async () => invalid),
        request
      )
    ).rejects.toMatchObject({
      code: 'INVALID_UPSTREAM_DATA',
    })
  })

  it('normalizes upstream failures', async () => {
    await expect(
      executeProviderRequest(
        provider(async () => {
          throw new Error('Network unavailable')
        }),
        request
      )
    ).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    })
  })

  it('preserves explicit rate-limit errors', async () => {
    await expect(
      executeProviderRequest(
        provider(async () => {
          throw new MarketDataProviderError(
            'Provider rate limit exceeded.',
            'UPSTREAM_RATE_LIMIT'
          )
        }),
        request
      )
    ).rejects.toMatchObject({
      code: 'UPSTREAM_RATE_LIMIT',
    })
  })

  it('times out even if the provider ignores abort', async () => {
    vi.useFakeTimers()

    let observedSignal: AbortSignal | undefined

    const pending = provider((_request, signal) => {
      observedSignal = signal

      return new Promise(() => {
        // Simulate a provider that never settles.
      })
    })

    const execution = executeProviderRequest(
      pending,
      request
    )

    // Attach the rejection handler before advancing time.
    const assertion = expect(execution).rejects.toMatchObject({
      code: 'UPSTREAM_TIMEOUT',
    })

    await vi.advanceTimersByTimeAsync(
      PROVIDER_TIMEOUT_MS
    )

    await assertion
    expect(observedSignal?.aborted).toBe(true)
  })
})
