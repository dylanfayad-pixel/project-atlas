import { describe, expect, it } from 'vitest'
import { assessComparisonQuality } from './comparisonQuality'
import type { ResearchDataset } from './researchSession'

function dataset(
  id: string,
  dates: string[],
  skipIndex: number | null = null,
): ResearchDataset {
  const bars = dates
    .filter((_, index) => index !== skipIndex)
    .map((timestamp, index) => ({
      timestamp,
      open: 100 + index,
      high: 100 + index,
      low: 100 + index,
      close: 100 + index,
      volume: 1000,
    }))

  return {
    id,
    source: 'uploaded-csv',
    filename: `${id}.csv`,
    symbol: id.toUpperCase(),
    exchange: null,
    instrumentVerified: false,
    timeframe: '1d',
    bars,
    firstTimestamp: bars[0].timestamp,
    lastTimestamp: bars[bars.length - 1].timestamp,
  }
}

const dates = Array.from(
  { length: 60 },
  (_, index) =>
    new Date(Date.UTC(2026, 0, index + 1))
      .toISOString().slice(0, 10),
)

describe('Multi-instrument comparison quality', () => {
  it('rejects fewer than two datasets', () => {
    const quality = assessComparisonQuality([
      dataset('a', dates),
    ])

    expect(quality.eligibility).toBe('ineligible')
  })

  it('rejects insufficient shared history', () => {
    const shortDates = dates.slice(0, 10)

    const quality = assessComparisonQuality([
      dataset('a', shortDates),
      dataset('b', shortDates),
    ])

    expect(quality.eligibility).toBe('ineligible')
  })

  it('marks moderately sized comparisons as limited', () => {
    const moderateDates = dates.slice(0, 30)

    const quality = assessComparisonQuality([
      dataset('a', moderateDates),
      dataset('b', moderateDates),
    ])

    expect(quality.eligibility).toBe('limited')
    expect(quality.coveragePct).toBe(100)
  })

  it('accepts sufficiently aligned historical datasets', () => {
    const quality = assessComparisonQuality([
      dataset('a', dates),
      dataset('b', dates),
    ])

    expect(quality.eligibility).toBe('eligible')
    expect(quality.sharedObservations).toBe(60)
    expect(quality.coveragePct).toBe(100)
  })

  it('reports incomplete date coverage', () => {
    const quality = assessComparisonQuality([
      dataset('a', dates),
      dataset('b', dates, 25),
    ])

    expect(quality.eligibility).toBe('limited')
    expect(quality.coveragePct).toBeLessThan(100)
  })

  it('returns stable shared date boundaries', () => {
    const quality = assessComparisonQuality([
      dataset('a', dates),
      dataset('b', dates),
    ])

    expect(quality.sharedStartDate).toBe(dates[0])
    expect(quality.sharedEndDate).toBe(dates[59])
  })
})
