/**
 * DepartmentChart Component
 * Custom SVG chart for department attendance
 */

'use client'

import React from 'react'
import Card from '../ui/Card'

interface DepartmentData {
  department: string
  present: number
  total: number
  attendanceRate: number
}

interface DepartmentChartProps {
  data: DepartmentData[]
  title?: string
  className?: string
}

const DepartmentChart: React.FC<DepartmentChartProps> = ({
  data,
  title = 'Department Attendance',
  className = ''
}) => {
  const maxTotal = Math.max(...data.map(d => d.total))
  const chartHeight = 300
  const barHeight = 30
  const barSpacing = 20

  return (
    <Card title={title} className={className}>
      <div className="h-80 w-full">
        <svg width="100%" height={chartHeight} className="overflow-visible">
          {data.map((dept, index) => {
            const y = index * (barHeight + barSpacing) + 20
            const barWidth = (dept.total / maxTotal) * 400
            const presentWidth = (dept.present / dept.total) * barWidth
            
            return (
              <g key={dept.department}>
                {/* Department label */}
                <text
                  x={10}
                  y={y + barHeight / 2}
                  fill="#374151"
                  fontSize="12"
                  textAnchor="start"
                  dominantBaseline="middle"
                >
                  {dept.department}
                </text>
                
                {/* Background bar */}
                <rect
                  x={120}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#E5E7EB"
                  rx={4}
                />
                
                {/* Present bar */}
                <rect
                  x={120}
                  y={y}
                  width={presentWidth}
                  height={barHeight}
                  fill="#10B981"
                  rx={4}
                />
                
                {/* Stats text */}
                <text
                  x={130 + barWidth}
                  y={y + barHeight / 2}
                  fill="#374151"
                  fontSize="11"
                  textAnchor="start"
                  dominantBaseline="middle"
                >
                  {dept.present}/{dept.total} ({dept.attendanceRate.toFixed(1)}%)
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      
      <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Present</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-gray-300 rounded"></div>
          <span>Total</span>
        </div>
      </div>
    </Card>
  )
}

export default DepartmentChart