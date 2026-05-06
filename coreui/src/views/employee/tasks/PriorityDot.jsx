// src/views/employee/tasks/PriorityDot.jsx
import React from 'react'

const PRIORITY_CONFIG = {
  high:   { label: 'High',   dot: '#ef4444', bg: '#fef2f2' },
  medium: { label: 'Medium', dot: '#f59e0b', bg: '#fffbeb' },
  low:    { label: 'Low',    dot: '#22c55e', bg: '#f0fdf4' },
}

const PriorityDot = ({ priority, showLabel = false, size = 8 }) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium

  return (
    <div className="d-inline-flex align-items-center gap-2">
      <span 
        className="d-inline-block rounded-circle" 
        style={{ width: size, height: size, backgroundColor: config.dot }} 
      />
      {showLabel && (
        <span className="small" style={{ color: config.dot, fontWeight: 500 }}>
          {config.label}
        </span>
      )}
    </div>
  )
}

export default PriorityDot