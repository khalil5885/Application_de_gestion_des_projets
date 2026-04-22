import React from 'react'

/**
 * ProgressBar — shows a labeled percentage bar for a project's completion.
 * Props:
 *   value  {number}  0–100 percentage value
 */
const ProgressBar = ({ value = 0 }) => {
  const clamped = Math.min(100, Math.max(0, value))

  const color =
    clamped >= 75 ? '#2eb85c'   // green
    : clamped >= 40 ? '#f9b115' // yellow
    : '#e55353'                 // red

  return (
    <div className="mb-2">
      <div className="d-flex justify-content-between mb-1">
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--cui-body-color)' }}>
          Progress
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color }}>
          {clamped}%
        </span>
      </div>
      <div
        className="rounded-pill overflow-hidden"
        style={{ height: 5, background: 'var(--cui-border-color)' }}
      >
        <div
          className="rounded-pill"
          style={{
            height: '100%',
            width: `${clamped}%`,
            background: color,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
