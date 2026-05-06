// src/features/employee/tasks/components/TaskStatusBadge.jsx
import React from 'react'
import { CBadge } from '@coreui/react'
import { STATUS_CONFIG } from './utils/taskHelpers'

const TaskStatusBadge = ({ status, onClick, className = '' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.todo

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill small fw-medium border-0 ${className}`}
        style={{ 
          backgroundColor: config.bg, 
          color: config.text,
          border: `1px solid ${config.border}40`,
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        <span className="d-inline-block rounded-circle" style={{ width: 6, height: 6, backgroundColor: config.border }} />
        {config.label}
      </button>
    )
  }

  return (
    <CBadge 
      color={config.color} 
      shape="rounded-pill" 
      className={`d-inline-flex align-items-center gap-2 px-3 py-2 ${className}`}
      style={{ 
        backgroundColor: config.bg, 
        color: config.text,
        border: `1px solid ${config.border}40`,
        fontSize: '0.75rem',
        fontWeight: 600
      }}
    >
      <span className="d-inline-block rounded-circle" style={{ width: 6, height: 6, backgroundColor: config.border }} />
      {config.label}
    </CBadge>
  )
}

export default TaskStatusBadge