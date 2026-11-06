import { useMemo } from 'react'
import { analyzeMarket } from '../lib/marketAnalytics'
import type { ResearchDataset } from '../lib/researchSession'

type Props = {
  dataset: ResearchDataset
}

// Format only observed historical values; never fabricate metrics.
function formatMetric(
  value: number | null,
  suffix = '',
): string {
  return value === null
    ? 'Insufficient data'
    : `${value.toFixed(2)}${suffix}`
}

export function MarketOverviewSummary({ dataset }: Props) {
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
      label: 'Observations',
      value: String(analysis.observations),
    },
  ]

  return (
    <section
      className="market-overview-summary"
      aria-label="Market Overview Summary"
    >
      <div className="overview-metrics-grid">
        {metrics.map((metric) => (
          <article className="overview-metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </div>
      <p className="workspace-description">
        Historical closing-price measurements from
        {` ${analysis.firstTimestamp} through ${analysis.lastTimestamp}. `}
        Volatility assumes 252 trading days annually.
        These metrics are not forecasts.
      </p>
    </section>
  )
}
