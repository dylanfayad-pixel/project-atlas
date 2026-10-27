import { useEffect, useState } from 'react'
import { Code2 } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import type { WorkspaceView } from './components/Sidebar'
import { WorkspaceContent } from './components/WorkspaceContent'
import { parseMarketData } from './lib/marketData'
import type { MarketPoint } from './lib/marketData'
import { parsePortfolioData } from './lib/portfolioData'
import type { PortfolioData } from './lib/portfolioData'
import './App.css'

const titles: Record<WorkspaceView, string> = {
  overview: 'Strategy Overview',
  strategies: 'Strategy Research',
  'market-data': 'Market Data',
  backtests: 'Backtest Research',
}

// Application shell owns navigation and asynchronous data loading.
function App() {
  const [activeView, setActiveView] =
    useState<WorkspaceView>('overview')

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

    fetch('/data/demo_portfolio.json', {
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
            SYNTHETIC DATA
          </div>
        </header>

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
            data={data}
            portfolio={portfolio}
            portfolioLoading={portfolioLoading}
            portfolioError={portfolioError}
          />
        )}

        <footer>
          <span>PROJECT ATLAS - PHASE 2 DEVELOPMENT</span>
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
