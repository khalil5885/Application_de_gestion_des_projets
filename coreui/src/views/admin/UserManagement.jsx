import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  CCol,
  CRow,
  CToast,
  CToastBody,
  CToastClose,
  CToaster,
  CButton, // Added CButton
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle, cilUserPlus, cilX } from '@coreui/icons' // Added icons
import { useAuth } from '../../context/AuthContext'
import CreateUser from './CreateUser'
import UserList from './UserList'

const UserManagement = () => {
  const { user } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toasts, setToasts] = useState([])
  
  // NEW: State to control form visibility
  const [showCreateForm, setShowCreateForm] = useState(false)

  if (user && user.global_role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  const handleUserCreated = (newUser) => {
    setRefreshKey((k) => k + 1)
    
    // Hide the form after successful creation
    setShowCreateForm(false)

    const id = Date.now()
    setToasts((prev) => [...prev, { id, email: newUser?.email || 'the user' }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }

  return (
    <>
      <CToaster placement="top-end" className="p-3">
        {toasts.map((t) => (
          <CToast key={t.id} visible autohide={false} color="success" className="text-white">
            <div className="d-flex align-items-center p-3 gap-2">
              <CIcon icon={cilCheckCircle} size="lg" />
              <CToastBody className="p-0 flex-grow-1">
                <strong>User created!</strong> Credentials sent to <strong>{t.email}</strong>.
              </CToastBody>
              <CToastClose
                className="btn-close-white"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              />
            </div>
          </CToast>
        ))}
      </CToaster>

      {/* Page header with Action Button */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">User Management</h4>
          <p className="text-body-secondary mb-0">
            Create new users and manage existing accounts.
          </p>
        </div>
        
        {/* Toggle Button */}
        <CButton 
          color={showCreateForm ? 'secondary' : 'primary'} 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="d-flex align-items-center gap-2"
        >
          <CIcon icon={showCreateForm ? cilX : cilUserPlus} />
          {showCreateForm ? 'Cancel' : 'Add New User'}
        </CButton>
      </div>

      <CRow className="g-4">
        {/* Conditional Rendering: Only show form if showCreateForm is true */}
        {showCreateForm && (
          <CCol lg={4} xl={4}>
            <CreateUser onUserCreated={handleUserCreated} />
          </CCol>
        )}

        {/* Adjust User list width based on whether form is open */}
        <CCol lg={showCreateForm ? 8 : 12} xl={showCreateForm ? 8 : 12}>
          <UserList refreshKey={refreshKey} />
        </CCol>
      </CRow>
    </>
  )
}

export default UserManagement