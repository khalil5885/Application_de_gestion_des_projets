import React from 'react'
import { CButton, CCard, CCardBody } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTrash, cilCalendar, cilUser, cilOptions } from '@coreui/icons'

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

const ProjectCard = ({ project, onDelete }) => {
  const isInProgress = project.status === 'in_progress'
  const isCompleted  = project.status === 'completed'

  return (
    <CCard className="mb-3 border-0 shadow-sm">
      <CCardBody className="p-3">
        {/* Top row */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <CIcon icon={cilOptions} size="sm" className="text-body-secondary" />
          <CButton
            size="sm"
            color="danger"
            variant="ghost"
            className="p-0"
            onClick={() => onDelete(project.id)}
            title="Delete project"
          >
            <CIcon icon={cilTrash} size="sm" />
          </CButton>
        </div>

        {/* Title */}
        <h6
          className="fw-bold mb-1"
          style={{
            textDecoration: isCompleted ? 'line-through' : 'none',
            opacity: isCompleted ? 0.55 : 1,
          }}
        >
          {project.name}
        </h6>

        {/* Client */}
        <p className="small text-body-secondary mb-2">{project.client?.name || '—'}</p>

        {/* Progress bar for in_progress */}
        {isInProgress && (
          <div className="mb-3">
            <div
              className="rounded-pill overflow-hidden"
              style={{ height: 4, background: 'var(--cui-border-color)' }}
            >
              <div className="bg-primary rounded-pill" style={{ height: '100%', width: '60%' }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="d-flex align-items-center justify-content-between pt-2"
          style={{ borderTop: '1px solid var(--cui-border-color-translucent)' }}
        >
          <div className="d-flex align-items-center gap-1 text-body-secondary">
            <CIcon icon={cilCalendar} size="sm" />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isCompleted
                ? `Done ${formatDate(project.end_date)}`
                : `${formatDate(project.start_date)} – ${formatDate(project.end_date)}`
              }
            </span>
          </div>
          <div
            className="rounded-circle bg-body-secondary d-flex align-items-center justify-content-center"
            style={{ width: 26, height: 26 }}
          >
            <CIcon icon={cilUser} size="sm" className="text-body-secondary" />
          </div>
        </div>
      </CCardBody>
    </CCard>
  )
}

export default ProjectCard