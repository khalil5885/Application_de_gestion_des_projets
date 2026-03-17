import React from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople, cilSpeedometer, cilUser, cilBriefcase } from '@coreui/icons'
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
      {/* ... Welcome banner and Stat cards stay the same ... */}

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

              {/* NEW: Manage Projects Button */}
              <CCol xs={12} sm="auto">
                <CButton
                  color="info"
                  variant="outline"
                  className="d-flex align-items-center gap-2"
                  onClick={() => navigate('/admin/projects')}
                >
                  <CIcon icon={cilBriefcase} />
                  Manage Projects
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