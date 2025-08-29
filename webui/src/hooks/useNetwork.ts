import { useEffect, useState } from 'react'
import { getNetState, getOutboxSize } from '../lib/api'

type NetState = { online: boolean; syncing: boolean; queue: number }

export default function useNetwork() {
  const [state, setState] = useState<NetState>(() => ({
    ...getNetState(),
    queue: getOutboxSize(),
  }))

  useEffect(() => {
    const onNet = (e: Event) => {
      const detail = (e as CustomEvent).detail as NetState | undefined
      if (detail) setState(detail)
      else setState(s => ({ ...s, online: navigator.onLine }))
    }
    const onOutbox = () => setState(s => ({ ...s, queue: getOutboxSize() }))
    window.addEventListener('dt:net', onNet as EventListener)
    window.addEventListener('dt:outbox', onOutbox as EventListener)
    window.addEventListener('online', onNet as EventListener)
    window.addEventListener('offline', onNet as EventListener)
    return () => {
      window.removeEventListener('dt:net', onNet as EventListener)
      window.removeEventListener('dt:outbox', onOutbox as EventListener)
      window.removeEventListener('online', onNet as EventListener)
      window.removeEventListener('offline', onNet as EventListener)
    }
  }, [])

  return state
}