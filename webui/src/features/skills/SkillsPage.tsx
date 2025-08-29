import React, { useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useList } from '../../hooks/useList'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { CardList } from '../../components/ui/CardList'
import { useTranslation } from 'react-i18next'

export default function SkillsPage() {
  const { t } = useTranslation()
  const list = useList<any>(() => apiFetch('/skills'))
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const create = async () => {
    if (!name.trim()) return
    await apiFetch('/skills', { method: 'POST', body: JSON.stringify({ name, description: description || undefined }) })
    setName(''); setDescription(''); list.reload()
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Section title={t('skills.create_title')} actions={<Button onClick={create}>{t('common.create')}</Button>}>
        <Input label={t('common.name')} value={name} onChange={e => setName(e.target.value)} placeholder={t('skills.placeholder_name')} />
        <Textarea label={t('common.description')} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('skills.placeholder_description')} />
      </Section>
      <div className="md:col-span-2">
        <Section title={t('skills.list_title')} actions={<Button variant="secondary" onClick={list.reload}>{t('common.refresh')}</Button>}>
          <CardList items={list.items} empty={t('skills.empty') as string}>
            {(sk:any) => (
              <div>
                <div className="font-semibold">{sk.name}</div>
                {sk.description && <div className="text-sm text-gray-600">{sk.description}</div>}
                <div className="text-xs text-gray-400">id: {sk.id}</div>
              </div>
            )}
          </CardList>
        </Section>
      </div>
    </div>
  )
}
