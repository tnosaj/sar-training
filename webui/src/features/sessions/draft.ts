// Local draft queue storage for a session

export type DraftItem = {
  dog_id: number
  exercise_id: number
  planned_behavior_id: number
}

const key = (sessionId: number) => `sessionDraft:${sessionId}`

export function loadDraft(sessionId: number): DraftItem[] {
  try {
    const raw = localStorage.getItem(key(sessionId))
    return raw ? JSON.parse(raw) as DraftItem[] : []
  } catch {
    return []
  }
}

export function saveDraft(sessionId: number, items: DraftItem[]) {
  localStorage.setItem(key(sessionId), JSON.stringify(items))
}

export function clearDraft(sessionId: number) {
  localStorage.removeItem(key(sessionId))
}

