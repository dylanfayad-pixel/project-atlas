import { describe, expect, it } from 'vitest'
import { parseBacktestResult } from './backtestApi'

function validResponse() {
  return {
    response_version: 1,
    signals: [
      {
        index: 0,
        timestamp: '2026-02-02',
        signal: 'BUY',
      },
    ],
    portfolio: {
      schema_version: 3,
      strategy: 'buy-and-hold',
      initial_capital: 10000,
      final_equity: 11363.636363636364,
      total_return_pct: 13.63636363636364,
      maximum_drawdown_pct: 0,
      trades: [
        {
          index: 1,
          timestamp: '2026-02-03',
          side: 'BUY',
          price: 110,
          quantity: 90.9090909090909,
          commission_paid: 0,
          slippage_cost: 0,
        },
      ],
      equity_curve: [
        {
          index: 0,
          timestamp: '2026-02-02',
          cash: 10000,
          shares: 0,
          equity: 10000,
        },
      ],
      risk_metrics: {
        return_observations: 2,
        periods_per_year: 252,
        risk_free_rate_per_period: 0,
        target_return_per_period: 0,
        annualized_volatility_pct: 0,
        sharpe_ratio: null,
        downside_deviation_pct: 0,
        sortino_ratio: null,
      },
    },
  }
}

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
