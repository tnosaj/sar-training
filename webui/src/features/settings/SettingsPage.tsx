import React, { useState } from 'react'
import { LS_KEY } from '../../lib/api'
import { Section } from '../../components/ui/Section'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { useTranslation } from 'react-i18next'

export default function SettingsPage({ apiBase, setApiBase }:{ apiBase: string, setApiBase: (v: string) => void }) {
  const [value, setValue] = useState(apiBase)
  const { t, i18n } = useTranslation()
  const currentLng = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0]
  return (
    <Section title={t('settings.title')}>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <Select
            label={t('settings.language')}
            value={currentLng}
            onChange={e => i18n.changeLanguage((e.target as HTMLSelectElement).value)}
          >
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </Select>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        {t('settings.blurb')}
      </p>
      <div className="flex gap-2 items-end max-w-xl">
        <Input label={t('settings.api_base')} value={value} onChange={e => setValue((e.target as HTMLInputElement).value)} />
        <Button onClick={() => setApiBase(value)}>{t('settings.save')}</Button>
      </div>
    </Section>
  )
}
