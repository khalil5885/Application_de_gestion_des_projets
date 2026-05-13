import React, { useState, useEffect, useRef } from 'react'
import { CFormCheck, CCollapse } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilChevronBottom, cilChevronRight, cilCheck } from '@coreui/icons'
import PriorityDot from './PriorityDot'
import { calculateProgress } from './utils/taskHelpers'

const TASK_STATUSES = [
  { value: 'todo', label: 'To Do', color: '#8a93a2' },
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'ready_for_review', label: 'Ready for Review', color: '#0ea5e9' },
  { value: 'on_hold', label: 'On Hold', color: '#f59e0b' },
  { value: 'done', label: 'Done', color: '#22c55e' },
]

const canCompleteTask = (task) => {
  if (!task.children || task.children.length === 0) return true
  return task.children.every(child => {
    if (child.status !== 'done') return false
    return canCompleteTask(child)
  })
}

const AnimatedSubtaskRow = ({ children, delay = 0 }) => {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    el.style.opacity = '0'
    el.style.transform = 'translateY(-8px)'

    requestAnimationFrame(() => {
      el.style.transition = `opacity 0.25s ease-out ${delay}s, transform 0.25s ease-out ${delay}s`
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    })
  }, [delay])

  return <div ref={ref}>{children}</div>
}

const StatusDropdown = ({ status, onChange }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = TASK_STATUSES.find(s => s.value === status) || TASK_STATUSES[0]

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="btn p-0 border-0 shadow-none"
        style={{ cursor: 'pointer', backgroundColor: 'transparent' }}
      >
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 8px', borderRadius: 4,
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
          backgroundColor: `${current.color}15`, color: current.color,
          border: `1px solid ${current.color}40`,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: current.color, flexShrink: 0 }} />
          {current.label}
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 9999,
          backgroundColor: 'var(--cui-body-bg)', border: '1px solid var(--cui-border-color)',
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          minWidth: 170, padding: '4px 0',
        }}>
          {TASK_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => { onChange(s.value); setOpen(false) }}
              className="d-flex align-items-center gap-2 w-100 border-0"
              style={{
                padding: '7px 12px', fontSize: '0.8rem', fontWeight: 500,
                backgroundColor: status === s.value ? `${s.color}15` : 'transparent',
                color: status === s.value ? s.color : 'var(--cui-body-color)',
                cursor: 'pointer', transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${s.color}10` }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = status === s.value ? `${s.color}15` : 'transparent'
              }}
            >
              <span style={{
                width: 7, height: 7, borderRadius: '50%', backgroundColor: s.color, flexShrink: 0,
                boxShadow: status === s.value ? `0 0 6px ${s.color}88` : 'none',
              }} />
              {s.label}
              {status === s.value && (
                <CIcon icon={cilCheck} size="sm" style={{ marginLeft: 'auto', color: s.color }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const RecursiveSubtaskTree = ({
  tasks,
  level = 0,
  onStatusChange,
  expandedIds: controlledExpandedIds,
  onToggleExpand: controlledOnToggleExpand
}) => {
  const [internalExpandedIds, setInternalExpandedIds] = useState(new Set())
  const expandedIds = controlledExpandedIds ?? internalExpandedIds

  const isExpanded = (id) => expandedIds.has(id)

  const handleToggleExpand = (id) => {
    if (controlledOnToggleExpand) {
      controlledOnToggleExpand(id)
      return
    }
    setInternalExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const indentSize = Math.min(level, 10) * 20

  return (
    <div className="d-flex flex-column">
      {tasks.map((task, idx) => {
        const hasChildren = task.children && task.children.length > 0
        const progress = calculateProgress(task)
        const canComplete = canCompleteTask(task)
        const expanded = isExpanded(task.id)

        return (
          <div key={task.id}>
            <AnimatedSubtaskRow delay={idx * 0.05}>
              <div
                className="d-flex align-items-center gap-2 py-2 subtask-row"
                style={{
                  paddingLeft: `${indentSize + 12}px`,
                  marginLeft: level > 0 ? '11px' : '0',
                }}
              >
                {/* Expand/Collapse */}
                {hasChildren ? (
                  <button
                    onClick={() => handleToggleExpand(task.id)}
                    className="btn btn-sm p-0 border-0"
                    style={{
                      width: 20, height: 20,
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <CIcon
                      icon={expanded ? cilChevronBottom : cilChevronRight}
                      size="sm"
                      className="text-muted"
                    />
                  </button>
                ) : (
                  <div style={{ width: 20, flexShrink: 0 }} />
                )}

                <CFormCheck
                  checked={task.status === 'done'}
                  onChange={() => {
                    const newStatus = task.status === 'done' ? 'todo' : 'done'
                    onStatusChange(task.id, newStatus)
                  }}
                  disabled={!canComplete}
                  className="m-0"
                />

                <PriorityDot priority={task.priority} size={6} />

                <span className={`small flex-grow-1 ${task.status === 'done' ? 'text-decoration-line-through text-muted' : ''}`}>
                  {task.title}
                </span>

                {/* STATUS DROPDOWN — replaces TaskStatusBadge onClick cycling */}
                <StatusDropdown
                  status={task.status}
                  onChange={(newStatus) => onStatusChange(task.id, newStatus)}
                />

                {hasChildren && (
                  <span className="small text-muted" style={{ fontSize: '0.7rem' }}>
                    {progress}%
                  </span>
                )}
              </div>
            </AnimatedSubtaskRow>

            <CCollapse visible={expanded}>
              {hasChildren && (
                <RecursiveSubtaskTree
                  tasks={task.children}
                  level={level + 1}
                  onStatusChange={onStatusChange}
                  expandedIds={controlledExpandedIds}
                  onToggleExpand={controlledOnToggleExpand}
                />
              )}
            </CCollapse>
          </div>
        )
      })}
    </div>
  )
}

export default RecursiveSubtaskTree