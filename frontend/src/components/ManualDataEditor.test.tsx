// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ManualDataEditor } from './ManualDataEditor'

afterEach(() => cleanup())

// Fill a complete daily candle through the real form inputs.
async function fillRow(
  user: ReturnType<typeof userEvent.setup>,
  index: number,
  date: string
) {
  const fields = [
    ['Date (YYYY-MM-DD)', date],
    ['Open', '100'],
    ['High', '105'],
    ['Low', '98'],
    ['Close', '103'],
    ['Volume', '1500000'],
  ]

  for (const [label, value] of fields) {
    await user.type(
      screen.getByRole('textbox', {
        name: `${label} row ${index}`,
      }),
      value
    )
  }
}

describe('ManualDataEditor interactions', () => {
  it('renders accessible OHLCV inputs', () => {
    render(<ManualDataEditor onLoad={vi.fn()} />)

    expect(screen.getByRole('textbox', {
      name: 'Date (YYYY-MM-DD) row 1',
    })).toBeTruthy()

    expect(screen.getByRole('textbox', {
      name: 'Close row 1',
    })).toBeTruthy()
  })

  it('adds another observation', async () => {
    const user = userEvent.setup()
    render(<ManualDataEditor onLoad={vi.fn()} />)

    await user.click(screen.getByRole('button', {
      name: 'Add Observation',
    }))

    expect(screen.getByRole('textbox', {
      name: 'Date (YYYY-MM-DD) row 2',
    })).toBeTruthy()
  })

  it('removes an observation', async () => {
    const user = userEvent.setup()
    render(<ManualDataEditor onLoad={vi.fn()} />)

    await user.click(screen.getByRole('button', {
      name: 'Add Observation',
    }))

    await user.click(screen.getByRole('button', {
      name: 'Remove row 2',
    }))

    expect(screen.queryByRole('textbox', {
      name: 'Date (YYYY-MM-DD) row 2',
    })).toBeNull()
  })

  it('loads validated observations', async () => {
    const user = userEvent.setup()
    const onLoad = vi.fn()

    render(<ManualDataEditor onLoad={onLoad} />)

    await fillRow(user, 1, '2026-01-05')

    await user.click(screen.getByRole('button', {
      name: 'Validate & Load Data',
    }))

    expect(onLoad).toHaveBeenCalledWith([{
      timestamp: '2026-01-05',
      open: 100,
      high: 105,
      low: 98,
      close: 103,
      volume: 1500000,
    }])

    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('rejects incomplete observations', async () => {
    const user = userEvent.setup()
    const onLoad = vi.fn()

    render(<ManualDataEditor onLoad={onLoad} />)

    await user.click(screen.getByRole('button', {
      name: 'Validate & Load Data',
    }))

    expect(onLoad).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeTruthy()
  })

  it('rejects duplicate dates', async () => {
    const user = userEvent.setup()
    const onLoad = vi.fn()

    render(<ManualDataEditor onLoad={onLoad} />)

    await fillRow(user, 1, '2026-01-05')

    await user.click(screen.getByRole('button', {
      name: 'Add Observation',
    }))

    await fillRow(user, 2, '2026-01-05')

    await user.click(screen.getByRole('button', {
      name: 'Validate & Load Data',
    }))

    expect(onLoad).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeTruthy()
  })
})
