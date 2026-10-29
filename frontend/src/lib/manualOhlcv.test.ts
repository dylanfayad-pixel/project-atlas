import { describe, expect, it } from 'vitest'
import {
  createManualRow,
  validateManualOhlcv,
} from './manualOhlcv'
import type { ManualOhlcvRow } from './manualOhlcv'

function row(
  overrides: Partial<ManualOhlcvRow> = {}
): ManualOhlcvRow {
  return {
    timestamp: '2026-01-05',
    open: '100',
    high: '105',
    low: '98',
    close: '103',
    volume: '1500000',
    ...overrides,
  }
}

describe('Manual OHLCV validation', () => {
  it('creates blank editable rows', () => {
    expect(createManualRow()).toEqual({
      timestamp: '',
      open: '',
      high: '',
      low: '',
      close: '',
      volume: '',
    })
  })

  it('accepts valid observations', () => {
    const bars = validateManualOhlcv([row()])

    expect(bars).toHaveLength(1)
    expect(bars[0].close).toBe(103)
  })

  it('rejects an empty dataset', () => {
    expect(() => validateManualOhlcv([])).toThrow()
  })

  it('rejects missing prices', () => {
    expect(() =>
      validateManualOhlcv([row({ open: '' })])
    ).toThrow()
  })

  it('rejects invalid calendar dates', () => {
    expect(() =>
      validateManualOhlcv([
        row({ timestamp: '2026-02-30' }),
      ])
    ).toThrow()
  })

  it('rejects invalid OHLC relationships', () => {
    expect(() =>
      validateManualOhlcv([
        row({ high: '99' }),
      ])
    ).toThrow()
  })

  it('rejects negative prices', () => {
    expect(() =>
      validateManualOhlcv([
        row({ low: '-1' }),
      ])
    ).toThrow()
  })

  it('rejects fractional volume', () => {
    expect(() =>
      validateManualOhlcv([
        row({ volume: '10.5' }),
      ])
    ).toThrow()
  })

  it('rejects duplicate dates', () => {
    expect(() =>
      validateManualOhlcv([row(), row()])
    ).toThrow()
  })

  it('rejects descending dates', () => {
    expect(() =>
      validateManualOhlcv([
        row({ timestamp: '2026-01-06' }),
        row({ timestamp: '2026-01-05' }),
      ])
    ).toThrow()
  })

  it('accepts chronological observations', () => {
    const bars = validateManualOhlcv([
      row(),
      row({
        timestamp: '2026-01-06',
        open: '103',
        high: '108',
        low: '101',
        close: '106',
      }),
    ])

    expect(bars).toHaveLength(2)
    expect(bars[1].timestamp).toBe('2026-01-06')
  })
})
