/**
 * EmployeeList Component
 * Display list of employees with their attendance status
 */

'use client'

import React from 'react'
import Card from '../ui/Card'
import Table from '../ui/Table'
import Badge from '../ui/Badge'

interface Employee {
  id: string
  name: string
  telegramId: string
  department: string
  status: 'active' | 'inactive'
  role: string
  lastSeen?: Date
}

interface EmployeeListProps {
  employees: Employee[]
  loading?: boolean
  onEmployeeSelect?: (employee: Employee) => void
}

const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  loading = false,
  onEmployeeSelect
}) => {
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'department', label: 'Department' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'lastSeen', label: 'Last Seen' }
  ]

  const tableData = employees.map(employee => ({
    ...employee,
    status: (
      <Badge variant={employee.status === 'active' ? 'success' : 'error'}>
        {employee.status}
      </Badge>
    ),
    lastSeen: employee.lastSeen 
      ? new Date(employee.lastSeen).toLocaleDateString()
      : 'Never'
  }))

  if (loading) {
    return (
      <Card>
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading employees...</div>
        </div>
      </Card>
    )
  }

  return (
    <Card title="Employee Management">
      <Table
        columns={columns}
        data={tableData}
        emptyMessage="No employees found"
      />
    </Card>
  )
}

export default EmployeeList