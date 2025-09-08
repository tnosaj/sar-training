import React from 'react'

export function CardList<T>({
  items,
  renderItem,
  children,
  empty = 'No items yet.',
  onItemClick,
}:{
  items: T[]
  renderItem?: (item: T) => React.ReactNode
  children?: (item: T) => React.ReactNode
  empty?: string
  onItemClick?: (item: T) => void
}) {
  const renderer = renderItem ?? children
  if (!items?.length) return <p className="text-gray-500 text-sm">{empty}</p>
  return (
    <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((it, i) => (
        <li
          key={i}
          onClick={onItemClick ? () => onItemClick(it) : undefined}
          className={
            'border rounded-2xl p-4 bg-gray-50 ' +
            (onItemClick ? 'cursor-pointer hover:shadow-md transition-shadow' : '')
          }
        >
          {renderer ? renderer(it) : null}
        </li>
      ))}
    </ul>
  )
}
