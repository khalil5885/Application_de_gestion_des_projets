import React from 'react'
import { CCard, CCardBody } from '@coreui/react'
import CIcon from '@coreui/icons-react'

const StatCard = ({ icon, label, value, subtitle, color }) => (
  <CCard
    className="border-0 shadow-sm h-100"
    style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease', borderRadius: '1rem' }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-3px)'
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = ''
    }}
  >
    <CCardBody className="p-4">
      <div
        className={`d-flex align-items-center justify-content-center rounded-3 bg-${color} bg-opacity-10 mb-3`}
        style={{ width: 48, height: 48 }}
      >
        <CIcon icon={icon} size="lg" className={`text-${color}`} />
      </div>
      <div className="fs-2 fw-bold mb-1">{value ?? '—'}</div>
      <div className="text-body-secondary small mb-1">{label}</div>
      {subtitle && <div className="text-success small fw-semibold">{subtitle}</div>}
    </CCardBody>
  </CCard>
)

export default StatCard
