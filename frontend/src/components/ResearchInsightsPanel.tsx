import { useMemo } from 'react'
import { analyzeMarket } from '../lib/marketAnalytics'
import { classifyMarketRegime } from '../lib/marketRegime'
import { generateResearchInsights } from '../lib/researchInsights'
import type { ResearchDataset } from '../lib/researchSession'

type Props = {
  dataset: ResearchDataset
}

// Explain measured historical conditions without generating
// price predictions or investment recommendations.
export function ResearchInsightsPanel({ dataset }: Props) {
  const insights = useMemo(() => {
    const analysis = analyzeMarket(dataset.bars)
    const regime = classifyMarketRegime(analysis)

    return generateResearchInsights(analysis, regime)
  }, [dataset.bars])

  return (
    <section className="panel" aria-label="Research Insights">
      <div className="panel-heading">
        <div>
          <h2>Automated Research Insights</h2>
          <p>
            Evidence-based explanations generated from
            historical market observations.
          </p>
        </div>
        <span className="panel-tag">RULES-BASED</span>
      </div>

      <div className="detail-grid">
        {insights.map((insight) => (
          <article className="detail-card" key={insight.id}>
            <span>{insight.category.toUpperCase()}</span>
            <strong>{insight.title}</strong>
            <p>{insight.description}</p>
          </article>
        ))}
      </div>

      <p className="workspace-description">
        These insights summarize historical measurements
        using predefined thresholds. They are not forecasts,
        trading signals, or investment recommendations.
      </p>
    </section>
  )
}
