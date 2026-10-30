import { describe, expect, it } from 'vitest'
import { parseBacktestResult } from './backtestApi'
import { validResponse } from './backtestTestFixture'


describe('Backtest response validation', () => {
  it('accepts valid engine output', () => {
    expect(
      parseBacktestResult(validResponse()).response_version
    ).toBe(1)
  })

  it('rejects unsupported response versions', () => {
    const response = validResponse()
    response.response_version = 99

    expect(() => parseBacktestResult(response)).toThrow()
  })

  it('rejects invalid trade quantities', () => {
    const response = validResponse()
    response.portfolio.trades[0].quantity = -1

    expect(() => parseBacktestResult(response)).toThrow()
  })

  it('rejects non-finite equity values', () => {
    const response = validResponse()
    response.portfolio.equity_curve[0].equity = Infinity

    expect(() => parseBacktestResult(response)).toThrow()
  })

  it('rejects missing risk metrics', () => {
    const response = validResponse()
    const invalid = {
      ...response,
      portfolio: {
        ...response.portfolio,
        risk_metrics: undefined,
      },
    }

    expect(() => parseBacktestResult(invalid)).toThrow()
  })

  it('rejects malformed signals', () => {
    const response = validResponse()
    response.signals[0].signal = 'INVALID'

    expect(() => parseBacktestResult(response)).toThrow()
  })
})
