import type { MarketPoint } from '../lib/marketData'

type Props = {
  data: MarketPoint[]
}

// Calculate dashboard metrics from actual loaded signal data.
export function MetricCards({ data }: Props) {
  const buys = data.filter((point) => point.signal === 'BUY').length
  const sells = data.filter((point) => point.signal === 'SELL').length

  return (
    <section className="metric-grid" aria-label="Strategy metrics">
      <div className="metric-card">
        <span>MARKET BARS</span>
        <strong>{data.length}</strong>
        <small>Historical observations</small>
      </div>

      <div className="metric-card">
        <span>BUY SIGNALS</span>
        <strong className="positive">{buys}</strong>
        <small>Bullish crossovers</small>
      </div>

      <div className="metric-card">
        <span>SELL SIGNALS</span>
        <strong className="negative">{sells}</strong>
        <small>Bearish crossovers</small>
      </div>

      <div className="metric-card">
        <span>STRATEGY</span>
        <strong className="strategy-value">SMA 3 / 5</strong>
        <small>Moving-average crossover</small>
      </div>
    </section>
  )
}
