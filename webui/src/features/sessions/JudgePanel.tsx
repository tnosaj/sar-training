import React, { useEffect, useState } from 'react'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { apiFetch } from '../../lib/api'
import { PLAN_KEY } from './PlanOrganize'
import { useTranslation } from 'react-i18next'


type Outcome = 'success'|'partial'|'fail'
type PlanItem = { dog_id:number; exercise_id:number; planned_behavior_id?:number }

export default function JudgePanel({ session, dogs, behaviors, exercises }:{
  session: any
  dogs: any[]
  behaviors: any[]
  exercises: any[]
}) {
  const { t } = useTranslation()
  
  const [plan, setPlan] = useState<PlanItem[]>([])
  const [idx, setIdx] = useState(0)

  const [outcome, setOutcome] = useState<Outcome>('success')
  const [score, setScore] = useState('')
  const [notes, setNotes] = useState('')
  const [exhibitedBehaviorId, setExhibitedBehaviorId] = useState('')
  const [exhibitedFreeText, setExhibitedFreeText] = useState('')
  const [startedAt, setStartedAt] = useState('')
  const [endedAt, setEndedAt] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem(PLAN_KEY(session.id))
    let q: PlanItem[] = []
    try { q = raw ? JSON.parse(raw) : [] } catch { q = [] }
    setPlan(Array.isArray(q) ? q : [])
    setIdx(0)
  }, [session.id])

  const current = plan[idx]
  const dogName      = (id?:number) => dogs.find((d:any)=>d.id===id)?.name || id
  const exerciseName = (id?:number) => exercises.find((x:any)=>x.id===id)?.name || id
  const behaviorName = (id?:number) => behaviors.find((b:any)=>b.id===id)?.name || id

  const submit = async () => {
    if (!current) return
    const payload:any = {
      dog_id: current.dog_id,
      exercise_id: current.exercise_id,
      planned_behavior_id: current.planned_behavior_id ?? (exhibitedBehaviorId ? Number(exhibitedBehaviorId) : undefined) ?? 0,
      outcome,
      notes: notes || undefined,
      score: score ? Number(score) : undefined,
      started_at: startedAt || undefined,
      ended_at: endedAt || undefined,
      exhibited_behavior_id: exhibitedBehaviorId ? Number(exhibitedBehaviorId) : undefined,
      exhibited_free_text: exhibitedFreeText || undefined,
    }
    if (!payload.planned_behavior_id) {
      alert('Planned behavior is required (from plan or choose one).')
      return
    }

    await apiFetch(`/sessions/${session.id}/rounds`, { method: 'POST', body: JSON.stringify(payload) })
    setOutcome('success'); setScore(''); setNotes(''); setExhibitedBehaviorId(''); setExhibitedFreeText(''); setStartedAt(''); setEndedAt('')
    if (idx < plan.length - 1) setIdx(i => i + 1)
    else alert('Finished planned queue!')
  }

  const skip = () => { if (idx < plan.length - 1) setIdx(i => i + 1) }

  return (
    <div className="space-y-4">
      {!current && <p className="text-sm text-gray-600">No planned items. Save a plan in the section above, then come back here.</p>}

      {current && (
        <>
          <div className="bg-white border rounded-2xl p-4">
            <div className="text-sm text-gray-600">Now judging</div>
            <div className="text-xl font-semibold">
              {dogName(current.dog_id)} • {exerciseName(current.exercise_id)}
            </div>
            {current.planned_behavior_id && (
              <div className="text-sm text-gray-600">Planned behavior: {behaviorName(current.planned_behavior_id)}</div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <Select label="Outcome" value={outcome} onChange={e => setOutcome(e.target.value as Outcome)}>
              <option value="success">success</option>
              <option value="partial">partial</option>
              <option value="fail">fail</option>
            </Select>
            <Input label="Score (0-10, optional)" type="number" min={0} max={10} value={score} onChange={e => setScore(e.target.value)} />
            <Input label="Started at (RFC3339, optional)" value={startedAt} onChange={e => setStartedAt(e.target.value)} placeholder="2025-09-04T18:05:00Z" />
            <Input label="Ended at (RFC3339, optional)" value={endedAt} onChange={e => setEndedAt(e.target.value)} placeholder="2025-09-04T18:07:00Z" />
            <Select label="Exhibited Behavior (optional)" value={exhibitedBehaviorId} onChange={e => setExhibitedBehaviorId(e.target.value)}>
              <option value="">(none / free text)</option>
              {behaviors.map((b:any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
            <Input label="Exhibited Free Text (optional)" value={exhibitedFreeText} onChange={e => setExhibitedFreeText(e.target.value)} placeholder="Offered down" />
          </div>
          <Textarea label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observations…" />

          <div className="flex gap-2">
            <Button variant="secondary" onClick={skip}>Skip</Button>
            <Button onClick={submit}>Log & Next</Button>
          </div>

          <div className="text-xs text-gray-500">Item {idx+1} of {plan.length}</div>
        </>
      )}
    </div>
  )
}
