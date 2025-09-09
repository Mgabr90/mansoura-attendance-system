/**
 * ReportsPanel Component
 * Generate and display attendance reports
 */

'use client'

import React, { useState } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Select from '../ui/Select'
import { DocumentArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/outline'

interface ReportsPanelProps {
  className?: string
}

const ReportsPanel: React.FC<ReportsPanelProps> = ({ className = '' }) => {
  const [reportType, setReportType] = useState('')
  const [dateRange, setDateRange] = useState('')
  const [department, setDepartment] = useState('')

  const reportOptions = [
    { value: 'daily', label: 'Daily Attendance' },
    { value: 'weekly', label: 'Weekly Summary' },
    { value: 'monthly', label: 'Monthly Report' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'this_month', label: 'This Month' }
  ]

  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'finance', label: 'Finance' },
    { value: 'operations', label: 'Operations' }
  ]

  const handleGenerateReport = () => {
    console.log('Generating report:', { reportType, dateRange, department })
  }

  const handleExportReport = () => {
    console.log('Exporting report:', { reportType, dateRange, department })
  }

  return (
    <Card title="Reports & Analytics" className={className}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Report Type"
            options={reportOptions}
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            placeholder="Select report type"
          />
          
          <Select
            label="Date Range"
            options={dateRangeOptions}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            placeholder="Select date range"
          />
          
          <Select
            label="Department"
            options={departmentOptions}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Select department"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleGenerateReport}
            disabled={!reportType || !dateRange}
            className="flex items-center justify-center"
          >
            <ChartBarIcon className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExportReport}
            disabled={!reportType || !dateRange}
            className="flex items-center justify-center"
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Export to PDF
          </Button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Stats</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Today Present:</span>
              <span className="ml-2 font-medium">--</span>
            </div>
            <div>
              <span className="text-gray-500">Today Absent:</span>
              <span className="ml-2 font-medium">--</span>
            </div>
            <div>
              <span className="text-gray-500">Late Today:</span>
              <span className="ml-2 font-medium">--</span>
            </div>
            <div>
              <span className="text-gray-500">Attendance Rate:</span>
              <span className="ml-2 font-medium text-gray-400">-- %</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ReportsPanel