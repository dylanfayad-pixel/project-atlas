import type { ResearchDataset } from './researchSession'

export type ResearchCollection = {
  datasets: ResearchDataset[]
  activeDatasetId: string | null
}

export const MAX_RESEARCH_DATASETS = 20

// Reject empty or malformed collection identifiers.
function validateDatasetId(id: string): void {
  if (
    typeof id !== 'string' ||
    id.length === 0 ||
    id.trim() !== id ||
    id.length > 128
  ) {
    throw new Error('Invalid dataset ID')
  }
}

// Create an empty collection without synthetic observations.
export function createResearchCollection(): ResearchCollection {
  return {
    datasets: [],
    activeDatasetId: null,
  }
}

// Return the active dataset without mutating collection state.
export function getActiveDataset(
  collection: ResearchCollection,
): ResearchDataset | null {
  return collection.datasets.find(
    (dataset) => dataset.id === collection.activeDatasetId,
  ) ?? null
}

// Preserve dataset identity and reject duplicate IDs.
export function addResearchDataset(
  collection: ResearchCollection,
  dataset: ResearchDataset,
): ResearchCollection {
  validateDatasetId(dataset.id)

  if (collection.datasets.some((item) => item.id === dataset.id)) {
    throw new Error('Dataset ID already exists')
  }

  if (collection.datasets.length >= MAX_RESEARCH_DATASETS) {
    throw new Error('Research collection capacity exceeded')
  }

  return {
    datasets: [...collection.datasets, dataset],
    activeDatasetId: dataset.id,
  }
}

// Selection changes only the active dataset reference.
export function selectResearchDataset(
  collection: ResearchCollection,
  datasetId: string,
): ResearchCollection {
  validateDatasetId(datasetId)

  if (!collection.datasets.some((item) => item.id === datasetId)) {
    throw new Error('Cannot select an unknown dataset')
  }

  return {
    ...collection,
    activeDatasetId: datasetId,
  }
}

// Replace a dataset without modifying unrelated instruments.
export function replaceResearchDataset(
  collection: ResearchCollection,
  datasetId: string,
  replacement: ResearchDataset,
): ResearchCollection {
  validateDatasetId(datasetId)
  validateDatasetId(replacement.id)

  if (!collection.datasets.some((item) => item.id === datasetId)) {
    throw new Error('Cannot replace an unknown dataset')
  }

  if (
    replacement.id !== datasetId &&
    collection.datasets.some((item) => item.id === replacement.id)
  ) {
    throw new Error('Replacement dataset ID already exists')
  }

  return {
    datasets: collection.datasets.map((item) =>
      item.id === datasetId ? replacement : item
    ),
    activeDatasetId:
      collection.activeDatasetId === datasetId
        ? replacement.id
        : collection.activeDatasetId,
  }
}

// Remove a dataset and select another valid dataset if needed.
export function removeResearchDataset(
  collection: ResearchCollection,
  datasetId: string,
): ResearchCollection {
  const datasets = collection.datasets.filter(
    (item) => item.id !== datasetId,
  )

  if (datasets.length === collection.datasets.length) {
    return collection
  }

  const activeDatasetId =
    collection.activeDatasetId === datasetId
      ? datasets[0]?.id ?? null
      : collection.activeDatasetId

  return {
    datasets,
    activeDatasetId,
  }
}
