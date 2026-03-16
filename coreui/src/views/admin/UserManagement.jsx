import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  CCol,
  CRow,
  CToast,
  CToastBody,
  CToastClose,
  CToaster,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle } from '@coreui/icons'
import { useAuth } from '../../context/AuthContext'
import CreateUser from './CreateUser'
import UserList from './UserList'

const UserManagement = () => {
  const { user } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toasts, setToasts] = useState([])

  // Guard: admins only
  if (user && user.global_role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  const handleUserCreated = (newUser) => {
    // Refresh the list
    setRefreshKey((k) => k + 1)
    // Show success toast
    const id = Date.now()
    setToasts((prev) => [...prev, { id, email: newUser?.email || 'the user' }])
    // Auto-dismiss after 5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }

  return (
    <>
      {/* Toast container */}
      <CToaster placement="top-end" className="p-3">
        {toasts.map((t) => (
          <CToast key={t.id} visible autohide={false} color="success" className="text-white">
            <div className="d-flex align-items-center p-3 gap-2">
              <CIcon icon={cilCheckCircle} size="lg" />
              <CToastBody className="p-0 flex-grow-1">
                <strong>User created!</strong> Credentials sent to{' '}
                <strong>{t.email}</strong>.
              </CToastBody>
              <CToastClose
                className="btn-close-white"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              />
            </div>
          </CToast>
        ))}
      </CToaster>

      {/* Page header */}
      <div className="mb-4">
        <h4 className="fw-bold mb-1">User Management</h4>
        <p className="text-body-secondary mb-0">
          Create new users and manage existing accounts.
        </p>
      </div>

      <CRow className="g-4">
        {/* Create User form — left column */}
        <CCol lg={4} xl={4}>
          <CreateUser onUserCreated={handleUserCreated} />
        </CCol>

        {/* User list — right column */}
        <CCol lg={8} xl={8}>
          <UserList refreshKey={refreshKey} />
        </CCol>
      </CRow>
    </>
  )
}

export default UserManagement
