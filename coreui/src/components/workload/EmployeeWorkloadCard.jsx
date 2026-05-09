import React from 'react'
import PropTypes from 'prop-types'
import { CAvatar, CBadge, CCard, CCardBody, CCol, CProgress, CRow } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCalendar, cilCheckCircle, cilClock, cilTask } from '@coreui/icons'
import { getInitials, WORKLOAD_LEVELS } from './workloadUtils'

const EmployeeWorkloadCard = ({ employee, onClick }) => {
  const level = WORKLOAD_LEVELS[employee.workloadLevel] || WORKLOAD_LEVELS.low
  const capacity = Math.max(0, 100 - Math.min(100, Math.round((employee.activeTasks / 10) * 100)))

  return (
    <CCard
      className="workload-employee-card h-100"
      role="button"
      tabIndex={0}
      onClick={() => onClick(employee)}
    >
      <CCardBody>
        <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
          <div className="d-flex align-items-center gap-3">
            <CAvatar color="primary" textColor="white" size="lg" className="fw-bold">
              {getInitials(employee.name)}
            </CAvatar>
            <div className="min-w-0">
              <h6 className="mb-1 text-truncate">{employee.name}</h6>
              <div className="small text-body-secondary text-truncate">{employee.email}</div>
            </div>
          </div>
          <CBadge color={level.color}>{level.label}</CBadge>
        </div>

        <CRow className="g-3 mb-4">
          <CCol xs={6}>
            <div className="workload-mini-stat">
              <CIcon icon={cilTask} className="text-primary" />
              <span>{employee.activeTasks}</span>
              <small>Active</small>
            </div>
          </CCol>
          <CCol xs={6}>
            <div className="workload-mini-stat">
              <CIcon icon={cilClock} className="text-danger" />
              <span>{employee.overdueTasks}</span>
              <small>Overdue</small>
            </div>
          </CCol>
          <CCol xs={6}>
            <div className="workload-mini-stat">
              <CIcon icon={cilCalendar} className="text-info" />
              <span>{employee.readyForReview}</span>
              <small>Review</small>
            </div>
          </CCol>
          <CCol xs={6}>
            <div className="workload-mini-stat">
              <CIcon icon={cilCheckCircle} className="text-success" />
              <span>{employee.completedThisMonth}</span>
              <small>Done</small>
            </div>
          </CCol>
        </CRow>

        <div className="d-flex align-items-center justify-content-between small mb-2">
          <span className="text-body-secondary">Available capacity</span>
          <span className="fw-semibold">{capacity}%</span>
        </div>
        <CProgress value={100 - capacity} color={level.color} height={7} className="rounded-pill" />
      </CCardBody>
    </CCard>
  )
}

EmployeeWorkloadCard.propTypes = {
  employee: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
}

export default EmployeeWorkloadCard
