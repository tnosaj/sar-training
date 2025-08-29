import React, { useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useList } from '../../hooks/useList'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { CardList } from '../../components/ui/CardList'
import SessionCard from './SessionCard'
import { useTranslation } from 'react-i18next'

export default function SessionsPage() {
  const { t } = useTranslation()
  const sessions = useList<any>(() => apiFetch('/sessions'))
  const dogs = useList<any>(() => apiFetch('/dogs'))
  const behaviorsList = useList<any>(() => apiFetch('/behaviors'))
  const exercisesList = useList<any>(() => apiFetch('/exercises'))

  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  const createSession = async () => {
    await apiFetch('/sessions', { method: 'POST', body: JSON.stringify({ location: location || undefined, notes: notes || undefined }) })
    setLocation(''); setNotes(''); sessions.reload()
  }

  return (
    <div className="space-y-6">
      <Section title={t('sessions.create_title')} actions={<Button onClick={createSession}>{t('sessions.create_button')}</Button>}>
        <Input label={t('sessions.location_optional')} value={location} onChange={e => setLocation(e.target.value)} placeholder={t('sessions.placeholder_location')} />
        <Textarea label={t('sessions.notes_optional')} value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('sessions.placeholder_notes')} />
      </Section>

      <Section title={t('sessions.list_title')} actions={<Button variant="secondary" onClick={sessions.reload}>{t('common.refresh')}</Button>}>
        <CardList items={sessions.items} empty={t('sessions.empty') as string}>
          {(s:any) => (
            <SessionCard s={s} dogs={dogs.items} behaviors={behaviorsList.items} exercises={exercisesList.items} />
          )}
        </CardList>
      </Section>
    </div>
  )
}
