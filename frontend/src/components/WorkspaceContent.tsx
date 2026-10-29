import { ResearchSetup } from './ResearchSetup'
import { CandlestickChart } from './CandlestickChart'
import type {
  ResearchSession,
} from '../lib/researchSession'
import type { OhlcvBar } from '../lib/ohlcvData'
import type {
  InstrumentMetadata,
} from '../lib/instrumentMetadata'
import type { MarketPoint } from '../lib/marketData'
import type { PortfolioData } from '../lib/portfolioData'
// Load portfolio charts separately from the main dashboard.
const PortfolioAnalytics = lazy(() =>
  import('./PortfolioAnalytics').then((module) => ({
    default: module.PortfolioAnalytics,
  }))
)
import type { WorkspaceView } from './Sidebar'
import { MetricCards } from './MetricCards'
import { lazy, Suspense } from 'react'

// Load the market chart only when its view is displayed.
const PriceChart = lazy(() =>
  import('./PriceChart').then((module) => ({
    default: module.PriceChart,
  }))
)
import { SignalTable } from './SignalTable'

type Props = {
  view: WorkspaceView
  session: ResearchSession
  onDatasetImported: (
    filename: string,
    bars: OhlcvBar[]
  ) => void
  onManualDataLoaded: (bars: OhlcvBar[]) => void
  onInstrumentSaved: (
    datasetId: string,
    metadata: InstrumentMetadata
  ) => void
  data: MarketPoint[]
  portfolio: PortfolioData | null
  portfolioLoading: boolean
  portfolioError: string | null
}

// Render the selected workspace using verified demonstration data.
export function WorkspaceContent({
  view,
  session,
  onDatasetImported,
  onManualDataLoaded,
  onInstrumentSaved,
  data,
  portfolio,
  portfolioLoading,
  portfolioError,
}: Props) {
  if (view === 'research-setup') {
    return (
      <ResearchSetup
        dataset={session.dataset}
        onDatasetImported={onDatasetImported}
        onManualDataLoaded={onManualDataLoaded}
        onInstrumentSaved={onInstrumentSaved}
      />
    )
  }

  if (session.dataset && view === 'overview') {
    const dataset = session.dataset

    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Active Research Dataset</h2>
            <p>{dataset.filename ?? 'Imported market data'}</p>
          </div>
          <span className="panel-tag">
            {dataset.source === 'manual-entry'
              ? 'MANUAL DATA'
              : dataset.source === 'uploaded-csv'
                ? 'UPLOADED CSV'
                : 'RESEARCH DATA'}
          </span>
        </div>
        <div className="detail-grid">
          <div className="detail-card">
            <span>OBSERVATIONS</span>
            <strong>{dataset.bars.length}</strong>
          </div>
          <div className="detail-card">
            <span>TIMEFRAME</span>
            <strong>1 Day</strong>
          </div>
          <div className="detail-card">
            <span>FIRST DATE</span>
            <strong>{dataset.firstTimestamp}</strong>
          </div>
          <div className="detail-card">
            <span>LAST DATE</span>
            <strong>{dataset.lastTimestamp}</strong>
          </div>
        </div>
        <p className="workspace-description">
          No backtest has been executed for this dataset.
          Performance metrics are not available yet.
        </p>
      </section>
    )
  }

  if (session.dataset && view === 'strategies') {
    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Strategy Configuration</h2>
            <p>Settings for the active research session</p>
          </div>
          <span className="panel-tag">NOT EXECUTED</span>
        </div>
        <div className="detail-grid">
          <div className="detail-card">
            <span>STRATEGY</span>
            <strong>SMA Crossover</strong>
          </div>
          <div className="detail-card">
            <span>FAST WINDOW</span>
            <strong>{session.strategy.fastWindow} candles</strong>
          </div>
          <div className="detail-card">
            <span>SLOW WINDOW</span>
            <strong>{session.strategy.slowWindow} candles</strong>
          </div>
        </div>
        <p className="workspace-description">
          These are configuration values, not generated signals.
          The C++ engine has not processed this dataset.
        </p>
      </section>
    )
  }

  if (session.dataset && view === 'market-data') {
    return (
      <CandlestickChart bars={session.dataset.bars} />
    )
  }

  if (session.dataset && view === 'backtests') {
    return (
      <section className="panel">
        <h2>No Backtest Executed</h2>
        <p className="workspace-description">
          Your dataset is loaded, but the C++ backtesting
          engine is not connected to this browser session.
          No trades, returns, or risk metrics have been
          calculated for the uploaded data.
        </p>
      </section>
    )
  }

  if (view === 'overview') {
    return (
      <>
        <MetricCards data={data} />
        <Suspense
          fallback={
            <section className="panel" role="status">
              Loading market chart...
            </section>
          }
        >
          <PriceChart data={data} />
        </Suspense>
        <SignalTable data={data} />
      </>
    )
  }

  if (view === 'strategies') {
    return (
      <>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Strategy Configuration</h2>
              <p>Current demonstration strategy</p>
            </div>
            <span className="panel-tag">SMA CROSSOVER</span>
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <span>STRATEGY</span>
              <strong>Simple Moving Average Crossover</strong>
            </div>
            <div className="detail-card">
              <span>FAST WINDOW</span>
              <strong>3 periods</strong>
            </div>
            <div className="detail-card">
              <span>SLOW WINDOW</span>
              <strong>5 periods</strong>
            </div>
          </div>
        </section>

        <Suspense
          fallback={
            <section className="panel" role="status">
              Loading market chart...
            </section>
          }
        >
          <PriceChart data={data} />
        </Suspense>
      </>
    )
  }

  if (view === 'market-data') {
    return (
      <>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Market Data Explorer</h2>
              <p>Loaded synthetic historical observations</p>
            </div>
            <span className="panel-tag">
              {data.length} RECORDS
            </span>
          </div>

          <p className="workspace-description">
            This dataset contains synthetic closing prices
            used by the C++ SMA crossover demonstration.
            It is not a live market feed.
          </p>
        </section>

        <SignalTable data={data} />
      </>
    )
  }

  if (portfolioLoading) {
    return (
      <section className="panel" role="status">
        Loading portfolio analytics...
      </section>
    )
  }

  if (portfolioError) {
    return (
      <div className="error-banner" role="alert">
        {portfolioError}
      </div>
    )
  }

  if (!portfolio) {
    return (
      <section className="panel">
        No portfolio results are available.
      </section>
    )
  }

  return (
    <Suspense
      fallback={
        <section className="panel" role="status">
          Loading portfolio analytics...
        </section>
      }
    >
      <PortfolioAnalytics portfolio={portfolio} />
    </Suspense>
  )
}
