export type ProspectScore = 'high' | 'medium' | 'low' | 'unanalyzed'

export interface Prospect {
  id: string
  created_at: string
  updated_at: string
  name: string
  role: string
  company: string
  sector: string
  offer: string
  linkedin_url?: string
  score: ProspectScore
  report?: SalesReport
}

export interface SalesReport {
  generated_at: string
  company_summary: string
  key_metrics: {
    employees?: string
    revenue?: string
    growth?: string
    market_position?: string
  }
  recent_news: Array<{
    title: string
    date: string
    impact: string
  }>
  meddic: {
    metrics: string
    economic_buyer: string
    decision_criteria: string
    decision_process: string
    identify_pain: string
    champion: string
  }
  spin: {
    situation: string[]
    problem: string[]
    implication: string[]
    need_payoff: string[]
  }
  talking_points: string[]
  risks: string[]
  score: ProspectScore
}

export interface CreateProspectInput {
  name: string
  role: string
  company: string
  sector: string
  offer: string
  linkedin_url?: string
}
