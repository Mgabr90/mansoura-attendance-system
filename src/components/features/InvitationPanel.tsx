/**
 * InvitationPanel Component
 * Manage employee invitations - view, resend, cancel
 */

'use client'

import React, { useState, useEffect } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { 
  LinkIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface Invitation {
  id: string
  token: string
  firstName: string
  lastName?: string
  department?: string
  position?: string
  email?: string
  phoneNumber?: string
  invitedBy: string
  invitedAt: string
  acceptedAt?: string
  expiresAt: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
  employee?: {
    id: number
    telegramId: string
    firstName: string
    lastName?: string
    registeredAt: string
  }
}

interface InvitationPanelProps {
  className?: string
}

const InvitationPanel: React.FC<InvitationPanelProps> = ({ className = '' }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'EXPIRED'>('ALL')

  useEffect(() => {
    fetchInvitations()
  }, [filter])

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const params = filter !== 'ALL' ? `?status=${filter}` : ''
      const response = await fetch(`/api/invitations${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setInvitations(data.data.invitations || [])
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResendInvitation = async (token: string) => {
    try {
      const response = await fetch(`/api/invitations/${token}/manage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'resend' }),
      })

      if (response.ok) {
        alert('Invitation resent successfully!')
        fetchInvitations()
      } else {
        alert('Failed to resend invitation')
      }
    } catch (error) {
      console.error('Error resending invitation:', error)
      alert('Error resending invitation')
    }
  }

  const handleCancelInvitation = async (token: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return
    }

    try {
      const response = await fetch(`/api/invitations/${token}/manage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      })

      if (response.ok) {
        alert('Invitation cancelled successfully!')
        fetchInvitations()
      } else {
        alert('Failed to cancel invitation')
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      alert('Error cancelling invitation')
    }
  }

  const copyInvitationLink = (token: string) => {
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'CIH_Mansoura_bot'
    const link = `https://t.me/${botUsername}?start=invite_${token}`
    navigator.clipboard.writeText(link).then(() => {
      alert('Invitation link copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy link')
    })
  }

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date()
    
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant={isExpired ? 'error' : 'warning'}>
            {isExpired ? 'EXPIRED' : 'PENDING'}
          </Badge>
        )
      case 'ACCEPTED':
        return <Badge variant="success">ACCEPTED</Badge>
      case 'CANCELLED':
        return <Badge variant="error">CANCELLED</Badge>
      case 'EXPIRED':
        return <Badge variant="error">EXPIRED</Badge>
      default:
        return <Badge variant="default">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="h-4 w-4" />
      case 'ACCEPTED':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'CANCELLED':
      case 'EXPIRED':
        return <XCircleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const filteredInvitations = invitations.filter(invitation => {
    if (filter === 'ALL') return true
    
    // Handle expired invitations
    const isExpired = new Date(invitation.expiresAt) < new Date()
    if (filter === 'EXPIRED') {
      return invitation.status === 'EXPIRED' || (invitation.status === 'PENDING' && isExpired)
    }
    
    return invitation.status === filter
  })

  if (loading) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card title="Invitation Management" className={className}>
      <div className="space-y-6">
        {/* Filter Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {['ALL', 'PENDING', 'ACCEPTED', 'EXPIRED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === status
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
          </nav>
        </div>

        {/* Invitations List */}
        {filteredInvitations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No invitations found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(invitation.status)}
                      <h3 className="font-medium text-gray-900">
                        {invitation.firstName} {invitation.lastName || ''}
                      </h3>
                      {getStatusBadge(invitation.status, invitation.expiresAt)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Department:</span> {invitation.department || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Position:</span> {invitation.position || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {invitation.email || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {invitation.phoneNumber || 'N/A'}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      <div>Invited: {new Date(invitation.invitedAt).toLocaleDateString()}</div>
                      <div>Expires: {new Date(invitation.expiresAt).toLocaleDateString()}</div>
                      {invitation.acceptedAt && (
                        <div>Accepted: {new Date(invitation.acceptedAt).toLocaleDateString()}</div>
                      )}
                    </div>

                    {invitation.employee && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                        <strong>✅ Employee Created:</strong> {invitation.employee.firstName} {invitation.employee.lastName} 
                        (ID: {invitation.employee.telegramId})
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    {invitation.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyInvitationLink(invitation.token)}
                          className="flex items-center"
                        >
                          <LinkIcon className="w-3 h-3 mr-1" />
                          Copy Link
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvitation(invitation.token)}
                          className="flex items-center"
                        >
                          <ArrowPathIcon className="w-3 h-3 mr-1" />
                          Resend
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelInvitation(invitation.token)}
                          className="flex items-center text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircleIcon className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={fetchInvitations}
            disabled={loading}
            className="flex items-center"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default InvitationPanel