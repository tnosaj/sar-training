import React from 'react'
import { useList } from '../../hooks/useList'
import { apiFetch } from '../../lib/api'
import { useTranslation } from 'react-i18next'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'

function Drawer({ open, onClose, title, children }:{
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-xl border-l flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-sm px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            ×
          </button>
        </div>
        <div className="p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export function DogStatsPanel({ dog, open, onClose }:{
  dog: any | null
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const dogId = dog?.id

  const rounds = useList<any>(
    () => (dogId ? apiFetch(`/dogs/${dogId}/rounds`) : Promise.resolve([])),
    [dogId]
  )
  const behaviors = useList<any>(() => apiFetch('/behaviors'))
  const exercises = useList<any>(() => apiFetch('/exercises'))

  const bMap = React.useMemo(() => {
    const m = new Map<number, string>()
    behaviors.items.forEach((b:any) => m.set(b.id, b.name))
    return m
  }, [behaviors.items])

  const eMap = React.useMemo(() => {
    const m = new Map<number, string>()
    exercises.items.forEach((x:any) => m.set(x.id, x.name))
    return m
  }, [exercises.items])

  const total = rounds.items.length
  const successes = rounds.items.filter((r:any) => r.outcome === 'success').length
  const successRate = total ? Math.round((successes / total) * 100) : 0
  const scores = rounds.items
    .map((r:any) => r.score)
    .filter((s:any) => typeof s === 'number')
  const avgScore = scores.length
    ? (scores.reduce((a:number, b:number) => a + b, 0) / scores.length).toFixed(1)
    : '—'

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={dog ? `${t('dogs.stats_title')} — ${dog.name}` : t('dogs.stats_title')}
    >
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 border rounded-xl p-3">
          <div className="text-xs uppercase text-gray-500">{t('dogs.total_rounds')}</div>
          <div className="text-2xl font-semibold">{total}</div>
        </div>
        <div className="bg-gray-50 border rounded-xl p-3">
          <div className="text-xs uppercase text-gray-500">{t('dogs.success_rate')}</div>
          <div className="text-2xl font-semibold">{successRate}%</div>
        </div>
        <div className="bg-gray-50 border rounded-xl p-3">
          <div className="text-xs uppercase text-gray-500">{t('dogs.avg_score')}</div>
          <div className="text-2xl font-semibold">{avgScore}</div>
        </div>
      </div>

      <Section title={t('dogs.recent_rounds')}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="p-2">{t('dogs.exercise')}</th>
                <th className="p-2">{t('dogs.planned')}</th>
                <th className="p-2">{t('dogs.exhibited')}</th>
                <th className="p-2">{t('dogs.outcome')}</th>
                <th className="p-2">{t('dogs.score')}</th>
                <th className="p-2">{t('dogs.notes')}</th>
              </tr>
            </thead>
            <tbody>
              {rounds.items.length ? (
                rounds.items
                  .slice()
                  .reverse()
                  .slice(0, 25)
                  .map((r:any) => (
                    <tr key={r.id}>
                      <td className="p-2">{eMap.get(r.exercise_id) || r.exercise_id}</td>
                      <td className="p-2">{bMap.get(r.planned_behavior_id) || r.planned_behavior_id}</td>
                      <td className="p-2">
                        {r.exhibited_behavior_id
                          ? bMap.get(r.exhibited_behavior_id) || r.exhibited_behavior_id
                          : r.exhibited_free_text || '—'}
                      </td>
                      <td className="p-2">{r.outcome}</td>
                      <td className="p-2">{r.score ?? ''}</td>
                      <td className="p-2">{r.notes ?? ''}</td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td className="p-3 text-center text-gray-500" colSpan={6}>
                    {t('dogs.no_rounds')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <Button variant="secondary" onClick={rounds.reload}>
            {t('common.refresh')}
          </Button>
        </div>
      </Section>
    </Drawer>
  )
}

export default DogStatsPanel