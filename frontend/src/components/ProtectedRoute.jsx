import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CSpinner } from '@coreui/react'

/**
 * ProtectedRoute
 *
 * Wraps routes that require authentication.
 * Uses AuthContext for proper state management across all browsers.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  // Show spinner while auth context initializes (reads localStorage)
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <CSpinner color="primary" />
      </div>
    )
  }

  // Redirect only after loading completes and user is not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute