import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useTranslation } from 'react-i18next'

type QueueItem = {
  dog_id: number
  exercise_id?: number
  planned_behavior_id?: number
}

function useLocalQueue(key: string) {
  const [items, setItems] = useState<QueueItem[]>([])
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [key])
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(items))
    } catch {}
  }, [key, items])
  return { items, setItems }
}

export default function PlanOrganize({
  sessionId,
  dogs,
  behaviors,
  exercises,
}: {
  sessionId: number
  dogs: any[]
  behaviors: any[]
  exercises: any[]
}) {
  const { t } = useTranslation()
  const { items, setItems } = useLocalQueue(`plan/${sessionId}`)
  const [search, setSearch] = useState('')
  const [templateName, setTemplateName] = useState('')

  const dogMap = useMemo(() => new Map(dogs.map((d: any) => [d.id, d])), [dogs])
  const behaviorMap = useMemo(() => new Map(behaviors.map((b: any) => [b.id, b])), [behaviors])
  const exerciseMap = useMemo(() => new Map(exercises.map((x: any) => [x.id, x])), [exercises])

  const availableDogs = useMemo(() => {
    const q = search.trim().toLowerCase()
    return dogs.filter((d: any) => d.name.toLowerCase().includes(q))
  }, [dogs, search])

  // ---- actions -------------------------------------------------------------

  const addDogToQueue = (dog_id: number) => {
    // avoid duplicates; you can add a second entry with the same dog if you want:
    // here we keep 1 per dog for the order (common case)
    if (items.some((i) => i.dog_id === dog_id)) return
    setItems([...items, { dog_id }])
  }

  const removeAt = (idx: number) => {
    const cpy = items.slice()
    cpy.splice(idx, 1)
    setItems(cpy)
  }

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir
    if (j < 0 || j >= items.length) return
    const cpy = items.slice()
    const [it] = cpy.splice(idx, 1)
    cpy.splice(j, 0, it)
    setItems(cpy)
  }

  const setExercise = (idx: number, val: number) => {
    const cpy = items.slice()
    cpy[idx] = { ...cpy[idx], exercise_id: val || undefined }
    setItems(cpy)
  }
  const setBehavior = (idx: number, val: number) => {
    const cpy = items.slice()
    cpy[idx] = { ...cpy[idx], planned_behavior_id: val || undefined }
    setItems(cpy)
  }

  const clear = () => setItems([])

  const save = async () => {
    // persist “dogs in session” order (server will INSERT OR IGNORE duplicates)
    const dogIds = items.map((i) => i.dog_id)
    for (const id of dogIds) {
      await apiFetch(`/sessions/${sessionId}/dogs`, {
        method: 'POST',
        body: JSON.stringify({ dog_id: id }),
      })
    }
    // (optional) you could POST planned rounds here too if you want
    alert(t('session.plan_saved', 'Plan saved.'))
  }

  // tiny demo “template” saver (local only)
  const saveTemplate = () => {
    if (!templateName.trim()) return
    localStorage.setItem(
      `plan-template/${templateName.trim()}`,
      JSON.stringify(items)
    )
    setTemplateName('')
    alert(t('session.template_saved', 'Template saved'))
  }
  const loadTemplate = (name: string) => {
    try {
      const raw = localStorage.getItem(`plan-template/${name}`)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }
  const templateNames = useMemo(() => {
    const out: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || ''
      if (k.startsWith('plan-template/')) out.push(k.split('/')[1])
    }
    return out.sort()
  }, [items]) // refresh list when items change (cheap)

  // “quick suggest”: dogs not in the queue yet
  const suggest = () => {
    const queued = new Set(items.map((i) => i.dog_id))
    const toAdd = dogs.filter((d: any) => !queued.has(d.id)).slice(0, 3) // first 3
    if (!toAdd.length) return
    setItems([
      ...items,
      ...toAdd.map((d) => ({ dog_id: d.id } as QueueItem)),
    ])
  }

  // ---- UI ------------------------------------------------------------------

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Left: All dogs */}
      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="px-3 py-2 border-b flex items-center justify-between">
          <div className="font-medium">
            {t('session.all_dogs', 'All Dogs')}
          </div>
          <Button variant="secondary" onClick={suggest}>
            {t('session.suggest', 'Suggest')}
          </Button>
        </div>

        <div className="p-3 space-y-3">
          <Input
            label={t('session.search', 'Search')}
            placeholder={t('session.search_name', 'Name…')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-64 overflow-auto divide-y">
            {availableDogs.map((d: any) => (
              <div
                key={d.id}
                className="py-2 flex items-center justify-between"
              >
                <div className="truncate">{d.name}</div>
                <Button variant="secondary" onClick={() => addDogToQueue(d.id)}>
                  {t('session.add', 'Add')}
                </Button>
              </div>
            ))}
            {!availableDogs.length && (
              <div className="py-8 text-center text-sm text-gray-500">
                {t('common.none_yet', 'None yet')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Queue (two columns wide on md+) */}
      <div className="md:col-span-2 bg-white border rounded-2xl overflow-hidden">
        <div className="px-3 py-2 border-b flex items-center justify-between">
          <div className="font-medium">
            {t('session.queue_title', 'Queue')}{' '}
            <span className="text-gray-500">
              ({t('session.training_order', 'Training Order')})
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* templates (local) */}
            <Select
              label={t('session.template', 'Template')}
              value=""
              onChange={(e) => loadTemplate((e.target as HTMLSelectElement).value)}
              className="w-36"
            >
              <option value="">{t('session.choose_template', 'Choose…')}</option>
              {templateNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>

            <Input
              label={t('session.save_as_template', 'Save as template')}
              value={templateName}
              placeholder={t('session.template_name', 'Name')}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-36"
            />
            <Button variant="secondary" onClick={saveTemplate}>
              {t('common.save', 'Save')}
            </Button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <Button variant="secondary" onClick={clear}>
              {t('common.clear', 'Clear')}
            </Button>
            <Button onClick={save}>{t('common.save', 'Save')}</Button>
          </div>
        </div>

        <div className="p-3">
          {!items.length ? (
            <p className="text-sm text-gray-500">
              {t('session.queue_empty', 'No items yet. Add dogs from the list.')}
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((it, idx) => {
                const dog = dogMap.get(it.dog_id)
                return (
                  <li
                    key={`${it.dog_id}-${idx}`}
                    className="border rounded-xl p-3 bg-gray-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium truncate">
                        {idx + 1}. {dog ? dog.name : it.dog_id}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => move(idx, -1)}
                          disabled={idx === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => move(idx, +1)}
                          disabled={idx === items.length - 1}
                        >
                          ↓
                        </Button>
                        <Button variant="danger" onClick={() => removeAt(idx)}>
                          {t('common.remove', 'Remove')}
                        </Button>
                      </div>
                    </div>

                    {/* per-item selections */}
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Select
                        label={t('session.exercise', 'Exercise')}
                        value={it.exercise_id || ''}
                        onChange={(e) =>
                          setExercise(idx, Number((e.target as HTMLSelectElement).value))
                        }
                      >
                        <option value="">
                          {t('session.choose_exercise', '— choose exercise —')}
                        </option>
                        {exercises.map((x: any) => (
                          <option key={x.id} value={x.id}>
                            {x.name}
                          </option>
                        ))}
                      </Select>

                      <Select
                        label={t('session.planned_behavior', 'Planned Behavior')}
                        value={it.planned_behavior_id || ''}
                        onChange={(e) =>
                          setBehavior(idx, Number((e.target as HTMLSelectElement).value))
                        }
                      >
                        <option value="">
                          {t('session.choose_behavior', '— choose behavior —')}
                        </option>
                        {behaviors.map((b: any) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* small summary line */}
                    <div className="mt-2 text-xs text-gray-600">
                      {t('session.summary', 'Summary')}:&nbsp;
                      {it.exercise_id
                        ? exerciseMap.get(it.exercise_id)?.name
                        : t('session.no_exercise', 'no exercise')}
                      {' • '}
                      {it.planned_behavior_id
                        ? behaviorMap.get(it.planned_behavior_id)?.name
                        : t('session.no_behavior', 'no behavior')}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
