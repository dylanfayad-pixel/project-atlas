import type { ResearchDataset } from './researchSession'

export type AlignedRiskResult = {
  datasetId: string
  label: string
  observations: number
  returnPct: number
  annualizedVolatilityPct: number | null
  maximumDrawdownPct: number
}

export type AlignedRiskAnalysis = {
  sharedDates: string[]
  results: AlignedRiskResult[]
  warnings: string[]
}

const TRADING_DAYS_PER_YEAR = 252

// Calculate sample standard deviation of observed returns.
function sampleStandardDeviation(values: number[]): number | null {
  if (values.length < 2) return null

  const mean = values.reduce((sum, value) => sum + value, 0) /
    values.length

  const variance = values.reduce(
    (sum, value) => sum + (value - mean) ** 2,
    0,
  ) / (values.length - 1)

  return Math.sqrt(variance)
}

// Calculate maximum drawdown from closing prices only.
function maximumCloseDrawdown(closes: number[]): number {
  let peak = closes[0]
  let maximum = 0

  for (const close of closes) {
    peak = Math.max(peak, close)
    maximum = Math.max(maximum, (peak - close) / peak)
  }

  return maximum * 100
}

// Align every instrument to the exact same observation dates.
// Missing observations are excluded rather than synthesized.
export function analyzeAlignedRisk(
  datasets: ResearchDataset[],
): AlignedRiskAnalysis {
  if (datasets.length < 2) {
    return {
      sharedDates: [],
      results: [],
      warnings: ['At least two datasets are required.'],
    }
  }

  let dates = new Set(
    datasets[0].bars.map((bar) => bar.timestamp),
  )

  for (const dataset of datasets.slice(1)) {
    const available = new Set(
      dataset.bars.map((bar) => bar.timestamp),
    )

    dates = new Set(
      [...dates].filter((date) => available.has(date)),
    )
  }

  const sharedDates = [...dates].sort()

  if (sharedDates.length < 2) {
    return {
      sharedDates,
      results: [],
      warnings: [
        'At least two shared observation dates are required.',
      ],
    }
  }

  const warnings: string[] = []

  // Shared-date gaps can turn multi-session price changes
  // into misleading single-session volatility observations.
  const hasCoverageGaps = datasets.some((dataset) => {
    const firstShared = sharedDates[0]
    const lastShared = sharedDates[sharedDates.length - 1]

    const observationsWithinWindow = dataset.bars.filter(
      (bar) =>
        bar.timestamp >= firstShared &&
        bar.timestamp <= lastShared,
    )

    return observationsWithinWindow.length !== sharedDates.length
  })

  if (hasCoverageGaps) {
    warnings.push(
      'Shared-date coverage gaps detected; annualized volatility is unavailable.',
    )
  }

  if (sharedDates.length < 3) {
    warnings.push(
      'At least three shared observations are required for volatility.',
    )
  }

  if (datasets.some(
    (dataset) => dataset.bars.length !== sharedDates.length,
  )) {
    warnings.push(
      'Datasets contain observations outside the shared date set.',
    )
  }

  const results = datasets.map((dataset) => {
    const lookup = new Map(
      dataset.bars.map((bar) => [bar.timestamp, bar.close]),
    )

    const closes = sharedDates.map((date) => {
      const close = lookup.get(date)

      if (close === undefined || !Number.isFinite(close) || close <= 0) {
        throw new Error('Invalid aligned closing price')
      }

      return close
    })

    const returns = closes.slice(1).map(
      (close, index) => close / closes[index] - 1,
    )

    const deviation = sampleStandardDeviation(returns)

    return {
      datasetId: dataset.id,
      label:
        dataset.symbol ??
        dataset.filename ??
        'Unlabeled Dataset',
      observations: closes.length,
      returnPct:
        (closes[closes.length - 1] / closes[0] - 1) * 100,
      annualizedVolatilityPct:
        deviation === null || hasCoverageGaps
          ? null
          : deviation * Math.sqrt(TRADING_DAYS_PER_YEAR) * 100,
      maximumDrawdownPct: maximumCloseDrawdown(closes),
    }
  })

  warnings.push(
    'Historical comparisons use closing prices and exclude dividends.',
  )

  return {
    sharedDates,
    results,
    warnings,
  }
}
