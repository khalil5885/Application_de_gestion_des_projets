// src/views/employee/tasks/ProgressBar.jsx
import React from 'react'
import { CProgress } from '@coreui/react'

const ProgressBar = ({ progress, height = 6, className = '' }) => {
  const getColor = (val) => {
    if (val >= 80) return 'success'
    if (val >= 50) return 'warning'
    return 'primary'
  }

  return (
    <div className={`d-flex align-items-center gap-2 ${className}`}>
      <CProgress 
        value={progress} 
        color={getColor(progress)}
        height={height}
        className="flex-grow-1 rounded-pill"
        style={{ backgroundColor: '#e5e7eb' }}
      />
      <span className="small text-muted" style={{ fontSize: '0.75rem', minWidth: 32 }}>
        {progress}%
      </span>
    </div>
  )
}

export default ProgressBar