import type { AlignedRiskResult } from './alignedRiskAnalytics'
import type { ComparisonEligibility } from './comparisonQuality'

export type ScreeningSort =
  | 'name'
  | 'return'
  | 'volatility'
  | 'drawdown'

export type ScreeningDirection = 'asc' | 'desc'

export type ScreeningFilters = {
  search: string
  minimumReturnPct: number | null
  maximumDrawdownPct: number | null
  maximumVolatilityPct: number | null
}

export type ScreenedInstrument = AlignedRiskResult & {
  rank: number | null
}

export const DEFAULT_SCREENING_FILTERS: ScreeningFilters = {
  search: '',
  minimumReturnPct: null,
  maximumDrawdownPct: null,
  maximumVolatilityPct: null,
}

function compareNumber(
  first: number | null,
  second: number | null,
  direction: ScreeningDirection,
): number {
  // Missing measurements always appear last.
  if (first === null) return second === null ? 0 : 1
  if (second === null) return -1

  return direction === 'asc'
    ? first - second
    : second - first
}

// Screen already-aligned measurements without recalculating
// the common date window or changing underlying observations.
export function screenInstruments(
  results: AlignedRiskResult[],
  eligibility: ComparisonEligibility,
  filters: ScreeningFilters,
  sort: ScreeningSort = 'return',
  direction: ScreeningDirection = 'desc',
): ScreenedInstrument[] {
  const search = filters.search.trim().toLowerCase()

  // Establish historical-return ranks from the full eligible
  // comparison population before applying user filters.
  const baselineRanks = new Map<string, number>()

  if (eligibility === 'eligible') {
    const baseline = [...results].sort(
      (a, b) =>
        b.returnPct - a.returnPct ||
        a.datasetId.localeCompare(b.datasetId),
    )

    baseline.forEach((result, index) => {
      baselineRanks.set(result.datasetId, index + 1)
    })
  }

  const filtered = results.filter((result) => {
    if (
      search &&
      !result.label.toLowerCase().includes(search)
    ) {
      return false
    }

    if (
      filters.minimumReturnPct !== null &&
      result.returnPct < filters.minimumReturnPct
    ) {
      return false
    }

    if (
      filters.maximumDrawdownPct !== null &&
      result.maximumDrawdownPct >
        filters.maximumDrawdownPct
    ) {
      return false
    }

    if (filters.maximumVolatilityPct !== null) {
      if (
        result.annualizedVolatilityPct === null ||
        result.annualizedVolatilityPct >
          filters.maximumVolatilityPct
      ) {
        return false
      }
    }

    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0

    switch (sort) {
      case 'name':
        comparison = a.label.localeCompare(b.label)
        if (direction === 'desc') comparison *= -1
        break
      case 'return':
        comparison = compareNumber(
          a.returnPct,
          b.returnPct,
          direction,
        )
        break
      case 'volatility':
        comparison = compareNumber(
          a.annualizedVolatilityPct,
          b.annualizedVolatilityPct,
          direction,
        )
        break
      case 'drawdown':
        comparison = compareNumber(
          a.maximumDrawdownPct,
          b.maximumDrawdownPct,
          direction,
        )
        break
    }

    // Stable, deterministic tie-breaking by dataset identity.
    return comparison || a.datasetId.localeCompare(b.datasetId)
  })

  return sorted.map((result) => ({
    ...result,
    rank: baselineRanks.get(result.datasetId) ?? null,
  }))
}
