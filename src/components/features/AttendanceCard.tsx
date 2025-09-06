/**
 * AttendanceCard Component
 * Display attendance information in a card format
 */

'use client'

import React from 'react'
import { ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import { cn } from '@/lib/utils'

interface AttendanceRecord {
  id: string
  employeeName: string
  checkInTime?: Date | string
  checkOutTime?: Date | string
  status: 'present' | 'absent' | 'late' | 'pending'
  location?: string
  notes?: string
}

interface AttendanceCardProps {
  attendance: AttendanceRecord
  className?: string
  showLocation?: boolean
  showNotes?: boolean
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({
  attendance,
  className = '',
  showLocation = true,
  showNotes = false
}) => {
  const getStatusBadge = (status: string) => {
    const badgeProps = {
      present: { variant: 'success' as const, text: 'Present' },
      absent: { variant: 'error' as const, text: 'Absent' },
      late: { variant: 'warning' as const, text: 'Late' },
      pending: { variant: 'info' as const, text: 'Pending' }
    }
    
    const props = badgeProps[status as keyof typeof badgeProps] || badgeProps.pending
    return <Badge variant={props.variant}>{props.text}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'absent':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'late':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const formatTime = (time?: Date | string) => {
    if (!time) return '--:--'
    const date = typeof time === 'string' ? new Date(time) : time
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {getStatusIcon(attendance.status)}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {attendance.employeeName}
            </h3>
            <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <span>In:</span>
                <span className="font-medium">{formatTime(attendance.checkInTime)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Out:</span>
                <span className="font-medium">{formatTime(attendance.checkOutTime)}</span>
              </div>
            </div>
            {showLocation && attendance.location && (
              <p className="mt-1 text-xs text-gray-500 truncate">
                📍 {attendance.location}
              </p>
            )}
            {showNotes && attendance.notes && (
              <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                {attendance.notes}
              </p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          {getStatusBadge(attendance.status)}
        </div>
      </div>
    </Card>
  )
}

export default AttendanceCard