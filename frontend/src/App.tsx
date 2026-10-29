import { useEffect, useState } from 'react'
import { Code2 } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import type { WorkspaceView } from './components/Sidebar'
import { WorkspaceContent } from './components/WorkspaceContent'
import { SessionIdentity } from './components/SessionIdentity'
import { parseMarketData } from './lib/marketData'
import type { MarketPoint } from './lib/marketData'
import { parsePortfolioData } from './lib/portfolioData'
import type { PortfolioData } from './lib/portfolioData'
import {
  createResearchSession,
  createUploadedDataset,
  createManualDataset,
} from './lib/researchSession'
import type { OhlcvBar } from './lib/ohlcvData'
import type {
  InstrumentMetadata,
} from './lib/instrumentMetadata'
import './App.css'

const titles: Record<WorkspaceView, string> = {
  'research-setup': 'New Research Session',
  overview: 'Strategy Overview',
  strategies: 'Strategy Research',
  'market-data': 'Market Data',
  backtests: 'Backtest Research',
}

// Application shell owns navigation and asynchronous data loading.
function App() {
  const [activeView, setActiveView] =
    useState<WorkspaceView>('research-setup')

  const [session, setSession] = useState(createResearchSession)
  const [demoMode, setDemoMode] = useState(false)

  // Remove synthetic results when changing research sources.
  function clearDemoResults() {
    setData([])
    setPortfolio(null)
    setError(null)
    setPortfolioError(null)
    setLoading(false)
    setPortfolioLoading(false)
  }

  function handleDatasetImported(
    filename: string,
    bars: OhlcvBar[]
  ) {
    const dataset = createUploadedDataset(filename, bars)
    setDemoMode(false)
    clearDemoResults()

    setSession((previous) => ({
      ...previous,
      dataset,
      status: 'data-ready',
    }))
  }

  function handleManualDataLoaded(bars: OhlcvBar[]) {
    const dataset = createManualDataset(bars)
    setDemoMode(false)
    clearDemoResults()

    setSession((previous) => ({
      ...previous,
      dataset,
      status: 'data-ready',
    }))
  }

  function handleInstrumentSaved(
    datasetId: string,
    metadata: InstrumentMetadata
  ) {
    setSession((previous) => {
      if (previous.dataset?.id !== datasetId) {
        return previous
      }

      return {
        ...previous,
        dataset: {
          ...previous.dataset,
          symbol: metadata.symbol,
          exchange: metadata.exchange,
          instrumentVerified: false,
        },
      }
    })
  }

  const [data, setData] = useState<MarketPoint[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [portfolio, setPortfolio] =
    useState<PortfolioData | null>(null)

  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioError, setPortfolioError] =
    useState<string | null>(null)


  useEffect(() => {
    if (!demoMode) return

    const controller = new AbortController()

    fetch('/data/demo_signals.csv', {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load signal data')
        }
        return response.text()
      })
      .then((csv) => setData(parseMarketData(csv)))
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setError(
          cause instanceof Error ? cause.message : 'Unknown error'
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [demoMode])

  // Load portfolio results independently of market signals.
  useEffect(() => {
    if (!demoMode) return

    const controller = new AbortController()

    fetch('/data/demo_portfolio_v3.json', {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load portfolio results')
        }
        return response.json()
      })
      .then((json: unknown) => {
        if (!controller.signal.aborted) {
          setPortfolio(parsePortfolioData(json))
        }
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setPortfolioError(
          cause instanceof Error ? cause.message : 'Unknown error'
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setPortfolioLoading(false)
        }
      })

    return () => controller.abort()
  }, [demoMode])

  return (
    <div className="app-shell">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
      />

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">
              PROJECT ATLAS / {activeView.toUpperCase()}
            </div>
            <h1>{titles[activeView]}</h1>
            <p>Historical quantitative research platform</p>
            <p className="atlas-creator">
              Created by <strong>Dylan Fayad</strong>
            </p>
          </div>

          <div className="environment-pill">
            <span className="status-dot" />
            {session.dataset?.source === 'manual-entry'
              ? 'MANUAL MARKET DATA'
              : session.dataset?.source === 'uploaded-csv'
                ? 'UPLOADED MARKET DATA'
                : session.dataset
                  ? 'RESEARCH MARKET DATA'
                  : demoMode ? 'SYNTHETIC DEMO' : 'NO ACTIVE DATA'}
          </div>
        <div className="demo-controls">
            {demoMode ? (
              <button
                type="button"
                className="research-upload-button"
                onClick={() => {
                  setDemoMode(false)
                  clearDemoResults()
                  setSession(createResearchSession())
                  setActiveView('research-setup')
                }}
              >
                Exit Demo
              </button>
            ) : (
              <button
                type="button"
                className="research-upload-button"
                onClick={() => {
                  setSession(createResearchSession())
                  clearDemoResults()
                  setDemoMode(true)
                  setLoading(true)
                  setPortfolioLoading(true)
                  setActiveView('overview')
                }}
              >
                Launch Demo
              </button>
            )}
          </div>
          </header>

        {session.dataset && (
          <SessionIdentity dataset={session.dataset} />
        )}

        {loading && (
          <div className="panel" role="status">
            Loading strategy data...
          </div>
        )}

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <WorkspaceContent
            view={activeView}
            session={session}
              demoMode={demoMode}
            onDatasetImported={handleDatasetImported}
            onManualDataLoaded={handleManualDataLoaded}
            onInstrumentSaved={handleInstrumentSaved}
            data={data}
            portfolio={portfolio}
            portfolioLoading={portfolioLoading}
            portfolioError={portfolioError}
          />
        )}

        <footer>
          <span>© 2026 Dylan Fayad · Project Atlas</span>
          <span>
            <Code2 size={14} />
            C++20 + REACT + TYPESCRIPT
          </span>
        </footer>
      </main>
    </div>
  )
}

export default App
