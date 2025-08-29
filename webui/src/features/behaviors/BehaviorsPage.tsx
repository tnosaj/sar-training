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

export default function BehaviorsPage() {
  const { t } = useTranslation()
  const skills = useList<any>(() => apiFetch('/skills'))
  const [filterSkill, setFilterSkill] = useState('')
  const behaviors = useList<any>(() => apiFetch(filterSkill ? `/behaviors?skill_id=${filterSkill}` : '/behaviors'), [filterSkill])

  const [name, setName] = useState('')
  const [skillId, setSkillId] = useState('')
  const [description, setDescription] = useState('')

  const create = async () => {
    if (!name.trim() || !skillId) return
    await apiFetch('/behaviors', { method: 'POST', body: JSON.stringify({ name, skill_id: Number(skillId), description: description || undefined }) })
    setName(''); setDescription(''); behaviors.reload()
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Section title={t('behaviors.create_title')} actions={<Button onClick={create}>{t('common.create')}</Button>}>
        <Select label={t('behaviors.skill')} value={skillId} onChange={e => setSkillId(e.target.value)}>
          <option value="">{t('behaviors.choose_skill')}</option>
          {skills.items.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Input label={t('common.name')} value={name} onChange={e => setName(e.target.value)} placeholder={t('behaviors.placeholder_name')} />
        <Textarea label={t('common.description')} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('behaviors.placeholder_description')} />
      </Section>

      <div className="md:col-span-2">
        <Section title={t('behaviors.list_title')} actions={
          <div className="flex gap-2 items-end">
            <Select label={t('behaviors.filter_by_skill')} value={filterSkill} onChange={e => setFilterSkill(e.target.value)}>
              <option value="">{t('behaviors.all_skills')}</option>
              {skills.items.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Button variant="secondary" onClick={behaviors.reload}>{t('common.refresh')}</Button>
          </div>
        }>
          <CardList items={behaviors.items} empty={t('behaviors.empty') as string}>
            {(b:any) => (
              <div>
                <div className="font-semibold">{b.name}</div>
                <div className="text-sm text-gray-600">{t('behaviors.skill_col')}: {skills.items.find((s:any) => s.id === b.skill_id)?.name || b.skill_id}</div>
                {b.description && <div className="text-sm text-gray-600">{b.description}</div>}
                <div className="text-xs text-gray-400">id: {b.id}</div>
              </div>
            )}
          </CardList>
        </Section>
      </div>
    </div>
  )
}
