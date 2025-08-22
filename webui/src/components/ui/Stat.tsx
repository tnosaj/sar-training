import React from 'react'

export function Stat({ label, value }:{ label: string, value: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-2xl p-4">
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}
