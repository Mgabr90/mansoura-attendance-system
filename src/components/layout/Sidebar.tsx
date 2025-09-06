/**
 * Sidebar Component
 * Navigation sidebar with menu items
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  UsersIcon, 
  ChartBarIcon, 
  CogIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  current?: boolean
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Employees', href: '/admin/employees', icon: UsersIcon },
  { name: 'Attendance', href: '/admin/attendance', icon: ClipboardDocumentListIcon },
  { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon },
  { name: 'Calendar', href: '/admin/calendar', icon: CalendarDaysIcon },
  { name: 'Settings', href: '/admin/settings', icon: CogIcon },
]

interface SidebarProps {
  className?: string
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const pathname = usePathname()

  return (
    <div className={`flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r border-gray-200 ${className}`}>
      <div className="flex items-center flex-shrink-0 px-4">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">CIH</span>
        </div>
        <span className="ml-2 text-sm font-medium text-gray-900">
          Admin Panel
        </span>
      </div>
      
      <div className="mt-5 flex-grow flex flex-col">
        <nav className="flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href as any}
                className={cn(
                  isActive
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 border-r-2'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center px-2 py-2 text-sm font-medium'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 flex-shrink-0 h-6 w-6'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500">
          <div>Version 2.0.0</div>
          <div className="mt-1">
            © 2024 El Mansoura CIH
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar