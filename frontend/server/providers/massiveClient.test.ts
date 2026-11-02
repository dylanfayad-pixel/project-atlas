// @vitest-environment node

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  buildMassiveUrl,
  MassiveHistoricalProvider,
} from './massiveClient'

import type {
  HistoricalDataRequest,
} from '../../src/lib/historicalDataRequest'

const request: HistoricalDataRequest = {
  symbol: 'AAPL',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  timeframe: '1d',
}

const provider = new MassiveHistoricalProvider('test-secret')

function successfulPayload() {
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

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Massive HTTP adapter', () => {
  it('constructs the historical aggregate URL', () => {
    const url = new URL(buildMassiveUrl(request))

    expect(url.protocol).toBe('https:')
    expect(url.hostname).toBe('api.massive.com')
    expect(url.pathname).toContain(
      '/v2/aggs/ticker/AAPL/range/1/day/'
    )
    expect(url.searchParams.get('adjusted')).toBe('false')
    expect(url.searchParams.get('sort')).toBe('asc')
  })

  it('sends credentials in a header, not the URL', async () => {
    const fetchMock = vi.fn<
      (url: string, options: RequestInit) => Promise<Response>
    >()

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(successfulPayload()), {
        status: 200,
      })
    )

    vi.stubGlobal('fetch', fetchMock)

    await provider.fetchDailyBars(
      request,
      new AbortController().signal
    )

    const [url, options] = fetchMock.mock.calls[0] as [
      string,
      RequestInit
    ]

    expect(url).not.toContain('test-secret')
    expect(options.headers).toMatchObject({
      Authorization: 'Bearer test-secret',
    })
  })

  it('normalizes successful provider responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify(successfulPayload()), {
          status: 200,
        })
      )
    )

    const result = await provider.fetchDailyBars(
      request,
      new AbortController().signal
    )

    expect(result.provider).toBe('massive')
    expect(result.bars[0].close).toBe(103)
  })

  it('maps HTTP 429 to a rate-limit error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 429 }))
    )

    await expect(
      provider.fetchDailyBars(
        request,
        new AbortController().signal
      )
    ).rejects.toMatchObject({
      code: 'UPSTREAM_RATE_LIMIT',
    })
  })

  it('rejects failed upstream HTTP responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 }))
    )

    await expect(
      provider.fetchDailyBars(
        request,
        new AbortController().signal
      )
    ).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    })
  })

  it('rejects invalid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('not-json', { status: 200 })
      )
    )

    await expect(
      provider.fetchDailyBars(
        request,
        new AbortController().signal
      )
    ).rejects.toMatchObject({
      code: 'INVALID_UPSTREAM_DATA',
    })
  })

  it('rejects oversized upstream responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('x'.repeat(2_000_001), {
          status: 200,
        })
      )
    )

    await expect(
      provider.fetchDailyBars(
        request,
        new AbortController().signal
      )
    ).rejects.toMatchObject({
      code: 'INVALID_UPSTREAM_DATA',
    })
  })

  it('forwards the abort signal to fetch', async () => {
    const fetchMock = vi.fn<
      (url: string, options: RequestInit) => Promise<Response>
    >()

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(successfulPayload()), {
        status: 200,
      })
    )

    vi.stubGlobal('fetch', fetchMock)

    const controller = new AbortController()

    await provider.fetchDailyBars(
      request,
      controller.signal
    )

    const [, options] = fetchMock.mock.calls[0] as [
      string,
      RequestInit
    ]

    expect(options.signal).toBe(controller.signal)
  })
})
