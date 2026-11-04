import { ResearchSetup } from './ResearchSetup'
import { MarketIntelligence } from './MarketIntelligence'
import { MarketRegimePanel } from './MarketRegimePanel'
import { ResearchInsightsPanel } from './ResearchInsightsPanel'
import { CandlestickChart } from './CandlestickChart'
import { analyzeMarket } from '../lib/marketAnalytics'
import type { WorkspaceView } from './Sidebar'
import type { ResearchSession } from '../lib/researchSession'
import type { OhlcvBar } from '../lib/ohlcvData'
import type { InstrumentMetadata } from '../lib/instrumentMetadata'

type Props = {
  view: WorkspaceView
  session: ResearchSession
  onDatasetImported: (filename: string, bars: OhlcvBar[]) => void
  onManualDataLoaded: (bars: OhlcvBar[]) => void
  onInstrumentSaved: (
    datasetId: string,
    metadata: InstrumentMetadata,
  ) => void
}

function EmptyWorkspace({ view }: { view: WorkspaceView }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>No Active Market Dataset</h2>
          <p>Historical research requires validated observations.</p>
        </div>
        <span className="panel-tag">NO DATA</span>
      </div>

      <p className="workspace-description">
        Open Data Workspace to upload a daily OHLCV CSV
        or enter historical observations manually.
        The {view.replaceAll('-', ' ')} workspace will
        update automatically after data is loaded.
      </p>
    </section>
  )
}

// Render research workspaces using only the active dataset.
// No simulated orders, backtests, or portfolio execution.
export function WorkspaceContent({
  view,
  session,
  onDatasetImported,
  onManualDataLoaded,
  onInstrumentSaved,
}: Props) {
  const dataset = session.dataset

  if (view === 'data-workspace') {
    return (
      <>
        <ResearchSetup
          dataset={dataset}
          onDatasetImported={onDatasetImported}
          onManualDataLoaded={onManualDataLoaded}
          onInstrumentSaved={onInstrumentSaved}
        />
        {dataset && <MarketIntelligence dataset={dataset} />}
      </>
    )
  }

  if (!dataset) {
    return <EmptyWorkspace view={view} />
  }

  if (view === 'market-overview') {
    return (
      <>
        <MarketIntelligence dataset={dataset} />
        <MarketRegimePanel dataset={dataset} />
        <ResearchInsightsPanel dataset={dataset} />
        <CandlestickChart bars={dataset.bars} />
      </>
    )
  }

  if (view === 'market-explorer') {
    return <CandlestickChart bars={dataset.bars} />
  }

  const analysis = analyzeMarket(dataset.bars)

  if (view === 'technical-indicators') {
    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Technical Indicators</h2>
            <p>Calculated from historical closing prices.</p>
          </div>
          <span className="panel-tag">HISTORICAL</span>
        </div>

        <div className="detail-grid">
          <div className="detail-card">
            <span>SMA 20</span>
            <strong>
              {analysis.sma20?.toFixed(2) ?? 'Insufficient data'}
            </strong>
          </div>

          <div className="detail-card">
            <span>SMA 50</span>
            <strong>
              {analysis.sma50?.toFixed(2) ?? 'Insufficient data'}
            </strong>
          </div>

          <div className="detail-card">
            <span>RSI 14</span>
            <strong>
              {analysis.rsi14?.toFixed(2) ?? 'Insufficient data'}
            </strong>
          </div>
          <div className="detail-card">
            <span>EMA 12</span>
            <strong>
              {analysis.ema12?.toFixed(2) ?? 'Insufficient data'}
            </strong>
          </div>

          <div className="detail-card">
            <span>EMA 26</span>
            <strong>
              {analysis.ema26?.toFixed(2) ?? 'Insufficient data'}
            </strong>
          </div>

          <div className="detail-card">
            <span>MACD</span>
            <strong>
              {analysis.macd.macd?.toFixed(4) ?? 'Insufficient data'}
            </strong>
          </div>

          <div className="detail-card">
            <span>MACD Signal</span>
            <strong>
              {analysis.macd.signal?.toFixed(4) ?? 'Insufficient data'}
            </strong>
          </div>

          <div className="detail-card">
            <span>MACD Histogram</span>
            <strong>
              {analysis.macd.histogram?.toFixed(4) ?? 'Insufficient data'}
            </strong>
          </div>
        </div>

        <p className="workspace-description">
          Technical indicators describe historical price
          behavior and do not guarantee future performance.
        </p>
      </section>
    )
  }

  if (view === 'risk-intelligence') {
    return (
      <>
        <MarketRegimePanel dataset={dataset} />
        <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Risk Intelligence</h2>
            <p>Historical price-based risk measurements.</p>
          </div>
          <span className="panel-tag">OBSERVED DATA</span>
        </div>

        <div className="detail-grid">
          <div className="detail-card">
            <span>Annualized Volatility</span>
            <strong>
              {analysis.annualizedVolatilityPct === null
                ? 'Insufficient data'
                : `${analysis.annualizedVolatilityPct.toFixed(2)}%`}
            </strong>
          </div>

          <div className="detail-card">
            <span>Maximum Close Drawdown</span>
            <strong>
              {analysis.maximumDrawdownPct.toFixed(2)}%
            </strong>
          </div>

          <div className="detail-card">
            <span>Historical Price Return</span>
            <strong>
              {analysis.totalReturnPct === null
                ? 'Insufficient data'
                : `${analysis.totalReturnPct.toFixed(2)}%`}
            </strong>
          </div>
        </div>

        <p className="workspace-description">
          Volatility uses daily close-to-close returns
          and a 252-trading-day annualization assumption.
          Drawdown uses closing prices rather than
          intraday lows. These metrics are not forecasts.
        </p>
        </section>
      </>
    )
  }

  return <EmptyWorkspace view={view} />
}
