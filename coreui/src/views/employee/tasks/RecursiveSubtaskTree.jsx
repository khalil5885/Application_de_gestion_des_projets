// RecursiveSubtaskTree.jsx — replace CSS animation with transition-based approach
import React, { useEffect, useRef } from 'react'
import { CFormCheck, CCollapse } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilChevronBottom, cilChevronRight } from '@coreui/icons'
import TaskStatusBadge from './TaskStatusBadge'
import PriorityDot from './PriorityDot'
import { calculateProgress } from './utils/taskHelpers'

const canCompleteTask = (task) => {
  if (!task.children || task.children.length === 0) return true
  return task.children.every(child => {
    if (child.status !== 'done') return false
    return canCompleteTask(child)
  })
}

// Animated row component — handles its own mount animation
const AnimatedSubtaskRow = ({ children, delay = 0 }) => {
  const ref = useRef(null)
  
  useEffect(() => {
    const el = ref.current
    if (!el) return
    
    // Force reflow to ensure transition triggers
    el.style.opacity = '0'
    el.style.transform = 'translateY(-8px)'
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        el.style.transition = `opacity 0.25s ease-out ${delay}s, transform 0.25s ease-out ${delay}s`
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
      }, 10)
    })
  }, [delay])

  return <div ref={ref}>{children}</div>
}

const RecursiveSubtaskTree = ({ 
  tasks, 
  level = 0, 
  onStatusChange,
  expandedIds = new Set(),
  onToggleExpand 
}) => {
  const isExpanded = (id) => expandedIds.has(id)
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
              {/* Task Row */}
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
                    onClick={() => onToggleExpand(task.id)}
                    className="btn btn-sm p-0 border-0 bg-transparent"
                    style={{ width: 20, height: 20 }}
                  >
                    <CIcon 
                      icon={expanded ? cilChevronBottom : cilChevronRight} 
                      size="sm" 
                      className="text-muted"
                    />
                  </button>
                ) : (
                  <div style={{ width: 20 }} />
                )}

                {/* Checkbox */}
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

                <TaskStatusBadge 
                  status={task.status} 
                  onClick={() => {
                    const cycle = { todo: 'in_progress', in_progress: 'done', done: 'todo', on_hold: 'todo' }
                    onStatusChange(task.id, cycle[task.status] || 'todo')
                  }}
                />

                {hasChildren && (
                  <span className="small text-muted" style={{ fontSize: '0.7rem' }}>
                    {progress}%
                  </span>
                )}
              </div>
            </AnimatedSubtaskRow>

            {/* Recursive Children */}
            <CCollapse visible={expanded}>
              {hasChildren && (
                <RecursiveSubtaskTree
                  tasks={task.children}
                  level={level + 1}
                  onStatusChange={onStatusChange}
                  expandedIds={expandedIds}
                  onToggleExpand={onToggleExpand}
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