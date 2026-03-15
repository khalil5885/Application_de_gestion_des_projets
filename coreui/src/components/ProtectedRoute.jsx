import React from 'react'
import { Navigate } from 'react-router-dom'

/**
 * ProtectedRoute
 *
 * Wraps routes that require authentication.
 * If no auth_token is found in localStorage, redirects to /login.
 *
 * Usage:
 *   <ProtectedRoute>
 *     <DefaultLayout />
 *   </ProtectedRoute>
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('auth_token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
