/**
 * AttendanceForm Component
 * Form for manual attendance entry/correction
 */

'use client'

import React, { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Card from '../ui/Card'
import { ClockIcon } from '@heroicons/react/24/outline'

interface AttendanceData {
  employeeId: string
  date: string
  checkInTime?: string
  checkOutTime?: string
  status: 'present' | 'absent' | 'late' | 'excused'
  notes?: string
}

interface AttendanceFormProps {
  attendance?: AttendanceData
  onSubmit?: (attendance: AttendanceData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  title?: string
  employees?: Array<{ id: string; name: string }>
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({
  attendance,
  onSubmit,
  onCancel,
  loading = false,
  title = 'Manual Attendance Entry',
  employees = []
}) => {
  const [formData, setFormData] = useState<AttendanceData>({
    employeeId: attendance?.employeeId || '',
    date: attendance?.date || new Date().toISOString().split('T')[0],
    checkInTime: attendance?.checkInTime || '',
    checkOutTime: attendance?.checkOutTime || '',
    status: attendance?.status || 'present',
    notes: attendance?.notes || ''
  })

  const statusOptions = [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'excused', label: 'Excused Absence' }
  ]

  const employeeOptions = employees.map(emp => ({
    value: emp.id,
    label: emp.name
  }))

  const handleChange = (field: keyof AttendanceData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      await onSubmit(formData)
    }
  }

  return (
    <Card title={title} className="max-w-lg">
      <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-6">
        <Select
          label="Employee"
          options={employeeOptions}
          value={formData.employeeId}
          onChange={handleChange('employeeId')}
          placeholder="Select employee"
          required
        />

        <Input
          label="Date"
          type="date"
          value={formData.date}
          onChange={handleChange('date')}
          required
        />

        <Select
          label="Status"
          options={statusOptions}
          value={formData.status}
          onChange={handleChange('status')}
          required
        />

        {(formData.status === 'present' || formData.status === 'late') && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Check In Time"
              type="time"
              value={formData.checkInTime}
              onChange={handleChange('checkInTime')}
            />
            <Input
              label="Check Out Time"
              type="time"
              value={formData.checkOutTime}
              onChange={handleChange('checkOutTime')}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Additional notes or comments"
            value={formData.notes}
            onChange={handleChange('notes')}
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            loading={loading}
            disabled={loading || !formData.employeeId}
            className="flex items-center"
          >
            <ClockIcon className="w-4 h-4 mr-2" />
            {attendance ? 'Update Attendance' : 'Record Attendance'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default AttendanceForm