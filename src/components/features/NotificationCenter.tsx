/**
 * NotificationCenter Component
 * Displays system notifications and alerts
 */

'use client'

import React, { useState, useEffect } from 'react'
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import Card from '../ui/Card'
import Button from '../ui/Button'

export interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'danger'
  }>
}

interface NotificationCenterProps {
  notifications?: Notification[]
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onDismiss?: (id: string) => void
  className?: string
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  className = ''
}) => {
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications)

  useEffect(() => {
    setLocalNotifications(notifications)
  }, [notifications])

  const getIcon = (type: Notification['type']) => {
    const iconClass = "h-5 w-5"
    
    switch (type) {
      case 'success':
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />
      case 'warning':
        return <ExclamationTriangleIcon className={`${iconClass} text-yellow-500`} />
      case 'error':
        return <ExclamationTriangleIcon className={`${iconClass} text-red-500`} />
      case 'info':
      default:
        return <InformationCircleIcon className={`${iconClass} text-blue-500`} />
    }
  }

  const getBorderColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500'
      case 'warning':
        return 'border-l-yellow-500'
      case 'error':
        return 'border-l-red-500'
      case 'info':
      default:
        return 'border-l-blue-500'
    }
  }

  const handleMarkAsRead = (id: string) => {
    setLocalNotifications(prev => 
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    )
    onMarkAsRead?.(id)
  }

  const handleDismiss = (id: string) => {
    setLocalNotifications(prev => prev.filter(notif => notif.id !== id))
    onDismiss?.(id)
  }

  const handleMarkAllAsRead = () => {
    setLocalNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
    onMarkAllAsRead?.()
  }

  const unreadCount = localNotifications.filter(n => !n.read).length

  if (localNotifications.length === 0) {
    return (
      <Card className={className}>
        <Card.Header>
          <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
        </Card.Header>
        <Card.Body>
          <div className="text-center py-6">
            <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No notifications at this time</p>
          </div>
        </Card.Body>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unreadCount} unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="divide-y divide-gray-200">
          {localNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-l-4 ${getBorderColor(notification.type)} ${
                !notification.read ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium ${
                        !notification.read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {notification.timestamp.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <button
                          onClick={() => handleDismiss(notification.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className={`mt-1 text-sm ${
                      !notification.read ? 'text-gray-700' : 'text-gray-500'
                    }`}>
                      {notification.message}
                    </p>
                    
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="mt-3 flex space-x-2">
                        {notification.actions.map((action, index) => (
                          <Button
                            key={index}
                            size="sm"
                            variant={action.variant || 'secondary'}
                            onClick={action.onClick}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  )
}

export default NotificationCenter
export type { Notification as NotificationItem }