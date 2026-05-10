import React, { createContext, useState, useEffect, useCallback } from 'react'
import api from '../api'

export const AuthContext = createContext()

// Safe storage wrapper for Edge compatibility
const storage = {
  get: (key) => {
    try {
      return localStorage.getItem(key)
    } catch (e) {
      console.warn('localStorage.getItem failed:', e.message)
      try {
        return sessionStorage.getItem(key)
      } catch (e2) {
        return null
      }
    }
  },
  set: (key, val) => {
    try {
      localStorage.setItem(key, val)
      return true
    } catch (e) {
      console.warn('localStorage.setItem failed:', e.message)
      try {
        sessionStorage.setItem(key, val)
        console.warn('Fell back to sessionStorage for', key)
        return true
      } catch (e2) {
        console.error('sessionStorage also failed:', e2.message)
        return false
      }
    }
  },
  remove: (key) => {
    try { localStorage.removeItem(key) } catch (e) {}
    try { sessionStorage.removeItem(key) } catch (e) {}
  },
  clearAuth: () => {
    storage.remove('token')
    storage.remove('user')
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = storage.get('token')
        const storedUser = storage.get('user')

        if (token && storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          setUser(JSON.parse(storedUser))
        }
      } catch (err) {
        console.error('Auth initialization failed:', err)
        storage.clearAuth()
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/api/login', { email, password })
      const { token, user: userData } = response.data.data || response.data

      const stored = storage.set('token', token)
      if (!stored) {
        throw new Error('Browser storage is disabled. Please enable cookies/storage and try again.')
      }
      
      storage.set('user', JSON.stringify(userData))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      setUser(userData)
      return userData
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed'
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/logout')
    } catch (err) {
      console.error('Logout request failed:', err)
    } finally {
      storage.clearAuth()
      delete api.defaults.headers.common['Authorization']
      setUser(null)
      setError(null)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}