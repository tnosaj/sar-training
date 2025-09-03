import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useList } from '../../hooks/useList'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import SessionCard from './SessionCard'
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
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // pick a default session once we’ve loaded
  useEffect(() => {
    if (!sessions.items.length) { setSelectedId(null); return }
    const saved = Number(localStorage.getItem(LS_LAST_SESSION) || '')
    const exists = sessions.items.some((s:any) => s.id === saved)
    if (exists) setSelectedId(saved)
    else setSelectedId(sessions.items[0].id) // newest first (API orders DESC)
  }, [sessions.items])

  // persist selection
  useEffect(() => {
    if (selectedId) localStorage.setItem(LS_LAST_SESSION, String(selectedId))
  }, [selectedId])

  const createSession = async () => {
    const created = await apiFetch('/sessions', {
      method: 'POST',
      body: JSON.stringify({
        location: location || undefined,
        notes: notes || undefined,
      }),
    })
    setLocation(''); setNotes('')
    await sessions.reload()
    if (created?.id) setSelectedId(created.id)
  }

  const selected = useMemo(
    () => sessions.items.find((s:any) => s.id === selectedId) || null,
    [sessions.items, selectedId]
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left column: create + list */}
      <div className="space-y-6">
        <Section
          title={t('session.create_title', 'Create Session')}
          actions={<Button onClick={createSession}>{t('session.create_action', 'Create')}</Button>}
        >
          <Input
            label={t('session.location_optional', 'Location (optional)')}
            value={location}
            onChange={e => setLocation((e.target as HTMLInputElement).value)}
            placeholder={t('session.location_ph', 'Training field')}
          />
          <Textarea
            label={t('session.notes_optional', 'Notes (optional)')}
            value={notes}
            onChange={e => setNotes((e.target as HTMLTextAreaElement).value)}
            placeholder={t('session.notes_ph', 'Evening work')}
          />
        </Section>

        <Section
          title={t('session.list_title', 'Sessions')}
          actions={<Button variant="secondary" onClick={sessions.reload}>{t('common.refresh', 'Refresh')}</Button>}
        >
          <div className="max-h-[420px] overflow-auto divide-y">
            {sessions.items.map((s:any) => {
              const active = s.id === selectedId
              return (
                <button
                  key={s.id}
                  className={[
                    'w-full text-left px-3 py-2 rounded-xl my-1 transition',
                    active ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50 border border-transparent',
                  ].join(' ')}
                  onClick={() => setSelectedId(s.id)}
                >
                  <div className="font-medium">
                    {t('session.session', 'Session')} #{s.id}
                  </div>
                  <div className="text-xs text-gray-600">
                    {t('session.started', 'Started:')} {s.started_at}
                  </div>
                  {s.location && (
                    <div className="text-xs text-gray-600">📍 {s.location}</div>
                  )}
                </button>
              )
            })}
            {!sessions.items.length && (
              <div className="py-8 text-center text-sm text-gray-500">
                {t('session.none_yet', 'No sessions yet.')}
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Right column: details editor for one session */}
      <div className="md:col-span-2">
        <Section
          title={t('session.details_title', 'Session Details')}
          actions={
            selected && (
              <Button variant="secondary" onClick={sessions.reload}>
                {t('common.refresh', 'Refresh')}
              </Button>
            )
          }
        >
          {!selected ? (
            <div className="text-sm text-gray-500">
              {t('session.pick_hint', 'Pick a session from the list to view and edit.')}
            </div>
          ) : (
            <SessionCard
              s={selected}
              dogs={dogs.items}
              behaviors={behaviorsList.items}
              exercises={exercisesList.items}
            />
          )}
        </Section>
      </div>
    </div>
  )
}
