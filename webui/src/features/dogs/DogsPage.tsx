import React, { useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useList } from '../../hooks/useList'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { CardList } from '../../components/ui/CardList'
import { useTranslation } from 'react-i18next'

export default function DogsPage() {
  const { t } = useTranslation()
  const list = useList<any>(() => apiFetch('/dogs'))
  const [name, setName] = useState('')
  const [callname, setCallname] = useState('')
  const [birthdate, setBirthdate] = useState('')

  const create = async () => {
    if (!name.trim()) return
    await apiFetch('/dogs', { method: 'POST', body: JSON.stringify({ name, callname: callname || undefined, birthdate: birthdate || undefined }) })
    setName(''); setCallname(''); setBirthdate(''); list.reload()
  }
  // --- edit/delete state & handlers ---------------------------------------
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editCallname, setEditCallname] = useState('')
  const [editBirthdate, setEditBirthdate] = useState('')

  const startEdit = (d:any) => {
    setEditingId(d.id)
    setEditName(d.name || '')
    setEditCallname(d.callname || '')
    setEditBirthdate(d.birthdate || '')
  }
  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditCallname('')
    setEditBirthdate('')
  }
  const saveEdit = async () => {
    if (!editingId) return
    const payload:any = {
      name: editName,
      callname: editCallname || undefined,
      birthdate: editBirthdate || undefined,
    }
    // optimistic
    list.setItems(curr => curr.map((d:any) => d.id === editingId ? { ...d, ...payload } : d))
    await apiFetch(`/dogs/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
    cancelEdit()
  }
  const deleteDog = async (id:number) => {
    if (!confirm('Delete this dog?')) return
    // optimistic
    list.setItems(curr => curr.filter((d:any) => d.id !== id))
    await apiFetch(`/dogs/${id}`, { method: 'DELETE' })
  }


  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Section title={t('dogs.create_title')} actions={<Button onClick={create}>{t('common.create')}</Button>}>
        <Input label={t('dogs.name')} value={name} onChange={e => setName(e.target.value)} placeholder="Kira" />
        <Input label={t('dogs.callname_optional')} value={callname} onChange={e => setCallname(e.target.value)} placeholder="Kiki" />
        <Input label={t('dogs.birthdate_optional')} value={birthdate} onChange={e => setBirthdate(e.target.value)} placeholder="2019-04-12T00:00:00Z" />
      </Section>
      <div className="md:col-span-2">
        <Section title={t('dogs.list_title')} actions={<Button variant="secondary" onClick={list.reload}>{t('common.refresh')}</Button>}>
          <CardList items={list.items} empty={t('dogs.empty') as string}>
            {(d:any) => (
              <div>
                {editingId === d.id ? (
                  <div className="space-y-2">
                    <Input label={t('dogs.name')} value={editName} onChange={e => setEditName(e.target.value)} />
                    <Input label={t('dogs.callname_optional')} value={editCallname} onChange={e => setEditCallname(e.target.value)} />
                    <Input label={t('dogs.birthdate_optional')} value={editBirthdate} onChange={e => setEditBirthdate(e.target.value)} />
                    <div className="flex gap-2">
                      <Button onClick={saveEdit}>{t('common.save')}</Button>
                      <Button variant="secondary" onClick={cancelEdit}>{t('common.cancel')}</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="font-semibold">{d.name} {d.callname ? `(${d.callname})` : ''}</div>
                    {d.birthdate && <div className="text-sm text-gray-600">Born: {d.birthdate}</div>}
                    <div className="text-xs text-gray-400">id: {d.id}</div>
                    <div className="flex gap-2 mt-2">
                      <Button variant="secondary" onClick={() => startEdit(d)}>{t('common.edit')}</Button>
                      <Button variant="danger" onClick={() => deleteDog(d.id)}>{t('common.delete')}</Button>
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
