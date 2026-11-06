// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import {
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { TickerSearch } from './TickerSearch'

const validResponse = {
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

beforeAll(() => {
  vi.stubEnv('VITE_ENABLE_TICKER_SEARCH', 'true')
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

async function enterTicker(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('textbox', {
    name: 'Stock Ticker',
  }), 'AAPL')
}

describe('Ticker search interactions', () => {
  it('disables public ticker retrieval when unavailable', () => {
    vi.stubEnv('VITE_ENABLE_TICKER_SEARCH', 'false')

    const { unmount } = render(
      <TickerSearch onDataLoaded={vi.fn(() => true)} />,
    )

    expect(
      screen.getByRole('button', {
        name: 'Load Historical Data',
      }),
    ).toBeDisabled()

    expect(screen.getByRole('note')).toHaveTextContent(
      'Automatic ticker retrieval is not available',
    )

    unmount()
    vi.stubEnv('VITE_ENABLE_TICKER_SEARCH', 'true')
  })

  it('loads historical data and reports success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(validResponse), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const onDataLoaded = vi.fn(() => true)
    const user = userEvent.setup()

    render(<TickerSearch onDataLoaded={onDataLoaded} />)

    await enterTicker(user)
    await user.click(screen.getByRole('button', {
      name: 'Load Historical Data',
    }))

    await waitFor(() => {
      expect(onDataLoaded).toHaveBeenCalledOnce()
    })

    expect(await screen.findByRole('status')).toHaveTextContent(
      'AAPL: 1 historical observations loaded.',
    )
  })

  it('reports provider configuration failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        error: 'Historical market-data provider is not configured.',
        code: 'PROVIDER_NOT_CONFIGURED',
      }), { status: 503 }),
    ))

    const onDataLoaded = vi.fn(() => true)
    const user = userEvent.setup()

    render(<TickerSearch onDataLoaded={onDataLoaded} />)

    await enterTicker(user)
    await user.click(screen.getByRole('button', {
      name: 'Load Historical Data',
    }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Historical market-data provider is not configured.',
    )

    expect(onDataLoaded).not.toHaveBeenCalled()
  })

  it('does not report success when collection rejects data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify(validResponse), { status: 200 }),
    ))

    const user = userEvent.setup()
    const onDataLoaded = vi.fn(() => false)

    render(<TickerSearch onDataLoaded={onDataLoaded} />)

    await enterTicker(user)
    await user.click(screen.getByRole('button', {
      name: 'Load Historical Data',
    }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Research collection is full.',
    )

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('cancels pending requests without importing data', async () => {
    let rejectRequest: ((error: Error) => void) | undefined

    vi.stubGlobal('fetch', vi.fn().mockImplementation(
      () => new Promise((_resolve, reject) => {
        rejectRequest = reject
      }),
    ))

    const user = userEvent.setup()
    const onDataLoaded = vi.fn(() => true)

    render(<TickerSearch onDataLoaded={onDataLoaded} />)

    await enterTicker(user)
    await user.click(screen.getByRole('button', {
      name: 'Load Historical Data',
    }))

    await user.click(screen.getByRole('button', {
      name: 'Cancel Request',
    }))

    rejectRequest?.(new Error('Request aborted'))

    await waitFor(() => {
      expect(screen.queryByText(
        'Loading Historical Data...',
      )).not.toBeInTheDocument()
    })

    expect(onDataLoaded).not.toHaveBeenCalled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
