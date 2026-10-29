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

  function handleDatasetImported(
    filename: string,
    bars: OhlcvBar[]
  ) {
    const dataset = createUploadedDataset(filename, bars)

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
  const [loading, setLoading] = useState(true)

  const [portfolio, setPortfolio] =
    useState<PortfolioData | null>(null)

  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [portfolioError, setPortfolioError] =
    useState<string | null>(null)


  useEffect(() => {
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
  }, [])

  // Load portfolio results independently of market signals.
  useEffect(() => {
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
  }, [])

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
          </div>

          <div className="environment-pill">
            <span className="status-dot" />
            {session.dataset
              ? 'UPLOADED MARKET DATA'
              : 'SYNTHETIC DEMO'}
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
            onDatasetImported={handleDatasetImported}
            onInstrumentSaved={handleInstrumentSaved}
            data={data}
            portfolio={portfolio}
            portfolioLoading={portfolioLoading}
            portfolioError={portfolioError}
          />
        )}

        <footer>
          <span>PROJECT ATLAS - QUANTITATIVE RESEARCH PLATFORM</span>
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
