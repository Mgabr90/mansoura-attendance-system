/**
 * LoginForm Component
 * Admin authentication form
 */

'use client'

import React, { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import { UserIcon } from '@heroicons/react/24/outline'

interface LoginFormProps {
  onSubmit?: (telegramId: string) => Promise<void>
  loading?: boolean
  error?: string
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  loading = false,
  error
}) => {
  const [telegramId, setTelegramId] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit && telegramId.trim()) {
      await onSubmit(telegramId.trim())
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your Telegram ID to access the system
          </p>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-6">
          <Input
            label="Telegram ID"
            type="text"
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            placeholder="@username or numeric ID"
            error={error}
            required
            icon={<UserIcon className="h-5 w-5" />}
          />

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={!telegramId.trim() || loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Only authorized administrators can access this system.
            <br />
            Contact your system administrator if you need access.
          </p>
        </div>
      </Card>
    </div>
  )
}

export default LoginForm