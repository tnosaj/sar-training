import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiFetch, setUnauthorizedHandler } from '../lib/api'

type User = { id: number; email: string } | null

type AuthContextType = {
  user: User
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthCtx = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)

  // When any API call hits 401, auto “log out” in the UI
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
    })
    // initial /me check
    ;(async () => {
      try {
        const me = await apiFetch('/auth/me')       // <— adjust if your backend path differs
        setUser(me)
      } catch (e) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const login = async (email: string, password: string) => {
    // NOTE: assumes cookie-based session, not token; backend should set Set-Cookie
    await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    // re-fetch /me
    const me = await apiFetch('/auth/me')
    setUser(me)
  }

  const logout = async () => {
    try { await apiFetch('/auth/logout', { method: 'POST' }) } catch { /* ignore */ }
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
