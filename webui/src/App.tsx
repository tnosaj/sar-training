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
import Select from './components/Select'
import { useTranslation } from 'react-i18next'

const TABS = [
  { key: 'dashboard', labelKey: 'nav.dashboard' },
  { key: 'skills',    labelKey: 'nav.skills' },
  { key: 'behaviors', labelKey: 'nav.behaviors' },
  { key: 'exercises', labelKey: 'nav.exercises' },
  { key: 'dogs',      labelKey: 'nav.dogs' },
  { key: 'sessions',  labelKey: 'nav.sessions' },
  { key: 'settings',  labelKey: 'nav.settings' },
] as const

export default function App() {
  const [apiBase, setApiBase] = useState(getInitialApiBase())
  useEffect(() => { localStorage.setItem(LS_KEY, apiBase) }, [apiBase])
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('dashboard')
  const { t, i18n } = useTranslation()
   const currentLng = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">🐾 {t('app.title')}</h1>
          <div className="flex items-center gap-3">
            <nav className="flex gap-2 overflow-x-auto">
              {TABS.map(tb => (
                <button key={tb.key} onClick={() => setTab(tb.key)}
                  className={cx('px-3 py-1.5 rounded-xl text-sm', tab === tb.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200')}>
                  {t(tb.labelKey)}
                </button>
              ))}
            </nav>
            <div className="hidden md:block w-36">
              <Select
                label={t('nav.language')}
                value={currentLng}
                onChange={e => i18n.changeLanguage((e.target as HTMLSelectElement).value)}
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </Select>
            </div>
          </div>
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
