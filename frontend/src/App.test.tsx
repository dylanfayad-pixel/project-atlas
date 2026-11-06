// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  render,
  screen,
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

const alignedCsv = [
  'timestamp,open,high,low,close,volume',
  '2026-01-05,200,205,195,200,1000000',
  '2026-01-06,210,215,205,210,1000000',
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

    await navigate(user, 'Market Overview')

    const insights = screen.getByRole('region', {
      name: 'Research Insights',
    })

    expect(
      within(insights).getByText('Trend Classification Unavailable'),
    ).toBeInTheDocument()

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
    expect(screen.getByText('EMA 12')).toBeInTheDocument()
    expect(screen.getByText('EMA 26')).toBeInTheDocument()
    expect(screen.getByText('MACD')).toBeInTheDocument()
    expect(screen.getByText('MACD Signal')).toBeInTheDocument()
    expect(screen.getByText('MACD Histogram')).toBeInTheDocument()

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

  it('preserves instrument metadata across multiple datasets', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Import and identify the first instrument.
    await uploadCsv(user, sampleCsv)

    await user.type(
      await screen.findByLabelText('Instrument ticker'),
      'AAPL',
    )

    await user.click(screen.getByRole('button', {
      name: 'Save Instrument Information',
    }))

    const identity = screen.getByRole('region', {
      name: 'Active research dataset',
    })

    expect(identity).toHaveTextContent('AAPL')

    // A second import must not delete the original dataset.
    await uploadCsv(user, replacementCsv, 'replacement.csv')

    const collection = screen.getByRole('region', {
      name: 'Research Collection',
    })

    expect(within(collection).getByText('2 DATASETS'))
      .toBeInTheDocument()

    expect(within(collection).getByText('AAPL'))
      .toBeInTheDocument()

    // The newly imported dataset becomes active and starts
    // with independent, unverified instrument metadata.
    expect(identity).toHaveTextContent('UNSPECIFIED INSTRUMENT')

    // Select the original dataset and restore its identity.
    await user.click(
      within(collection).getByRole('button', {
        name: 'Select Dataset',
      }),
    )

    expect(identity).toHaveTextContent('AAPL')
    expect(screen.getByText('Dataset Preview'))
      .toBeInTheDocument()
  })

  it('isolates historical prices when switching datasets', async () => {
    const user = userEvent.setup()
    render(<App />)

    await uploadCsv(user, sampleCsv)

    let dashboard = screen.getByRole('region', {
      name: 'Market Intelligence',
    })

    expect(within(dashboard).getByText('106.00'))
      .toBeInTheDocument()

    await uploadCsv(user, replacementCsv, 'replacement.csv')

    dashboard = screen.getByRole('region', {
      name: 'Market Intelligence',
    })

    expect(within(dashboard).getByText('205.00'))
      .toBeInTheDocument()

    const collection = screen.getByRole('region', {
      name: 'Research Collection',
    })

    await user.click(
      within(collection).getByRole('button', {
        name: 'Select Dataset',
      }),
    )

    dashboard = screen.getByRole('region', {
      name: 'Market Intelligence',
    })

    expect(within(dashboard).getByText('106.00'))
      .toBeInTheDocument()

    expect(within(dashboard).queryByText('205.00'))
      .not.toBeInTheDocument()
  })

  it('removes datasets without retaining stale research data', async () => {
    const user = userEvent.setup()
    render(<App />)

    await uploadCsv(user, sampleCsv)
    await uploadCsv(user, replacementCsv, 'replacement.csv')

    let collection = screen.getByRole('region', {
      name: 'Research Collection',
    })

    expect(within(collection).getByText('2 DATASETS'))
      .toBeInTheDocument()

    await user.click(
      within(collection).getByRole('button', {
        name: 'Remove replacement.csv',
      }),
    )

    collection = screen.getByRole('region', {
      name: 'Research Collection',
    })

    expect(within(collection).getByText('1 DATASETS'))
      .toBeInTheDocument()

    expect(
      screen.getByRole('region', {
        name: 'Market Intelligence',
      }),
    ).toHaveTextContent('106.00')

    await user.click(
      within(collection).getByRole('button', {
        name: 'Remove sample.csv',
      }),
    )

    expect(
      screen.queryByRole('region', {
        name: 'Research Collection',
      }),
    ).not.toBeInTheDocument()

    expect(screen.getByText('NO ACTIVE DATA'))
      .toBeInTheDocument()
  })

  it('rejects a 21st dataset without changing the collection', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Fill the research collection to its documented capacity.
    for (let index = 0; index < 20; index++) {
      await uploadCsv(
        user,
        sampleCsv,
        `instrument-${index}.csv`,
      )
    }

    const collection = screen.getByRole('region', {
      name: 'Research Collection',
    })

    expect(within(collection).getByText('20 DATASETS'))
      .toBeInTheDocument()

    // Importing beyond capacity must not create another dataset.
    await uploadCsv(user, replacementCsv, 'overflow.csv')

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('Research collection limit reached')

    expect(within(collection).getByText('20 DATASETS'))
      .toBeInTheDocument()

    expect(within(collection).queryByText('overflow.csv'))
      .not.toBeInTheDocument()
  })

  it('compares multiple instruments using shared dates', async () => {
    const user = userEvent.setup()
    render(<App />)

    await uploadCsv(user, sampleCsv)

    const collection = await screen.findByRole('region', {
      name: 'Research Collection',
    })

    expect(within(collection).getByText('1 DATASETS'))
      .toBeInTheDocument()

    await uploadCsv(user, alignedCsv, 'aligned.csv')

    // Wait for the second import to update React collection state.
    expect(
      await within(collection).findByText('2 DATASETS'),
    ).toBeInTheDocument()

    await navigate(user, 'Market Explorer')

    const comparison = screen.getByRole('region', {
      name: 'Instrument Comparison',
    })

    expect(
      within(comparison).getAllByText('2'),
    ).toHaveLength(3)

    expect(within(comparison).getByText('sample.csv'))
      .toBeInTheDocument()

    expect(within(comparison).getByText('aligned.csv'))
      .toBeInTheDocument()

    expect(within(comparison).getByText('2026-01-05'))
      .toBeInTheDocument()

    expect(within(comparison).getByText('2026-01-06'))
      .toBeInTheDocument()

    // The sample dataset rises from 103 to 106.
    // The aligned dataset rises from 200 to 210.
    expect(within(comparison).getByText('2.91%'))
      .toBeInTheDocument()

    expect(within(comparison).getByText('5.00%'))
      .toBeInTheDocument()
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

  it('preserves CSV and manual datasets independently', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Import historical CSV observations.
    await uploadCsv(user, sampleCsv)

    // Manual observations create a second dataset.
    await loadManualData(user)

    const collection = screen.getByRole('region', {
      name: 'Research Collection',
    })

    expect(within(collection).getByText('2 DATASETS'))
      .toBeInTheDocument()

    expect(within(collection).getByText('sample.csv'))
      .toBeInTheDocument()

    // Manual data is the newly selected dataset.
    let dashboard = screen.getByRole('region', {
      name: 'Market Intelligence',
    })

    expect(within(dashboard).getByText('103.00'))
      .toBeInTheDocument()

    // Return to the original CSV dataset.
    await user.click(
      within(collection).getByRole('button', {
        name: 'Select Dataset',
      }),
    )

    dashboard = screen.getByRole('region', {
      name: 'Market Intelligence',
    })

    expect(within(dashboard).getByText('106.00'))
      .toBeInTheDocument()

    expect(within(dashboard).queryByText('103.00'))
      .not.toBeInTheDocument()
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
