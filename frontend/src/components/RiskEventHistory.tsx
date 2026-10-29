import type { PortfolioRiskEvent } from '../lib/portfolioData'

type Props = {
  events: PortfolioRiskEvent[]
}

// Risk events describe simulation decisions, not necessarily fills.
const eventLabels: Record<PortfolioRiskEvent['type'], string> = {
  DRAWDOWN_BREACH: 'Drawdown threshold breached',
  LIQUIDATION_EXECUTED: 'Risk liquidation executed',
  LIQUIDATION_REJECTED: 'Risk liquidation rejected',
}

export function RiskEventHistory({ events }: Props) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Risk Control Event History</h2>
          <p>
            Chronological events recorded by the C++ risk engine
          </p>
        </div>
        <span className="panel-tag">RISK EVENTS</span>
      </div>

      {events.length === 0 ? (
        <p>No risk-control events occurred during this simulation.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th scope="col">Bar</th>
                <th scope="col">Timestamp</th>
                <th scope="col">Event</th>
                <th scope="col">Observed drawdown</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, position) => (
                <tr key={`${event.index}-${event.type}-${position}`}>
                  <td>{event.index}</td>
                  <td>{event.timestamp}</td>
                  <td>{eventLabels[event.type]}</td>
                  <td>
                    {event.type === 'DRAWDOWN_BREACH'
                      ? `${(event.drawdown_fraction * 100).toFixed(2)}%`
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p>
        Rejected liquidation attempts do not represent
        completed SELL fills.
      </p>
    </section>
  )
}
