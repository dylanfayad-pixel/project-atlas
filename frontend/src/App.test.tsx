// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

// Mock chart rendering while exercising real application state,
// CSV parsing, navigation, metadata, and market analytics.
vi.mock('./components/CandlestickChart', () => ({
  CandlestickChart: () => <div data-testid="candlestick-chart" />,
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

// Upload a real File through the existing CSV input.
async function uploadCsv(
  user: ReturnType<typeof userEvent.setup>,
  content: string,
  filename = 'sample.csv',
) {
  const file = new File([content], filename, {
    type: 'text/csv',
  })

  await user.upload(
    screen.getByLabelText('Upload daily OHLCV CSV'),
    file,
  )
}

// Enter a validated daily OHLCV observation.
async function loadManualData(
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.click(screen.getByRole('button', {
    name: 'Manual Entry',
  }))

  const fields = [
    ['Date (YYYY-MM-DD)', '2026-01-05'],
    ['Open', '100'],
    ['High', '105'],
    ['Low', '98'],
    ['Close', '103'],
    ['Volume', '1500000'],
  ]

  for (const [label, value] of fields) {
    await user.type(
      screen.getByRole('textbox', {
        name: `${label} row 1`,
      }),
      value,
    )
  }

  await user.click(screen.getByRole('button', {
    name: 'Validate & Load Data',
  }))
}

async function navigate(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  await user.click(screen.getByRole('button', { name }))
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Atlas Intelligence navigation', () => {
  it('starts in Data Workspace without fabricated results', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', {
        name: 'Data Workspace',
        level: 1,
      }),
    ).toBeInTheDocument()

    expect(screen.getByText('NO ACTIVE DATA')).toBeInTheDocument()

    expect(
      screen.queryByRole('button', { name: 'Run Backtest' }),
    ).not.toBeInTheDocument()
  })

  it('provides all five research workspaces', async () => {
    const user = userEvent.setup()
    render(<App />)

    const views = [
      'Market Overview',
      'Data Workspace',
      'Technical Indicators',
      'Market Explorer',
      'Risk Intelligence',
    ]

    for (const name of views) {
      await navigate(user, name)

      expect(
        screen.getByRole('heading', {
          name,
          level: 1,
        }),
      ).toBeInTheDocument()
    }
  })

  it('shows explicit empty states without data', async () => {
    const user = userEvent.setup()
    render(<App />)

    await navigate(user, 'Market Overview')

    expect(
      screen.getByText('No Active Market Dataset'),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('region', {
        name: 'Market Intelligence',
      }),
    ).not.toBeInTheDocument()
  })
})

describe('Atlas Intelligence CSV research', () => {
  it('automatically calculates historical metrics', async () => {
    const user = userEvent.setup()
    render(<App />)

    await uploadCsv(user, sampleCsv)

    const dashboard = await screen.findByRole('region', {
      name: 'Market Intelligence',
    })

    expect(within(dashboard).getByText('106.00')).toBeInTheDocument()
    expect(within(dashboard).getByText('2.91%')).toBeInTheDocument()
  })

  it('preserves imported data across navigation', async () => {
    const user = userEvent.setup()
    render(<App />)

    await uploadCsv(user, sampleCsv)
    await screen.findByText('Dataset Preview')

    await navigate(user, 'Market Overview')

    expect(
      screen.getByRole('region', {
        name: 'Market Intelligence',
      }),
    ).toBeInTheDocument()

    await navigate(user, 'Market Explorer')

    expect(screen.getByTestId('candlestick-chart')).toBeInTheDocument()

    await navigate(user, 'Data Workspace')

    expect(screen.getByText('Dataset Preview')).toBeInTheDocument()
  })

  it('shows historical technical indicators', async () => {
    const user = userEvent.setup()
    render(<App />)

    await uploadCsv(user, sampleCsv)
    await navigate(user, 'Technical Indicators')

    expect(screen.getByText('SMA 20')).toBeInTheDocument()
    expect(screen.getByText('RSI 14')).toBeInTheDocument()

    expect(
      screen.getAllByText('Insufficient data').length,
    ).toBeGreaterThan(0)
  })

  it('shows historical risk measurements', async () => {
    const user = userEvent.setup()
    render(<App />)

    await uploadCsv(user, sampleCsv)
    await navigate(user, 'Risk Intelligence')

    expect(screen.getByText('Annualized Volatility')).toBeInTheDocument()
    expect(screen.getByText('Maximum Close Drawdown')).toBeInTheDocument()
    expect(screen.getByText('Historical Price Return')).toBeInTheDocument()
  })

  it('resets metadata after dataset replacement', async () => {
    const user = userEvent.setup()
    render(<App />)

    await uploadCsv(user, sampleCsv)

    await user.type(
      await screen.findByLabelText('Instrument ticker'),
      'AAPL',
    )

    await user.click(screen.getByRole('button', {
      name: 'Save Instrument Information',
    }))

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })

    await uploadCsv(user, replacementCsv, 'replacement.csv')

    await waitFor(() => {
      expect(
        screen.getByText('UNSPECIFIED INSTRUMENT'),
      ).toBeInTheDocument()
    })

    expect(screen.queryByText('AAPL')).not.toBeInTheDocument()
  })

  it('preserves valid data after invalid upload', async () => {
    const user = userEvent.setup()
    render(<App />)

    await uploadCsv(user, sampleCsv)
    await screen.findByText('Dataset Preview')

    await uploadCsv(
      user,
      'timestamp,open,high,low,close,volume\ninvalid',
      'invalid.csv',
    )

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Dataset Preview')).toBeInTheDocument()
  })
})

describe('Atlas Intelligence manual research', () => {
  it('automatically analyzes manual observations', async () => {
    const user = userEvent.setup()
    render(<App />)

    await loadManualData(user)

    const dashboard = await screen.findByRole('region', {
      name: 'Market Intelligence',
    })

    expect(within(dashboard).getByText('103.00')).toBeInTheDocument()
  })

  it('preserves manual data across research workspaces', async () => {
    const user = userEvent.setup()
    render(<App />)

    await loadManualData(user)

    await navigate(user, 'Market Explorer')

    expect(screen.getByTestId('candlestick-chart')).toBeInTheDocument()

    await navigate(user, 'Market Overview')

    expect(
      screen.getByRole('region', {
        name: 'Market Intelligence',
      }),
    ).toBeInTheDocument()
  })

  it('switches input methods without clearing the dataset', async () => {
    const user = userEvent.setup()
    render(<App />)

    await uploadCsv(user, sampleCsv)

    await navigate(user, 'Data Workspace')
    await navigate(user, 'Market Overview')
    await navigate(user, 'Data Workspace')

    await user.click(screen.getByRole('button', {
      name: 'Manual Entry',
    }))

    expect(screen.getByText('Dataset Preview')).toBeInTheDocument()

    await user.click(screen.getByRole('button', {
      name: 'Upload CSV',
    }))

    expect(screen.getByText('Dataset Preview')).toBeInTheDocument()
  })
})
