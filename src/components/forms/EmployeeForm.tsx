/**
 * EmployeeForm Component
 * Form for adding/editing employee information
 */

'use client'

import React, { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Card from '../ui/Card'
import { UserPlusIcon } from '@heroicons/react/24/outline'

interface Employee {
  id?: string
  name: string
  telegramId: string
  department: string
  position: string
  phone?: string
  email?: string
  startDate: string
}

interface EmployeeFormProps {
  employee?: Employee
  onSubmit?: (employee: Employee) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  title?: string
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  onSubmit,
  onCancel,
  loading = false,
  title = 'Add New Employee'
}) => {
  const [formData, setFormData] = useState<Employee>({
    name: employee?.name || '',
    telegramId: employee?.telegramId || '',
    department: employee?.department || '',
    position: employee?.position || '',
    phone: employee?.phone || '',
    email: employee?.email || '',
    startDate: employee?.startDate || new Date().toISOString().split('T')[0]
  })

  const [errors, setErrors] = useState<Partial<Employee>>({})

  const departmentOptions = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'finance', label: 'Finance' },
    { value: 'operations', label: 'Operations' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'sales', label: 'Sales' }
  ]

  const handleChange = (field: keyof Employee) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Employee> = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.telegramId.trim()) newErrors.telegramId = 'Telegram ID is required'
    if (!formData.department) newErrors.department = 'Department is required'
    if (!formData.position.trim()) newErrors.position = 'Position is required'
    if (!formData.startDate) newErrors.startDate = 'Start date is required'

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm() && onSubmit) {
      await onSubmit(formData)
    }
  }

  return (
    <Card title={title} className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={handleChange('name')}
            error={errors.name}
            placeholder="Enter employee's full name"
            required
          />

          <Input
            label="Telegram ID"
            value={formData.telegramId}
            onChange={handleChange('telegramId')}
            error={errors.telegramId}
            placeholder="@username or numeric ID"
            required
          />

          <Select
            label="Department"
            options={departmentOptions}
            value={formData.department}
            onChange={handleChange('department')}
            error={errors.department}
            placeholder="Select department"
            required
          />

          <Input
            label="Position"
            value={formData.position}
            onChange={handleChange('position')}
            error={errors.position}
            placeholder="Job title or position"
            required
          />

          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={handleChange('phone')}
            error={errors.phone}
            placeholder="Optional phone number"
          />

          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            error={errors.email}
            placeholder="Optional email address"
          />

          <Input
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={handleChange('startDate')}
            error={errors.startDate}
            required
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
            disabled={loading}
            className="flex items-center"
          >
            <UserPlusIcon className="w-4 h-4 mr-2" />
            {employee ? 'Update Employee' : 'Add Employee'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default EmployeeForm