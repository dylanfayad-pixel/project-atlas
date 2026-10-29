// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InstrumentEditor } from './InstrumentEditor'
import { createUploadedDataset } from '../lib/researchSession'
import type { OhlcvBar } from '../lib/ohlcvData'

const bars: OhlcvBar[] = [
  {
    timestamp: '2026-01-05',
    open: 100,
    high: 105,
    low: 98,
    close: 103,
    volume: 1000,
  },
]

function makeDataset() {
  return createUploadedDataset('sample.csv', bars)
}

afterEach(() => cleanup())

describe('InstrumentEditor interactions', () => {
  it('renders clearly labeled fields', () => {
    render(
      <InstrumentEditor
        dataset={makeDataset()}
        onSave={vi.fn()}
      />
    )

    expect(
      screen.getByLabelText('Instrument ticker')
    ).toBeTruthy()

    expect(
      screen.getByLabelText('Exchange')
    ).toBeTruthy()
  })

  it('saves normalized user-provided metadata', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(
      <InstrumentEditor
        dataset={makeDataset()}
        onSave={onSave}
      />
    )

    await user.type(
      screen.getByLabelText('Instrument ticker'),
      'aapl'
    )

    await user.type(
      screen.getByLabelText('Exchange'),
      'nasdaq'
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Save Instrument Information',
      })
    )

    expect(onSave).toHaveBeenCalledWith({
      symbol: 'AAPL',
      exchange: 'NASDAQ',
      verified: false,
    })
  })

  it('rejects invalid ticker characters', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(
      <InstrumentEditor
        dataset={makeDataset()}
        onSave={onSave}
      />
    )

    await user.type(
      screen.getByLabelText('Instrument ticker'),
      'AAPL!'
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Save Instrument Information',
      })
    )

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeTruthy()
  })

  it('rejects an exchange without a ticker', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(
      <InstrumentEditor
        dataset={makeDataset()}
        onSave={onSave}
      />
    )

    await user.type(
      screen.getByLabelText('Exchange'),
      'NASDAQ'
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Save Instrument Information',
      })
    )

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeTruthy()
  })

  it('allows an unspecified instrument', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(
      <InstrumentEditor
        dataset={makeDataset()}
        onSave={onSave}
      />
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Save Instrument Information',
      })
    )

    expect(onSave).toHaveBeenCalledWith({
      symbol: null,
      exchange: null,
      verified: false,
    })
  })
})
