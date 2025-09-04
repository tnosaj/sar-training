import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useList } from '../../hooks/useList'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import PlanOrganize from './PlanOrganize'
import JudgePanel from './JudgePanel'
import ReviewPanel from './ReviewPanel'

import { useTranslation } from 'react-i18next'

const LS_LAST_SESSION = 'ui.lastSessionId'

export default function SessionsPage() {
  const { t } = useTranslation()
  const sessions = useList<any>(() => apiFetch('/sessions'))
  const dogs = useList<any>(() => apiFetch('/dogs'))
  const behaviors = useList<any>(() => apiFetch('/behaviors'))
  const exercises = useList<any>(() => apiFetch('/exercises'))

  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  type Mode = 'organize' | 'judge' | 'review'
  const [mode, setMode] = useState<Mode>('organize')

  // bump this to force JudgePanel to reload the queue
  const [queueTick, setQueueTick] = useState(0)

  const selected = useMemo(
    () => sessions.items.find((s:any) => s.id === selectedId) || sessions.items[0],
    [sessions.items, selectedId]
  )

  const createSession = async () => {
    const s = await apiFetch('/sessions', {
      method: 'POST',
      body: JSON.stringify({ location: location || undefined, notes: notes || undefined })
    })
    setLocation(''); setNotes('')
    await sessions.reload()
    setSelectedId(s.id)
  }

  const onQueueSaved = () => setQueueTick(x => x + 1)
  const onLogged = () => setQueueTick(x => x + 1) // judge logged a round → refresh queue + its table

  return (
    <div className="grid md:grid-cols-[320px,1fr] gap-6">
      {/* Left */}
      <div className="space-y-6">
        <Section title="Create Session" actions={<Button onClick={createSession}>Create</Button>}>
          <Input label="Location (optional)" value={location} onChange={e => setLocation(e.target.value)} placeholder="Training field" />
          <Textarea label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Evening work" />
        </Section>

        <Section title="Sessions" actions={<Button variant="secondary" onClick={sessions.reload}>Refresh</Button>}>
          <ul className="space-y-2">
            {sessions.items.map((s:any) => (
              <li key={s.id}>
                <button
                  className={`w-full text-left px-3 py-2 rounded-xl border ${selected?.id === s.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white hover:bg-gray-50'}`}
                  onClick={() => { setSelectedId(s.id); setMode('organize') }}
                >
                  <div className="font-medium">Session #{s.id}</div>
                  <div className="text-xs text-gray-500">{s.started_at}</div>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Right */}
      <div className="space-y-6">
        {selected ? (
          <>
            <Section
              title="Session Details"
              actions={
                <div className="flex gap-2">
                  <Button variant={mode === 'organize' ? 'primary' : 'secondary'} onClick={() => setMode('organize')}>Organize</Button>
                  <Button variant={mode === 'judge' ? 'primary' : 'secondary'} onClick={() => setMode('judge')}>Judge</Button>
                  <Button variant={mode === 'review' ? 'primary' : 'secondary'} onClick={() => setMode('review')}>Review</Button>
                </div>
              }
            >
              {mode === 'organize' && (
                <PlanOrganize
                  session={selected}
                  dogs={dogs.items}
                  behaviors={behaviors.items}
                  exercises={exercises.items}
                  onSaved={onQueueSaved}
                />
              )}
              {mode === 'judge' && (
                <JudgePanel
                  key={selected.id} /* ensure remount when switching sessions */
                  session={selected}
                  dogs={dogs.items}
                  behaviors={behaviors.items}
                  exercises={exercises.items}
                  queueTick={queueTick}
                  onLogged={onLogged}
                />
              )}
              {mode === 'review' && (
                <ReviewPanel
                  session={selected}
                  dogs={dogs.items}
                  behaviors={behaviors.items}
                  exercises={exercises.items}
                />
              )}
            </Section>
          </>
        ) : (
          <Section title="Session Details">
            <p className="text-gray-600 text-sm">Select a session on the left.</p>
          </Section>
        )}
      </div>
    </div>
  )
}