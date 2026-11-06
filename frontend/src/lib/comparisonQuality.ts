import type { ResearchDataset } from './researchSession'
import { analyzeAlignedRisk } from './alignedRiskAnalytics'

export type ComparisonEligibility =
  | 'eligible'
  | 'limited'
  | 'ineligible'

export type ComparisonQuality = {
  eligibility: ComparisonEligibility
  sharedObservations: number
  sharedStartDate: string | null
  sharedEndDate: string | null
  coveragePct: number | null
  warnings: string[]
}

const MIN_COMPARABLE_OBSERVATIONS = 20
const MIN_ELIGIBLE_OBSERVATIONS = 50

// Evaluate whether datasets have sufficient common
// historical observations for descriptive comparisons.
export function assessComparisonQuality(
  datasets: ResearchDataset[],
): ComparisonQuality {
  const analysis = analyzeAlignedRisk(datasets)
  const sharedObservations = analysis.sharedDates.length

  if (datasets.length < 2 || sharedObservations < 2) {
    return {
      eligibility: 'ineligible',
      sharedObservations,
      sharedStartDate: null,
      sharedEndDate: null,
      coveragePct: null,
      warnings: analysis.warnings,
    }
  }

  const sharedStartDate = analysis.sharedDates[0]
  const sharedEndDate =
    analysis.sharedDates[sharedObservations - 1]

  // Compare shared observations against the union of all
  // observed dates inside the common comparison window.
  const union = new Set<string>()

  for (const dataset of datasets) {
    for (const bar of dataset.bars) {
      if (
        bar.timestamp >= sharedStartDate &&
        bar.timestamp <= sharedEndDate
      ) {
        union.add(bar.timestamp)
      }
    }
  }

  const coveragePct =
    union.size === 0
      ? null
      : (sharedObservations / union.size) * 100

  const warnings = [...analysis.warnings]

  let eligibility: ComparisonEligibility = 'eligible'

  if (sharedObservations < MIN_COMPARABLE_OBSERVATIONS) {
    eligibility = 'ineligible'
    warnings.push(
      'Fewer than 20 shared observations; ranking is unavailable.',
    )
  } else if (
    sharedObservations < MIN_ELIGIBLE_OBSERVATIONS ||
    coveragePct === null ||
    coveragePct < 100
  ) {
    eligibility = 'limited'
    warnings.push(
      'Comparison has limited history or incomplete date coverage.',
    )
  }

  return {
    eligibility,
    sharedObservations,
    sharedStartDate,
    sharedEndDate,
    coveragePct,
    warnings,
  }
}
