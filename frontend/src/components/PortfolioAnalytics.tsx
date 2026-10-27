import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PortfolioData } from '../lib/portfolioData'

type Props = {
  portfolio: PortfolioData
}

// Display performance values calculated by the C++ engine.
export function PortfolioAnalytics({ portfolio }: Props) {
  const money = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)

  return (
    <>
      <section className="metric-grid">
        <div className="metric-card">
          <span>STARTING CAPITAL</span>
          <strong>{money(portfolio.initial_capital)}</strong>
        </div>

        <div className="metric-card">
          <span>FINAL EQUITY</span>
          <strong>{money(portfolio.final_equity)}</strong>
        </div>

        <div className="metric-card">
          <span>TOTAL RETURN</span>
          <strong className={
            portfolio.total_return_pct >= 0
              ? 'positive'
              : 'negative'
          }>
            {portfolio.total_return_pct.toFixed(2)}%
          </strong>
        </div>

        <div className="metric-card">
          <span>MAXIMUM DRAWDOWN</span>
          <strong className="negative">
            {portfolio.maximum_drawdown_pct.toFixed(2)}%
          </strong>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Portfolio Equity Curve</h2>
            <p>{portfolio.strategy} — C++ simulation output</p>
          </div>
          <span className="panel-tag">SIMULATED</span>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={portfolio.equity_curve}>
              <CartesianGrid
                stroke="#243247"
                strokeDasharray="3 5"
              />
              <XAxis
                dataKey="timestamp"
                stroke="#8190a6"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#8190a6"
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 500', 'dataMax + 500']}
              />
              <Tooltip
                contentStyle={{
                  background: '#111e30',
                  border: '1px solid #2a3b52',
                  borderRadius: 10,
                }}
              />
              <Line
                type="linear"
                dataKey="equity"
                stroke="#60a5fa"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Executed Trade History</h2>
            <p>Next-bar simulated fills, not real orders</p>
          </div>
          <span className="panel-tag">
            {portfolio.trades.length} FILLS
          </span>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>DAY</th>
                <th>SIDE</th>
                <th>PRICE</th>
                <th>QUANTITY</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.trades.map((trade) => (
                <tr key={trade.index}>
                  <td>{trade.timestamp}</td>
                  <td>
                    <span className={
                      `signal-badge ${trade.side.toLowerCase()}`
                    }>
                      {trade.side}
                    </span>
                  </td>
                  <td>{money(trade.price)}</td>
                  <td>{trade.quantity.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
