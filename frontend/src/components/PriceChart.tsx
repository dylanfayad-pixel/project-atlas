import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MarketPoint } from '../lib/marketData'

type Props = {
  data: MarketPoint[]
}

// Visualizes historical closing prices and strategy decisions.
export function PriceChart({ data }: Props) {
  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <h2>Historical Price Analysis</h2>
          <p>Synthetic closing prices with strategy signals</p>
        </div>
        <span className="panel-tag">C++ ENGINE OUTPUT</span>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
              domain={['dataMin - 1', 'dataMax + 1']}
            />

            <Tooltip
              contentStyle={{
                background: '#111e30',
                border: '1px solid #2a3b52',
                borderRadius: 10,
                color: '#eaf0fa',
              }}
            />

            <Line
              type="linear"
              dataKey="price"
              stroke="#5a9cff"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />

            {data
              .filter((point) => point.signal !== 'HOLD')
              .map((point) => (
                <ReferenceDot
                  key={point.index}
                  x={point.timestamp}
                  y={point.price}
                  r={7}
                  fill={
                    point.signal === 'BUY'
                      ? '#31d7a0'
                      : '#ff6b86'
                  }
                  stroke="#101b2b"
                  strokeWidth={2}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend">
        <span>
          <i className="legend-line" /> Closing price
        </span>
        <span>
          <i className="legend-dot buy" /> Buy signal
        </span>
        <span>
          <i className="legend-dot sell" /> Sell signal
        </span>
      </div>
    </section>
  )
}
