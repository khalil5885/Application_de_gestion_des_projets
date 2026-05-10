import React from 'react'
import { CCard, CCardBody, CListGroup, CListGroupItem, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilWarning } from '@coreui/icons'

const deadlineColor = (dateStr) => {
  const days = Math.ceil((new Date(dateStr) - new Date()) / 86400000)
  if (days <= 1) return 'danger'
  if (days <= 3) return 'warning'
  return 'info'
}

const UpcomingDeadlines = ({ deadlines }) => (
  <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '1rem' }}>
    <CCardBody className="p-4">
      <h5 className="fw-semibold mb-3">Upcoming Deadlines</h5>
      {deadlines?.length === 0 && (
        <p className="text-body-secondary small">No upcoming deadlines 🎉</p>
      )}
      <CListGroup flush>
        {deadlines?.map(item => {
          const color = deadlineColor(item.end_date)
          return (
            <CListGroupItem
              key={item.id}
              className="px-0 py-2 border-bottom d-flex align-items-center gap-2"
              style={{ background: 'transparent' }}
            >
              <CIcon icon={cilWarning} className={`text-${color}`} size="sm" />
              <span className="flex-grow-1 small">{item.name}</span>
              <CBadge color={color} shape="rounded-pill">
                {new Date(item.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </CBadge>
            </CListGroupItem>
          )
        })}
      </CListGroup>
    </CCardBody>
  </CCard>
)

export default UpcomingDeadlines
