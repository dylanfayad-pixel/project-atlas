import { useMemo } from 'react'
import { analyzeMarket } from '../lib/marketAnalytics'
import type { ResearchDataset } from '../lib/researchSession'

// Present observed market statistics without trade simulation.
type Props = {
  dataset: ResearchDataset
}

function formatMetric(
  value: number | null,
  suffix = '',
  digits = 2,
): string {
  if (value === null) return 'Insufficient data'
  return `${value.toFixed(digits)}${suffix}`
}

export function MarketIntelligence({ dataset }: Props) {
  // Recalculate only when the dataset's observations change.
  const analysis = useMemo(
    () => analyzeMarket(dataset.bars),
    [dataset.bars],
  )

  const metrics = [
    {
      label: 'Latest Close',
      value: formatMetric(analysis.latestClose),
    },
    {
      label: 'Historical Price Return',
      value: formatMetric(analysis.totalReturnPct, '%'),
    },
    {
      label: 'Annualized Volatility',
      value: formatMetric(analysis.annualizedVolatilityPct, '%'),
    },
    {
      label: 'Maximum Close Drawdown',
      value: formatMetric(analysis.maximumDrawdownPct, '%'),
    },
    {
      label: 'SMA 20',
      value: formatMetric(analysis.sma20),
    },
    {
      label: 'SMA 50',
      value: formatMetric(analysis.sma50),
    },
    {
      label: 'RSI 14',
      value: formatMetric(analysis.rsi14),
    },
  ]

  return (
    <section className="panel" aria-label="Market Intelligence">
      <div className="panel-heading">
        <div>
          <h2>Market Intelligence</h2>
          <p>
            Automatically calculated from validated
            daily OHLCV observations.
          </p>
        </div>
        <span className="panel-tag">OBSERVED DATA</span>
      </div>

      <div className="detail-grid">
        {metrics.map((metric) => (
          <div className="detail-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      <p className="workspace-description">
        {analysis.observations} observations from{' '}
        {analysis.firstTimestamp} through{' '}
        {analysis.lastTimestamp}.
        Returns and drawdowns use closing prices.
        Volatility assumes 252 trading days annually.
        Results are historical measurements, not
        predictions or investment recommendations.
      </p>
    </section>
  )
}
