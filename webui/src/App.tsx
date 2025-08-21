import { apiFetch, getInitialApiBase, LS_KEY } from './lib/api'

// --- Small helpers ---------------------------------------------------------
function cx(...classes: (string | false | null | undefined)[]) { return classes.filter(Boolean).join(' ') }

function Section({ title, actions, children }:{ title: string, actions?: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 md:p-6 border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-2">{actions}</div>
      </div>
      {children}
    </div>
  )
}

function Button({ children, onClick, type = 'button', variant = 'primary', disabled }:{ children: React.ReactNode, onClick?: () => void, type?: 'button'|'submit', variant?: 'primary'|'secondary'|'danger', disabled?: boolean }) {
  const styles = variant === 'secondary'
    ? 'bg-gray-100 hover:bg-gray-200 text-gray-900'
    : variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={cx('px-3 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed', styles)}>
      {children}
    </button>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, className, ...rest } = props
  return (
    <label className="block text-sm mb-2">
      <div className="mb-1 text-gray-700">{label}</div>
      <input {...rest} className={cx('w-full rounded-xl border px-3 py-2', className)} />
    </label>
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const { label, className, ...rest } = props
  return (
    <label className="block text-sm mb-2">
      <div className="mb-1 text-gray-700">{label}</div>
      <textarea {...rest} className={cx('w-full rounded-xl border px-3 py-2', className)} />
    </label>
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const { label, className, children, ...rest } = props
  return (
    <label className="block text-sm mb-2">
      <div className="mb-1 text-gray-700">{label}</div>
      <select {...rest} className={cx('w-full rounded-xl border px-3 py-2 bg-white', className)}>
        {children}
      </select>
    </label>
  )
}

function ErrorMsg({ error }:{ error?: string | null }) {
  if (!error) return null
  return <div className="text-sm text-red-600 mb-2">⚠️ {String(error)}</div>
}

function useList<T>(fetcher: () => Promise<T[]>, deps: any[] = []) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reload = async () => {
    try { setLoading(true); setError(null); const data = await fetcher(); setItems(data || []) }
    catch (e:any) { setError(e.message || String(e)) }
    finally { setLoading(false) }
  }
  useEffect(() => { reload() /* eslint-disable-next-line */ }, deps)
  return { items, loading, error, reload, setItems }
}

function CardList<T>({ items, renderItem, children, empty = 'No items yet.' }:{ items: T[]; renderItem?: (item:T)=>React.ReactNode; children?: (item:T)=>React.ReactNode; empty?: string }) {
  const renderer = renderItem ?? children
  if (!items?.length) return <p className="text-gray-500 text-sm">{empty}</p>
  return (
    <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((it, i) => (
        <li key={i} className="border rounded-2xl p-4 bg-gray-50">
          {renderer ? renderer(it) : null}
        </li>
      ))}
    </ul>
  )
}

// --- Tabs ------------------------------------------------------------------
const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'skills', label: 'Skills' },
  { key: 'behaviors', label: 'Behaviors' },
  { key: 'exercises', label: 'Exercises' },
  { key: 'dogs', label: 'Dogs' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'settings', label: 'Settings' },
] as const

// --- Root App ---------------------------------------------------------------
export default function App() {
  const [apiBase, setApiBase] = useState(getInitialApiBase())
  useEffect(() => { localStorage.setItem(LS_KEY, apiBase) }, [apiBase])
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('dashboard')

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">🐾 Dog Training Tracker</h1>
          <nav className="flex gap-2 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cx('px-3 py-1.5 rounded-xl text-sm', tab === t.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200')}>{t.label}</button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'skills' && <SkillsTab />}
        {tab === 'behaviors' && <BehaviorsTab />}
        {tab === 'exercises' && <ExercisesTab />}
        {tab === 'dogs' && <DogsTab />}
        {tab === 'sessions' && <SessionsTab />}
        {tab === 'settings' && <SettingsTab apiBase={apiBase} setApiBase={setApiBase} />}
      </main>

      <footer className="py-8 text-center text-xs text-gray-500">API base: {apiBase}</footer>
    </div>
  )
}

