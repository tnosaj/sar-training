import React, { useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useList } from '../../hooks/useList'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { CardList } from '../../components/ui/CardList'

export default function SkillsPage() {
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
      <Section title="Create Skill" actions={<Button onClick={create}>Create</Button>}>
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="Obedience" />
        <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Core obedience skillset" />
      </Section>
      <div className="md:col-span-2">
        <Section title="All Skills" actions={<Button variant="secondary" onClick={list.reload}>Refresh</Button>}>
          <CardList items={list.items} empty="No skills yet.">
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
