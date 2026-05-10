import React from 'react'
import { CBadge, CCard, CCardBody, CProgress } from '@coreui/react'

const STATUS_COLORS = {
  todo: 'warning',
  in_progress: 'primary',
  ready_for_review: 'info',
  done: 'success',
  on_hold: 'secondary',
}

const RISK_COLORS = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const ProjectSummaryCard = ({ project, onClick }) => {
  const status = project.status || 'active'
  const risk = (project.risk_level || project.ai_estimation?.risk_level || 'low').toLowerCase()
  const progress = Number(
    project.progress ?? project.progress_percentage ?? project.completion ?? 0,
  )

  return (
    <CCard
      className="border-0 shadow-sm h-100"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <CCardBody>
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div style={{ minWidth: 0 }}>
            <h6 className="fw-bold mb-1 text-truncate">
              {project.name || project.title || 'Untitled project'}
            </h6>
            <div className="small text-body-secondary">
              {project.client?.name || project.category || 'Project'}
            </div>
          </div>
          <CBadge color={STATUS_COLORS[status] || 'secondary'}>
            {status.replaceAll('_', ' ')}
          </CBadge>
        </div>

        <div className="d-flex justify-content-between small mb-2">
          <span className="text-body-secondary">Progress</span>
          <span className="fw-semibold">{progress}%</span>
        </div>
        <CProgress
          value={progress}
          color={progress >= 80 ? 'success' : progress >= 45 ? 'primary' : 'warning'}
        />

        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="small">
            <div className="text-body-secondary">Deadline</div>
            <div className="fw-semibold">{formatDate(project.end_date || project.deadline)}</div>
          </div>
          <CBadge color={RISK_COLORS[risk] || 'secondary'}>{risk} risk</CBadge>
        </div>
      </CCardBody>
    </CCard>
  )
}

export default ProjectSummaryCard
