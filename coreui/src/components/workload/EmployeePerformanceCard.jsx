import React from 'react'
import PropTypes from 'prop-types'
import { CBadge, CCard, CCardBody, CProgress } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle, cilClock, cilWarning } from '@coreui/icons'
import { WORKLOAD_LEVELS } from './workloadUtils'

const EmployeePerformanceCard = ({ employee }) => {
  const level = WORKLOAD_LEVELS[employee.workloadLevel] || WORKLOAD_LEVELS.low
  const score =
    employee.productivityScore ||
    Math.max(
      0,
      Math.min(
        100,
        employee.completedThisMonth * 8 + employee.readyForReview * 4 - employee.overdueTasks * 7,
      ),
    )

  return (
    <CCard className="h-100">
      <CCardBody>
        <div className="d-flex align-items-start justify-content-between mb-4">
          <div>
            <div className="small text-body-secondary mb-1">Performance signal</div>
            <h5 className="mb-0">{score}% productivity score</h5>
          </div>
          <CBadge color={level.color}>{level.label}</CBadge>
        </div>

        <CProgress
          value={score}
          color={score >= 75 ? 'success' : score >= 45 ? 'warning' : 'danger'}
          height={8}
          className="rounded-pill mb-4"
        />

        <div className="d-flex flex-column gap-3">
          <div className="d-flex align-items-center gap-3">
            <CIcon icon={cilCheckCircle} className="text-success" />
            <div>
              <div className="fw-semibold small">Completion momentum</div>
              <div className="small text-body-secondary">
                {employee.completedThisMonth} tasks completed this month
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <CIcon icon={cilClock} className="text-info" />
            <div>
              <div className="fw-semibold small">Review queue</div>
              <div className="small text-body-secondary">
                {employee.readyForReview} tasks waiting for review
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <CIcon icon={cilWarning} className="text-warning" />
            <div>
              <div className="fw-semibold small">Average completion time</div>
              <div className="small text-body-secondary">
                {employee.averageCompletionTime || 'Not enough data yet'}
              </div>
            </div>
          </div>
        </div>
      </CCardBody>
    </CCard>
  )
}

EmployeePerformanceCard.propTypes = {
  employee: PropTypes.object.isRequired,
}

export default EmployeePerformanceCard
