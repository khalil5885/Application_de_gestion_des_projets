import React from 'react'

/**
 * TaskBreakdown — shows a compact summary of tasks grouped by status.
 * Props:
 *   tasks  {Array}  array of task objects with at least a `status` field
 */
const TaskBreakdown = ({ tasks = [] }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <p className="small text-body-secondary mb-2" style={{ fontSize: 10 }}>
        No tasks yet.
      </p>
    )
  }

  const done    = tasks.filter((t) => t.status === 'done').length
  const inProg  = tasks.filter((t) => t.status === 'in_progress').length
  const pending = tasks.length - done - inProg

  const pills = [
    { label: 'Done',       count: done,    color: '#2eb85c' },
    { label: 'In Progress', count: inProg,  color: '#321fdb' },
    { label: 'Pending',    count: pending, color: '#8a93a2' },
  ].filter((p) => p.count > 0)

  return (
    <div className="d-flex flex-wrap gap-1 mb-2">
      {pills.map(({ label, count, color }) => (
        <span
          key={label}
          className="rounded-pill px-2"
          style={{
            fontSize: 9,
            fontWeight: 700,
            background: `${color}22`,
            color,
            border: `1px solid ${color}44`,
            lineHeight: '18px',
          }}
        >
          {count} {label}
        </span>
      ))}
    </div>
  )
}

export default TaskBreakdown
