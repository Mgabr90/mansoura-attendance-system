/**
 * useAuth Hook - Authentication State Management
 * Manages user authentication, login, logout, and session state
 */

'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import AuthService from '@/lib/auth'
import type { Admin as User } from '@prisma/client'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  const authService = new AuthService()

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const setUser = useCallback((user: User | null) => {
    setState(prev => ({ ...prev, user }))
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Set user data
      setUser(data.user)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, setUser])

  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      
      await fetch('/api/auth/logout', {
        method: 'POST',
      })

      setUser(null)
      setError(null)
    } catch (error) {
      console.error('Logout error:', error)
      // Clear user even if logout request fails
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [setLoading, setUser, setError])

  const checkAuth = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [setLoading, setUser])

  const clearError = useCallback(() => {
    setError(null)
  }, [setError])

  // Check authentication on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const value: AuthContextType = {
    user: state.user,
    loading: state.loading,
    error: state.error,
    login,
    logout,
    checkAuth,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use the auth context
const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { useAuth }
export default useAuth 