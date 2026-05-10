import React from 'react'
import { STATUS_CONFIG } from './utils/taskHelpers'

const TaskStatusBadge = ({ status, onClick, className = '' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.todo

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 10px',
    borderRadius: 6,
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    backgroundColor: config.bg,
    color: config.text,
    border: `1px solid ${config.border}`,
    transition: 'all 0.15s ease',
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
  }

  const dot = (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: config.border,
        flexShrink: 0,
        boxShadow: `0 0 4px ${config.border}88`,
      }}
    />
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={className}
        style={{ ...baseStyle, background: 'none', outline: 'none' }}
        onMouseEnter={e => {
          e.currentTarget.style.filter = 'brightness(1.1)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.filter = ''
          e.currentTarget.style.transform = ''
        }}
      >
        {dot}
        {config.label}
      </button>
    )
  }

  return (
    <span className={className} style={baseStyle}>
      {dot}
      {config.label}
    </span>
  )
}

export default TaskStatusBadge