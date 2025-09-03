import { apiFetch } from '../lib/api'

export type DogRound = {
  id?: number
  session_id: number
  dog_id: number
  exercise_id: number
  planned_behavior_id: number
  exhibited_behavior_id?: number
  exhibited_free_text?: string
  outcome: 'success'|'partial'|'fail'
  score?: number
  notes?: string
  round_number?: number
  started_at?: string
  ended_at?: string
}

export type Suggestion = {
  behavior_id: number
  reason: 'stale' | 'low_score'
  lastSeen?: string
  avgScore?: number
}

// Look back at the dog's rounds and produce simple suggestions:
// - 'stale': behavior not seen in >= 21 days (or never)
// - 'low_score': avg score < 7 in last 5 rounds for that behavior
export async function recommendForDog(dogId: number): Promise<Suggestion[]> {
  const rounds: DogRound[] = await apiFetch(`/dogs/${dogId}/rounds`)
  const now = new Date()
  const byBehavior = new Map<number, DogRound[]>()
  for (const r of rounds) {
    const key = r.planned_behavior_id
    if (!byBehavior.has(key)) byBehavior.set(key, [])
    byBehavior.get(key)!.push(r)
  }
  const suggestions: Suggestion[] = []
  for (const [behavior_id, arr] of byBehavior.entries()) {
    // last seen
    const dates = arr
      .map(r => r.started_at || r.ended_at)
      .filter(Boolean)
      .map(s => new Date(s as string).getTime())
    const lastSeenMs = dates.length ? Math.max(...dates) : undefined
    const daysSince = lastSeenMs ? (now.getTime() - lastSeenMs) / (1000*60*60*24) : Infinity
    if (daysSince >= 21) {
      suggestions.push({ behavior_id, reason: 'stale', lastSeen: lastSeenMs ? new Date(lastSeenMs).toISOString() : undefined })
      continue
    }
    // average of last 5 scores
    const scores = arr
      .map(r => r.score)
      .filter((s): s is number => typeof s === 'number')
      .slice(-5)
    if (scores.length) {
      const avg = scores.reduce((a,b)=>a+b,0) / scores.length
      if (avg < 7) suggestions.push({ behavior_id, reason: 'low_score', avgScore: Math.round(avg*10)/10 })
    }
  }
  // Sort: stale first (older lastSeen first), then low_score (lower avg first)
  return suggestions.sort((a, b) => {
    if (a.reason !== b.reason) return a.reason === 'stale' ? -1 : 1
    if (a.reason === 'stale') {
      const aT = a.lastSeen ? new Date(a.lastSeen).getTime() : 0
      const bT = b.lastSeen ? new Date(b.lastSeen).getTime() : 0
      return aT - bT
    } else {
      const aS = a.avgScore ?? 10
      const bS = b.avgScore ?? 10
      return aS - bS
    }
  })
}
