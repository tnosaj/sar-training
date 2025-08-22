import React from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

export function Button({ children, onClick, type = 'button', variant = 'primary', disabled }:{
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: Variant
  disabled?: boolean
}) {
  const styles =
    variant === 'secondary' ? 'bg-gray-100 hover:bg-gray-200 text-gray-900'
    : variant === 'danger'   ? 'bg-red-600 hover:bg-red-700 text-white'
    :                          'bg-indigo-600 hover:bg-indigo-700 text-white'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${styles}`}
    >
      {children}
    </button>
  )
}
