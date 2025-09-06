/**
 * AttendanceChart Component
 * Displays attendance data in a visual chart format
 */

'use client'

import React from 'react'

interface AttendanceData {
  date: string
  present: number
  absent: number
  late: number
}

interface AttendanceChartProps {
  data: AttendanceData[]
  type?: 'line' | 'bar'
  height?: number
  className?: string
}

const AttendanceChart: React.FC<AttendanceChartProps> = ({
  data,
  type = 'line',
  height = 300,
  className = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ height: `${height}px` }}>
        <p className="text-gray-500">No attendance data available</p>
      </div>
    )
  }

  // Calculate max value for scaling
  const maxValue = Math.max(...data.map(d => Math.max(d.present, d.absent, d.late)))
  const padding = 40
  const chartWidth = 600
  const chartHeight = height - (padding * 2)

  const getX = (index: number) => (index / (data.length - 1)) * (chartWidth - padding * 2) + padding
  const getY = (value: number) => chartHeight - (value / maxValue) * chartHeight + padding

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium text-gray-900">Attendance Overview</h3>
        <div className="flex space-x-6 mt-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Present</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Late</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Absent</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} className="overflow-visible">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => {
            const y = padding + (i * (chartHeight / 4))
            return (
              <g key={i}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6b7280"
                >
                  {Math.round((maxValue * (4 - i)) / 4)}
                </text>
              </g>
            )
          })}

          {/* Chart lines/bars */}
          {type === 'bar' ? (
            // Bar chart
            data.map((item, index) => {
              const x = getX(index)
              const barWidth = (chartWidth - padding * 2) / data.length * 0.8
              const barSpacing = barWidth / 3
              
              return (
                <g key={index}>
                  {/* Present bar */}
                  <rect
                    x={x - barWidth/2}
                    y={getY(item.present)}
                    width={barSpacing}
                    height={chartHeight - getY(item.present) + padding}
                    fill="#22c55e"
                  />
                  {/* Late bar */}
                  <rect
                    x={x - barSpacing/2}
                    y={getY(item.late)}
                    width={barSpacing}
                    height={chartHeight - getY(item.late) + padding}
                    fill="#f59e0b"
                  />
                  {/* Absent bar */}
                  <rect
                    x={x + barSpacing/2}
                    y={getY(item.absent)}
                    width={barSpacing}
                    height={chartHeight - getY(item.absent) + padding}
                    fill="#ef4444"
                  />
                  {/* Date label */}
                  <text
                    x={x}
                    y={height - 10}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#6b7280"
                  >
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                </g>
              )
            })
          ) : (
            // Line chart
            <>
              {/* Present line */}
              <polyline
                points={data.map((item, index) => `${getX(index)},${getY(item.present)}`).join(' ')}
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
              />
              {/* Late line */}
              <polyline
                points={data.map((item, index) => `${getX(index)},${getY(item.late)}`).join(' ')}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
              />
              {/* Absent line */}
              <polyline
                points={data.map((item, index) => `${getX(index)},${getY(item.absent)}`).join(' ')}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
              />
              
              {/* Data points */}
              {data.map((item, index) => (
                <g key={index}>
                  <circle cx={getX(index)} cy={getY(item.present)} r="4" fill="#22c55e" />
                  <circle cx={getX(index)} cy={getY(item.late)} r="4" fill="#f59e0b" />
                  <circle cx={getX(index)} cy={getY(item.absent)} r="4" fill="#ef4444" />
                  
                  {/* Date labels */}
                  <text
                    x={getX(index)}
                    y={height - 10}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#6b7280"
                  >
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                </g>
              ))}
            </>
          )}
        </svg>
      </div>
    </div>
  )
}

export default AttendanceChart