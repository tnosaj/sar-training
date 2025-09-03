import { useEffect, useMemo, useState } from 'react'

export type PlanItem = {
  dog_id: number
  planned_behavior_id?: number
  exercise_id?: number
}

export type Template = {
  name: string
  items: Array<Pick<PlanItem, 'planned_behavior_id'|'exercise_id'>>
}

const keyFor = (sessionId: number) => `plan:session:${sessionId}`
const templatesKey = 'plan:templates'

const readJSON = <T,>(k: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(k)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

const writeJSON = (k: string, v: any) => {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
}

export function usePlan(sessionId: number) {
  const [queue, setQueue] = useState<PlanItem[]>(() => readJSON<PlanItem[]>(keyFor(sessionId), []))

  useEffect(() => {
    writeJSON(keyFor(sessionId), queue)
  }, [sessionId, queue])

  const api = useMemo(() => ({
    add(dog_id: number, planned_behavior_id?: number, exercise_id?: number) {
      setQueue(q => [...q, { dog_id, planned_behavior_id, exercise_id }])
    },
    remove(idx: number) {
      setQueue(q => q.filter((_, i) => i !== idx))
    },
    moveUp(idx: number) {
      setQueue(q => {
        if (idx <= 0 || idx >= q.length) return q
        const copy = q.slice()
        const t = copy[idx-1]; copy[idx-1] = copy[idx]; copy[idx] = t
        return copy
      })
    },
    moveDown(idx: number) {
      setQueue(q => {
        if (idx < 0 || idx >= q.length-1) return q
        const copy = q.slice()
        const t = copy[idx+1]; copy[idx+1] = copy[idx]; copy[idx] = t
        return copy
      })
    },
    update(idx: number, patch: Partial<PlanItem>) {
      setQueue(q => q.map((it, i) => i === idx ? { ...it, ...patch } : it))
    },
    clear() { setQueue([]) },
    popFront() {
      let first: PlanItem | undefined
      setQueue(q => {
        first = q[0]
        return q.slice(1)
      })
      return first
    },
  }), [sessionId])

  // Templates are global
  const templates = readJSON<Template[]>(templatesKey, [])
  const saveTemplate = (name: string) => {
    const items = queue.map(({ planned_behavior_id, exercise_id }) => ({ planned_behavior_id, exercise_id }))
    const next = templates.filter(t => t.name !== name).concat([{ name, items }])
    writeJSON(templatesKey, next)
  }
  const applyTemplate = (name: string) => {
    const t = templates.find(x => x.name === name)
    if (!t) return
    setQueue(q => q.concat(t.items.map(it => ({ dog_id: q.length ? q[q.length-1].dog_id : 0, ...it }))))
  }

  return { queue, setQueue, ...api, templates, saveTemplate, applyTemplate }
}
