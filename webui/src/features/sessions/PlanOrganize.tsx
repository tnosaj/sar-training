import React, { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { useTranslation } from 'react-i18next'


// simple localStorage queue per-session
const qKey = (id:number) => `session:${id}:queue`
type QItem = { dog_id:number; exercise_id:number; planned_behavior_id?:number }

function loadQueue(sessionId:number): QItem[] {
  try { return JSON.parse(localStorage.getItem(qKey(sessionId)) || '[]') } catch { return [] }
}
function saveQueue(sessionId:number, items:QItem[]) {
  localStorage.setItem(qKey(sessionId), JSON.stringify(items))
}

export default function PlanOrganize({
  session, dogs, behaviors, exercises, onSaved,
}:{
  session:any
  dogs:any[]
  behaviors:any[]
  exercises:any[]
  onSaved: () => void
}) {
  const { t } = useTranslation()
  
  const [dogId, setDogId] = useState('')
  const [exerciseId, setExerciseId] = useState('')
  const [plannedBehaviorId, setPlannedBehaviorId] = useState('')

  const [queue, setQueue] = useState<QItem[]>(() => loadQueue(session.id))

  const dogName = (id:number) => dogs.find((d:any)=>d.id===id)?.name || `#${id}`
  const exerName = (id:number) => exercises.find((x:any)=>x.id===id)?.name || `#${id}`
  const behName = (id:number|undefined) => id ? (behaviors.find((b:any)=>b.id===id)?.name || `#${id}`) : '—'

  const canAdd = dogId && exerciseId

  const add = () => {
    if (!canAdd) return
    const item: QItem = {
      dog_id: Number(dogId),
      exercise_id: Number(exerciseId),
      planned_behavior_id: plannedBehaviorId ? Number(plannedBehaviorId) : undefined,
    }
    const next = [...queue, item]
    setQueue(next)
    saveQueue(session.id, next)
    setExerciseId(''); setPlannedBehaviorId('')
  }

  const removeAt = (idx:number) => {
    const next = queue.slice()
    next.splice(idx,1)
    setQueue(next); saveQueue(session.id, next)
  }

  const move = (idx:number, dir:-1|1) => {
    const j = idx + dir
    if (j < 0 || j >= queue.length) return
    const next = queue.slice()
    const tmp = next[idx]; next[idx] = next[j]; next[j] = tmp
    setQueue(next); saveQueue(session.id, next)
  }

  const clear = () => {
    if (!queue.length) return
    if (!confirm('Clear the current queue?')) return
    setQueue([]); saveQueue(session.id, [])
  }

  const save = () => {
    saveQueue(session.id, queue)
    // in a real app you may toast; for now minimal feedback:
    // eslint-disable-next-line no-alert
    alert('Saved')
    onSaved()
  }

  const summary = useMemo(() => queue.map(q =>
    `${dogName(q.dog_id)} • ${exerName(q.exercise_id)}${q.planned_behavior_id ? `  · Planned: ${behName(q.planned_behavior_id)}` : ''}`
  ), [queue, dogs, exercises, behaviors])

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">Plan — Session #{session.id}</div>

      <div className="grid md:grid-cols-3 gap-4">
        <Select label="Dog" value={dogId} onChange={e => setDogId(e.target.value)}>
          <option value="">Choose...</option>
          {dogs.map((d:any)=> <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <Select label="Exercise" value={exerciseId} onChange={e => setExerciseId(e.target.value)}>
          <option value="">Choose...</option>
          {exercises.map((x:any)=> <option key={x.id} value={x.id}>{x.name}</option>)}
        </Select>
        <Select label="Planned behavior (optional)" value={plannedBehaviorId} onChange={e => setPlannedBehaviorId(e.target.value)}>
          <option value="">—</option>
          {behaviors.map((b:any)=> <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={add} disabled={!canAdd}>Add to Queue</Button>
        <Button onClick={save} disabled={!queue.length}>Save</Button>
        <Button variant="danger" onClick={clear} disabled={!queue.length}>Clear</Button>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium">Upcoming order</div>
        {!queue.length && <div className="text-sm text-gray-500">No items yet. Add dogs from the list.</div>}
        {queue.map((q, idx) => (
          <div key={idx} className="border rounded-xl p-3 bg-white flex items-start justify-between">
            <div>
              <div className="font-medium">{idx+1}. {dogName(q.dog_id)} • {exerName(q.exercise_id)}</div>
              <div className="text-xs text-gray-600">Planned: {behName(q.planned_behavior_id)}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => move(idx,-1)}>↑</Button>
              <Button variant="secondary" onClick={() => move(idx, 1)}>↓</Button>
              <Button variant="danger" onClick={() => removeAt(idx)}>Remove</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
