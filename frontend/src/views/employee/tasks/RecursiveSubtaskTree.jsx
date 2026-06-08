import React, { useState, useEffect, useRef } from 'react'
import { CFormCheck, CCollapse, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilChevronBottom, cilChevronRight } from '@coreui/icons'
import PriorityDot from './PriorityDot'
import { calculateProgress } from './utils/taskHelpers'

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

const RecursiveSubtaskTree = ({
  tasks,
  level = 0,
  onStatusChange,
  onSubtaskClick,
  expandedIds: controlledExpandedIds,
  onToggleExpand: controlledOnToggleExpand,
}) => {
  const [internalExpandedIds, setInternalExpandedIds] = useState(new Set())
  const expandedIds = controlledExpandedIds ?? internalExpandedIds

  const isExpanded = (id) => expandedIds.has(id)

  const handleToggleExpand = (e, id) => {
    e.stopPropagation()
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
        const expanded = isExpanded(task.id)

        return (
          <div key={task.id}>
            <AnimatedSubtaskRow delay={idx * 0.05}>
              <div
                className="d-flex align-items-center gap-2 py-2 subtask-row"
                onClick={() => onSubtaskClick?.(task)}
                style={{
                  paddingLeft: `${indentSize + 12}px`,
                  marginLeft: level > 0 ? '11px' : '0',
                  cursor: onSubtaskClick ? 'pointer' : 'default',
                  borderRadius: 6,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => {
                  if (onSubtaskClick) e.currentTarget.style.background = 'var(--cui-secondary-bg)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {/* Expand/Collapse — stopPropagation so it doesn't open the detail modal */}
                {hasChildren ? (
                  <button
                    onClick={(e) => handleToggleExpand(e, task.id)}
                    className="btn btn-sm p-0 border-0"
                    style={{
                      width: 20, height: 20,
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
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

                {/* Checkbox — stopPropagation so ticking doesn't open the detail modal */}
                {/* <CFormCheck
                  checked={task.status === 'done'}
                  onChange={() => {
                    const newStatus = task.status === 'done' ? 'todo' : 'done'
                    onStatusChange(task.id, newStatus)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="m-0"
                /> */}

                <PriorityDot priority={task.priority} size={6} />

                <span
                  className={`small flex-grow-1 ${task.status === 'done' ? 'text-decoration-line-through text-muted' : ''}`}
                >
                  {task.title}
                </span>

                {/* Simple status indicator */}
                {task.status === 'in_progress' && (
                  <CBadge color="primary" size="sm">In Progress</CBadge>
                )}

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
                  onSubtaskClick={onSubtaskClick}
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