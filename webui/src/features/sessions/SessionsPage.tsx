import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useList } from '../../hooks/useList'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import PlanOrganize from './PlanOrganize'
import JudgePanel from './JudgePanel'
import { useTranslation } from 'react-i18next'

const LS_LAST_SESSION = 'ui.lastSessionId'

export default function SessionsPage() {
  const { t } = useTranslation()
  const sessions = useList<any>(() => apiFetch('/sessions'))
  const dogs = useList<any>(() => apiFetch('/dogs'))
  const behaviorsList = useList<any>(() => apiFetch('/behaviors'))
  const exercisesList = useList<any>(() => apiFetch('/exercises'))

  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const saved = localStorage.getItem(LS_LAST_SESSION)
    return saved ? Number(saved) : null
  })
  useEffect(() => {
    if (selectedId) localStorage.setItem(LS_LAST_SESSION, String(selectedId))
  }, [selectedId])

  useEffect(() => {
    if (!selectedId && sessions.items.length) {
      setSelectedId(sessions.items[0].id)
    }
  }, [selectedId, sessions.items])

  const selectedSession = useMemo(
    () => sessions.items.find((x:any) => x.id === selectedId) || null,
    [selectedId, sessions.items]
  )

  const createSession = async () => {
    const s = await apiFetch('/sessions', { method: 'POST', body: JSON.stringify({ location: location || undefined, notes: notes || undefined }) })
    setLocation(''); setNotes('')
    sessions.reload()
    setSelectedId(s.id)
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-4">
        <Section title="Create Session" actions={<Button onClick={createSession}>Create</Button>}>
          <Input label="Location (optional)" value={location} onChange={e => setLocation(e.target.value)} placeholder="Training field" />
          <Textarea label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Evening work" />
        </Section>

        <Section title="Sessions" actions={<Button variant="secondary" onClick={sessions.reload}>Refresh</Button>}>
          <ul className="divide-y rounded-2xl border overflow-hidden bg-white">
            {sessions.items.map((s:any) => (
              <li key={s.id}>
                <button
                  className={'w-full text-left px-3 py-2 hover:bg-gray-50 ' + (selectedId===s.id ? 'bg-indigo-50' : '')}
                  onClick={() => setSelectedId(s.id)}
                >
                  <div className="font-medium">Session #{s.id}</div>
                  <div className="text-xs text-gray-600">{s.started_at}</div>
                  {s.location && <div className="text-xs text-gray-600">📍 {s.location}</div>}
                </button>
              </li>
            ))}
            {!sessions.items.length && <li className="p-3 text-sm text-gray-500">No sessions yet.</li>}
          </ul>
        </Section>
      </div>

      <div className="md:col-span-2 space-y-6">
        {!selectedSession && (
          <Section title="No session selected">
            <p className="text-sm text-gray-600">Pick a session from the list to plan and judge rounds.</p>
          </Section>
        )}

        {selectedSession && (
          <>
            <Section title={`Plan — Session #${selectedSession.id}`}>
              <PlanOrganize
                session={selectedSession}
                dogs={dogs.items}
                behaviors={behaviorsList.items}
                exercises={exercisesList.items}
              />
            </Section>

            <Section title={`Judge — Session #${selectedSession.id}`}>
              <JudgePanel
                session={selectedSession}
                dogs={dogs.items}
                behaviors={behaviorsList.items}
                exercises={exercisesList.items}
              />
            </Section>
          </>
        )}
      </div>
    </div>
  )
}
