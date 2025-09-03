import React, { useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useList } from '../../hooks/useList'
import { Button } from '../../components/ui/Button'
import PlanOrganize from './PlanOrganize'
import JudgePanel from './JudgePanel'
import { useTranslation } from 'react-i18next'

export default function SessionCard({ s, dogs, behaviors, exercises }:{
  s: any
  dogs: any[]
  behaviors: any[]
  exercises: any[]
}) {
  const { t } = useTranslation()
  const rounds = useList<any>(() => apiFetch(`/sessions/${s.id}/rounds`), [s.id])
  const [mode, setMode] = useState<'organize'|'judge'>('organize')

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{t('session.session')} #{s.id}</div>
          <div className="text-sm text-gray-600">{t('session.started')} {s.started_at}</div>
          {s.location && <div className="text-sm text-gray-600">📍 {s.location}</div>}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex gap-2 mb-3">
          <Button
            variant={mode === 'organize' ? 'primary' : 'secondary'}
            onClick={() => setMode('organize')}
          >
            {t('session.organize', 'Organize')}
          </Button>
          <Button
            variant={mode === 'judge' ? 'primary' : 'secondary'}
            onClick={() => setMode('judge')}
          >
            {t('session.judge', 'Judge')}
          </Button>
        </div>

        {mode === 'organize' ? (
          <PlanOrganize
            sessionId={s.id}
            dogs={dogs}
            behaviors={behaviors}
            exercises={exercises}
          />
        ) : (
          <JudgePanel
            sessionId={s.id}
            dogs={dogs}
            behaviors={behaviors}
            exercises={exercises}
          />
        )}
      </div>

      <div className="mt-4">
        <div className="font-medium mb-2">{t('session.rounds_title', 'Rounds')}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white rounded-2xl border">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 border-b">{t('session.table.num')}</th>
                <th className="text-left p-2 border-b">{t('session.table.dog')}</th>
                <th className="text-left p-2 border-b">{t('session.table.exercise')}</th>
                <th className="text-left p-2 border-b">{t('session.table.planned')}</th>
                <th className="text-left p-2 border-b">{t('session.table.exhibited')}</th>
                <th className="text-left p-2 border-b">{t('session.table.outcome')}</th>
                <th className="text-left p-2 border-b">{t('session.table.score')}</th>
                <th className="text-left p-2 border-b">{t('session.table.notes')}</th>
              </tr>
            </thead>
            <tbody>
              {rounds.items.map((r:any, idx:number) => (
                <tr key={r.id || idx} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border-b">{r.round_number}</td>
                  <td className="p-2 border-b">
                    {(dogs.find((d:any) => d.id === r.dog_id)?.name) || r.dog_id}
                  </td>
                  <td className="p-2 border-b">
                    {(exercises.find((x:any) => x.id === r.exercise_id)?.name) || r.exercise_id}
                  </td>
                  <td className="p-2 border-b">
                    {(behaviors.find((b:any) => b.id === r.planned_behavior_id)?.name) || r.planned_behavior_id}
                  </td>
                  <td className="p-2 border-b">
                    {r.exhibited_behavior_id
                      ? (behaviors.find((b:any) => b.id === r.exhibited_behavior_id)?.name || r.exhibited_behavior_id)
                      : (r.exhibited_free_text || '—')}
                  </td>
                  <td className="p-2 border-b">{r.outcome}</td>
                  <td className="p-2 border-b">{r.score ?? ''}</td>
                  <td className="p-2 border-b">{r.notes ?? ''}</td>
                </tr>
              ))}
              {!rounds.items.length && (
                <tr>
                  <td className="p-3 text-center text-gray-500" colSpan={8}>
                    {t('session.table.no_rounds')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
