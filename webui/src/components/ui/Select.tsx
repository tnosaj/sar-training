import React from 'react'
import { cx } from '../../lib/cx'

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const { label, className, children, ...rest } = props
  return (
    <label className="block text-sm mb-2">
      <div className="mb-1 text-gray-700">{label}</div>
      <select {...rest} className={cx('w-full rounded-xl border px-3 py-2 bg-white', className)}>
        {children}
      </select>
    </label>
  )
}
