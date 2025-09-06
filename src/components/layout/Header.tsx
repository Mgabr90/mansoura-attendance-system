/**
 * Header Component
 * Application header with navigation and user actions
 */

'use client'

import React from 'react'
import { Bars3Icon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/src'
import Button from '../ui/Button'

interface HeaderProps {
  onMenuClick?: () => void
  className?: string
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  className = ''
}) => {
  const { user, logout } = useAuth()

  return (
    <div className={`bg-white shadow ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
              onClick={onMenuClick}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 ml-4">
                El Mansoura CIH
              </h1>
              <span className="ml-2 text-sm text-gray-500">
                Attendance System
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="text-gray-400 hover:text-gray-500">
              <BellIcon className="h-6 w-6" />
            </button>

            {/* User menu */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-gray-500 capitalize">
                      {user.role.toLowerCase()}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={logout}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-500">Not logged in</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header