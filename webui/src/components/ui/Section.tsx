import React from 'react'

export function Section({ title, actions, children }:{
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 md:p-6 border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-2">{actions}</div>
      </div>
      {children}
    </div>
  )
}
