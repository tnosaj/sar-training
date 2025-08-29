import React from 'react'
import useNetwork from '../hooks/useNetwork'

export default function OfflineBanner() {
  const { online, syncing, queue } = useNetwork()
  if (online && !syncing && queue === 0) return null
  return (
    <div
      className={`w-full border-b ${online
        ? 'bg-amber-50 border-amber-200 text-amber-800'
        : 'bg-red-50 border-red-200 text-red-800'}`}
    >
      <div className="max-w-6xl mx-auto px-4 py-2 text-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!online && <span>⚠️ Offline. Using local cache.</span>}
          {online && syncing && <span>⏫ Syncing {queue} queued change{queue === 1 ? '' : 's'}…</span>}
          {online && !syncing && queue > 0 && <span>⏳ {queue} change{queue === 1 ? '' : 's'} queued</span>}
        </div>
        <div className="text-xs opacity-70">
          {online ? 'Online' : 'Offline'}
          {syncing ? ' · Syncing' : ''}
          {queue ? ` · Queue: ${queue}` : ''}
        </div>
      </div>
    </div>
  )
}