import React, { useState } from 'react'
import { LS_KEY } from '../../lib/api'
import { Section } from '../../components/ui/Section'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export default function SettingsPage({ apiBase, setApiBase }:{ apiBase: string, setApiBase: (v: string) => void }) {
  const [value, setValue] = useState(apiBase)
  return (
    <Section title="Settings">
      <p className="text-sm text-gray-600 mb-3">
        Set the API base URL. In dev the default <code>/api</code> goes through the Vite proxy
        to <code>http://localhost:8080</code>. For production you can point this at a full URL
        or configure your reverse proxy to keep the <code>/api</code> prefix.
      </p>
      <div className="flex gap-2 items-end max-w-xl">
        <Input label="API Base" value={value} onChange={e => setValue((e.target as HTMLInputElement).value)} />
        <Button onClick={() => { setApiBase(value); localStorage.setItem(LS_KEY, value) }}>Save</Button>
      </div>
    </Section>
  )
}
