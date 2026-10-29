import { describe, expect, it } from 'vitest'
import { parseOhlcvCsv } from './ohlcvData'

const header = 'timestamp,open,high,low,close,volume'

function csv(...rows: string[]): string {
  return [header, ...rows].join('\n')
}

describe('OHLCV CSV validation', () => {
  it('accepts valid daily market data', () => {
    const bars = parseOhlcvCsv(
      csv(
        '2026-01-05,100,105,98,103,1500000',
        '2026-01-06,103,108,101,106,1700000'
      )
    )

    expect(bars).toHaveLength(2)
    expect(bars[0].open).toBe(100)
    expect(bars[1].volume).toBe(1700000)
  })

  it('accepts a UTF-8 BOM', () => {
    const input = '\uFEFF' + csv(
      '2026-01-05,100,105,98,103,1500000'
    )

    expect(parseOhlcvCsv(input)).toHaveLength(1)
  })

  it('rejects missing columns', () => {
    expect(() =>
      parseOhlcvCsv('timestamp,open,close\n2026-01-05,100,103')
    ).toThrow()
  })

  it('rejects invalid calendar dates', () => {
    expect(() =>
      parseOhlcvCsv(csv(
        '2026-02-30,100,105,98,103,1000'
      ))
    ).toThrow()
  })

  it('rejects duplicate timestamps', () => {
    expect(() =>
      parseOhlcvCsv(csv(
        '2026-01-05,100,105,98,103,1000',
        '2026-01-05,103,108,101,106,1000'
      ))
    ).toThrow()
  })

  it('rejects descending timestamps', () => {
    expect(() =>
      parseOhlcvCsv(csv(
        '2026-01-06,100,105,98,103,1000',
        '2026-01-05,103,108,101,106,1000'
      ))
    ).toThrow()
  })

  it('rejects invalid high and low relationships', () => {
    expect(() =>
      parseOhlcvCsv(csv(
        '2026-01-05,100,99,98,103,1000'
      ))
    ).toThrow()
  })

  it('rejects non-finite prices', () => {
    expect(() =>
      parseOhlcvCsv(csv(
        '2026-01-05,100,Infinity,98,103,1000'
      ))
    ).toThrow()
  })

  it('rejects negative prices', () => {
    expect(() =>
      parseOhlcvCsv(csv(
        '2026-01-05,-100,105,98,103,1000'
      ))
    ).toThrow()
  })

  it('rejects negative volume', () => {
    expect(() =>
      parseOhlcvCsv(csv(
        '2026-01-05,100,105,98,103,-1'
      ))
    ).toThrow()
  })

  it('rejects fractional volume', () => {
    expect(() =>
      parseOhlcvCsv(csv(
        '2026-01-05,100,105,98,103,10.5'
      ))
    ).toThrow()
  })

  it('rejects missing numeric fields', () => {
    expect(() =>
      parseOhlcvCsv(csv(
        '2026-01-05,100,105,,103,1000'
      ))
    ).toThrow()
  })

  it('rejects an empty dataset', () => {
    expect(() => parseOhlcvCsv(header)).toThrow()
  })
})
