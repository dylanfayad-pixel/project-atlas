
import { useState } from 'react'
import { Code2 } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import type { WorkspaceView } from './components/Sidebar'
import { WorkspaceContent } from './components/WorkspaceContent'
import { SessionIdentity } from './components/SessionIdentity'
import {
  createResearchSession,
  createUploadedDataset,
  createManualDataset,
} from './lib/researchSession'
import type { OhlcvBar } from './lib/ohlcvData'
import type { InstrumentMetadata } from './lib/instrumentMetadata'
import './App.css'

const titles: Record<WorkspaceView, string> = {
  'market-overview': 'Market Overview',
  'data-workspace': 'Data Workspace',
  'technical-indicators': 'Technical Indicators',
  'market-explorer': 'Market Explorer',
  'risk-intelligence': 'Risk Intelligence',
}

// The application owns navigation and the validated research session.
// Financial analytics are calculated from the active dataset.
function App() {
  const [activeView, setActiveView] =
    useState<WorkspaceView>('data-workspace')

  const [session, setSession] = useState(createResearchSession)

  function handleDatasetImported(
    filename: string,
    bars: OhlcvBar[],
  ) {
    const dataset = createUploadedDataset(filename, bars)

    setSession((previous) => ({
      ...previous,
      dataset,
      status: 'data-ready',
    }))
  }

  function handleManualDataLoaded(bars: OhlcvBar[]) {
    const dataset = createManualDataset(bars)

    setSession((previous) => ({
      ...previous,
      dataset,
      status: 'data-ready',
    }))
  }

  function handleInstrumentSaved(
    datasetId: string,
    metadata: InstrumentMetadata,
  ) {
    setSession((previous) => {
      // Ignore metadata updates for a replaced dataset.
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
            <p>Automated quantitative market intelligence</p>
          </div>

          <div className="environment-pill">
            <span className="status-dot" />
            {session.dataset?.source === 'manual-entry'
              ? 'MANUAL MARKET DATA'
              : session.dataset?.source === 'uploaded-csv'
                ? 'UPLOADED MARKET DATA'
                : session.dataset
                  ? 'RESEARCH MARKET DATA'
                  : 'NO ACTIVE DATA'}
          </div>
        </header>

        {session.dataset && (
          <SessionIdentity dataset={session.dataset} />
        )}

        <WorkspaceContent
          view={activeView}
          session={session}
          onDatasetImported={handleDatasetImported}
          onManualDataLoaded={handleManualDataLoaded}
          onInstrumentSaved={handleInstrumentSaved}
        />

        <footer>
          <span>Project Atlas Intelligence</span>
          <span>
            <Code2 size={14} />
            REACT + TYPESCRIPT + QUANTITATIVE ANALYTICS
          </span>
        </footer>
      </main>
    </div>
  )
}

export default App
