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

      {portfolio.schema_version === 2 && (
        <section className="metric-grid">
          <div className="metric-card">
            <span>TOTAL COMMISSIONS</span>
            <strong className="negative">
              {money(portfolio.total_commission)}
            </strong>
          </div>

          <div className="metric-card">
            <span>TOTAL SLIPPAGE</span>
            <strong className="negative">
              {money(portfolio.total_slippage_cost)}
            </strong>
          </div>

          <div className="metric-card">
            <span>TOTAL EXECUTION COST</span>
            <strong className="negative">
              {money(portfolio.total_execution_cost)}
            </strong>
          </div>

          <div className="metric-card">
            <span>COST AS % OF CAPITAL</span>
            <strong className="negative">
              {(
                portfolio.total_execution_cost /
                portfolio.initial_capital * 100
              ).toFixed(2)}%
            </strong>
          </div>
        </section>
      )}

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
            <LineChart
              data={portfolio.equity_curve}
              margin={{ top: 12, right: 18, left: 8, bottom: 4 }}
            >
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
                width={82}
                tickMargin={10}
                tickFormatter={(value: number) =>
                  `$${Math.round(value).toLocaleString('en-US')}`
                }
                domain={['dataMin - 500', 'dataMax + 500']}
              />
              <Tooltip
                formatter={(value) => [
                  money(Number(value)),
                  'Portfolio Equity',
                ]}
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
                {portfolio.schema_version === 2 && (
                  <>
                    <th>COMMISSION</th>
                    <th>SLIPPAGE</th>
                  </>
                )}
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
                  {portfolio.schema_version === 2 &&
                    'commission_paid' in trade &&
                    'slippage_cost' in trade && (
                      <>
                        <td>{money(trade.commission_paid)}</td>
                        <td>{money(trade.slippage_cost)}</td>
                      </>
                    )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
