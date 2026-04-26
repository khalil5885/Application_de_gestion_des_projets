import React from 'react'
import { CCard, CCardBody, CButton, CListGroup, CListGroupItem, CAvatar } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowRight } from '@coreui/icons'
import { useNavigate } from 'react-router-dom'

const RecentActivity = ({ activities }) => {
  const navigate = useNavigate()

  return (
    <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '1rem' }}>
      <CCardBody className="p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-semibold mb-0">Recent Activity</h5>
          <CButton
            color="link"
            size="sm"
            className="p-0 text-decoration-none"
            onClick={() => navigate('/workspace/activity')}
          >
            View all <CIcon icon={cilArrowRight} size="sm" />
          </CButton>
        </div>
        <CListGroup flush>
          {activities?.length === 0 && (
            <p className="text-body-secondary small">No activity yet.</p>
          )}
          {activities?.map(item => (
            <CListGroupItem
              key={item.id}
              className="px-0 py-3 border-bottom d-flex align-items-center gap-3"
              style={{ background: 'transparent' }}
            >
              <CAvatar color="primary" textColor="white" size="sm">
                {item.user?.[0] ?? '?'}
              </CAvatar>
              <div className="flex-grow-1 small">
                <strong>{item.user}</strong>{' '}
                <span className="text-body-secondary">{item.event}</span>{' '}
                <span className="fw-semibold">{item.subject_type}: {item.subject_name}</span>
              </div>
              <span className="text-body-secondary small text-nowrap">{item.time}</span>
            </CListGroupItem>
          ))}
        </CListGroup>
      </CCardBody>
    </CCard>
  )
}

export default RecentActivity
