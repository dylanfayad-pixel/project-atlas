import type { MarketAnalytics } from './marketAnalytics'
import type { MarketRegime } from './marketRegime'

export type ResearchInsight = {
  id: string
  title: string
  description: string
  category: 'trend' | 'volatility' | 'momentum' | 'data'
}

// Generate explanations from measured historical data.
// No model calls, price forecasts, or trading recommendations.
export function generateResearchInsights(
  analysis: MarketAnalytics,
  regime: MarketRegime,
): ResearchInsight[] {
  const insights: ResearchInsight[] = []

  if (regime.trend === 'insufficient-data') {
    insights.push({
      id: 'trend-insufficient',
      title: 'Trend Classification Unavailable',
      description:
        'At least 50 daily observations are required to ' +
        'classify the historical price trend.',
      category: 'data',
    })
  } else {
    const titles = {
      bullish: 'Bullish Historical Trend',
      bearish: 'Bearish Historical Trend',
      sideways: 'Mixed Historical Trend',
    }

    insights.push({
      id: `trend-${regime.trend}`,
      title: titles[regime.trend],
      description:
        regime.reasons[0] ??
        'Historical moving-average alignment was evaluated.',
      category: 'trend',
    })
  }

  if (regime.volatility === 'high') {
    insights.push({
      id: 'volatility-high',
      title: 'Elevated Historical Volatility',
      description:
        `Annualized volatility is ` +
        `${analysis.annualizedVolatilityPct?.toFixed(2)}%, ` +
        'meeting the configured 30% threshold.',
      category: 'volatility',
    })
  } else if (regime.volatility === 'normal') {
    insights.push({
      id: 'volatility-normal',
      title: 'Historical Volatility Below Threshold',
      description:
        `Annualized volatility is ` +
        `${analysis.annualizedVolatilityPct?.toFixed(2)}%, ` +
        'below the configured 30% threshold.',
      category: 'volatility',
    })
  } else {
    insights.push({
      id: 'volatility-insufficient',
      title: 'Volatility Classification Unavailable',
      description:
        'Insufficient daily observations for a ' +
        'regime-level volatility classification.',
      category: 'data',
    })
  }

  if (analysis.rsi14 === null) {
    insights.push({
      id: 'momentum-insufficient',
      title: 'Momentum Indicator Unavailable',
      description:
        'RSI 14 requires at least 15 closing-price observations.',
      category: 'data',
    })
  } else {
    let description: string
    let title: string

    if (analysis.rsi14 >= 70) {
      title = 'Elevated RSI Momentum'
      description =
        `RSI 14 is ${analysis.rsi14.toFixed(2)}, ` +
        'at or above the conventional 70 threshold.'
    } else if (analysis.rsi14 <= 30) {
      title = 'Depressed RSI Momentum'
      description =
        `RSI 14 is ${analysis.rsi14.toFixed(2)}, ` +
        'at or below the conventional 30 threshold.'
    } else {
      title = 'RSI Within Conventional Range'
      description =
        `RSI 14 is ${analysis.rsi14.toFixed(2)}, ` +
        'between the conventional 30 and 70 thresholds.'
    }

    insights.push({
      id: 'momentum-rsi',
      title,
      description,
      category: 'momentum',
    })
  }

  return insights
}
