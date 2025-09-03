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
  // --- edit/delete state & handlers ---------------------------------------
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const startEdit = (sk: any) => {
    setEditingId(sk.id)
    setEditName(sk.name || '')
    setEditDescription(sk.description || '')
  }
  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditDescription('')
  }
  const saveEdit = async () => {
    if (!editingId) return
    const payload = { name: editName, description: editDescription || undefined }
    // optimistic
    list.setItems(curr => curr.map((s:any) => s.id === editingId ? { ...s, ...payload } : s))
    await apiFetch(`/skills/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
    cancelEdit()
  }
  const deleteSkill = async (id: number) => {
    if (!confirm('Delete this skill?')) return
    // optimistic
    list.setItems(curr => curr.filter((s:any) => s.id !== id))
    await apiFetch(`/skills/${id}`, { method: 'DELETE' })
  }


  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Section title={t('skills.create_title')} actions={<Button onClick={create}>{t('common.create')}</Button>}>
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="Obedience" />
        <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Core obedience skillset" />
      </Section>
      <div className="md:col-span-2">
        <Section title={t('skills.list_title')} actions={<Button variant="secondary" onClick={list.reload}>{t('common.refresh')}</Button>}>
          <CardList items={list.items} empty={t('skills.empty') as string}>
            {(sk:any) => (
              <div>
                {editingId === sk.id ? (
                  <div className="space-y-2">
                    <Input label={t('skills.placeholder_name')} value={editName} onChange={e => setEditName(e.target.value)} />
                    <Textarea label={t('skills.placeholder_description')} value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                    <div className="flex gap-2">
                      <Button onClick={saveEdit}>{t('common.save')}</Button>
                      <Button variant="secondary" onClick={cancelEdit}>{t('common.cancel')}</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="font-semibold">{sk.name}</div>
                    {sk.description && <div className="text-sm text-gray-600">{sk.description}</div>}
                    <div className="text-xs text-gray-400">id: {sk.id}</div>
                    <div className="flex gap-2 mt-2">
                      <Button variant="secondary" onClick={() => startEdit(sk)}>{t('common.edit')}</Button>
                      <Button variant="danger" onClick={() => deleteSkill(sk.id)}>{t('common.delete')}</Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardList>
        </Section>
      </div>
    </div>
  )
}
