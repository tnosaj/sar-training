import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import ScoreSlider from '../../components/ui/ScoreSlider'
import { apiFetch } from '../../lib/api'
import { useTranslation } from 'react-i18next'

type QItem = { dog_id:number; exercise_id:number; planned_behavior_id?:number }
const qKey = (id:number) => `session:${id}:queue`

function loadQueue(sessionId:number): QItem[] {
  try { return JSON.parse(localStorage.getItem(qKey(sessionId)) || '[]') } catch { return [] }
}
function saveQueue(sessionId:number, items:QItem[]) {
  localStorage.setItem(qKey(sessionId), JSON.stringify(items))
}

export default function JudgePanel({
  session, dogs, behaviors, exercises, queueTick, onLogged,
}:{
  session:any
  dogs:any
  behaviors:any[]
  exercises:any[]
  queueTick:number
  onLogged: () => void
}) {
  const { t } = useTranslation()
  
  const [queue, setQueue] = useState<QItem[]>(() => loadQueue(session.id))
  const [outcome, setOutcome] = useState<'success'|'partial'|'fail'>('success')
  const [exhibitedBehaviorId, setExhibitedBehaviorId] = useState('')
  const [exhibitedFreeText, setExhibitedFreeText] = useState('')
  const [score, setScore] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('')

  // reload when parent bumps or session changes
  useEffect(() => { setQueue(loadQueue(session.id)) }, [session.id, queueTick])

  const next = queue[0]
  const exerName = (id:number) => exercises.find((x:any)=>x.id===id)?.name || `#${id}`
  const behName = (id:number|undefined) => id ? (behaviors.find((b:any)=>b.id===id)?.name || `#${id}`) : '—'
  const dogName = (id:number|undefined) => id ? (dogs.find((b:any)=>b.id===id)?.name || `#${id}`) : '—'

  const canLog = !!next

  async function logResult() {
    if (!next) return
    const payload:any = {
      dog_id: next.dog_id,
      exercise_id: next.exercise_id,
      planned_behavior_id: next.planned_behavior_id || undefined,
      outcome,
      score: score ? Number(score) : undefined,
      notes: notes || undefined,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      exhibited_behavior_id: exhibitedBehaviorId ? Number(exhibitedBehaviorId) : undefined,
      exhibited_free_text: exhibitedFreeText || undefined,
    }
    await apiFetch(`/sessions/${session.id}/rounds`, { method: 'POST', body: JSON.stringify(payload) })

    // pop the item we just judged
    const rest = queue.slice(1)
    setQueue(rest); saveQueue(session.id, rest)

    // reset form bits
    setOutcome('success'); setExhibitedBehaviorId(''); setExhibitedFreeText(''); setScore(5); setNotes('')

    // let parent refresh any tables
    onLogged()
  }

  const plannedSummary = useMemo(() => {
    if (!next) return 'No planned items. Save a plan in the section above, then come back here.'
    return `${exerName(next.exercise_id)} (planned: ${behName(next.planned_behavior_id)})`
  }, [next, exercises, behaviors])

    const plannedDog = useMemo(() => {
    if (!next) return 'No planned items. Save a plan in the section above, then come back here.'
    return `${dogName(next.dog_id)}`
  }, [next, dogs])


  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">Judge — Session #{session.id}</div>

      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-700">Queue length:</div>
        <div className="text-sm font-medium">{queue.length}</div>
        <Button variant="secondary" onClick={() => setQueue(loadQueue(session.id))}>Refresh</Button>
      </div>

      <div className="border rounded-xl p-3 bg-white">
        <div className="font-medium mb-2">Current dog: {plannedDog}</div>
        <div className="text-sm text-gray-700 mb-3">{plannedSummary}</div>

        {!next ? (
          <div className="text-sm text-gray-500">No items planned.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            <Select label="Outcome" value={outcome} onChange={e => setOutcome(e.target.value as any)}>
              <option value="success">success</option>
              <option value="partial">partial</option>
              <option value="fail">fail</option>
            </Select>
            <ScoreSlider label="Score (0–10, optional)" value={score} min={0} max={10} step={1} initialValue={5} onChange={setScore} />
            <Select label="Exhibited behavior (optional)" value={exhibitedBehaviorId} onChange={e => setExhibitedBehaviorId(e.target.value)}>
              <option value="">—</option>
              {behaviors.map((b:any)=> <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
            <Input label="Exhibited (free text, optional)" value={exhibitedFreeText} onChange={e => setExhibitedFreeText(e.target.value)} placeholder="Offered down" />
            <Textarea label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observations…" />
          </div>
        )}

        <div className="mt-3">
          <Button onClick={logResult} disabled={!canLog}>Log result &amp; advance</Button>
        </div>
      </div>
    </div>
  )
}
