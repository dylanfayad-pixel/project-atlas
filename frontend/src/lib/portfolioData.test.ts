import { describe, expect, it } from 'vitest'
import { parsePortfolioData } from './portfolioData'

// A small valid portfolio fixture used by all regression tests.
function validPortfolio() {
  return {
    schema_version: 1,
    strategy: 'Test Strategy',
    initial_capital: 1000,
    final_equity: 1200,
    net_profit: 200,
    total_return_pct: 20,
    maximum_drawdown_pct: 0,
    equity_curve: [
      {
        index: 0,
        timestamp: 'Day 1',
        cash: 1000,
        shares: 0,
        equity: 1000,
      },
      {
        index: 1,
        timestamp: 'Day 2',
        cash: 1200,
        shares: 0,
        equity: 1200,
      },
    ],
    trades: [
      {
        index: 1,
        timestamp: 'Day 2',
        side: 'SELL',
        price: 12,
        quantity: 100,
      },
    ],
  }
}

describe('Portfolio JSON validation', () => {
  it('accepts a valid portfolio', () => {
    const result = parsePortfolioData(validPortfolio())

    expect(result.final_equity).toBe(1200)
    expect(result.total_return_pct).toBe(20)
  })

  it('rejects unsupported schema versions', () => {
    const data = validPortfolio()
    data.schema_version = 99

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects non-finite financial values', () => {
    const data = validPortfolio()
    data.final_equity = Number.NaN

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects negative initial capital', () => {
    const data = validPortfolio()
    data.initial_capital = -100

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects malformed trade quantities', () => {
    const data = validPortfolio()
    data.trades[0].quantity = -5

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects mismatched trade timestamps', () => {
    const data = validPortfolio()
    data.trades[0].timestamp = 'Wrong Day'

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects non-sequential equity indices', () => {
    const data = validPortfolio()
    data.equity_curve[1].index = 5

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects inconsistent final equity', () => {
    const data = validPortfolio()
    data.final_equity = 5000

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects malformed equity observations', () => {
    const data = validPortfolio()
    data.equity_curve[0].equity = -1

    expect(() => parsePortfolioData(data)).toThrow()
  })

  it('rejects invalid maximum drawdown', () => {
    const data = validPortfolio()
    data.maximum_drawdown_pct = 150

    expect(() => parsePortfolioData(data)).toThrow()
  })
})
