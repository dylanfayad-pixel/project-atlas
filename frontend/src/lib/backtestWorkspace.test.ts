import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BACKTEST_DRAFT,
  parseBacktestDraft,
} from './backtestWorkspace'

describe('Backtest workspace configuration', () => {
  it('uses zero costs when optional fields are blank', () => {
    const config = parseBacktestDraft(
      DEFAULT_BACKTEST_DRAFT
    )

    expect(config.capital).toBe(10000)
    expect(config.commission).toBe(0)
    expect(config.slippage_bps).toBe(0)
  })

  it('accepts decimal capital and costs', () => {
    const config = parseBacktestDraft({
      ...DEFAULT_BACKTEST_DRAFT,
      capital: '12500.50',
      commission: '1.25',
      slippage_bps: '2.5',
    })

    expect(config.capital).toBe(12500.5)
    expect(config.commission).toBe(1.25)
    expect(config.slippage_bps).toBe(2.5)
  })

  it('rejects empty required capital', () => {
    expect(() => parseBacktestDraft({
      ...DEFAULT_BACKTEST_DRAFT,
      capital: '',
    })).toThrow()
  })

  it('rejects invalid SMA windows', () => {
    expect(() => parseBacktestDraft({
      ...DEFAULT_BACKTEST_DRAFT,
      strategy: 'sma-crossover',
      fast: '10',
      slow: '5',
    })).toThrow()
  })

  it('rejects negative commission', () => {
    expect(() => parseBacktestDraft({
      ...DEFAULT_BACKTEST_DRAFT,
      commission: '-1',
    })).toThrow()
  })

  it('rejects non-finite capital', () => {
    expect(() => parseBacktestDraft({
      ...DEFAULT_BACKTEST_DRAFT,
      capital: 'Infinity',
    })).toThrow()
  })
})
