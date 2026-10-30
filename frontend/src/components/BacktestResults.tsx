import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { BacktestResult } from '../lib/backtestApi'

type Props = {
  result: BacktestResult
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

// Present C++ engine output without recalculating performance.
export function BacktestResults({ result }: Props) {
  const { portfolio, signals } = result

  const tradeSignals = signals.filter(
    (event) => event.signal !== 'HOLD'
  )

  return (
    <div className="backtest-results">
      <h3>Backtest Results</h3>

      <div className="detail-grid">
        <div className="detail-card">
          <span>INITIAL CAPITAL</span>
          <strong>
            {currency.format(portfolio.initial_capital)}
          </strong>
        </div>

        <div className="detail-card">
          <span>FINAL EQUITY</span>
          <strong>
            {currency.format(portfolio.final_equity)}
          </strong>
        </div>

        <div className="detail-card">
          <span>TOTAL RETURN</span>
          <strong>
            {portfolio.total_return_pct.toFixed(2)}%
          </strong>
        </div>

        <div className="detail-card">
          <span>MAXIMUM DRAWDOWN</span>
          <strong>
            {portfolio.maximum_drawdown_pct.toFixed(2)}%
          </strong>
        </div>

        <div className="detail-card">
          <span>EXECUTED TRADES</span>
          <strong>{portfolio.trades.length}</strong>
        </div>

        <div className="detail-card">
          <span>ANNUALIZED VOLATILITY</span>
          <strong>
            {portfolio.risk_metrics.annualized_volatility_pct.toFixed(2)}%
          </strong>
        </div>
      </div>

      <section className="backtest-chart">
        <h3>Portfolio Equity Curve</h3>

        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={portfolio.equity_curve}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip />
              <Line
                type="linear"
                dataKey="equity"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="backtest-history">
        <h3>Historical BUY/SELL Signals</h3>

        {tradeSignals.length === 0 ? (
          <p>No BUY or SELL signals were generated.</p>
        ) : (
          <div className="backtest-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Signal</th>
                  <th>Bar Index</th>
                </tr>
              </thead>
              <tbody>
                {tradeSignals.map((event) => (
                  <tr key={`${event.index}-${event.signal}`}>
                    <td>{event.timestamp}</td>
                    <td>{event.signal}</td>
                    <td>{event.index}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="backtest-history">
        <h3>Executed Trades</h3>

        {portfolio.trades.length === 0 ? (
          <p>No trades were executed.</p>
        ) : (
          <div className="backtest-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Side</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Commission</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.trades.map((trade) => (
                  <tr key={`${trade.index}-${trade.side}`}>
                    <td>{trade.timestamp}</td>
                    <td>{trade.side}</td>
                    <td>{currency.format(trade.price)}</td>
                    <td>{trade.quantity.toFixed(4)}</td>
                    <td>
                      {currency.format(trade.commission_paid)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="workspace-description">
        Historical simulation only. Strategy signals and
        simulated executions are not investment advice.
      </p>
    </div>
  )
}
