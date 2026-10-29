import { describe, expect, it } from 'vitest'
import {
  createInstrumentMetadata,
  normalizeSymbol,
  validateSymbol,
} from './instrumentMetadata'

describe('Instrument metadata', () => {
  it('normalizes ticker symbols', () => {
    expect(normalizeSymbol(' aapl ')).toBe('AAPL')
  })

  it('accepts common ticker formats', () => {
    expect(validateSymbol('BRK.B')).toBe('BRK.B')
    expect(validateSymbol('SPY')).toBe('SPY')
  })

  it('rejects empty required symbols', () => {
    expect(() => validateSymbol('')).toThrow()
  })

  it('rejects unsupported symbol characters', () => {
    expect(() => validateSymbol('AAPL!')).toThrow()
  })

  it('rejects excessively long symbols', () => {
    expect(() => validateSymbol('A'.repeat(21))).toThrow()
  })

  it('creates unverified user-provided metadata', () => {
    const metadata = createInstrumentMetadata(
      'aapl',
      'nasdaq'
    )

    expect(metadata).toEqual({
      symbol: 'AAPL',
      exchange: 'NASDAQ',
      verified: false,
    })
  })

  it('allows an unidentified CSV instrument', () => {
    expect(createInstrumentMetadata('', '')).toEqual({
      symbol: null,
      exchange: null,
      verified: false,
    })
  })

  it('rejects exchange without symbol', () => {
    expect(() =>
      createInstrumentMetadata('', 'NASDAQ')
    ).toThrow()
  })

  it('rejects malformed exchange labels', () => {
    expect(() =>
      createInstrumentMetadata('AAPL', '<script>')
    ).toThrow()
  })
})
