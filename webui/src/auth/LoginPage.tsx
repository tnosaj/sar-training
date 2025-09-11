import React, { useState } from 'react'
import { useAuth } from './AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Section } from '../components/ui/Section'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string|null>(null)

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try { await login(email, password) }
    catch (err:any) { setError(err?.message || 'Login failed') }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <form onSubmit={onSubmit} className="w-full max-w-sm">
        <Section title="Sign in">
          {error && <div className="mb-3 text-sm text-red-600">⚠️ {error}</div>}
          <Input label="Email" value={email} onChange={e => setEmail((e.target as HTMLInputElement).value)} />
          <Input label="Password" type="password" value={password} onChange={e => setPassword((e.target as HTMLInputElement).value)} />
          <div className="mt-2"><Button type="submit">Sign in</Button></div>
        </Section>
      </form>
    </div>
  )
}
