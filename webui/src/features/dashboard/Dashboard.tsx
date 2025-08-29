import React from 'react'
import { apiFetch } from '../../lib/api'
import { useList } from '../../hooks/useList'
import { Section } from '../../components/ui/Section'
import { Stat } from '../../components/ui/Stat'
import { CardList } from '../../components/ui/CardList'
import { useTranslation } from 'react-i18next'

export default function Dashboard() {
  const { t } = useTranslation()
  const { items: sessions } = useList<any>(() => apiFetch('/sessions'))
  const { items: dogs } = useList<any>(() => apiFetch('/dogs'))
  const { items: skills } = useList<any>(() => apiFetch('/skills'))

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Section title={t('dashboard.quick_stats')}>
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Sessions" value={sessions.length} />
          <Stat label="Dogs" value={dogs.length} />
          <Stat label="Skills" value={skills.length} />
        </div>
      </Section>
      <Section title={t('dashboard.recent_sessions')}>
        <CardList items={sessions.slice(0, 6)} empty="No sessions yet.">
          {(s:any) => (
            <div>
              <div className="font-semibold">Session #{s.id}</div>
              <div className="text-sm text-gray-600">{s.started_at}</div>
              {s.location && <div className="text-sm">📍 {s.location}</div>}
            </div>
          )}
        </CardList>
      </Section>
    </div>
  )
}
