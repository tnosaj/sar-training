import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { useList } from '../../hooks/useList'
import { useTranslation } from 'react-i18next'



type PlanItem = { dog_id: number; exercise_id: number; planned_behavior_id?: number }
export const PLAN_KEY = (id:number) => `sess:${id}:plan`

export default function PlanOrganize({ session, dogs, behaviors, exercises }:{
  session: any
  dogs: any[]
  behaviors: any[]
  exercises: any[]
}) {
  const { t } = useTranslation()

  const sessionDogs = useList<any>(() => apiFetch(`/sessions/${session.id}/dogs`), [session.id])

  const [queue, setQueue] = useState<PlanItem[]>([])
  const [dogId, setDogId] = useState('')
  const [exerciseId, setExerciseId] = useState('')
  const [behaviorId, setBehaviorId] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem(PLAN_KEY(session.id))
    if (raw) { try { setQueue(JSON.parse(raw)) } catch { setQueue([]) } }
    else setQueue([])
  }, [session.id])

  const addItem = () => {
    if (!dogId || !exerciseId) return
    const item: PlanItem = { dog_id: Number(dogId), exercise_id: Number(exerciseId) }
    if (behaviorId) item.planned_behavior_id = Number(behaviorId)
    setQueue(q => [...q, item])
    setDogId(''); setExerciseId(''); setBehaviorId('')
  }

  const removeAt = (idx:number) => setQueue(q => q.filter((_, i) => i !== idx))
  const save = () => { localStorage.setItem(PLAN_KEY(session.id), JSON.stringify(queue)); alert('Saved') }

  const dogsSource = sessionDogs.items.length ? sessionDogs.items : dogs

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-3 gap-3">
        <Select label="Dog" value={dogId} onChange={e => setDogId(e.target.value)}>
          <option value="">Choose…</option>
          {dogsSource.map((d:any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <Select label="Exercise" value={exerciseId} onChange={e => setExerciseId(e.target.value)}>
          <option value="">Choose…</option>
          {exercises.map((x:any) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </Select>
        <Select label="Planned behavior (optional)" value={behaviorId} onChange={e => setBehaviorId(e.target.value)}>
          <option value="">—</option>
          {behaviors.map((b:any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={addItem}>Add to Queue</Button>
        <Button variant="secondary" onClick={save}>Save</Button>
      </div>

      <div className="mt-2">
        <div className="text-sm text-gray-600 mb-2">Upcoming order</div>
        <ol className="space-y-2">
          {queue.map((it, idx) => (
            <li key={idx} className="flex items-center justify-between bg-white border rounded-xl px-3 py-2">
              <div>
                <div className="font-medium">
                  {(dogsSource.find((d:any)=>d.id===it.dog_id)?.name) || it.dog_id} • {(exercises.find((x:any)=>x.id===it.exercise_id)?.name) || it.exercise_id}
                </div>
                {!!it.planned_behavior_id && (
                  <div className="text-xs text-gray-600">
                    Planned: {(behaviors.find((b:any)=>b.id===it.planned_behavior_id)?.name) || it.planned_behavior_id}
                  </div>
                )}
              </div>
              <Button variant="danger" onClick={() => removeAt(idx)}>Remove</Button>
            </li>
          ))}
          {!queue.length && <li className="text-sm text-gray-500">Queue is empty.</li>}
        </ol>
      </div>
    </div>
  )
}