// --- Dashboard --------------------------------------------------------------
function Dashboard() {
  const { items: sessions } = useList<any>(() => apiFetch('/sessions'))
  const { items: dogs } = useList<any>(() => apiFetch('/dogs'))
  const { items: skills } = useList<any>(() => apiFetch('/skills'))

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Section title="Quick Stats">
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Sessions" value={sessions.length} />
          <Stat label="Dogs" value={dogs.length} />
          <Stat label="Skills" value={skills.length} />
        </div>
      </Section>
      <Section title="Recent Sessions" actions={null}>
        <CardList items={sessions.slice(0, 6)} empty="No sessions yet.">
          {(s:any) => (
            <div>
              <div className="font-semibold">Session #{s.id}</div>
              <div className="text-sm text-gray-600">{s.started_at}</div>
              {s.location && <div className="text-sm">📍 {s.location}</div>}
            </div>
          )}
        </CardList>
      </Section>
    </div>
  )
}

function Stat({ label, value }:{ label: string, value: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-2xl p-4">
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}

// --- Skills -----------------------------------------------------------------
function SkillsTab() {
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
        <ErrorMsg error={list.error} />
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

// --- Behaviors --------------------------------------------------------------
function BehaviorsTab() {
  const skills = useList<any>(() => apiFetch('/skills'))
  const [filterSkill, setFilterSkill] = useState('')
  const behaviors = useList<any>(
    () => apiFetch(filterSkill ? `/behaviors?skill_id=${filterSkill}` : '/behaviors'),
  [filterSkill]
  )

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

// --- Exercises + linking ----------------------------------------------------
function ExercisesTab() {
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
    alert('Linked!')
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Section title="Create Exercise" actions={<Button onClick={create}>Create</Button>}>
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="Duration Hold" />
        <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Hold sit for duration" />
      </Section>

      <Section title="Link Exercise ⇄ Behavior" actions={<Button onClick={link}>Link</Button>}>
        <Select label="Behavior" value={linkBehavior} onChange={e => setLinkBehavior(e.target.value)}>
          <option value="">-- choose behavior --</option>
          {behaviors.items.map((b:any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
        <Select label="Exercise" value={linkExercise} onChange={e => setLinkExercise(e.target.value)}>
          <option value="">-- choose exercise --</option>
          {exercises.items.map((x:any) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </Select>
        <Input label="Strength (1-5)" type="number" min={1} max={5} value={strength} onChange={e => setStrength(e.target.value)} />
      </Section>

      <div className="md:col-span-1">
        <Section title="Exercises" actions={<Button variant="secondary" onClick={exercises.reload}>Refresh</Button>}>
          <CardList items={exercises.items} empty="No exercises yet.">
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

// --- Dogs -------------------------------------------------------------------
function DogsTab() {
  const list = useList<any>(() => apiFetch('/dogs'))
  const [name, setName] = useState('')
  const [callname, setCallname] = useState('')
  const [birthdate, setBirthdate] = useState('')

  const create = async () => {
    if (!name.trim()) return
    await apiFetch('/dogs', { method: 'POST', body: JSON.stringify({ name, callname: callname || undefined, birthdate: birthdate || undefined }) })
    setName(''); setCallname(''); setBirthdate(''); list.reload()
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Section title="Create Dog" actions={<Button onClick={create}>Create</Button>}>
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="Kira" />
        <Input label="Callname (optional)" value={callname} onChange={e => setCallname(e.target.value)} placeholder="Kiki" />
        <Input label="Birthdate (RFC3339, optional)" value={birthdate} onChange={e => setBirthdate(e.target.value)} placeholder="2019-04-12T00:00:00Z" />
      </Section>
      <div className="md:col-span-2">
        <Section title="All Dogs" actions={<Button variant="secondary" onClick={list.reload}>Refresh</Button>}>
          <CardList items={list.items} empty="No dogs yet.">
            {(d:any) => (
              <div>
                <div className="font-semibold">{d.name} {d.callname ? `(${d.callname})` : ''}</div>
                {d.birthdate && <div className="text-sm text-gray-600">Born: {d.birthdate}</div>}
                <div className="text-xs text-gray-400">id: {d.id}</div>
              </div>
            )}
          </CardList>
        </Section>
      </div>
    </div>
  )
}

// --- Sessions & Rounds ------------------------------------------------------
function SessionsTab() {
  const sessions = useList<any>(() => apiFetch('/sessions'))
  const dogs = useList<any>(() => apiFetch('/dogs'))
  const behaviors = useList<any>(() => apiFetch('/behaviors'))
  const exercises = useList<any>(() => apiFetch('/exercises'))

  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  const createSession = async () => {
    await apiFetch('/sessions', { method: 'POST', body: JSON.stringify({ location: location || undefined, notes: notes || undefined }) })
    setLocation(''); setNotes(''); sessions.reload()
  }

  return (
    <div className="space-y-6">
      <Section title="Create Session" actions={<Button onClick={createSession}>Create Session</Button>}>
        <Input label="Location (optional)" value={location} onChange={e => setLocation(e.target.value)} placeholder="Training field" />
        <Textarea label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Evening work" />
      </Section>

      <Section title="All Sessions" actions={<Button variant="secondary" onClick={sessions.reload}>Refresh</Button>}>
        <CardList items={sessions.items} empty="No sessions yet.">
          {(s:any) => (
            <SessionCard s={s} dogs={dogs.items} behaviors={behaviors.items} exercises={exercises.items} />
          )}
        </CardList>
      </Section>
    </div>
  )
}

function SessionCard({ s, dogs, behaviors, exercises }:{ s:any, dogs:any[], behaviors:any[], exercises:any[] }) {
  const sessionDogs = useList<any>(() => apiFetch(`/sessions/${s.id}/dogs`), [s.id])
  const rounds = useList<any>(() => apiFetch(`/sessions/${s.id}/rounds`), [s.id])

  const [addDogId, setAddDogId] = useState('')

  const [dogId, setDogId] = useState('')
  const [exerciseId, setExerciseId] = useState('')
  const [plannedBehaviorId, setPlannedBehaviorId] = useState('')
  const [exhibitedBehaviorId, setExhibitedBehaviorId] = useState('')
  const [outcome, setOutcome] = useState('success')
  const [score, setScore] = useState('')
  const [notes, setNotes] = useState('')
  const [startedAt, setStartedAt] = useState('')
  const [endedAt, setEndedAt] = useState('')
  const [exhibitedFreeText, setExhibitedFreeText] = useState('')

  const addDog = async () => {
    if (!addDogId) return
    await apiFetch(`/sessions/${s.id}/dogs`, { method: 'POST', body: JSON.stringify({ dog_id: Number(addDogId) }) })
    setAddDogId(''); sessionDogs.reload()
  }

  const createRound = async () => {
    if (!dogId || !exerciseId || !plannedBehaviorId) return alert('dog, exercise, planned behavior required')
    const payload: any = {
      dog_id: Number(dogId),
      exercise_id: Number(exerciseId),
      planned_behavior_id: Number(plannedBehaviorId),
      outcome,
      notes: notes || undefined,
      score: score ? Number(score) : undefined,
      started_at: startedAt || undefined,
      ended_at: endedAt || undefined,
      exhibited_behavior_id: exhibitedBehaviorId ? Number(exhibitedBehaviorId) : undefined,
      exhibited_free_text: exhibitedFreeText || undefined,
    }
    await apiFetch(`/sessions/${s.id}/rounds`, { method: 'POST', body: JSON.stringify(payload) })
    setExerciseId(''); setPlannedBehaviorId(''); setExhibitedBehaviorId(''); setOutcome('success'); setScore(''); setNotes(''); setStartedAt(''); setEndedAt(''); setExhibitedFreeText('')
    rounds.reload()
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">Session #{s.id}</div>
          <div className="text-sm text-gray-600">Started: {s.started_at}</div>
          {s.location && <div className="text-sm text-gray-600">📍 {s.location}</div>}
        </div>
      </div>

      <div className="mt-4 grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <div className="border rounded-2xl p-3 bg-white">
            <div className="font-medium mb-2">Dogs in session</div>
            <ul className="text-sm list-disc ml-4 mb-3">
              {sessionDogs.items.map((d:any) => <li key={d.id}>{d.name}</li>)}
              {!sessionDogs.items.length && <li className="text-gray-500">None yet</li>}
            </ul>
            <div className="flex gap-2">
              <select className="border rounded-xl px-3 py-2 flex-1 bg-white" value={addDogId} onChange={e => setAddDogId(e.target.value)}>
                <option value="">Add dog…</option>
                {dogs.map((d:any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <Button onClick={addDog}>Add</Button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="border rounded-2xl p-3 bg-white">
            <div className="font-medium mb-2">Log a Round</div>
            <div className="grid md:grid-cols-2 gap-3">
              <Select label="Dog" value={dogId} onChange={e => setDogId(e.target.value)}>
                <option value="">-- choose dog --</option>
                {sessionDogs.items.map((d:any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
              <Select label="Exercise" value={exerciseId} onChange={e => setExerciseId(e.target.value)}>
                <option value="">-- choose exercise --</option>
                {exercises.items.map((x:any) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
              <Select label="Planned Behavior" value={plannedBehaviorId} onChange={e => setPlannedBehaviorId(e.target.value)}>
                <option value="">-- choose behavior --</option>
                {behaviors.items.map((b:any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
              <Select label="Exhibited Behavior (optional)" value={exhibitedBehaviorId} onChange={e => setExhibitedBehaviorId(e.target.value)}>
                <option value="">(none / free text)</option>
                {behaviors.items.map((b:any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
              <Select label="Outcome" value={outcome} onChange={e => setOutcome(e.target.value)}>
                <option value="success">success</option>
                <option value="partial">partial</option>
                <option value="fail">fail</option>
              </Select>
              <Input label="Score (0-10, optional)" type="number" min={0} max={10} value={score} onChange={e => setScore(e.target.value)} />
              <Input label="Started at (RFC3339, optional)" value={startedAt} onChange={e => setStartedAt(e.target.value)} placeholder="2025-08-20T18:05:00Z" />
              <Input label="Ended at (RFC3339, optional)" value={endedAt} onChange={e => setEndedAt(e.target.value)} placeholder="2025-08-20T18:07:00Z" />
            </div>
            <Textarea label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observations…" />
            <Input label="Exhibited Free Text (optional)" value={exhibitedFreeText} onChange={e => setExhibitedFreeText(e.target.value)} placeholder="Offered down" />
            <div className="flex gap-2">
              <Button onClick={() => { const now = new Date().toISOString(); setStartedAt(now); setEndedAt(now) }}>Now</Button>
              <Button onClick={createRound}>Log Round</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="font-medium mb-2">Rounds</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white rounded-2xl border">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 border-b">#</th>
                <th className="text-left p-2 border-b">Dog</th>
                <th className="text-left p-2 border-b">Exercise</th>
                <th className="text-left p-2 border-b">Planned</th>
                <th className="text-left p-2 border-b">Exhibited</th>
                <th className="text-left p-2 border-b">Outcome</th>
                <th className="text-left p-2 border-b">Score</th>
                <th className="text-left p-2 border-b">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rounds.items.map((r:any, idx:number) => (
                <tr key={r.id || idx} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border-b">{r.round_number}</td>
                  <td className="p-2 border-b">{(sessionDogs.items.find((d:any) => d.id === r.dog_id)?.name) || r.dog_id}</td>
                  <td className="p-2 border-b">{(exercises.items.find((x:any) => x.id === r.exercise_id)?.name) || r.exercise_id}</td>
                  <td className="p-2 border-b">{(behaviors.items.find((b:any) => b.id === r.planned_behavior_id)?.name) || r.planned_behavior_id}</td>
                  <td className="p-2 border-b">{r.exhibited_behavior_id ? (behaviors.items.find((b:any) => b.id === r.exhibited_behavior_id)?.name || r.exhibited_behavior_id) : (r.exhibited_free_text || '—')}</td>
                  <td className="p-2 border-b">{r.outcome}</td>
                  <td className="p-2 border-b">{r.score ?? ''}</td>
                  <td className="p-2 border-b">{r.notes ?? ''}</td>
                </tr>
              ))}
              {!rounds.items.length && (
                <tr><td className="p-3 text-center text-gray-500" colSpan={8}>No rounds yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// --- Settings ---------------------------------------------------------------
function SettingsTab({ apiBase, setApiBase }:{ apiBase: string, setApiBase: (v:string)=>void }) {
  const [value, setValue] = useState(apiBase)
  return (
    <Section title="Settings">
      <p className="text-sm text-gray-600 mb-3">Set the API base URL. In dev the default <code>/api</code> goes through the Vite proxy to <code>http://localhost:8080</code>. For production you can point this at a full URL or configure your reverse proxy to keep the <code>/api</code> prefix.</p>
      <div className="flex gap-2 items-end max-w-xl">
        <Input label="API Base" value={value} onChange={e => setValue((e.target as HTMLInputElement).value)} />
        <Button onClick={() => setApiBase(value)}>Save</Button>
      </div>
    </Section>
  )
}