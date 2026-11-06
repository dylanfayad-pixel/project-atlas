
import { useRef, useState } from 'react'
import { Code2 } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import type { WorkspaceView } from './components/Sidebar'
import { WorkspaceContent } from './components/WorkspaceContent'
import { SessionIdentity } from './components/SessionIdentity'
import { DatasetSelector } from './components/DatasetSelector'
import { CompactInstrumentSelector } from './components/CompactInstrumentSelector'
import {
  MAX_RESEARCH_DATASETS,
  addResearchDataset,
  createResearchCollection,
  getActiveDataset,
  removeResearchDataset,
  replaceResearchDataset,
  selectResearchDataset,
} from './lib/researchCollection'
import {
  createResearchSession,
  createUploadedDataset,
  createManualDataset,
} from './lib/researchSession'
import type { OhlcvBar } from './lib/ohlcvData'
import type { HistoricalDataResponse } from './lib/historicalDataResponse'
import { createProviderDataset } from './lib/providerDataset'
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

  const [collection, setCollection] =
    useState(createResearchCollection)

  // Track the latest collection synchronously so closely timed
  // imports cannot bypass capacity validation.
  const collectionRef = useRef(collection)

  function commitCollection(
    next: typeof collection,
  ) {
    collectionRef.current = next
    setCollection(next)
  }

  const [collectionError, setCollectionError] =
    useState<string | null>(null)

  // Preserve the existing single-dataset component contract.
  const activeDataset = getActiveDataset(collection)

  const session = {
    ...createResearchSession(),
    dataset: activeDataset,
    status: activeDataset ? 'data-ready' as const : 'no-data' as const,
  }

  function handleDatasetImported(
    filename: string,
    bars: OhlcvBar[],
  ) {
    if (
      collectionRef.current.datasets.length >= MAX_RESEARCH_DATASETS
    ) {
      setCollectionError(
        `Research collection limit reached (${MAX_RESEARCH_DATASETS} datasets).`,
      )
      return
    }

    setCollectionError(null)

    const dataset = createUploadedDataset(filename, bars)
    commitCollection(
      addResearchDataset(collectionRef.current, dataset),
    )
  }

  function handleManualDataLoaded(bars: OhlcvBar[]) {
    if (
      collectionRef.current.datasets.length >= MAX_RESEARCH_DATASETS
    ) {
      setCollectionError(
        `Research collection limit reached (${MAX_RESEARCH_DATASETS} datasets).`,
      )
      return
    }

    setCollectionError(null)

    const dataset = createManualDataset(bars)
    commitCollection(
      addResearchDataset(collectionRef.current, dataset),
    )
  }

  // Provider observations enter the same bounded research collection
  // as CSV and manual datasets, preserving independent identities.
  function handleProviderDataLoaded(
    data: HistoricalDataResponse,
  ) {
    if (
      collectionRef.current.datasets.length >= MAX_RESEARCH_DATASETS
    ) {
      setCollectionError(
        `Research collection limit reached (${MAX_RESEARCH_DATASETS} datasets).`,
      )
      return false
    }

    setCollectionError(null)

    const dataset = createProviderDataset(data)

    commitCollection(
      addResearchDataset(collectionRef.current, dataset),
    )

    return true
  }

  function handleInstrumentSaved(
    datasetId: string,
    metadata: InstrumentMetadata,
  ) {
    const current = collectionRef.current.datasets.find(
      (dataset) => dataset.id === datasetId,
    )

    if (!current) return

    commitCollection(
      replaceResearchDataset(
        collectionRef.current,
        datasetId,
        {
          ...current,
          symbol: metadata.symbol,
          exchange: metadata.exchange,
          instrumentVerified: false,
        },
      ),
    )
  }

  function handleDatasetSelected(datasetId: string) {
    commitCollection(
      selectResearchDataset(collectionRef.current, datasetId),
    )
  }

  function handleDatasetRemoved(datasetId: string) {
    commitCollection(
      removeResearchDataset(collectionRef.current, datasetId),
    )
    setCollectionError(null)
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

        {collectionError && (
          <div className="error-banner" role="alert">
            {collectionError}
          </div>
        )}

        {activeView === 'market-overview' ? (
          <CompactInstrumentSelector
            collection={collection}
            onSelect={handleDatasetSelected}
          />
        ) : (
          <DatasetSelector
            collection={collection}
            onSelect={handleDatasetSelected}
            onRemove={handleDatasetRemoved}
          />
        )}

        {session.dataset && activeView !== 'market-overview' && (
          <SessionIdentity dataset={session.dataset} />
        )}

        <WorkspaceContent
          view={activeView}
          session={session}
          datasets={collection.datasets}
          onDatasetImported={handleDatasetImported}
          onManualDataLoaded={handleManualDataLoaded}
          onProviderDataLoaded={handleProviderDataLoaded}
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
