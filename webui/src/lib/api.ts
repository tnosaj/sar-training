// Offline-aware API with GET cache  write outbox.
// Keeps the apiFetch(signature) so existing code keeps working.

export const LS_KEY = 'dogtracker.apiBase'
const CACHE_PREFIX = 'dogtracker.cache.v1:'
const OUTBOX_KEY = 'dogtracker.outbox.v1'
const NET_KEY = 'dogtracker.net.v1' // {online:boolean, syncing:boolean, queue:number}

export function getInitialApiBase() {
  const saved = localStorage.getItem(LS_KEY)
  return saved || '/api'
}

// --------------------------- Network state ---------------------------------
type NetState = { online: boolean; syncing: boolean; queue: number }
function readNet(): NetState {
  try { return JSON.parse(localStorage.getItem(NET_KEY) || '') } catch { /*noop*/ }
  return { online: navigator.onLine, syncing: false, queue: getOutbox().length }
}
function writeNet(ns: NetState) {
  localStorage.setItem(NET_KEY, JSON.stringify(ns))
  window.dispatchEvent(new CustomEvent('dt:net', { detail: ns }))
}
export function getNetState(): NetState { return readNet() }

// ------------------------------- Cache -------------------------------------
function cacheKey(apiBase: string, path: string) { return `${CACHE_PREFIX}${apiBase}${path}` }
function putCache(apiBase: string, path: string, data: any) {
  try { localStorage.setItem(cacheKey(apiBase, path), JSON.stringify({ t: Date.now(), data })) } catch {}
}
function getCache(apiBase: string, path: string): any | undefined {
  try {
    const raw = localStorage.getItem(cacheKey(apiBase, path))
    if (!raw) return undefined
    const obj = JSON.parse(raw)
    return obj?.data
  } catch { return undefined }
}

// ------------------------------- Outbox ------------------------------------
type OutboxItem = { id: string; path: string; init: RequestInit; ts: number }
function getOutbox(): OutboxItem[] {
  try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]') } catch { return [] }
}
function setOutbox(items: OutboxItem[]) {
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('dt:outbox', { detail: { size: items.length } }))
  const ns = readNet(); writeNet({ ...ns, queue: items.length })
}
export function getOutboxSize() { return getOutbox().length }
function pushOutbox(item: OutboxItem) { setOutbox([...getOutbox(), item]) }

let watcherStarted = false
let watcherTimer: number | undefined

let onUnauthorized: null | (() => void) = null;
export function setUnauthorizedHandler(fn: () => void) { onUnauthorized = fn; }

export function startNetworkWatcher(apiBase: string) {
  // Debounce restarts
  if (watcherStarted && watcherTimer) { clearInterval(watcherTimer) }
  watcherStarted = true
  const tick = async () => {
    try {
      const res = await fetch(`${apiBase}/health`, { cache: 'no-store' })
      if (!res.ok) throw new Error('bad status')
      const was = readNet()
      if (!was.online) writeNet({ ...was, online: true })
      if (getOutbox().length) await flushOutbox(apiBase)
    } catch {
      const was = readNet()
      if (was.online) writeNet({ ...was, online: false })
    }
  }
  // immediate check  every 10s
  tick()
  watcherTimer = window.setInterval(tick, 10000)
  // Also react to browser online/offline events
  window.addEventListener('online', () => writeNet({ ...readNet(), online: true }))
  window.addEventListener('offline', () => writeNet({ ...readNet(), online: false }))
}

export async function flushOutbox(apiBase?: string) {
  apiBase = apiBase || (localStorage.getItem(LS_KEY) || '/api')
  const queue = getOutbox()
  if (!queue.length) return
  writeNet({ ...readNet(), syncing: true })
  try {
    while (getOutbox().length) {
      const [item, ...rest] = getOutbox()
      setOutbox(rest)
      try {
        await fetch(`${apiBase}${item.path}`, {
          headers: { 'Content-Type': 'application/json' },
          ...item.init,
        })
      } catch (e) {
        // Put it back at the end and bail until next tick
        setOutbox([...rest, item])
        throw e
      }
    }
  } finally {
    writeNet({ ...readNet(), syncing: false })
  }
}

// ------------------------------- apiFetch ----------------------------------
export async function apiFetch(path: string, opts: RequestInit = {}) {
  const apiBase = localStorage.getItem(LS_KEY) || '/api'
  const method = (opts.method || 'GET').toString().toUpperCase()
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  const res = await fetch(`${apiBase}${path}`, { headers, credentials:'include', ...opts,  })
   // 401 → notify auth layer, then throw
  if (res.status === 401) { onUnauthorized?.(); throw new Error('unauthorized') }
  if (method === 'GET') {
    try {  
      
      const text = await res.text()
      let data: any
      try { data = text ? JSON.parse(text) : undefined } catch { data = text }
      if (!res.ok) { throw new Error((data && data.error) ? data.error : `Request failed (${res.status})`) }
      putCache(apiBase, path, data)
      return data
    } catch (e) {
      // Fallback to cache
      const cached = getCache(apiBase, path)
      if (cached !== undefined) return cached
      throw e
    }
  } else {
    // Mutations: if offline, enqueue to outbox (last write wins).
    const isOnline = readNet().online && navigator.onLine
    if (!isOnline) {
      pushOutbox({ id: crypto.randomUUID(), path, init: { ...opts, headers }, ts: Date.now() })
      // Best-effort optimistic response: echo body if present
      try { return opts.body ? JSON.parse(String(opts.body)) : undefined } catch { return undefined }
    }
    // Online path
    try {
      const text = await res.text()
      let data: any
      try { data = text ? JSON.parse(text) : undefined } catch { data = text }
      if (!res.ok) { throw new Error((data && data.error) ? data.error : `Request failed (${res.status})`) }
      return data
    } catch (e) {
      // If request failed mid-air, enqueue and surface best-effort body
      pushOutbox({ id: crypto.randomUUID(), path, init: { ...opts, headers }, ts: Date.now() })
      try { return opts.body ? JSON.parse(String(opts.body)) : undefined } catch { return undefined }
    }
  }
}

// For convenience, explicit helpers (optional in callers)
export const apiGet = (path: string, opts: RequestInit = {}) => apiFetch(path, { ...opts, method: 'GET' })
export const apiMutate = (path: string, opts: RequestInit) => apiFetch(path, opts)

// In case callers want to force-clear caches (not required)
export function clearCache(prefix = CACHE_PREFIX) {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i) {
    const k = localStorage.key(i)!
    if (k.startsWith(prefix)) keys.push(k)
  }
  keys.forEach(k => localStorage.removeItem(k))
}