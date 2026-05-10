import React from 'react'
import { CCard, CCardBody, CListGroup, CListGroupItem, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTask } from '@coreui/icons'

const priorityColors = { high: 'danger', medium: 'warning', low: 'secondary' }

const UpcomingTasks = ({ tasks }) => (
  <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '1rem' }}>
    <CCardBody className="p-4">
      <h5 className="fw-semibold mb-3">Upcoming Tasks</h5>
      {tasks?.length === 0 && (
        <p className="text-body-secondary small">No upcoming tasks 🎉</p>
      )}
      <CListGroup flush>
        {tasks?.map(task => (
          <CListGroupItem
            key={task.id}
            className="px-0 py-2 border-bottom d-flex align-items-center gap-2"
            style={{ background: 'transparent' }}
          >
            <CIcon icon={cilTask} className="text-body-secondary" size="sm" />
            <span className="flex-grow-1 small">{task.title}</span>
            <CBadge color={priorityColors[task.priority]} shape="rounded-pill">
              {task.priority}
            </CBadge>
          </CListGroupItem>
        ))}
      </CListGroup>
    </CCardBody>
  </CCard>
)

export default UpcomingTasks
