import React from 'react'
import PropTypes from 'prop-types'
import { CCard, CCardBody, CCol, CRow } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle, cilClock, cilSpeedometer, cilTask, cilWarning } from '@coreui/icons'

const DEFAULT_STATS = [
  { key: 'activeTasks', label: 'Active tasks', color: 'primary', icon: cilTask },
  {
    key: 'completedThisMonth',
    label: 'Completed this month',
    color: 'success',
    icon: cilCheckCircle,
  },
  { key: 'overdueTasks', label: 'Overdue tasks', color: 'danger', icon: cilWarning },
  { key: 'readyForReview', label: 'Ready for review', color: 'info', icon: cilClock },
  {
    key: 'averageCompletionRate',
    label: 'Avg completion rate',
    color: 'warning',
    icon: cilSpeedometer,
    suffix: '%',
  },
]

const WorkloadStatsCards = ({ stats, items = DEFAULT_STATS }) => (
  <CRow className="g-3 mb-4">
    {items.map((item) => (
      <CCol xs={12} sm={6} xl key={item.key}>
        <CCard className="h-100 border-0 shadow-sm">
          <CCardBody>
            <div className="d-flex align-items-start justify-content-between gap-3">
              <div>
                <div className="small text-body-secondary mb-1">{item.label}</div>
                <div className="fs-3 fw-bold">
                  {stats?.[item.key] ?? 0}
                  {item.suffix || ''}
                </div>
                {item.caption && (
                  <div className={`small text-${item.color} fw-semibold mt-1`}>{item.caption}</div>
                )}
              </div>
              <div className={`workload-stat-icon text-${item.color}`}>
                <CIcon icon={item.icon} />
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    ))}
  </CRow>
)

WorkloadStatsCards.propTypes = {
  stats: PropTypes.object,
  items: PropTypes.array,
}

export default WorkloadStatsCards
