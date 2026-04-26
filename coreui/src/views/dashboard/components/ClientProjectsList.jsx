import React from 'react'
import { CCard, CCardBody, CProgress, CProgressBar, CBadge } from '@coreui/react'

const statusColors = {
  pending: 'secondary',
  in_progress: 'primary',
  completed: 'success',
  on_hold: 'warning',
}

const ClientProjectsList = ({ projects }) => (
  <CCard className="border-0 shadow-sm" style={{ borderRadius: '1rem' }}>
    <CCardBody className="p-4">
      <h5 className="fw-semibold mb-4">My Projects</h5>
      <div className="d-flex flex-column gap-4">
        {projects?.length === 0 && (
          <p className="text-body-secondary small">No projects yet.</p>
        )}
        {projects?.map(p => (
          <div key={p.id}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="fw-semibold small">{p.name}</span>
              <div className="d-flex align-items-center gap-2">
                <CBadge color={statusColors[p.status] ?? 'secondary'}>
                  {p.status?.replace('_', ' ')}
                </CBadge>
                <span className="text-body-secondary small">{p.progress}%</span>
              </div>
            </div>
            <CProgress height={8}>
              <CProgressBar
                value={p.progress}
                color={p.progress === 100 ? 'success' : 'primary'}
              />
            </CProgress>
          </div>
        ))}
      </div>
    </CCardBody>
  </CCard>
)

export default ClientProjectsList
