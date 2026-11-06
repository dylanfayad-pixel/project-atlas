// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InstrumentComparison } from './InstrumentComparison'
import type { ResearchDataset } from '../lib/researchSession'

afterEach(() => cleanup())

function dataset(
  id: string,
  closes: number[],
): ResearchDataset {
  const bars = closes.map((close, index) => ({
    timestamp: new Date(
      Date.UTC(2026, 0, index + 1),
    ).toISOString().slice(0, 10),
    open: close,
    high: close,
    low: close,
    close,
    volume: 1000,
  }))

  return {
    id,
    source: 'uploaded-csv',
    filename: `${id}.csv`,
    symbol: id.toUpperCase(),
    exchange: null,
    instrumentVerified: false,
    timeframe: '1d',
    bars,
    firstTimestamp: bars[0].timestamp,
    lastTimestamp: bars[bars.length - 1].timestamp,
  }
}

describe('Multi-instrument comparison dashboard', () => {
  it('shows insufficient-data guidance', () => {
    render(<InstrumentComparison datasets={[]} />)

    expect(
      screen.getByText(/at least two instruments/i),
    ).toBeInTheDocument()
  })

  it('displays aligned historical comparisons', () => {
    render(
      <InstrumentComparison datasets={[
        dataset('a', [100, 110, 120]),
        dataset('b', [200, 210, 220]),
      ]} />,
    )

    const panel = screen.getByRole('region', {
      name: 'Instrument Comparison',
    })

    expect(within(panel).getByText('A')).toBeInTheDocument()
    expect(within(panel).getByText('B')).toBeInTheDocument()
    expect(within(panel).getByText('20.00%')).toBeInTheDocument()
    expect(within(panel).getByText('10.00%')).toBeInTheDocument()
  })

  it('reports limited comparison quality', () => {
    render(
      <InstrumentComparison datasets={[
        dataset('a', Array(30).fill(100)),
        dataset('b', Array(30).fill(100)),
      ]} />,
    )

    expect(screen.getByText('LIMITED')).toBeInTheDocument()
  })

  it('filters displayed instruments by search', async () => {
    const user = userEvent.setup()

    render(
      <InstrumentComparison datasets={[
        dataset('a', [100, 110, 120]),
        dataset('b', [200, 210, 220]),
      ]} />,
    )

    await user.type(
      screen.getByRole('searchbox', {
        name: 'Search Instruments',
      }),
      'A',
    )

    const table = screen.getByRole('table')

    expect(within(table).getByText('A')).toBeInTheDocument()
    expect(within(table).queryByText('B'))
      .not.toBeInTheDocument()
  })

  it('filters by minimum historical return', async () => {
    const user = userEvent.setup()

    render(
      <InstrumentComparison datasets={[
        dataset('a', [100, 110, 120]),
        dataset('b', [200, 210, 220]),
      ]} />,
    )

    await user.type(
      screen.getByRole('spinbutton', {
        name: 'Minimum Return (%)',
      }),
      '15',
    )

    const table = screen.getByRole('table')

    expect(within(table).getByText('A')).toBeInTheDocument()
    expect(within(table).queryByText('B'))
      .not.toBeInTheDocument()
  })

  it('explains when screening filters exclude all instruments', async () => {
    const user = userEvent.setup()

    render(
      <InstrumentComparison datasets={[
        dataset('a', [100, 110, 120]),
        dataset('b', [200, 210, 220]),
      ]} />,
    )

    await user.type(
      screen.getByRole('searchbox', {
        name: 'Search Instruments',
      }),
      'NOT-A-REAL-INSTRUMENT',
    )

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent('No instruments match')

    expect(
      within(screen.getByRole('table')).queryByText('A'),
    ).not.toBeInTheDocument()

    expect(
      within(screen.getByRole('table')).queryByText('B'),
    ).not.toBeInTheDocument()
  })

  it('resets screening filters', async () => {
    const user = userEvent.setup()

    render(
      <InstrumentComparison datasets={[
        dataset('a', [100, 110, 120]),
        dataset('b', [200, 210, 220]),
      ]} />,
    )

    await user.type(
      screen.getByRole('searchbox', {
        name: 'Search Instruments',
      }),
      'A',
    )

    await user.click(screen.getByRole('button', {
      name: 'Reset Screening',
    }))

    const table = screen.getByRole('table')

    expect(within(table).getByText('A')).toBeInTheDocument()
    expect(within(table).getByText('B')).toBeInTheDocument()
  })

  it('sorts displayed instruments by name', async () => {
    const user = userEvent.setup()

    render(
      <InstrumentComparison datasets={[
        dataset('b', [200, 210, 220]),
        dataset('a', [100, 110, 120]),
      ]} />,
    )

    await user.selectOptions(
      screen.getByRole('combobox', {
        name: 'Sort Instruments By',
      }),
      'name',
    )

    await user.selectOptions(
      screen.getByRole('combobox', {
        name: 'Sort Direction',
      }),
      'asc',
    )

    const rows = within(screen.getByRole('table'))
      .getAllByRole('row')
      .slice(1)

    expect(within(rows[0]).getByText('A'))
      .toBeInTheDocument()

    expect(within(rows[1]).getByText('B'))
      .toBeInTheDocument()
  })

  it('rejects negative maximum drawdown without changing results', async () => {
    const user = userEvent.setup()

    render(
      <InstrumentComparison datasets={[
        dataset('a', [100, 110, 120]),
        dataset('b', [200, 210, 220]),
      ]} />,
    )

    const input = screen.getByRole('spinbutton', {
      name: 'Maximum Drawdown (%)',
    })

    await user.type(input, '-5')

    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert'))
      .toHaveTextContent('Correct the highlighted screening fields.')

    const errorId = input.getAttribute('aria-describedby')

    expect(errorId).toBeTruthy()

    const error = document.getElementById(errorId!)

    expect(error).toHaveTextContent('Enter a nonnegative number.')

    expect(within(screen.getByRole('table')).getByText('A'))
      .toBeInTheDocument()

    expect(within(screen.getByRole('table')).getByText('B'))
      .toBeInTheDocument()
  })

  it('clears numeric validation errors after reset', async () => {
    const user = userEvent.setup()

    render(
      <InstrumentComparison datasets={[
        dataset('a', [100, 110, 120]),
        dataset('b', [200, 210, 220]),
      ]} />,
    )

    const input = screen.getByRole('spinbutton', {
      name: 'Maximum Volatility (%)',
    })

    await user.type(input, '-10')

    expect(input).toHaveAttribute('aria-invalid', 'true')

    await user.click(screen.getByRole('button', {
      name: 'Reset Screening',
    }))

    expect(input).toHaveValue(null)
    expect(input).toHaveAttribute('aria-invalid', 'false')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('applies a corrected numeric threshold', async () => {
    const user = userEvent.setup()

    render(
      <InstrumentComparison datasets={[
        dataset('a', [100, 110, 120]),
        dataset('b', [200, 210, 220]),
      ]} />,
    )

    const input = screen.getByRole('spinbutton', {
      name: 'Maximum Drawdown (%)',
    })

    await user.type(input, '-5')

    expect(input).toHaveAttribute('aria-invalid', 'true')

    await user.clear(input)
    await user.type(input, '0')

    expect(input).toHaveAttribute('aria-invalid', 'false')
    expect(input).toHaveValue(0)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    const table = screen.getByRole('table')

    expect(within(table).getByText('A')).toBeInTheDocument()
    expect(within(table).getByText('B')).toBeInTheDocument()
  })

  it('does not generate investment recommendations', () => {
    render(
      <InstrumentComparison datasets={[
        dataset('a', [100, 110, 120]),
        dataset('b', [200, 210, 220]),
      ]} />,
    )

    expect(
      screen.getByText(/no trading recommendations/i),
    ).toBeInTheDocument()
  })
})
