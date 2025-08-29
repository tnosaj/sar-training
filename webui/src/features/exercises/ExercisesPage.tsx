import React, { useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useList } from '../../hooks/useList'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { CardList } from '../../components/ui/CardList'
import { useTranslation } from 'react-i18next'

export default function ExercisesPage() {
  const { t } = useTranslation()
  const exercises = useList<any>(() => apiFetch('/exercises'))
  const behaviors = useList<any>(() => apiFetch('/behaviors'))
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const [linkBehavior, setLinkBehavior] = useState('')
  const [linkExercise, setLinkExercise] = useState('')
  const [strength, setStrength] = useState('3')

  const create = async () => {
    if (!name.trim()) return
    await apiFetch('/exercises', { method: 'POST', body: JSON.stringify({ name, description: description || undefined }) })
    setName(''); setDescription(''); exercises.reload()
  }

  const link = async () => {
    if (!linkBehavior || !linkExercise) return
    await apiFetch('/behavior-exercises', { method: 'POST', body: JSON.stringify({ behavior_id: Number(linkBehavior), exercise_id: Number(linkExercise), strength: Number(strength) }) })
    alert(t('exercises.linked'))
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Section title={t('exercises.create_title')} actions={<Button onClick={create}>{t('common.create')}</Button>}>
        <Input label={t('common.name')} value={name} onChange={e => setName(e.target.value)} placeholder={t('exercises.placeholder_name')} />
        <Textarea label={t('common.description')} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('exercises.placeholder_description')} />
      </Section>

      <Section title={t('exercises.link_title')} actions={<Button onClick={link}>{t('exercises.link')}</Button>}>
        <Select label={t('behaviors.behavior')} value={linkBehavior} onChange={e => setLinkBehavior(e.target.value)}>
          <option value="">{t('behaviors.choose_behavior')}</option>
          {behaviors.items.map((b:any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
        <Select label={t('exercises.exercise')} value={linkExercise} onChange={e => setLinkExercise(e.target.value)}>
          <option value="">{t('exercises.choose_exercise')}</option>
          {exercises.items.map((x:any) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </Select>
        <Input label={t('exercises.strength')} type="number" min={1} max={5} value={strength} onChange={e => setStrength(e.target.value)} />
      </Section>

      <div className="md:col-span-1">
        <Section title={t('exercises.list_title')} actions={<Button variant="secondary" onClick={exercises.reload}>{t('common.refresh')}</Button>}>
          <CardList items={exercises.items} empty={t('exercises.empty') as string}>
            {(x:any) => (
              <div>
                <div className="font-semibold">{x.name}</div>
                {x.description && <div className="text-sm text-gray-600">{x.description}</div>}
                <div className="text-xs text-gray-400">id: {x.id}</div>
              </div>
            )}
          </CardList>
        </Section>
      </div>
    </div>
  )
}
