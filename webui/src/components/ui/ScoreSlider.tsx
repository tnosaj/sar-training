import React, { useEffect, useMemo, useState } from 'react'

type Props = {
  label?: string
  min?: number
  max?: number
  step?: number
  /** Uncontrolled: starting value (defaults to midpoint of min/max). Ignored when `value` is provided. */
  initialValue?: number
  /** Controlled value. If provided, the component reflects this value and never manages its own state. */
  value?: number
  onChange?: (value: number) => void
  showValue?: boolean
  disabled?: boolean
  className?: string
}

export default function ScoreSlider({
  label = 'Score',
  min = 0,
  max = 10,
  step = 1,
  initialValue,
  value,
  onChange,
  showValue = true,
  disabled = false,
  className = '',
}: Props) {
  // default midpoint if no initialValue provided
  const midpoint = useMemo(() => Math.round((min + max) / 2), [min, max])
  const start = initialValue ?? midpoint

  // Uncontrolled internal state (ignored when `value` prop is provided)
  const [inner, setInner] = useState<number>(value ?? start)

  // Keep internal state in sync when parent controls `value`
  useEffect(() => {
    if (value !== undefined) setInner(value)
  }, [value])

  // Recompute default if min/max/initialValue change and we're uncontrolled
  useEffect(() => {
    if (value === undefined) setInner(initialValue ?? midpoint)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue, min, max])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value)
    if (value === undefined) setInner(next) // uncontrolled
    onChange?.(next)
  }

  return (
    <label className={`block text-sm ${className}`}>
      <div className="mb-1 text-gray-700 flex items-center justify-between">
        <span>{label}</span>
        {showValue && <span className="text-gray-500 tabular-nums">{inner}</span>}
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={inner}
        onChange={handleChange}
        disabled={disabled}
        className="w-full accent-indigo-600"
      />

      {/* Optional ticks (purely visual) */}
      <div className="mt-1 flex justify-between text-[11px] text-gray-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </label>
  )
}
