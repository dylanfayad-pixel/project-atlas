import type {
  BacktestDraft,
  BacktestExecution,
} from '../lib/backtestWorkspace'
import { BacktestConfigForm } from './BacktestConfigForm'
const BacktestResults = lazy(
  () => import('./BacktestResults').then((module) => ({
    default: module.BacktestResults,
  }))
)
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
  backtestDraft: BacktestDraft
  backtestExecution: BacktestExecution
  onBacktestDraftChange: (
    key: keyof BacktestDraft,
    value: string
  ) => void
  onRunBacktest: () => void
  demoMode: boolean
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
  backtestDraft,
  backtestExecution,
  onBacktestDraftChange,
  onRunBacktest,
  demoMode,
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
      <>
        <ResearchSetup
          dataset={session.dataset}
          onDatasetImported={onDatasetImported}
          onManualDataLoaded={onManualDataLoaded}
          onInstrumentSaved={onInstrumentSaved}
        />
        {session.dataset && (
          <BacktestConfigForm
            draft={backtestDraft}
            running={backtestExecution.status === 'running'}
            onChange={onBacktestDraftChange}
            onRun={onRunBacktest}
          />
        )}
      </>
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
        <div className="workspace-description">
          {backtestExecution.status === 'success' &&
          backtestExecution.result ? (
            <div>
              <strong>Latest Backtest</strong>
              <p>
                Strategy: {backtestExecution.result.portfolio.strategy}
              </p>
              <p>
                Final equity: {'$'}
                {backtestExecution.result.portfolio.final_equity.toFixed(2)}
              </p>
              <p>
                Total return: {' '}
                {backtestExecution.result.portfolio.total_return_pct.toFixed(2)}%
              </p>
            </div>
          ) : backtestExecution.status === 'running' ? (
            <p>Backtest currently running.</p>
          ) : backtestExecution.status === 'error' ? (
            <p>Latest backtest failed. Review the Backtests tab.</p>
          ) : (
            <p>No backtest has been executed for this dataset.</p>
          )}
        </div>
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
          <span className="panel-tag">
              {backtestExecution.status === 'success'
                ? 'BACKTEST COMPLETE'
                : backtestExecution.status === 'running'
                  ? 'RUNNING'
                  : 'NOT EXECUTED'}
            </span>
        </div>
        <div className="detail-grid">
          <div className="detail-card">
            <span>STRATEGY</span>
            <strong>
              {backtestDraft.strategy === 'buy-and-hold'
                ? 'Buy & Hold'
                : 'SMA Crossover'}
            </strong>
          </div>
          {backtestDraft.strategy === 'sma-crossover' && (
            <>
              <div className="detail-card">
                <span>FAST WINDOW</span>
                <strong>{backtestDraft.fast} candles</strong>
              </div>
              <div className="detail-card">
                <span>SLOW WINDOW</span>
                <strong>{backtestDraft.slow} candles</strong>
              </div>
            </>
          )}
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
        <h2>Backtest Research</h2>
        {backtestExecution.status === 'idle' && (
          <p>No backtest has been executed for this dataset.</p>
        )}
        {backtestExecution.status === 'running' && (
          <p role="status">Running C++ backtest...</p>
        )}
        {backtestExecution.status === 'error' && (
          <div className="error-banner" role="alert">
            {backtestExecution.error}
          </div>
        )}
        {backtestExecution.status === 'success' &&
          backtestExecution.result && (
            <Suspense fallback={<p>Loading results...</p>}>
              <BacktestResults result={backtestExecution.result} />
            </Suspense>
          )}
      </section>
    )
  }

  // Without an active dataset or explicit Demo Mode,
  // no synthetic results may appear in the workspace.
  if (!session.dataset && !demoMode) {
    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>No Active Research Session</h2>
            <p>Start by loading market data.</p>
          </div>
          <span className="panel-tag">NO DATA</span>
        </div>
        <p className="workspace-description">
          Upload a daily OHLCV CSV or enter observations
          manually in Research Setup. Market charts,
          strategy signals, and backtest performance
          will appear only when supported by an
          active research session.
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
