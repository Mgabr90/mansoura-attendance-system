/**
 * Footer Component
 * Application footer
 */

'use client'

import React from 'react'

interface FooterProps {
  className?: string
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={`bg-white border-t border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              © {currentYear} El Mansoura CIH. All rights reserved.
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-sm text-gray-500">
                Attendance Management System v2.0.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer