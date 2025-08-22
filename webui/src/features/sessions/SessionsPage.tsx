import React, { useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useList } from '../../hooks/useList'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { CardList } from '../../components/ui/CardList'
import SessionCard from './SessionCard'

export default function SessionsPage() {
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
      <Section title="Create Session" actions={<Button onClick={createSession}>Create Session</Button>}>
        <Input label="Location (optional)" value={location} onChange={e => setLocation(e.target.value)} placeholder="Training field" />
        <Textarea label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Evening work" />
      </Section>

      <Section title="All Sessions" actions={<Button variant="secondary" onClick={sessions.reload}>Refresh</Button>}>
        <CardList items={sessions.items} empty="No sessions yet.">
          {(s:any) => (
            <SessionCard s={s} dogs={dogs.items} behaviors={behaviorsList.items} exercises={exercisesList.items} />
          )}
        </CardList>
      </Section>
    </div>
  )
}
