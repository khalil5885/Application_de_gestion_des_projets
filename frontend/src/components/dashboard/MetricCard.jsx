import React from 'react'
import { CCard, CCardBody } from '@coreui/react'
import CIcon from '@coreui/icons-react'

const MetricCard = ({ icon, label, value, subtitle, color = 'primary', children }) => (
  <CCard className="border-0 shadow-sm h-100">
    <CCardBody>
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div>
          <div className="small text-body-secondary mb-1">{label}</div>
          <div className="fs-3 fw-bold">{value ?? 0}</div>
          {subtitle && <div className={`small text-${color} fw-semibold mt-1`}>{subtitle}</div>}
        </div>
        {icon && (
          <div
            className={`rounded-3 d-flex align-items-center justify-content-center bg-${color} bg-opacity-10`}
            style={{ width: 44, height: 44, flexShrink: 0 }}
          >
            <CIcon icon={icon} className={`text-${color}`} />
          </div>
        )}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </CCardBody>
  </CCard>
)

export default MetricCard
