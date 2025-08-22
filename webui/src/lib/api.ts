export const LS_KEY = 'dogtracker.apiBase';

export function getInitialApiBase() {
  // Default to dev proxy path. You can set a full URL in Settings later.
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
  return saved || '/api';
}

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const apiBase = (typeof localStorage !== 'undefined' ? localStorage.getItem(LS_KEY) : null) || '/api';
  const res = await fetch(`${apiBase}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : undefined; } catch { data = text; }
  if (!res.ok) {
    const err = (data && (data.error || data.message)) ? (data.error || data.message) : `Request failed (${res.status})`;
    throw new Error(err);
  }
  return data;
}
