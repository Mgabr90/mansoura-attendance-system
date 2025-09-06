/**
 * TrendChart Component
 * Custom SVG line chart for attendance trends
 */

'use client'

import React from 'react'
import Card from '../ui/Card'

interface TrendData {
  date: string
  value: number
  label?: string
}

interface TrendChartProps {
  data: TrendData[]
  title?: string
  className?: string
  color?: string
}

const TrendChart: React.FC<TrendChartProps> = ({
  data,
  title = 'Attendance Trend',
  className = '',
  color = '#6366F1'
}) => {
  if (!data.length) {
    return (
      <Card title={title} className={className}>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </Card>
    )
  }

  const width = 500
  const height = 200
  const padding = 40

  const minValue = Math.min(...data.map(d => d.value))
  const maxValue = Math.max(...data.map(d => d.value))
  const valueRange = maxValue - minValue

  // Generate path for the line
  const pathData = data.map((point, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding)
    const y = padding + (1 - (point.value - minValue) / valueRange) * (height - 2 * padding)
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  return (
    <Card title={title} className={className}>
      <div className="w-full overflow-x-auto">
        <svg width={width} height={height + 60} className="min-w-full">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((line) => {
            const y = padding + (line / 4) * (height - 2 * padding)
            return (
              <line
                key={line}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
            )
          })}
          
          {/* Y-axis labels */}
          {[0, 1, 2, 3, 4].map((tick) => {
            const y = padding + (tick / 4) * (height - 2 * padding)
            const value = maxValue - (tick / 4) * valueRange
            return (
              <text
                key={tick}
                x={padding - 10}
                y={y}
                fill="#6B7280"
                fontSize="10"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {Math.round(value)}
              </text>
            )
          })}
          
          {/* X-axis labels */}
          {data.map((point, index) => {
            const x = padding + (index / (data.length - 1)) * (width - 2 * padding)
            return (
              <text
                key={index}
                x={x}
                y={height + 20}
                fill="#6B7280"
                fontSize="10"
                textAnchor="middle"
              >
                {new Date(point.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </text>
            )
          })}
          
          {/* Trend line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {data.map((point, index) => {
            const x = padding + (index / (data.length - 1)) * (width - 2 * padding)
            const y = padding + (1 - (point.value - minValue) / valueRange) * (height - 2 * padding)
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill={color}
                stroke="white"
                strokeWidth="2"
              >
                <title>{`${point.label || point.date}: ${point.value}`}</title>
              </circle>
            )
          })}
        </svg>
      </div>
      
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-600">
          Range: {minValue} - {maxValue} | Trend: {data.length} data points
        </div>
      </div>
    </Card>
  )
}

export default TrendChart