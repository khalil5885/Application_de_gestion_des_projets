// components/project/KanbanColumn.jsx
import React, { memo } from 'react'
import { CBadge } from '@coreui/react'
import { useDroppable } from '@dnd-kit/core'
import ProjectCard from './ProjectCard'

const STATUS_COLUMNS = [
  { key: 'todo',             label: 'To Do',            color: 'warning' },
  { key: 'in_progress',      label: 'In Progress',      color: 'primary' },
  { key: 'ready_for_review', label: 'Ready for Review', color: 'info'    },
  { key: 'done',             label: 'Done',             color: 'success' },
  { key: 'on_hold',          label: 'On Hold',          color: 'danger'  },
]

/**
 * KanbanColumn
 *
 * Wrapped in React.memo so a column only re-renders when its own `projects`
 * array reference changes — not when an unrelated column's cards are being
 * dragged.  The parent must keep per-column arrays stable (e.g. via useMemo)
 * so this optimisation actually fires.
 *
 * Props
 * ─────
 * col          – one entry from STATUS_COLUMNS
 * projects     – the subset of projects that belong to this column
 * onDelete     – stable callback (useCallback in parent) called after a delete
 * onCardClick  – stable callback (useCallback in parent) called when a card
 *                is clicked; receives the full project object
 */
const KanbanColumn = memo(({ col, projects, onDelete, onCardClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id: col.key })

  const columnStyle = {
    flexShrink: 0,
    width: 300,
    minHeight: '600px',
    borderRadius: '12px',
    transition: 'all 0.25s ease',
    backgroundColor: isOver ? 'rgba(50, 31, 219, 0.08)' : 'rgba(0,0,0,0.02)',
    outline: isOver ? '2px dashed #321fdb' : '2px dashed transparent',
    outlineOffset: '2px',
    padding: '12px',
  }

  return (
    <div ref={setNodeRef} style={columnStyle}>
      {/* Column header */}
      <div className="d-flex align-items-center justify-content-between mb-3 px-1">
        <div className="d-flex align-items-center gap-2">
          <CBadge
            color={col.color}
            shape="rounded-pill"
            style={{ width: 8, height: 8, padding: 0 }}
          />
          <span className={`fw-bold small ${isOver ? 'text-primary' : ''}`}>
            {col.label}
          </span>
        </div>
        <CBadge color={col.color} variant="outline" shape="rounded-pill">
          {projects.length}
        </CBadge>
      </div>

      {/* Cards */}
      <div className="d-flex flex-column gap-3">
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            onDelete={onDelete}
            onClick={onCardClick}
          />
        ))}

        {isOver && projects.length === 0 && (
          <div className="py-5 text-center text-primary small fw-bold border rounded-3 border-dashed">
            Drop Here
          </div>
        )}
      </div>
    </div>
  )
})

KanbanColumn.displayName = 'KanbanColumn'

export { STATUS_COLUMNS }
export default KanbanColumn