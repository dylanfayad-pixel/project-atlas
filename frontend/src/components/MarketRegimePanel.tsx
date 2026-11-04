import { useMemo } from 'react'
import { analyzeMarket } from '../lib/marketAnalytics'
import { classifyMarketRegime } from '../lib/marketRegime'
import type { ResearchDataset } from '../lib/researchSession'

type Props = {
  dataset: ResearchDataset
}

const trendLabels = {
  bullish: 'Bullish Trend',
  bearish: 'Bearish Trend',
  sideways: 'Sideways / Mixed',
  'insufficient-data': 'Insufficient Data',
} as const

const volatilityLabels = {
  high: 'High Volatility',
  normal: 'Normal Volatility',
  'insufficient-data': 'Insufficient Data',
} as const

// Explain historical classifications without predicting returns.
export function MarketRegimePanel({ dataset }: Props) {
  const regime = useMemo(() => {
    const analysis = analyzeMarket(dataset.bars)
    return classifyMarketRegime(analysis)
  }, [dataset.bars])

  return (
    <section className="panel" aria-label="Market Regime">
      <div className="panel-heading">
        <div>
          <h2>Market Regime</h2>
          <p>
            Rules-based historical trend and volatility analysis.
          </p>
        </div>
        <span className="panel-tag">HISTORICAL</span>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <span>Trend Classification</span>
          <strong>{trendLabels[regime.trend]}</strong>
        </div>

        <div className="detail-card">
          <span>Volatility Classification</span>
          <strong>{volatilityLabels[regime.volatility]}</strong>
        </div>
      </div>

      <div className="workspace-description">
        <strong>Classification Evidence</strong>
        <ul>
          {regime.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>

      <p className="workspace-description">
        Trend classification requires 50 daily observations.
        High volatility is defined here as annualized
        historical volatility of at least 30%.
        These are research conventions, not predictions.
      </p>
    </section>
  )
}
