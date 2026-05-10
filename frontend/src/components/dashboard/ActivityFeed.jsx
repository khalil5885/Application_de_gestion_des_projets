import React from 'react'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'

const getText = (item) =>
  item.message || item.description || item.title || item.content || 'Activity update'

const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const ActivityFeed = ({
  title = 'Recent Activity',
  items = [],
  emptyText = 'No activity yet.',
}) => (
  <CCard className="border-0 shadow-sm h-100">
    <CCardHeader className="bg-transparent border-0 pb-0">
      <h6 className="fw-bold mb-0">{title}</h6>
    </CCardHeader>
    <CCardBody>
      {items.length === 0 ? (
        <div className="text-body-secondary small py-4 text-center">{emptyText}</div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {items.slice(0, 6).map((item, index) => (
            <div key={item.id || index} className="d-flex gap-3">
              <span
                className="rounded-circle bg-primary bg-opacity-25 mt-1"
                style={{ width: 9, height: 9, flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <div className="small fw-semibold">{getText(item)}</div>
                <div className="text-body-secondary" style={{ fontSize: 12 }}>
                  {formatDate(item.created_at || item.date || item.updated_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CCardBody>
  </CCard>
)

export default ActivityFeed
