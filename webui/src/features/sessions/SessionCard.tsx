import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useList } from '../../hooks/useList'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { SortableItem, SortableList } from '../../components/dnd/Sortable'
import { loadQueue, saveQueue, loadTemplates, saveTemplate, type QueueItem, uid } from '../../lib/trainingQueue'
import { useTranslation } from 'react-i18next'

export default function SessionCard({ s, dogs, behaviors, exercises }:{
  s: any
  dogs: any[]
  behaviors: any[]
  exercises: any[]
}) {
  const { t } = useTranslation()
  const sessionDogs = useList<any>(() => apiFetch(`/sessions/${s.id}/dogs`), [s.id])
  const rounds = useList<any>(() => apiFetch(`/sessions/${s.id}/rounds`), [s.id])

  // --- Organize state -------------------------------------------------------
  const [mode, setMode] = useState<'organize' | 'judge'>('organize')
  const [search, setSearch] = useState('')
  const [queue, setQueue] = useState<QueueItem[]>(() => loadQueue(s.id))
  const [templates, setTemplates] = useState<Record<string, QueueItem[]>>(() => loadTemplates())
  const [tplName, setTplName] = useState('')

  useEffect(() => { setQueue(loadQueue(s.id)) }, [s.id])
  useEffect(() => { saveQueue(s.id, queue) }, [s.id, queue])

  const addToQueue = (dogId: number) => {
    setQueue(q => [...q, { id: uid(String(dogId)), dogId }])
  }
  const removeFromQueue = (id: string) => setQueue(q => q.filter(x => x.id !== id))
  const clearQueue = () => setQueue([])

  const visibleDogs = useMemo(() => {
    const q = search.toLowerCase()
    return sessionDogs.items.filter((d:any) =>
      !q || String(d.name).toLowerCase().includes(q) || String(d.callname||'').toLowerCase().includes(q)
    )
  }, [sessionDogs.items, search])

  const onReorder = (ids: Array<string | number>) => {
    // ids is the new ordered list of queue item ids
    setQueue((q) => ids.map(id => q.find(x => x.id === id)!).filter(Boolean))
  }

  // --- Judge minimal state (for later expansion) ---------------------------
  const [currentIdx, setCurrentIdx] = useState(0)
  useEffect(() => { if (currentIdx >= queue.length) setCurrentIdx(0) }, [queue.length, currentIdx])

  // --- Log-a-round (kept small for Judge view) -----------------------------
  const [outcome, setOutcome] = useState<'success'|'partial'|'fail'>('success')
  const [score, setScore] = useState('')
  const [notes, setNotes] = useState('')
  const [exhibitedBehaviorId, setExhibitedBehaviorId] = useState('')
  const [exhibitedFreeText, setExhibitedFreeText] = useState('')

  const logCurrent = async () => {
    if (!queue.length) return
    const q = queue[currentIdx]
    if (!q.exerciseId || !q.behaviorId) return alert('choose exercise and planned behavior first')
    const payload: any = {
      dog_id: q.dogId,
      exercise_id: q.exerciseId,
      planned_behavior_id: q.behaviorId,
      outcome,
      score: score ? Number(score) : undefined,
      notes: notes || undefined,
      exhibited_behavior_id: exhibitedBehaviorId ? Number(exhibitedBehaviorId) : undefined,
      exhibited_free_text: exhibitedFreeText || undefined,
    }
    await apiFetch(`/sessions/${s.id}/rounds`, { method: 'POST', body: JSON.stringify(payload) })
    // advance to next
    setCurrentIdx(i => (i + 1) % Math.max(queue.length, 1))
    setOutcome('success'); setScore(''); setNotes(''); setExhibitedBehaviorId(''); setExhibitedFreeText('')
    rounds.reload()
  }

  // helpers
  const dogName = (id:number) => sessionDogs.items.find((d:any) => d.id === id)?.name || `#${id}`

  // --- UI -------------------------------------------------------------------
  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">Session #{s.id}</div>
          <div className="text-sm text-gray-600">Started: {s.started_at}</div>
          {s.location && <div className="text-sm text-gray-600">📍 {s.location}</div>}
        </div>
        <div className="flex gap-2">
          <Button variant={mode==='organize' ? 'primary' : 'secondary'} onClick={() => setMode('organize')}>Organize</Button>
          <Button variant={mode==='judge' ? 'primary' : 'secondary'} onClick={() => setMode('judge')}>Judge</Button>
        </div>
      </div>

      {mode === 'organize' && (
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          {/* All dogs in this session */}
          <div className="md:col-span-1">
            <div className="border rounded-2xl p-3 bg-white">
              <div className="font-medium mb-2">All Dogs</div>
              <Input label="Search" value={search} onChange={e => setSearch((e.target as HTMLInputElement).value)} placeholder="Name…" />
              <ul className="text-sm mt-2 max-h-64 overflow-auto divide-y">
                {visibleDogs.map((d:any) => (
                  <li key={d.id} className="py-2 flex items-center justify-between">
                    <div className="truncate">{d.name}{d.callname ? ` (${d.callname})` : ''}</div>
                    <Button variant="secondary" onClick={() => addToQueue(d.id)}>Add</Button>
                  </li>
                ))}
                {!visibleDogs.length && <li className="py-4 text-center text-gray-500">No matches.</li>}
              </ul>
            </div>
          </div>

          {/* Queue + controls */}
          <div className="md:col-span-2">
            <div className="border rounded-2xl p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Queue (Training Order)</div>
                <div className="flex gap-2">
                  {/* Templates */}
                  <select
                    className="border rounded-xl px-2 py-1 bg-white text-sm"
                    value=""
                    onChange={e => {
                      const name = (e.target as HTMLSelectElement).value
                      if (!name) return
                      setQueue(templates[name] || [])
                    }}
                  >
                    <option value="">Template</option>
                    {Object.keys(templates).map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <input
                    className="border rounded-xl px-2 py-1 text-sm"
                    placeholder="Save as template"
                    value={tplName}
                    onChange={e => setTplName((e.target as HTMLInputElement).value)}
                  />
                  <Button variant="secondary" onClick={() => { if (!tplName.trim()) return; saveTemplate(tplName.trim(), queue); setTemplates(loadTemplates()); setTplName('') }}>Save</Button>
                  <Button variant="danger" onClick={clearQueue}>Clear</Button>
                </div>
              </div>

              {/* Sortable queue */}
              <SortableList
                ids={queue.map(q => q.id)}
                onReorder={(ids) => onReorder(ids as string[])}
              >
                <div className="space-y-3">
                  {queue.map((q) => (
                    <SortableItem key={q.id} id={q.id}>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{dogName(q.dogId)}</div>
                          <Button variant="secondary" onClick={() => removeFromQueue(q.id)}>Remove</Button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-2">
                          <Select
                            label="Exercise"
                            value={q.exerciseId ?? ''}
                            onChange={e => {
                              const v = Number((e.target as HTMLSelectElement).value || 0) || undefined
                              setQueue(list => list.map(it => it.id === q.id ? { ...it, exerciseId: v } : it))
                            }}
                          >
                            <option value="">-- choose --</option>
                            {exercises.map((x:any) => <option key={x.id} value={x.id}>{x.name}</option>)}
                          </Select>
                          <Select
                            label="Planned Behavior"
                            value={q.behaviorId ?? ''}
                            onChange={e => {
                              const v = Number((e.target as HTMLSelectElement).value || 0) || undefined
                              setQueue(list => list.map(it => it.id === q.id ? { ...it, behaviorId: v } : it))
                            }}
                          >
                            <option value="">-- choose --</option>
                            {behaviors.map((b:any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </Select>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                  {!queue.length && (
                    <div className="text-sm text-gray-500 px-2 py-3">No items yet. Add dogs from the list.</div>
                  )}
                </div>
              </SortableList>
            </div>
          </div>
        </div>
      )}

      {mode === 'judge' && (
        <div className="mt-4 border rounded-2xl p-3 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Current</div>
            <div className="text-sm text-gray-500">{queue.length ? `${currentIdx + 1} / ${queue.length}` : '—'}</div>
          </div>

          {!queue.length ? (
            <div className="text-sm text-gray-500">Queue is empty. Add dogs in Organize.</div>
          ) : (
            <>
              <div className="mb-3">
                <div className="text-lg font-semibold">{dogName(queue[currentIdx].dogId)}</div>
                <div className="text-sm text-gray-600">
                  Exercise: {exercises.find((x:any)=>x.id===queue[currentIdx].exerciseId)?.name || '—'} · Planned:{' '}
                  {behaviors.find((b:any)=>b.id===queue[currentIdx].behaviorId)?.name || '—'}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <Select label="Outcome" value={outcome} onChange={e => setOutcome((e.target as HTMLSelectElement).value as any)}>
                  <option value="success">success</option>
                  <option value="partial">partial</option>
                  <option value="fail">fail</option>
                </Select>
                <Input label="Score (0-10, optional)" type="number" min={0} max={10} value={score} onChange={e => setScore((e.target as HTMLInputElement).value)} />
                <Select label="Exhibited Behavior (optional)" value={exhibitedBehaviorId} onChange={e => setExhibitedBehaviorId((e.target as HTMLSelectElement).value)}>
                  <option value="">(none / free text)</option>
                  {behaviors.map((b:any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
                <Input label="Exhibited Free Text (optional)" value={exhibitedFreeText} onChange={e => setExhibitedFreeText((e.target as HTMLInputElement).value)} placeholder="Offered down" />
              </div>
              <Textarea label="Notes (optional)" value={notes} onChange={e => setNotes((e.target as HTMLTextAreaElement).value)} placeholder="Observations…" />

              <div className="flex gap-2">
                <Button onClick={logCurrent}>Log & Next</Button>
                <Button variant="secondary" onClick={() => setCurrentIdx(i => (i + 1) % Math.max(queue.length, 1))}>Skip</Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Rounds table (unchanged) */}
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