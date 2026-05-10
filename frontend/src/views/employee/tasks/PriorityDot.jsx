import React from 'react'

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'var(--danger-border)'  },
  high:   { label: 'High',   color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'var(--danger-border)'  },
  medium: { label: 'Medium', color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)' },
  low:    { label: 'Low',    color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)' },
}

const PriorityDot = ({ priority, showLabel = false, size = 8 }) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium

  return (
    <div className="d-inline-flex align-items-center gap-2">
      <span
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: config.color,
          boxShadow: `0 0 0 2px ${config.bg}, 0 0 6px ${config.color}55`,
          flexShrink: 0,
        }}
      />
      {showLabel && (
        <span
          style={{
            fontSize: '0.73rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: config.color,
            background: config.bg,
            border: `1px solid ${config.border}`,
            borderRadius: '4px',
            padding: '1px 7px',
          }}
        >
          {config.label}
        </span>
      )}
    </div>
  )
}

export default PriorityDot