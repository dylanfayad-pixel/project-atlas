import { describe, expect, it } from 'vitest'
import {
  exponentialMovingAverage,
  movingAverageConvergenceDivergence,
} from './marketAnalytics'

describe('Exponential moving average', () => {
  it('uses the initial SMA seed', () => {
    expect(exponentialMovingAverage([10, 20, 30], 3))
      .toBe(20)
  })

  it('applies recursive exponential weighting', () => {
    expect(exponentialMovingAverage([10, 20, 30, 40], 3))
      .toBeCloseTo(30)
  })

  it('returns null for insufficient observations', () => {
    expect(exponentialMovingAverage([10, 20], 3))
      .toBeNull()
  })

  it('rejects invalid periods and nonfinite observations', () => {
    expect(exponentialMovingAverage([10, 20], 0))
      .toBeNull()

    expect(() =>
      exponentialMovingAverage([10, Number.NaN], 2),
    ).toThrow()
  })
})

describe('MACD', () => {
  it('requires enough observations for slow EMA', () => {
    const result = movingAverageConvergenceDivergence(
      Array(25).fill(100),
    )

    expect(result.macd).toBeNull()
    expect(result.signal).toBeNull()
    expect(result.histogram).toBeNull()
  })

  it('produces zero MACD for constant prices', () => {
    const result = movingAverageConvergenceDivergence(
      Array(40).fill(100),
    )

    expect(result.macd).toBeCloseTo(0)
    expect(result.signal).toBeCloseTo(0)
    expect(result.histogram).toBeCloseTo(0)
  })

  it('does not invent a signal before nine MACD values', () => {
    const result = movingAverageConvergenceDivergence(
      Array.from({ length: 33 }, (_, i) => 100 + i),
    )

    expect(result.macd).not.toBeNull()
    expect(result.signal).toBeNull()
    expect(result.histogram).toBeNull()
  })

  it('rejects invalid period configurations', () => {
    expect(() =>
      movingAverageConvergenceDivergence(
        Array(40).fill(100),
        26,
        12,
        9,
      ),
    ).toThrow()
  })
})
