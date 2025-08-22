import { useEffect, useState } from 'react'

export function useList<T>(fetcher: () => Promise<T[]>, deps: any[] = []) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetcher()
      setItems(data || [])
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { items, loading, error, reload, setItems }
}
