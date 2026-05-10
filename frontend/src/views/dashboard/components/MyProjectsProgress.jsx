import React from 'react'
import { CCard, CCardBody, CProgress, CProgressBar } from '@coreui/react'
import { useNavigate } from 'react-router-dom'

const MyProjectsProgress = ({ projects }) => {
  const navigate = useNavigate()

  return (
    <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '1rem' }}>
      <CCardBody className="p-4">
        <h5 className="fw-semibold mb-3">My Projects</h5>
        {projects?.length === 0 && (
          <p className="text-body-secondary small">No projects assigned yet.</p>
        )}
        <div className="d-flex flex-column gap-3">
          {projects?.map(p => (
            <div
              key={p.id}
              className="d-flex flex-column gap-1"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/admin/projects/${p.id}`)}
            >
              <div className="d-flex justify-content-between small">
                <span className="fw-semibold">{p.name}</span>
                <span className="text-body-secondary">{p.progress}%</span>
              </div>
              <CProgress height={6}>
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
}

export default MyProjectsProgress
