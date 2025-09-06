/**
 * Layout Component
 * Main application layout wrapper
 */

'use client'

import React from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
  className?: string
}

const Layout: React.FC<LayoutProps> = ({
  children,
  showSidebar = true,
  className = ''
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <Header />
      
      <div className="flex">
        {showSidebar && (
          <div className="hidden md:flex md:flex-shrink-0">
            <div className="flex flex-col w-64">
              <Sidebar />
            </div>
          </div>
        )}
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout