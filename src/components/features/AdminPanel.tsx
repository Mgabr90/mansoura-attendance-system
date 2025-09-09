/**
 * AdminPanel Component
 * Administrative controls and settings
 */

'use client'

import React, { useState } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Badge from '../ui/Badge'
import InvitationPanel from './InvitationPanel'
import { 
  UserGroupIcon, 
  CogIcon, 
  ShieldCheckIcon,
  ClockIcon,
  UsersIcon
} from '@heroicons/react/24/outline'

interface AdminPanelProps {
  className?: string
}

const AdminPanel: React.FC<AdminPanelProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('users')

  const tabs = [
    { id: 'users', label: 'User Management', icon: UserGroupIcon },
    { id: 'employees', label: 'Employee Management', icon: UsersIcon },
    { id: 'settings', label: 'System Settings', icon: CogIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'schedule', label: 'Work Schedule', icon: ClockIcon }
  ]

  const roleOptions = [
    { value: 'MODERATOR', label: 'Moderator' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' }
  ]

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Admin</h4>
          <div className="space-y-4">
            <Input
              label="Telegram ID"
              placeholder="@username or numeric ID"
            />
            <Input
              label="First Name"
              placeholder="Enter first name"
            />
            <Select
              label="Role"
              options={roleOptions}
              placeholder="Select role"
            />
            <Button className="w-full">
              Add Admin
            </Button>
          </div>
        </div>
        
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Active Admins</h4>
          <div className="space-y-3">
            {[1, 2, 3].map((admin) => (
              <div key={admin} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Admin {admin}</div>
                  <div className="text-sm text-gray-500">@admin{admin}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="success">Active</Badge>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 mb-4">General Settings</h4>
          <Input
            label="Organization Name"
            defaultValue="El Mansoura CIH"
          />
          <Input
            label="Work Start Time"
            type="time"
            defaultValue="09:00"
          />
          <Input
            label="Work End Time"
            type="time"
            defaultValue="17:00"
          />
          <Input
            label="Late Threshold (minutes)"
            type="number"
            defaultValue="15"
          />
        </div>
        
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Location Settings</h4>
          <Input
            label="Office Latitude"
            placeholder="31.0409"
          />
          <Input
            label="Office Longitude"
            placeholder="31.3785"
          />
          <Input
            label="Allowed Radius (meters)"
            type="number"
            defaultValue="100"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button variant="outline">
          Reset to Default
        </Button>
        <Button>
          Save Settings
        </Button>
      </div>
    </div>
  )

  const renderEmployeeManagement = () => (
    <div className="space-y-6">
      <InvitationPanel />
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return renderUserManagement()
      case 'employees':
        return renderEmployeeManagement()
      case 'settings':
        return renderSystemSettings()
      case 'security':
        return <div className="p-8 text-center text-gray-500">Security settings coming soon...</div>
      case 'schedule':
        return <div className="p-8 text-center text-gray-500">Schedule management coming soon...</div>
      default:
        return null
    }
  }

  return (
    <Card className={className}>
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
      
      <div className="mt-6">
        {renderContent()}
      </div>
    </Card>
  )
}

export default AdminPanel