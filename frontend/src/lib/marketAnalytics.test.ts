import { describe, expect, it } from 'vitest'
import {
  analyzeMarket,
  relativeStrengthIndex,
  simpleMovingAverage,
} from './marketAnalytics'
import type { OhlcvBar } from './ohlcvData'

function barsFromCloses(closes: number[]): OhlcvBar[] {
  const start = Date.UTC(2025, 0, 1)

  return closes.map((close, index) => ({
    timestamp: new Date(start + index * 86400000)
      .toISOString().slice(0, 10),
    open: close,
    high: close,
    low: close,
    close,
    volume: 1000,
  }))
}

describe('Market intelligence analytics', () => {
  it('rejects empty observations', () => {
    expect(() => analyzeMarket([])).toThrow()
  })

  it('calculates historical price return', () => {
    const result = analyzeMarket(barsFromCloses([100, 110, 120]))
    expect(result.totalReturnPct).toBeCloseTo(20)
    expect(result.latestClose).toBe(120)
  })

  it('calculates maximum close-price drawdown', () => {
    const result = analyzeMarket(
      barsFromCloses([100, 120, 90, 110]),
    )
    expect(result.maximumDrawdownPct).toBeCloseTo(25)
  })

  it('does not invent volatility from insufficient returns', () => {
    const result = analyzeMarket(barsFromCloses([100, 110]))
    expect(result.annualizedVolatilityPct).toBeNull()
  })

  it('returns zero volatility for constant prices', () => {
    const result = analyzeMarket(
      barsFromCloses([100, 100, 100, 100]),
    )
    expect(result.annualizedVolatilityPct).toBe(0)
  })

  it('calculates the latest simple moving average', () => {
    expect(simpleMovingAverage([10, 20, 30, 40], 2))
      .toBe(35)
    expect(simpleMovingAverage([10, 20], 3))
      .toBeNull()
  })

  it('handles rising, falling, and flat RSI series', () => {
    expect(relativeStrengthIndex(
      Array.from({ length: 15 }, (_, i) => 100 + i),
    )).toBe(100)

    expect(relativeStrengthIndex(
      Array.from({ length: 15 }, (_, i) => 100 - i),
    )).toBe(0)

    expect(relativeStrengthIndex(
      Array(15).fill(100),
    )).toBe(50)
  })

  it('rejects invalid close prices', () => {
    expect(() => analyzeMarket(
      barsFromCloses([100, Number.NaN]),
    )).toThrow()
  })
})
