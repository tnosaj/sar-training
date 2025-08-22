import React, { useEffect, useState } from 'react'
import { getInitialApiBase, LS_KEY } from './lib/api'
import Dashboard from './features/dashboard/Dashboard'
import SkillsPage from './features/skills/SkillsPage'
import BehaviorsPage from './features/behaviors/BehaviorsPage'
import ExercisesPage from './features/exercises/ExercisesPage'
import DogsPage from './features/dogs/DogsPage'
import SessionsPage from './features/sessions/SessionsPage'
import SettingsPage from './features/settings/SettingsPage'
import { cx } from './lib/cx'

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'skills', label: 'Skills' },
  { key: 'behaviors', label: 'Behaviors' },
  { key: 'exercises', label: 'Exercises' },
  { key: 'dogs', label: 'Dogs' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'settings', label: 'Settings' },
] as const

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
        {tab === 'skills' && <SkillsPage />}
        {tab === 'behaviors' && <BehaviorsPage />}
        {tab === 'exercises' && <ExercisesPage />}
        {tab === 'dogs' && <DogsPage />}
        {tab === 'sessions' && <SessionsPage />}
        {tab === 'settings' && <SettingsPage apiBase={apiBase} setApiBase={setApiBase} />}
      </main>

      <footer className="py-8 text-center text-xs text-gray-500">API base: {apiBase}</footer>
    </div>
  )
}
