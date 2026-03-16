import React from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople, cilSpeedometer, cilUser } from '@coreui/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const StatCard = ({ icon, label, value, color }) => (
  <CCard className="border-0 shadow-sm h-100">
    <CCardBody className="d-flex align-items-center gap-3 p-4">
      <div
        className={`d-flex align-items-center justify-content-center rounded-3 bg-${color} bg-opacity-10`}
        style={{ width: 52, height: 52, flexShrink: 0 }}
      >
        <CIcon icon={icon} size="xl" className={`text-${color}`} />
      </div>
      <div>
        <div className="text-body-secondary small mb-1">{label}</div>
        <div className="fs-4 fw-bold">{value}</div>
      </div>
    </CCardBody>
  </CCard>
)

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.global_role === 'admin'

  return (
    <>
      {/* Welcome banner */}
      <CCard className="border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #321fdb 0%, #1f64db 100%)', color: '#fff' }}>
        <CCardBody className="p-4 p-lg-5">
          <CRow className="align-items-center">
            <CCol>
              <h3 className="fw-bold mb-1" style={{ color: '#fff' }}>
                Welcome back{user?.name ? `, ${user.name}` : ''}! 👋
              </h3>
              <p className="mb-0 opacity-75">
                {isAdmin
                  ? 'You have full admin access. Manage users and settings from the sidebar.'
                  : `You're logged in as ${user?.global_role || 'user'}. Check your assigned tasks and projects.`}
              </p>
            </CCol>
            <CCol xs="auto" className="d-none d-md-block">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle bg-white bg-opacity-10"
                style={{ width: 72, height: 72 }}
              >
                <CIcon icon={cilUser} size="3xl" style={{ color: '#fff' }} />
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Stat cards */}
      <CRow className="g-4 mb-4">
        <CCol sm={6} xl={4}>
          <StatCard icon={cilSpeedometer} label="Platform" value="WebMedia" color="primary" />
        </CCol>
        <CCol sm={6} xl={4}>
          <StatCard icon={cilUser} label="Your Role" value={user?.global_role ? user.global_role.charAt(0).toUpperCase() + user.global_role.slice(1) : '—'} color="info" />
        </CCol>
        <CCol sm={6} xl={4}>
          <StatCard icon={cilPeople} label="Account" value={user?.email || '—'} color="success" />
        </CCol>
      </CRow>

      {/* Admin quick actions */}
      {isAdmin && (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="p-4">
            <h5 className="fw-semibold mb-3">Quick Actions</h5>
            <CRow className="g-3">
              <CCol xs={12} sm="auto">
                <CButton
                  color="primary"
                  className="d-flex align-items-center gap-2"
                  onClick={() => navigate('/admin/users')}
                >
                  <CIcon icon={cilPeople} />
                  Manage Users
                </CButton>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      )}
    </>
  )
}

export default Dashboard
