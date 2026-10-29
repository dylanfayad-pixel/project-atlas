import { ResearchSetup } from './ResearchSetup'
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
  data: MarketPoint[]
  portfolio: PortfolioData | null
  portfolioLoading: boolean
  portfolioError: string | null
}

// Render the selected workspace using verified demonstration data.
export function WorkspaceContent({
  view,
  data,
  portfolio,
  portfolioLoading,
  portfolioError,
}: Props) {
  if (view === 'research-setup') {
    return <ResearchSetup />
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
