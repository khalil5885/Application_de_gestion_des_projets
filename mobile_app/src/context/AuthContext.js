import React, { createContext, useState, useEffect, useCallback, useContext } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Restore session from AsyncStorage on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token')
        const storedUser = await AsyncStorage.getItem('user')
        if (token && storedUser) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          setUser(JSON.parse(storedUser))
        }
      } catch (err) {
        console.warn('Auth init failed:', err)
        await AsyncStorage.multiRemove(['auth_token', 'user'])
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
      const { token, user: userData } = response.data

      await AsyncStorage.setItem('auth_token', token)
      await AsyncStorage.setItem('user', JSON.stringify(userData))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      setUser(userData)
      return userData
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/logout')
    } catch {
      // ignore — always clear locally
    } finally {
      await AsyncStorage.multiRemove(['auth_token', 'user'])
      delete api.defaults.headers.common['Authorization']
      setUser(null)
      setError(null)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, clearError, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
