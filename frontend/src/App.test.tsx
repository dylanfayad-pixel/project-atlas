// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

// Mock charts only; keep the actual application state,
// CSV parser, navigation, and metadata editor under test.
vi.mock('./components/CandlestickChart', () => ({
  CandlestickChart: () => <div data-testid="candlestick-chart" />,
}))

vi.mock('./components/PriceChart', () => ({
  PriceChart: () => <div data-testid="demo-price-chart" />,
}))

vi.mock('./components/PortfolioAnalytics', () => ({
  PortfolioAnalytics: () => <div data-testid="portfolio-analytics" />,
}))

const sampleCsv = [
  'timestamp,open,high,low,close,volume',
  '2026-01-05,100,105,98,103,1500000',
  '2026-01-06,103,108,101,106,1700000',
].join('\n')

const replacementCsv = [
  'timestamp,open,high,low,close,volume',
  '2026-02-02,200,210,195,205,2000000',
].join('\n')

function mockFetch() {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)

    if (url.includes('demo_signals.csv')) {
      return {
        ok: true,
        text: async () => [
          'index,timestamp,price,signal',
          '0,2026-01-05,100,HOLD',
        ].join('\n'),
      }
    }

    return {
      ok: true,
      json: async () => ({}),
    }
  }))
}

async function uploadCsv(user: ReturnType<typeof userEvent.setup>,
  content: string, filename = 'sample.csv') {
  const file = new File([content], filename, {
    type: 'text/csv',
  })

  // The actual file input is visually hidden but accessible.
  await user.upload(
    screen.getByLabelText('Upload daily OHLCV CSV'),
    file
  )
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Atlas research workflow', () => {
  it('preserves imported data across navigation', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('Market Data Import')
    await uploadCsv(user, sampleCsv)

    await screen.findByText('Dataset validated successfully.')

    await user.click(screen.getByRole('button', {
      name: 'Overview',
    }))

    expect(screen.getByText('Active Research Dataset')).toBeTruthy()

    await user.click(screen.getByRole('button', {
      name: 'Market Data',
    }))

    expect(screen.getByTestId('candlestick-chart')).toBeTruthy()

    await user.click(screen.getByRole('button', {
      name: 'Research Setup',
    }))

    expect(screen.getByText('Dataset Preview')).toBeTruthy()
  })

  it('saves instrument identity across tabs', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('Market Data Import')
    await uploadCsv(user, sampleCsv)

    await user.type(
      await screen.findByLabelText('Instrument ticker'),
      'aapl'
    )
    await user.type(
      screen.getByLabelText('Exchange'),
      'nasdaq'
    )

    await user.click(screen.getByRole('button', {
      name: 'Save Instrument Information',
    }))

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeTruthy()
    })

    await user.click(screen.getByRole('button', {
      name: 'Backtests',
    }))

    expect(screen.getByText('AAPL')).toBeTruthy()
    expect(screen.getByText('No Backtest Executed')).toBeTruthy()
  })

  it('resets metadata when a new dataset is uploaded', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('Market Data Import')
    await uploadCsv(user, sampleCsv)

    await user.type(
      await screen.findByLabelText('Instrument ticker'),
      'AAPL'
    )

    await user.click(screen.getByRole('button', {
      name: 'Save Instrument Information',
    }))

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeTruthy()
    })

    await uploadCsv(user, replacementCsv, 'replacement.csv')

    await waitFor(() => {
      expect(
        screen.getByText('UNSPECIFIED INSTRUMENT')
      ).toBeTruthy()
    })

    expect(screen.queryByText('AAPL')).toBeNull()
  })

  it('does not show demo results for uploaded data', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('Market Data Import')
    await uploadCsv(user, sampleCsv)

    await user.click(screen.getByRole('button', {
      name: 'Backtests',
    }))

    expect(screen.getByText('No Backtest Executed')).toBeTruthy()
    expect(
      screen.queryByTestId('portfolio-analytics')
    ).toBeNull()
  })

  it('preserves valid data after an invalid upload', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('Market Data Import')
    await uploadCsv(user, sampleCsv)

    await screen.findByText('Dataset Preview')

    await uploadCsv(
      user,
      'timestamp,open,high,low,close,volume\ninvalid',
      'invalid.csv'
    )

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByText('Dataset Preview')).toBeTruthy()
  })
})
