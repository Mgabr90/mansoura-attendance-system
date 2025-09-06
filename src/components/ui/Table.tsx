/**
 * Table Component
 * Reusable table component
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface Column {
  key: string
  label: string
  width?: string
  sortable?: boolean
}

interface TableProps {
  columns: Column[]
  data: any[]
  onSort?: (key: string) => void
  className?: string
  emptyMessage?: string
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
  onSort,
  className = '',
  emptyMessage = 'No data available'
}) => {
  return (
    <div className={cn('overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg', className)}>
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  column.sortable && onSort && 'cursor-pointer hover:bg-gray-100'
                )}
                style={{ width: column.width }}
                onClick={() => column.sortable && onSort && onSort(column.key)}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Table