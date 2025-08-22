import React, { useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useList } from '../../hooks/useList'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'

export default function SessionCard({ s, dogs, behaviors, exercises }:{
  s: any
  dogs: any[]
  behaviors: any[]
  exercises: any[]
}) {
  const sessionDogs = useList<any>(() => apiFetch(`/sessions/${s.id}/dogs`), [s.id])
  const rounds = useList<any>(() => apiFetch(`/sessions/${s.id}/rounds`), [s.id])

  const [addDogId, setAddDogId] = useState('')

  const [dogId, setDogId] = useState('')
  const [exerciseId, setExerciseId] = useState('')
  const [plannedBehaviorId, setPlannedBehaviorId] = useState('')
  const [exhibitedBehaviorId, setExhibitedBehaviorId] = useState('')
  const [outcome, setOutcome] = useState('success')
  const [score, setScore] = useState('')
  const [notes, setNotes] = useState('')
  const [startedAt, setStartedAt] = useState('')
  const [endedAt, setEndedAt] = useState('')
  const [exhibitedFreeText, setExhibitedFreeText] = useState('')

  const addDog = async () => {
    if (!addDogId) return
    await apiFetch(`/sessions/${s.id}/dogs`, { method: 'POST', body: JSON.stringify({ dog_id: Number(addDogId) }) })
    setAddDogId(''); sessionDogs.reload()
  }

  const createRound = async () => {
    if (!dogId || !exerciseId || !plannedBehaviorId) return alert('dog, exercise, planned behavior required')
    const payload: any = {
      dog_id: Number(dogId),
      exercise_id: Number(exerciseId),
      planned_behavior_id: Number(plannedBehaviorId),
      outcome,
      notes: notes || undefined,
      score: score ? Number(score) : undefined,
      started_at: startedAt || undefined,
      ended_at: endedAt || undefined,
      exhibited_behavior_id: exhibitedBehaviorId ? Number(exhibitedBehaviorId) : undefined,
      exhibited_free_text: exhibitedFreeText || undefined,
    }
    await apiFetch(`/sessions/${s.id}/rounds`, { method: 'POST', body: JSON.stringify(payload) })
    setExerciseId(''); setPlannedBehaviorId(''); setExhibitedBehaviorId(''); setOutcome('success'); setScore(''); setNotes(''); setStartedAt(''); setEndedAt(''); setExhibitedFreeText('')
    rounds.reload()
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">Session #{s.id}</div>
          <div className="text-sm text-gray-600">Started: {s.started_at}</div>
          {s.location && <div className="text-sm text-gray-600">📍 {s.location}</div>}
        </div>
      </div>

      <div className="mt-4 grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <div className="border rounded-2xl p-3 bg-white">
            <div className="font-medium mb-2">Dogs in session</div>
            <ul className="text-sm list-disc ml-4 mb-3">
              {sessionDogs.items.map((d:any) => <li key={d.id}>{d.name}</li>)}
              {!sessionDogs.items.length && <li className="text-gray-500">None yet</li>}
            </ul>
            <div className="flex gap-2">
              <select className="border rounded-xl px-3 py-2 flex-1 bg-white" value={addDogId} onChange={e => setAddDogId(e.target.value)}>
                <option value="">Add dog…</option>
                {dogs.map((d:any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <Button onClick={addDog}>Add</Button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="border rounded-2xl p-3 bg-white">
            <div className="font-medium mb-2">Log a Round</div>
            <div className="grid md:grid-cols-2 gap-3">
              <Select label="Dog" value={dogId} onChange={e => setDogId(e.target.value)}>
                <option value="">-- choose dog --</option>
                {sessionDogs.items.map((d:any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
              <Select label="Exercise" value={exerciseId} onChange={e => setExerciseId(e.target.value)}>
                <option value="">-- choose exercise --</option>
                {exercises.map((x:any) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
              <Select label="Planned Behavior" value={plannedBehaviorId} onChange={e => setPlannedBehaviorId(e.target.value)}>
                <option value="">-- choose behavior --</option>
                {behaviors.map((b:any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
              <Select label="Exhibited Behavior (optional)" value={exhibitedBehaviorId} onChange={e => setExhibitedBehaviorId(e.target.value)}>
                <option value="">(none / free text)</option>
                {behaviors.map((b:any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
              <Select label="Outcome" value={outcome} onChange={e => setOutcome(e.target.value)}>
                <option value="success">success</option>
                <option value="partial">partial</option>
                <option value="fail">fail</option>
              </Select>
              <Input label="Score (0-10, optional)" type="number" min={0} max={10} value={score} onChange={e => setScore(e.target.value)} />
              <Input label="Started at (RFC3339, optional)" value={startedAt} onChange={e => setStartedAt(e.target.value)} placeholder="2025-08-20T18:05:00Z" />
              <Input label="Ended at (RFC3339, optional)" value={endedAt} onChange={e => setEndedAt(e.target.value)} placeholder="2025-08-20T18:07:00Z" />
            </div>
            <Textarea label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observations…" />
            <Input label="Exhibited Free Text (optional)" value={exhibitedFreeText} onChange={e => setExhibitedFreeText(e.target.value)} placeholder="Offered down" />
            <div className="flex gap-2">
              <Button onClick={() => { const now = new Date().toISOString(); setStartedAt(now); setEndedAt(now) }}>Now</Button>
              <Button onClick={createRound}>Log Round</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="font-medium mb-2">Rounds</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white rounded-2xl border">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 border-b">#</th>
                <th className="text-left p-2 border-b">Dog</th>
                <th className="text-left p-2 border-b">Exercise</th>
                <th className="text-left p-2 border-b">Planned</th>
                <th className="text-left p-2 border-b">Exhibited</th>
                <th className="text-left p-2 border-b">Outcome</th>
                <th className="text-left p-2 border-b">Score</th>
                <th className="text-left p-2 border-b">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rounds.items.map((r:any, idx:number) => (
                <tr key={r.id || idx} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border-b">{r.round_number}</td>
                  <td className="p-2 border-b">{(sessionDogs.items.find((d:any) => d.id === r.dog_id)?.name) || r.dog_id}</td>
                  <td className="p-2 border-b">{(exercises.find((x:any) => x.id === r.exercise_id)?.name) || r.exercise_id}</td>
                  <td className="p-2 border-b">{(behaviors.find((b:any) => b.id === r.planned_behavior_id)?.name) || r.planned_behavior_id}</td>
                  <td className="p-2 border-b">{r.exhibited_behavior_id ? (behaviors.find((b:any) => b.id === r.exhibited_behavior_id)?.name || r.exhibited_behavior_id) : (r.exhibited_free_text || '—')}</td>
                  <td className="p-2 border-b">{r.outcome}</td>
                  <td className="p-2 border-b">{r.score ?? ''}</td>
                  <td className="p-2 border-b">{r.notes ?? ''}</td>
                </tr>
              ))}
              {!rounds.items.length && (
                <tr><td className="p-3 text-center text-gray-500" colSpan={8}>No rounds yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
