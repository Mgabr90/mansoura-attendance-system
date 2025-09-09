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
import { UserPlusIcon, LinkIcon, QrCodeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface Employee {
  id?: string
  name: string
  telegramId?: string
  department: string
  position: string
  phone?: string
  email?: string
  startDate: string
}

interface InvitationData {
  id: string
  token: string
  invitationLink: string
  status: string
  expiresAt: string
}

interface EmployeeFormProps {
  employee?: Employee
  onSubmit?: (employee: Employee) => Promise<InvitationData | void>
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
    department: employee?.department || '',
    position: employee?.position || '',
    phone: employee?.phone || '',
    email: employee?.email || '',
    startDate: employee?.startDate || new Date().toISOString().split('T')[0]
  })

  const [errors, setErrors] = useState<Partial<Employee>>({})
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null)
  const [showInvitation, setShowInvitation] = useState(false)

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

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!formData.department) {
      newErrors.department = 'Department is required'
    }
    if (!formData.position.trim()) {
      newErrors.position = 'Position is required'
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm() && onSubmit) {
      const result = await onSubmit(formData)
      
      // If invitation was generated and we received invitation data
      if (result) {
        setInvitationData(result)
        setShowInvitation(true)
      }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Link copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy link')
    })
  }

  return (
    <Card title={title} className="max-w-2xl">
      <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={handleChange('name')}
            error={errors.name}
            placeholder="Enter employee's full name"
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

        {/* Invitation Info */}
        {!employee && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <LinkIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-800">Invitation-Only Employee Registration</h3>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              All new employees must register through invitation links. After submitting this form, you'll receive an invitation link to share with the employee.
            </p>
          </div>
        )}

        {/* Invitation Display Section */}
        {showInvitation && invitationData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-medium text-green-800">Invitation Created Successfully!</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invitation Link:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={invitationData.invitationLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(invitationData.invitationLink)}
                    className="flex items-center"
                  >
                    <LinkIcon className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Status: <span className="font-medium text-blue-600">{invitationData.status}</span></span>
                <span>Expires: {new Date(invitationData.expiresAt).toLocaleDateString()}</span>
              </div>

              <div className="bg-white border border-gray-200 rounded p-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Share this link with the employee:</strong>
                </p>
                <p className="text-sm text-gray-600">
                  • The employee can click the link to automatically register
                </p>
                <p className="text-sm text-gray-600">
                  • No need to provide Telegram ID manually
                </p>
                <p className="text-sm text-gray-600">
                  • You'll be notified when they complete registration
                </p>
              </div>
            </div>
          </div>
        )}

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
{employee ? 'Update Employee' : 'Create Invitation'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default EmployeeForm