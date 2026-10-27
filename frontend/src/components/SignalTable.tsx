import type { MarketPoint } from '../lib/marketData'

type Props = {
  data: MarketPoint[]
}

// Displays each historical strategy decision in chronological order.
export function SignalTable({ data }: Props) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Signal Activity</h2>
          <p>Decisions produced by the historical strategy engine</p>
        </div>
        <span className="panel-tag">{data.length} EVENTS</span>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>INDEX</th>
              <th>PERIOD</th>
              <th>CLOSE</th>
              <th>SIGNAL</th>
            </tr>
          </thead>

          <tbody>
            {data.map((point) => (
              <tr key={point.index}>
                <td>{point.index}</td>
                <td>{point.timestamp}</td>
                <td>${point.price.toFixed(2)}</td>
                <td>
                  <span
                    className={
                      `signal-badge ${point.signal.toLowerCase()}`
                    }
                  >
                    {point.signal}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
