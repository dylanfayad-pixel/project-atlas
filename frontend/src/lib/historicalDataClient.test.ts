import { describe, expect, it, vi } from 'vitest'
import {
  fetchHistoricalData,
  HistoricalDataClientError,
} from './historicalDataClient'

const validResponse = {
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
  ],
}

function mockFetch(body: unknown, status = 200) {
  return vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

describe('Historical market-data browser client', () => {
  it('retrieves validated historical observations', async () => {
    const fetchImpl = mockFetch(validResponse)

    const result = await fetchHistoricalData(
      'aapl',
      '2025-01-01',
      '2025-12-31',
      { fetchImpl },
    )

    expect(result.symbol).toBe('AAPL')
    expect(result.bars).toHaveLength(1)

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('symbol=AAPL'),
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
      }),
    )
  })

  it('rejects invalid symbols before requesting data', async () => {
    const fetchImpl = mockFetch(validResponse)

    await expect(
      fetchHistoricalData(
        'BAD!',
        '2025-01-01',
        '2025-12-31',
        { fetchImpl },
      ),
    ).rejects.toThrow()

    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('reports provider configuration errors', async () => {
    const fetchImpl = mockFetch({
      error: 'Historical market-data provider is not configured.',
      code: 'PROVIDER_NOT_CONFIGURED',
    }, 503)

    await expect(
      fetchHistoricalData(
        'AAPL',
        '2025-01-01',
        '2025-12-31',
        { fetchImpl },
      ),
    ).rejects.toMatchObject({
      code: 'PROVIDER_NOT_CONFIGURED',
      status: 503,
    } satisfies Partial<HistoricalDataClientError>)
  })

  it('rejects mismatched provider responses', async () => {
    const fetchImpl = mockFetch({
      ...validResponse,
      symbol: 'MSFT',
    })

    await expect(
      fetchHistoricalData(
        'AAPL',
        '2025-01-01',
        '2025-12-31',
        { fetchImpl },
      ),
    ).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    })
  })

  it('passes cancellation signals to fetch', async () => {
    const controller = new AbortController()
    const fetchImpl = mockFetch(validResponse)

    await fetchHistoricalData(
      'AAPL',
      '2025-01-01',
      '2025-12-31',
      {
        signal: controller.signal,
        fetchImpl,
      },
    )

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: controller.signal,
      }),
    )
  })
})
