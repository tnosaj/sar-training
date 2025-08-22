import React, { useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useList } from '../../hooks/useList'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { CardList } from '../../components/ui/CardList'

export default function BehaviorsPage() {
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
      <Section title="Create Behavior" actions={<Button onClick={create}>Create</Button>}>
        <Select label="Skill" value={skillId} onChange={e => setSkillId(e.target.value)}>
          <option value="">-- choose a skill --</option>
          {skills.items.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="Sit" />
        <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Sit on cue" />
      </Section>

      <div className="md:col-span-2">
        <Section title="Behaviors" actions={
          <div className="flex gap-2 items-end">
            <Select label="Filter by skill" value={filterSkill} onChange={e => setFilterSkill(e.target.value)}>
              <option value="">(all skills)</option>
              {skills.items.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Button variant="secondary" onClick={behaviors.reload}>Refresh</Button>
          </div>
        }>
          <CardList items={behaviors.items} empty="No behaviors yet.">
            {(b:any) => (
              <div>
                <div className="font-semibold">{b.name}</div>
                <div className="text-sm text-gray-600">Skill: {skills.items.find((s:any) => s.id === b.skill_id)?.name || b.skill_id}</div>
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
