import React, { createContext, useState, useEffect, useCallback } from 'react'
import api from '../api'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize auth on mount - check if token exists in localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const storedUser = localStorage.getItem('user')

        if (token && storedUser) {
          // Set the default Authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          setUser(JSON.parse(storedUser))
        }
      } catch (err) {
        console.error('Auth initialization failed:', err)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
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
      // Get CSRF cookie first
      await api.get('/sanctum/csrf-cookie')

      // Attempt login
      const response = await api.post('/api/login', {
        email,
        password,
      })

      const { token, user: userData } = response.data

      // Store token and user data
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user', JSON.stringify(userData))

      // Set default auth header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      setUser(userData)
      return userData
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed'
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to invalidate token on server
      await api.post('/api/logout')
    } catch (err) {
      console.error('Logout request failed:', err)
    } finally {
      // Clear local state regardless of server response
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      delete api.defaults.headers.common['Authorization']
      setUser(null)
      setError(null)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

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
