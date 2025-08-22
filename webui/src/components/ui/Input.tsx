import React from 'react'
import { cx } from '../../lib/cx'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, className, ...rest } = props
  return (
    <label className="block text-sm mb-2">
      <div className="mb-1 text-gray-700">{label}</div>
      <input {...rest} className={cx('w-full rounded-xl border px-3 py-2', className)} />
    </label>
  )
}
