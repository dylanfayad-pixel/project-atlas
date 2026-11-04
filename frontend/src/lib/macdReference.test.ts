import { describe, expect, it } from 'vitest'
import {
  exponentialMovingAverage,
  movingAverageConvergenceDivergence,
} from './marketAnalytics'

// Intentionally slower reference implementation.
// Recalculate each EMA from the full historical prefix.
function referenceMacd(closes: number[]) {
  const values: number[] = []

  for (let length = 26; length <= closes.length; length++) {
    const history = closes.slice(0, length)

    const fast = exponentialMovingAverage(history, 12)
    const slow = exponentialMovingAverage(history, 26)

    if (fast === null || slow === null) {
      throw new Error('Unexpected insufficient history')
    }

    values.push(fast - slow)
  }

  const macd = values.at(-1) ?? null
  const signal = exponentialMovingAverage(values, 9)

  return {
    macd,
    signal,
    histogram:
      macd === null || signal === null
        ? null
        : macd - signal,
  }
}

describe('Optimized MACD numerical equivalence', () => {
  it('matches the reference on a varying price series', () => {
    const closes = Array.from(
      { length: 120 },
      (_, i) =>
        100 +
        i * 0.15 +
        Math.sin(i * 0.37) * 7 +
        Math.cos(i * 0.13) * 3,
    )

    const actual = movingAverageConvergenceDivergence(closes)
    const expected = referenceMacd(closes)

    expect(actual.macd).toBeCloseTo(expected.macd!, 10)
    expect(actual.signal).toBeCloseTo(expected.signal!, 10)
    expect(actual.histogram).toBeCloseTo(expected.histogram!, 10)
  })

  it('matches the reference at the first valid signal', () => {
    const closes = Array.from(
      { length: 34 },
      (_, i) => 100 + i * 0.4 + Math.sin(i),
    )

    const actual = movingAverageConvergenceDivergence(closes)
    const expected = referenceMacd(closes)

    expect(actual.macd).toBeCloseTo(expected.macd!, 10)
    expect(actual.signal).toBeCloseTo(expected.signal!, 10)
    expect(actual.histogram).toBeCloseTo(expected.histogram!, 10)
  })

  it('matches the reference before signal availability', () => {
    const closes = Array.from(
      { length: 30 },
      (_, i) => 100 + Math.sin(i * 0.5) * 4,
    )

    const actual = movingAverageConvergenceDivergence(closes)
    const expected = referenceMacd(closes)

    expect(actual.macd).toBeCloseTo(expected.macd!, 10)
    expect(actual.signal).toBeNull()
    expect(actual.histogram).toBeNull()
  })
})
