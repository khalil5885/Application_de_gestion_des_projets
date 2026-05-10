import React from 'react'

const ProgressBar = ({ progress = 0, height = 6, className = '' }) => {
  const getColor = (val) => {
    if (val >= 80) return 'var(--success)'
    if (val >= 50) return 'var(--accent)'
    if (val >= 20) return 'var(--warning)'
    return 'var(--danger)'
  }

  return (
    <div className={`d-flex align-items-center gap-3 ${className}`}>
      <div
        style={{
          flex: 1,
          height,
          borderRadius: 999,
          background: 'var(--border-default)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            borderRadius: 999,
            background: getColor(progress),
            transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
            boxShadow: `0 0 8px ${getColor(progress)}55`,
          }}
        />
      </div>
      <span
        style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: getColor(progress),
          minWidth: 34,
          textAlign: 'right',
        }}
      >
        {progress}%
      </span>
    </div>
  )
}

export default ProgressBar