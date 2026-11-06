import { analyzeAlignedRisk } from './alignedRiskAnalytics'
import type { ResearchDataset } from './researchSession'

export type ComparativeReturn = {
  datasetId: string
  label: string
  startDate: string
  endDate: string
  startClose: number
  endClose: number
  returnPct: number
}

export type ComparativeAnalysis = {
  startDate: string | null
  endDate: string | null
  results: ComparativeReturn[]
  warnings: string[]
}

// Compatibility adapter over the unified aligned-risk engine.
// All comparison endpoints now come from one shared date policy.
export function compareHistoricalReturns(
  datasets: ResearchDataset[],
): ComparativeAnalysis {
  const analysis = analyzeAlignedRisk(datasets)

  if (
    analysis.sharedDates.length < 2 ||
    analysis.results.length === 0
  ) {
    return {
      startDate: null,
      endDate: null,
      results: [],
      warnings: analysis.warnings,
    }
  }

  const startDate = analysis.sharedDates[0]
  const endDate =
    analysis.sharedDates[analysis.sharedDates.length - 1]

  const results = analysis.results.map((result) => {
    const dataset = datasets.find(
      (item) => item.id === result.datasetId,
    )

    if (!dataset) {
      throw new Error('Comparison dataset not found')
    }

    const start = dataset.bars.find(
      (bar) => bar.timestamp === startDate,
    )

    const end = dataset.bars.find(
      (bar) => bar.timestamp === endDate,
    )

    if (!start || !end) {
      throw new Error('Aligned comparison endpoints missing')
    }

    return {
      datasetId: result.datasetId,
      label: result.label,
      startDate,
      endDate,
      startClose: start.close,
      endClose: end.close,
      returnPct: result.returnPct,
    }
  })

  return {
    startDate,
    endDate,
    results,
    warnings: analysis.warnings,
  }
}
