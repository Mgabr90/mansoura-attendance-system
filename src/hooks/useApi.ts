/**
 * useApi Hook - API Request Management
 * Provides utilities for making API requests with loading states and error handling
 */

'use client'

import { useState, useCallback } from 'react'

interface ApiState<T = any> {
  data: T | null
  loading: boolean
  error: string | null
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function useApi<T = any>(initialData: T | null = null) {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null
  })

  const request = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed')
      }

      setState({
        data: data.data || data,
        loading: false,
        error: null
      })

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))

      return {
        success: false,
        error: errorMessage
      }
    }
  }, [])

  const get = useCallback((url: string, options: RequestInit = {}) => {
    return request(url, { ...options, method: 'GET' })
  }, [request])

  const post = useCallback((url: string, data: any, options: RequestInit = {}) => {
    return request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    })
  }, [request])

  const put = useCallback((url: string, data: any, options: RequestInit = {}) => {
    return request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }, [request])

  const del = useCallback((url: string, options: RequestInit = {}) => {
    return request(url, { ...options, method: 'DELETE' })
  }, [request])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }))
  }, [])

  return {
    ...state,
    request,
    get,
    post,
    put,
    delete: del,
    clearError,
    setData,
  }
}

export default useApi