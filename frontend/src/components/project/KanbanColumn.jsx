import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { CBadge } from '@coreui/react'
import ProjectCard from './ProjectCard'

export const STATUS_COLUMNS = [
  { key: 'todo',          label: 'To Do',           color: 'warning'  },
  { key: 'in_progress',      label: 'In Progress',     color: 'info'     },
  { key: 'ready_for_review', label: 'Ready for Review', color: 'primary' },
  { key: 'done',             label: 'Done',            color: 'success'  },
  { key: 'on_hold',          label: 'On Hold',         color: 'danger'   },
]

const KanbanColumn = ({ col, projects = [], activeId, onDelete, onCardClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: col.key,
    data: { type: 'column', status: col.key },
  })

  return (
    <div
      style={{
        minWidth: 280,
        maxWidth: 280,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Column header */}
      <div className="d-flex align-items-center justify-content-between mb-3 px-1">
        <span className="fw-semibold" style={{ fontSize: '0.88rem' }}>
          {col.label}
        </span>
        <CBadge color={col.color} shape="rounded-pill">
          {projects.length}
        </CBadge>
      </div>

      {/* Drop area */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          minHeight: 120,
          borderRadius: 12,
          padding: 4,
          background: isOver ? 'var(--cui-tertiary-bg, rgba(0,0,0,0.03))' : 'transparent',
          outline: isOver ? '2px dashed var(--cui-primary)' : '2px dashed transparent',
          transition: 'background 0.15s ease, outline 0.15s ease',
        }}
      >
        {projects.length === 0 ? (
          <div
            style={{
              minHeight: 140,
              border: '1px dashed var(--cui-border-color)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cui-secondary-color)',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Drop here
          </div>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              activeId={activeId}
              onDelete={onDelete}
              onClick={onCardClick}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default KanbanColumn