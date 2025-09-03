import React, { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Section } from '../../components/ui/Section'
import { usePlan } from './usePlanStore'
import { apiFetch } from '../../lib/api'

export default function JudgePanel({ sessionId, dogs, behaviors, exercises }:{ sessionId:number, dogs:any[], behaviors:any[], exercises:any[] }) {
  const plan = usePlan(sessionId)
  const [outcome, setOutcome] = useState<'success'|'partial'|'fail'>('success')
  const [score, setScore] = useState<number|''>('' as any)
  const [notes, setNotes] = useState('')
  const [exhibitedBehaviorId, setExhibitedBehaviorId] = useState<number|''>('' as any)
  const [exhibitedFreeText, setExhibitedFreeText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const current = plan.queue[0]

  const canSubmit = !!(current && current.dog_id && current.planned_behavior_id && current.exercise_id)

  async function submitNow() {
    if (!current) return
    if (!canSubmit) return alert('Please choose dog, planned behavior and exercise first.')
    setSubmitting(true)
    try {
      await apiFetch(`/sessions/${sessionId}/rounds`, {
        method: 'POST',
        body: JSON.stringify({
          dog_id: current.dog_id,
          exercise_id: current.exercise_id,
          planned_behavior_id: current.planned_behavior_id,
          exhibited_behavior_id: exhibitedBehaviorId || undefined,
          exhibited_free_text: exhibitedFreeText || undefined,
          notes: notes || undefined,
          outcome,
          score: score === '' ? undefined : Number(score),
        })
      })
      plan.popFront()
      setOutcome('success'); setScore('' as any); setNotes(''); setExhibitedBehaviorId('' as any); setExhibitedFreeText('')
    } catch (e:any) {
      alert(e.message || String(e))
    } finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-4">
      <Section title="Current Dog">
        {current ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <Select label="Dog" value={String(current.dog_id||'')} onChange={e => plan.update(0, { dog_id: Number(e.target.value) })}>
                <option value="">-- choose dog --</option>
                {dogs.map((d:any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
              <Select label="Exercise" value={String(current.exercise_id||'')} onChange={e => plan.update(0, { exercise_id: e.target.value ? Number(e.target.value) : undefined })}>
                <option value="">-- choose exercise --</option>
                {exercises.map((x:any) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
              <Select label="Planned Behavior" value={String(current.planned_behavior_id||'')} onChange={e => plan.update(0, { planned_behavior_id: e.target.value ? Number(e.target.value) : undefined })}>
                <option value="">-- choose behavior --</option>
                {behaviors.map((b:any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <div className="text-sm text-gray-700 mb-1">Outcome</div>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant={outcome==='success'?'primary':'secondary'} onClick={()=>setOutcome('success')}>Success</Button>
                  <Button variant={outcome==='partial'?'primary':'secondary'} onClick={()=>setOutcome('partial')}>Partial</Button>
                  <Button variant={outcome==='fail'?'primary':'secondary'} onClick={()=>setOutcome('fail')}>Fail</Button>
                </div>
              </div>
              <div>
                <Input label="Score (0-10 optional)" type="number" min={0} max={10} value={String(score)} onChange={e => setScore(e.target.value===''?'':Number(e.target.value))} />
              </div>
              <Textarea label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observations…" />
              <Select label="Exhibited Behavior (optional)" value={String(exhibitedBehaviorId||'')} onChange={e => setExhibitedBehaviorId(e.target.value ? Number(e.target.value) : ('' as any))}>
                <option value="">(none / free text)</option>
                {behaviors.map((b:any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
              <Input label="Exhibited Free Text (optional)" value={exhibitedFreeText} onChange={e => setExhibitedFreeText(e.target.value)} placeholder="Offered down" />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => plan.popFront()} disabled={!current}>Skip</Button>
              <Button onClick={submitNow} disabled={!canSubmit || submitting}>{submitting ? 'Submitting…' : 'Submit & Next'}</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Queue is empty. Add items on the Organize tab.</p>
        )}
      </Section>
    </div>
  )
}
