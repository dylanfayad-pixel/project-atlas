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


describe('Explicit demonstration mode', () => {
  it('starts without synthetic performance results', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('Market Data Import')

    expect(screen.getByText('NO ACTIVE DATA')).toBeTruthy()

    await user.click(screen.getByRole('button', {
      name: 'Overview',
    }))

    expect(
      screen.getByText('No Active Research Session')
    ).toBeTruthy()

    expect(screen.queryByTestId('demo-price-chart')).toBeNull()
    expect(screen.queryByTestId('portfolio-analytics')).toBeNull()
  })

  it('activates demo only when explicitly requested', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', {
      name: 'Launch Demo',
    }))

    expect(await screen.findByText('SYNTHETIC DEMO')).toBeTruthy()

    expect(
      await screen.findByTestId('demo-price-chart')
    ).toBeTruthy()
  })

  it('returns to an empty session after exiting demo', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', {
      name: 'Launch Demo',
    }))

    await screen.findByTestId('demo-price-chart')

    await user.click(screen.getByRole('button', {
      name: 'Exit Demo',
    }))

    expect(screen.getByText('NO ACTIVE DATA')).toBeTruthy()

    await user.click(screen.getByRole('button', {
      name: 'Overview',
    }))

    expect(
      screen.getByText('No Active Research Session')
    ).toBeTruthy()
  })
})

describe('Research session isolation', () => {
  it('clears imported data when launching demo', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<App />)

    await uploadCsv(user, sampleCsv)
    await screen.findByText('Dataset Preview')

    await user.click(screen.getByRole('button', {
      name: 'Launch Demo',
    }))

    expect(
      await screen.findByText('SYNTHETIC DEMO')
    ).toBeTruthy()

    expect(
      await screen.findByTestId('demo-price-chart')
    ).toBeTruthy()

    expect(
      screen.queryByText('Active Research Dataset')
    ).toBeNull()
  })

  it('returns to an empty workspace after demo exit', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', {
      name: 'Launch Demo',
    }))

    await screen.findByTestId('demo-price-chart')

    await user.click(screen.getByRole('button', {
      name: 'Exit Demo',
    }))

    await user.click(screen.getByRole('button', {
      name: 'Backtests',
    }))

    expect(
      screen.getByText('No Active Research Session')
    ).toBeTruthy()

    expect(
      screen.queryByTestId('portfolio-analytics')
    ).toBeNull()
  })
})

describe('Demo loading race conditions', () => {
  it('ignores late demo responses after exiting', async () => {
    let resolveSignals:
      ((value: { ok: boolean; text: () => Promise<string> }) => void)
      | undefined

    const pendingSignals = new Promise<{
      ok: boolean
      text: () => Promise<string>
    }>((resolve) => {
      resolveSignals = resolve
    })

    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      if (String(input).includes('demo_signals.csv')) {
        return pendingSignals
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      })
    }))

    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', {
      name: 'Launch Demo',
    }))

    await user.click(screen.getByRole('button', {
      name: 'Exit Demo',
    }))

    resolveSignals?.({
      ok: true,
      text: async () =>
        'index,timestamp,price,signal\\n0,2026-01-05,100,HOLD',
    })

    await user.click(screen.getByRole('button', {
      name: 'Overview',
    }))

    expect(
      screen.getByText('No Active Research Session')
    ).toBeTruthy()

    expect(
      screen.queryByTestId('demo-price-chart')
    ).toBeNull()
  })
})

describe('Manual research workflow', () => {
  async function loadManualData(
    user: ReturnType<typeof userEvent.setup>
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
        value
      )
    }

    await user.click(screen.getByRole('button', {
      name: 'Validate & Load Data',
    }))
  }

  it('loads manual data into the shared session', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('Market Data Import')
    await loadManualData(user)

    expect(
      screen.getByText('MANUALLY ENTERED DATA')
    ).toBeTruthy()

    await user.click(screen.getByRole('button', {
      name: 'Overview',
    }))

    expect(screen.getByText('Active Research Dataset')).toBeTruthy()

    // Both the session header and Overview show the count.
    // Verify that each displays the expected observation total.
    expect(screen.getAllByText('1')).toHaveLength(2)
  })

  it('shows manual candles in Market Data', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('Market Data Import')
    await loadManualData(user)

    await user.click(screen.getByRole('button', {
      name: 'Market Data',
    }))

    expect(
      screen.getByTestId('candlestick-chart')
    ).toBeTruthy()
  })

  it('does not assign demo backtest results to manual data',
    async () => {
      mockFetch()
      const user = userEvent.setup()
      render(<App />)

      await screen.findByText('Market Data Import')
      await loadManualData(user)

      await user.click(screen.getByRole('button', {
        name: 'Backtests',
      }))

      expect(
        screen.getByText('No backtest has been executed for this dataset.')
      ).toBeTruthy()

      expect(
        screen.queryByTestId('portfolio-analytics')
      ).toBeNull()
    })
})


describe('Market data source selection', () => {
  it('shows only the selected input form', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('Market Data Import')

    expect(
      screen.getByRole('button', { name: 'Choose CSV File' })
    ).toBeTruthy()

    await user.click(screen.getByRole('button', {
      name: 'Manual Entry',
    }))

    expect(
      screen.getByText('Manual Market Data Entry')
    ).toBeTruthy()

    expect(
      screen.queryByRole('button', { name: 'Choose CSV File' })
    ).toBeNull()

    await user.click(screen.getByRole('button', {
      name: 'Upload CSV',
    }))

    expect(
      screen.getByRole('button', { name: 'Choose CSV File' })
    ).toBeTruthy()

    expect(
      screen.queryByText('Manual Market Data Entry')
    ).toBeNull()
  })

  it('preserves active data when changing input methods',
    async () => {
      mockFetch()
      const user = userEvent.setup()
      render(<App />)

      await screen.findByText('Market Data Import')
      await uploadCsv(user, sampleCsv)

      await screen.findByText('Dataset Preview')

      await user.click(screen.getByRole('button', {
        name: 'Manual Entry',
      }))

      expect(screen.getByText('Dataset Preview')).toBeTruthy()

      await user.click(screen.getByRole('button', {
        name: 'Upload CSV',
      }))

      expect(screen.getByText('Dataset Preview')).toBeTruthy()
    })
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
    expect(screen.getByText('No backtest has been executed for this dataset.')).toBeTruthy()
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

    expect(screen.getByText('No backtest has been executed for this dataset.')).toBeTruthy()
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


describe('Shared backtest workflow', () => {
  it('shows backtest configuration after manual data load', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<App />)

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
        value
      )
    }

    await user.click(screen.getByRole('button', {
      name: 'Validate & Load Data',
    }))

    expect(
      await screen.findByText('Configure & Run Backtest')
    ).toBeTruthy()

    expect(
      screen.getByRole('button', { name: 'Run Backtest' })
    ).toBeTruthy()
  })

  it('automatically opens Backtests when execution starts', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<App />)

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
        value
      )
    }

    await user.click(screen.getByRole('button', {
      name: 'Validate & Load Data',
    }))

    const capital = screen.getByLabelText(
      'Starting Capital ($)'
    ) as HTMLInputElement

    await user.clear(capital)
    expect(capital.value).toBe('')

    await user.type(capital, '12500.50')
    expect(capital.valueAsNumber).toBe(12500.5)

    await user.click(screen.getByRole('button', {
      name: 'Run Backtest',
    }))

    expect(
      await screen.findByRole('heading', {
        name: 'Backtest Research',
        level: 1,
      })
    ).toBeTruthy()
  })
})
