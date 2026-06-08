import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CButton, CCard, CCardBody } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTrash, cilCalendar } from '@coreui/icons'
import ProgressBar from './ProgressBar'
import TaskBreakdown from './TaskBreakdown'

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

const ProjectCard = ({ project, onDelete, onClick, activeId, isDragOverlay = false }) => {
  const isInProgress = project.status === 'in_progress'
  const isCompleted = project.status === 'done'

  // dnd-kit id MUST be a string
  const draggableId = String(project.id)

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: draggableId,
    data: { project },
    disabled: isDragOverlay,
  })

  // Check if THIS card is the one being dragged (comparing string IDs)
  const isBeingDragged = !isDragOverlay && activeId != null && String(activeId) === draggableId

  const cardStyle = {
    opacity: isBeingDragged ? 0 : 1,
    cursor: isDragOverlay ? 'grabbing' : 'pointer',
    boxShadow: isDragOverlay
      ? '0 20px 40px rgba(0,0,0,0.22), 0 8px 16px rgba(0,0,0,0.1)'
      : undefined,
    transition: 'opacity 0.15s ease',
    transform: 'none',
  }

  const members = project.members ?? project.employees ?? []

  return (
    <CCard
      ref={isDragOverlay ? undefined : setNodeRef}
      style={cardStyle}
      className="mb-3 border-0 shadow-sm project-card-hover"
    >
      <CCardBody className="p-3">

        {/* ── Top row: drag handle + delete ── */}
        <div className="d-flex justify-content-between align-items-start mb-2">

          {/* 9-dot drag handle */}
          <div
            {...(isDragOverlay ? {} : listeners)}
            {...(isDragOverlay ? {} : attributes)}
            className="p-1 rounded-1"
            style={{
              cursor: isDragOverlay ? 'grabbing' : 'grab',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 4px)',
              gap: '3px',
              padding: '4px',
            }}
          >
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: '#8a93a2',
                }}
              />
            ))}
          </div>

          {/* Delete button — hidden on overlay */}
          {!isDragOverlay && (
            <CButton
              size="sm"
              color="danger"
              variant="ghost"
              className="p-0 shadow-none"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(project.id)
              }}
            >
              <CIcon icon={cilTrash} size="sm" />
            </CButton>
          )}
        </div>

        {/* ── Title & client ── */}
        <h6
          className="fw-bold mb-1"
          style={{
            textDecoration: isCompleted ? 'line-through' : 'none',
            opacity: isCompleted ? 0.55 : 1,
          }}
        >
          {project.name}
        </h6>
        <p className="small text-body-secondary mb-2">
          {project.client?.name || '—'}
        </p>

        {/* ── Progress / task breakdown ── */}
        {isInProgress
          ? <ProgressBar value={project.progress} />
          : <TaskBreakdown tasks={project.tasks} />
        }

        {/* ── Footer: date + member avatars ── */}
        <div
          className="d-flex align-items-center justify-content-between pt-2 mb-2"
          style={{ borderTop: '1px solid var(--cui-border-color-translucent)' }}
        >
          <div className="d-flex align-items-center gap-1 text-body-secondary">
            <CIcon icon={cilCalendar} size="sm" />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
              {isCompleted ? formatDate(project.end_date) : formatDate(project.start_date)}
            </span>
          </div>

          {/* Avatar stack (max 5) */}
          <div className="d-flex align-items-center">
            {members.slice(0, 5).map((emp, index) => {
              const name = emp.employee?.name ?? emp.name ?? '?'
              return (
                <div
                  key={emp.id ?? index}
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center border border-1 border-white"
                  style={{
                    width: 22,
                    height: 22,
                    fontSize: 9,
                    marginLeft: index === 0 ? 0 : -8,
                    zIndex: 10 - index,
                  }}
                  title={name}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              )
            })}
            {members.length > 5 && (
              <div
                className="rounded-circle bg-light text-dark d-flex align-items-center justify-content-center border border-1 border-white"
                style={{ width: 22, height: 22, fontSize: 8, marginLeft: -8, zIndex: 0 }}
              >
                +{members.length - 5}
              </div>
            )}
          </div>
        </div>

        {/* ── View Details button ── */}
        {!isDragOverlay && (
          <CButton
            color="primary"
            variant="outline"
            size="sm"
            className="w-100 py-1"
            style={{ fontSize: '0.75rem' }}
            onClick={() => onClick(project)}
          >
            View Details
          </CButton>
        )}

      </CCardBody>
    </CCard>
  )
}

export default ProjectCard