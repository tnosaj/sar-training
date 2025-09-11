import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

type User = { id:number; email:string; is_admin:boolean } | null
type Ctx = { user:User; loading:boolean; login:(email:string, password:string)=>Promise<void>; logout:()=>Promise<void> }

const AuthCtx = createContext<Ctx>({ user:null, loading:true, login:async()=>{}, logout:async()=>{} })
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }:{ children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try { const me = await apiFetch('/auth/me'); setUser(me) }
    catch { setUser(null) }
    finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [])

  const login = async (email:string, password:string) => {
    await apiFetch('/auth/login', { method:'POST', body: JSON.stringify({ email, password }) })
    await refresh()
  }
  const logout = async () => {
    await apiFetch('/auth/logout', { method:'POST' })
    setUser(null)
  }

  return <AuthCtx.Provider value={{ user, loading, login, logout }}>{children}</AuthCtx.Provider>
}
