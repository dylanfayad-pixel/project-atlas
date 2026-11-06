// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import App from './App'

// The charting library requires browser canvas APIs unavailable in
// jsdom. Keep the application integration real while replacing only
// the visual chart renderer.
vi.mock('./components/CandlestickChart', () => ({
  CandlestickChart: () => (
    <div data-testid="mock-candlestick-chart">
      Historical candlestick chart
    </div>
  ),
}))


const providerResponse = {
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

beforeAll(() => {
  vi.stubEnv('VITE_ENABLE_TICKER_SEARCH', 'true')
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Atlas ticker retrieval integration', () => {
  it('loads provider data into the research collection', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(providerResponse), {
        status: 200,
      }),
    )

    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', {
      name: 'Search Ticker',
    }))

    await user.type(screen.getByRole('textbox', {
      name: 'Stock Ticker',
    }), 'AAPL')

    await user.click(screen.getByRole('button', {
      name: 'Load Historical Data',
    }))

    await waitFor(() => {
      expect(
        screen.getByRole('status'),
      ).toHaveTextContent(
        'AAPL: 2 historical observations loaded.',
      )
    })

    const collection = screen.getByRole('region', {
      name: 'Research Collection',
    })

    expect(
      within(collection).getByText('AAPL'),
    ).toBeInTheDocument()

    expect(
      within(collection).getByText('1 DATASETS'),
    ).toBeInTheDocument()

    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('does not create a dataset after provider failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        error: 'Historical market-data provider is not configured.',
        code: 'PROVIDER_NOT_CONFIGURED',
      }), { status: 503 }),
    ))

    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', {
      name: 'Search Ticker',
    }))

    await user.type(screen.getByRole('textbox', {
      name: 'Stock Ticker',
    }), 'AAPL')

    await user.click(screen.getByRole('button', {
      name: 'Load Historical Data',
    }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Historical market-data provider is not configured.',
    )

    expect(
      screen.queryByRole('region', {
        name: 'Research Collection',
      }),
    ).not.toBeInTheDocument()
  })
})
