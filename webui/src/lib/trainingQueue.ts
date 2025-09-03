export type QueueItem = {
  id: string          // unique per entry (dog can repeat)
  dogId: number
  exerciseId?: number
  behaviorId?: number
}

const QKEY = (sessionId: number) => `queue:${sessionId}`
const TKEY = 'queue:templates'  // Record<string, QueueItem[]>

export function loadQueue(sessionId: number): QueueItem[] {
  try { return JSON.parse(localStorage.getItem(QKEY(sessionId)) || '[]') } catch { return [] }
}
export function saveQueue(sessionId: number, items: QueueItem[]) {
  localStorage.setItem(QKEY(sessionId), JSON.stringify(items))
}

export function uid(prefix = 'q'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export function loadTemplates(): Record<string, QueueItem[]> {
  try { return JSON.parse(localStorage.getItem(TKEY) || '{}') } catch { return {} }
}
export function saveTemplate(name: string, items: QueueItem[]) {
  const all = loadTemplates()
  all[name] = items
  localStorage.setItem(TKEY, JSON.stringify(all))
}
