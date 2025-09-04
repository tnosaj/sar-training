import React, { useMemo, useState } from 'react'
import { useList } from '../../hooks/useList'
import { apiFetch } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { useTranslation } from 'react-i18next'


type Outcome = 'success' | 'partial' | 'fail'
type Round = {
  id?: number
  session_id: number
  dog_id: number
  round_number?: number
  exercise_id: number
  planned_behavior_id: number
  exhibited_behavior_id?: number
  exhibited_free_text?: string
  outcome: Outcome
  score?: number
  notes?: string
  started_at?: string
  ended_at?: string
}

export default function ReviewPanel({
  session,
  dogs,
  behaviors,
  exercises,
}: {
  session: any
  dogs: any[]
  behaviors: any[]
  exercises: any[]
}) {
  const { t } = useTranslation()

  const rounds = useList<Round>(() => apiFetch(`/sessions/${session.id}/rounds`), [session.id])

  // filters
  const [dogFilter, setDogFilter] = useState<string>('')
  const [exerciseFilter, setExerciseFilter] = useState<string>('')
  const [outcomeFilter, setOutcomeFilter] = useState<string>('') // '', 'success', 'partial', 'fail'
  const [textFilter, setTextFilter] = useState<string>('') // searches notes/free text

  const dogName = (id: number) => dogs.find(d => d.id === id)?.name || `#${id}`
  const exerciseName = (id: number) => exercises.find(x => x.id === id)?.name || `#${id}`
  const behaviorName = (id: number) => behaviors.find(b => b.id === id)?.name || `#${id}`

  const filtered = useMemo(() => {
    const txt = textFilter.trim().toLowerCase()
    return rounds.items.filter(r => {
      if (dogFilter && String(r.dog_id) !== dogFilter) return false
      if (exerciseFilter && String(r.exercise_id) !== exerciseFilter) return false
      if (outcomeFilter && r.outcome !== (outcomeFilter as Outcome)) return false
      if (txt) {
        const hay = [
          r.notes || '',
          r.exhibited_free_text || '',
          dogName(r.dog_id),
          exerciseName(r.exercise_id),
          behaviorName(r.planned_behavior_id),
        ].join(' ').toLowerCase()
        if (!hay.includes(txt)) return false
      }
      return true
    })
    // backend orders by dog_id, round_number; a bit nicer if we sort chronologically by round_number then dog
    .sort((a, b) => (a.round_number ?? 0) - (b.round_number ?? 0) || a.dog_id - b.dog_id)
  }, [rounds.items, dogFilter, exerciseFilter, outcomeFilter, textFilter])

  const stats = useMemo(() => {
    if (!filtered.length) return { count: 0, success: 0, partial: 0, fail: 0, avgScore: null as number | null }
    let success = 0, partial = 0, fail = 0, scoreSum = 0, scoreCnt = 0
    for (const r of filtered) {
      if (r.outcome === 'success') success++
      else if (r.outcome === 'partial') partial++
      else if (r.outcome === 'fail') fail++
      if (typeof r.score === 'number') { scoreSum += r.score; scoreCnt++ }
    }
    return { count: filtered.length, success, partial, fail, avgScore: scoreCnt ? +(scoreSum / scoreCnt).toFixed(2) : null }
  }, [filtered])

  const exportCSV = () => {
    const header = [
      'round_number','dog','exercise','planned_behavior','exhibited_behavior_or_text',
      'outcome','score','notes','started_at','ended_at'
    ]
    const rows = filtered.map(r => {
      const exhibited = r.exhibited_behavior_id
        ? behaviorName(r.exhibited_behavior_id)
        : (r.exhibited_free_text || '')
      return [
        r.round_number ?? '',
        dogName(r.dog_id),
        exerciseName(r.exercise_id),
        behaviorName(r.planned_behavior_id),
        exhibited.replace(/\n/g, ' '),
        r.outcome,
        r.score ?? '',
        (r.notes || '').replace(/\n/g, ' '),
        r.started_at || '',
        r.ended_at || '',
      ]
    })
    const csv = [header, ...rows].map(cols =>
      cols.map(v => {
        const s = String(v ?? '')
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      }).join(',')
    ).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `session-${session.id}-rounds.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Session meta */}
      <div className="bg-white border rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Session #{session.id}</div>
            <div className="text-sm text-gray-600">
              Started: {session.started_at} {session.ended_at ? ` · Ended: ${session.ended_at}` : ''}
            </div>
            {session.location && <div className="text-sm text-gray-600">📍 {session.location}</div>}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Rounds: <b>{stats.count}</b></div>
            <div className="text-sm text-gray-500">Success/Partial/Fail: <b>{stats.success}/{stats.partial}/{stats.fail}</b></div>
            <div className="text-sm text-gray-500">Avg score: <b>{stats.avgScore ?? '—'}</b></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-2xl p-4">
        <div className="grid md:grid-cols-5 gap-3">
          <Select label="Dog" value={dogFilter} onChange={e => setDogFilter(e.target.value)}>
            <option value="">(all)</option>
            {dogs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select label="Exercise" value={exerciseFilter} onChange={e => setExerciseFilter(e.target.value)}>
            <option value="">(all)</option>
            {exercises.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
          </Select>
          <Select label="Outcome" value={outcomeFilter} onChange={e => setOutcomeFilter(e.target.value)}>
            <option value="">(all)</option>
            <option value="success">success</option>
            <option value="partial">partial</option>
            <option value="fail">fail</option>
          </Select>
          <Input label="Search text" value={textFilter} onChange={e => setTextFilter(e.target.value)} placeholder="notes, free text, names…" />
          <div className="flex items-end">
            <Button variant="secondary" onClick={rounds.reload}>Refresh</Button>
            <div className="w-2" />
            <Button onClick={exportCSV}>Export CSV</Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-2xl p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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
                <th className="text-left p-2 border-b">Start</th>
                <th className="text-left p-2 border-b">End</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => {
                const exhibited = r.exhibited_behavior_id
                  ? (behaviors.find(b => b.id === r.exhibited_behavior_id)?.name || r.exhibited_behavior_id)
                  : (r.exhibited_free_text || '—')
                return (
                  <tr key={r.id || idx} className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 border-b">{r.round_number ?? ''}</td>
                    <td className="p-2 border-b">{dogName(r.dog_id)}</td>
                    <td className="p-2 border-b">{exerciseName(r.exercise_id)}</td>
                    <td className="p-2 border-b">{behaviorName(r.planned_behavior_id)}</td>
                    <td className="p-2 border-b">{exhibited}</td>
                    <td className="p-2 border-b">{r.outcome}</td>
                    <td className="p-2 border-b">{r.score ?? ''}</td>
                    <td className="p-2 border-b max-w-[24rem] truncate" title={r.notes || ''}>{r.notes ?? ''}</td>
                    <td className="p-2 border-b">{r.started_at || ''}</td>
                    <td className="p-2 border-b">{r.ended_at || ''}</td>
                  </tr>
                )
              })}
              {!filtered.length && (
                <tr><td className="p-3 text-center text-gray-500" colSpan={10}>No rounds match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
