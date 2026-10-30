// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useBacktestController } from './useBacktestController'
import { createManualDataset } from '../lib/researchSession'

const bars = [
  {
    timestamp: '2026-01-05',
    open: 100,
    high: 105,
    low: 98,
    close: 103,
    volume: 1000,
  },
]

function createDataset() {
  return createManualDataset(bars)
}

function createResponse() {
  return {
    response_version: 1,
    signals: [],
    portfolio: {
      schema_version: 3,
      strategy: 'buy-and-hold',
      initial_capital: 10000,
      final_equity: 10000,
      total_return_pct: 0,
      maximum_drawdown_pct: 0,
      trades: [],
      equity_curve: [
        {
          index: 0,
          timestamp: '2026-01-05',
          cash: 10000,
          shares: 0,
          equity: 10000,
        },
      ],
      risk_metrics: {
        return_observations: 0,
        periods_per_year: 252,
        risk_free_rate_per_period: 0,
        target_return_per_period: 0,
        annualized_volatility_pct: 0,
        sharpe_ratio: null,
        downside_deviation_pct: 0,
        sortino_ratio: null,
      },
    },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Shared backtest controller', () => {
  it('executes and stores validated results', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => createResponse(),
    })

    vi.stubGlobal('fetch', fetchMock)

    const started = vi.fn()
    const dataset = createDataset()

    const { result } = renderHook(() =>
      useBacktestController(dataset, started)
    )

    await act(async () => {
      await result.current.execute()
    })

    expect(started).toHaveBeenCalledOnce()
    expect(result.current.execution.status).toBe('success')
    expect(result.current.execution.result?.portfolio.final_equity)
      .toBe(10000)
  })

  it('shows backend errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Invalid backtest request',
      }),
    }))

    const dataset = createDataset()

    const { result } = renderHook(() =>
      useBacktestController(dataset, vi.fn())
    )

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.execution.status).toBe('error')
    expect(result.current.execution.error)
      .toBe('Invalid backtest request')
  })

  it('does not expose results from a replaced dataset', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => createResponse(),
    }))

    const first = createDataset()
    const second = createDataset()

    const { result, rerender } = renderHook(
      ({ dataset }) =>
        useBacktestController(dataset, vi.fn()),
      { initialProps: { dataset: first } }
    )

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.execution.status).toBe('success')

    rerender({ dataset: second })

    await waitFor(() => {
      expect(result.current.execution.status).toBe('idle')
    })

    expect(result.current.execution.result).toBeNull()
  })

  it('aborts outstanding execution when settings change', async () => {
    let signal: AbortSignal | undefined

    vi.stubGlobal('fetch', vi.fn(
      (_url: string, options: RequestInit) => {
        signal = options.signal ?? undefined
        return new Promise<Response>(() => {})
      }
    ))

    const dataset = createDataset()

    const { result } = renderHook(() =>
      useBacktestController(dataset, vi.fn())
    )

    act(() => {
      void result.current.execute()
    })

    await waitFor(() => {
      expect(signal).toBeDefined()
    })

    act(() => {
      result.current.updateDraft('capital', '15000')
    })

    expect(signal?.aborted).toBe(true)
    expect(result.current.execution.status).toBe('idle')
  })
  it('aborts an outstanding request on unmount', async () => {
    let signal: AbortSignal | undefined

    vi.stubGlobal('fetch', vi.fn(
      (_url: string, options: RequestInit) => {
        signal = options.signal ?? undefined
        return new Promise<Response>(() => {})
      }
    ))

    const dataset = createDataset()
    const started = vi.fn()

    const { result, unmount } = renderHook(() =>
      useBacktestController(dataset, started)
    )

    act(() => {
      void result.current.execute()
    })

    await waitFor(() => {
      expect(signal).toBeDefined()
    })

    expect(signal?.aborted).toBe(false)

    unmount()

    expect(signal?.aborted).toBe(true)
  })

  it('ignores a late response after settings change', async () => {
    let resolveFetch: ((value: Response) => void) | undefined

    vi.stubGlobal('fetch', vi.fn(
      () => new Promise<Response>((resolve) => {
        resolveFetch = resolve
      })
    ))

    const dataset = createDataset()
    const started = vi.fn()

    const { result } = renderHook(() =>
      useBacktestController(dataset, started)
    )

    act(() => {
      void result.current.execute()
    })

    await waitFor(() => {
      expect(resolveFetch).toBeDefined()
    })

    act(() => {
      result.current.updateDraft('capital', '15000')
    })

    await act(async () => {
      resolveFetch?.({
        ok: true,
        json: async () => createResponse(),
      } as Response)

      await Promise.resolve()
    })

    expect(result.current.execution.status).toBe('idle')
    expect(result.current.execution.result).toBeNull()
    expect(result.current.execution.error).toBeNull()
  })

})
