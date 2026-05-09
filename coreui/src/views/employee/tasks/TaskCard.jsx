import React, { useState } from 'react'
import { 
  CCard, 
  CCardBody, 
  CFormCheck, 
  CDropdown, 
  CDropdownToggle, 
  CDropdownMenu, 
  CDropdownItem,
  CTooltip,
  CCollapse,
  CButton
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
  cilOptions, 
  cilChevronBottom, 
  cilChevronRight,
  cilCommentSquare,
  cilPaperclip,
  cilTask,
  cilCalendar,
  cilExpandDown
} from '@coreui/icons'
import TaskStatusBadge from './TaskStatusBadge'
import PriorityDot from './PriorityDot'
import ProgressBar from './ProgressBar'
import RecursiveSubtaskTree from './RecursiveSubtaskTree'
import { formatDueDate, calculateProgress } from './utils/taskHelpers'

// Recursive check: task can only complete if ALL descendants are done
const canCompleteTask = (task) => {
  if (!task.children || task.children.length === 0) return true
  return task.children.every(child => {
    if (child.status !== 'done') return false
    return canCompleteTask(child) // recurse deeper
  })
}

// Count all descendants recursively
const countAllSubtasks = (task) => {
  if (!task.children || task.children.length === 0) return 0
  return task.children.reduce((count, child) => {
    return count + 1 + countAllSubtasks(child)
  }, 0)
}

// Collect all task IDs in tree
const getAllTaskIds = (task) => {
  const ids = new Set()
  const collect = (t) => {
    ids.add(t.id)
    t.children?.forEach(collect)
  }
  collect(task)
  return ids
}

const TaskCard = ({ task, onStatusChange, onClick }) => {
  const [expanded, setExpanded] = useState(false)
  const [expandedIds, setExpandedIds] = useState(new Set())
  
  const dueInfo = formatDueDate(task.due_date)
  const progress = calculateProgress(task)
  const canComplete = canCompleteTask(task)
  const totalSubtasks = countAllSubtasks(task)
  const hasChildren = task.children && task.children.length > 0
  const allIds = hasChildren ? getAllTaskIds(task) : new Set()

  const isAllExpanded = expanded && expandedIds.size === allIds.size

  const handleExpandAll = () => {
    if (isAllExpanded) {
      // Collapse everything
      setExpanded(false)
      setExpandedIds(new Set())
    } else {
      // Expand everything
      setExpanded(true)
      setExpandedIds(new Set(allIds))
    }
  }

  const handleToggleExpand = (id) => {
    const newSet = new Set(expandedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExpandedIds(newSet)
    
    // If any child is expanded, parent should be expanded too
    if (newSet.size > 0 && !expanded) setExpanded(true)
  }

  return (
    <CCard 
      className="border-0 shadow-sm mb-3"
      style={{ 
        borderLeft: dueInfo.urgent ? '3px solid #ef4444' : '3px solid transparent',
        transition: 'all 0.2s ease'
      }}
    >
      <CCardBody className="p-4">
        {/* Top Row */}
        <div className="d-flex align-items-start gap-3">
          {/* Checkbox */}
          <CTooltip content={!canComplete ? "Complete all subtasks first" : ""}>
            <div>
              <CFormCheck
                checked={task.status === 'done'}
                onChange={() => onStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')}
                disabled={!canComplete}
                className="mt-1"
              />
            </div>
          </CTooltip>

          {/* Main Content */}
          <div className="flex-grow-1">
            {/* Title & Actions */}
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div 
                className="cursor-pointer"
                onClick={() => onClick?.(task)}
                style={{ cursor: 'pointer' }}
              >
                <h6 className={`fw-bold mb-1 ${task.status === 'done' ? 'text-decoration-line-through text-muted' : ''}`}>
                  {task.title}
                </h6>
                {task.project && (
                  <span className="small text-primary" style={{ fontWeight: 500 }}>
                    {task.project.name}
                  </span>
                )}
              </div>
              
              <CDropdown alignment="end">
                <CDropdownToggle caret={false} color="transparent" className="p-1 border-0 shadow-none">
                  <CIcon icon={cilOptions} className="text-muted" />
                </CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem onClick={() => onClick?.(task)}>
                    <CIcon icon={cilTask} className="me-2" size="sm" />
                    View Details
                  </CDropdownItem>
                  <CDropdownItem>
                    <CIcon icon={cilCommentSquare} className="me-2" size="sm" />
                    Add Comment
                  </CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </div>

            {/* Meta Row */}
            <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
              <TaskStatusBadge status={task.status} />
              <PriorityDot priority={task.priority} showLabel />
              
              <div className="d-flex align-items-center gap-1 small text-muted">
                <CIcon icon={cilCalendar} size="sm" />
                <span style={{ color: dueInfo.color, fontWeight: dueInfo.urgent ? 600 : 400 }}>
                  {dueInfo.text}
                </span>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <p className="small text-muted mb-3" style={{ lineHeight: 1.5 }}>
                {task.description}
              </p>
            )}

            {/* Progress Bar */}
            {hasChildren && (
              <div className="mb-3">
                <ProgressBar progress={progress} />
              </div>
            )}

            {/* Bottom Meta */}
            <div className="d-flex align-items-center gap-3 small text-muted">
              {hasChildren && (
                <>
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="d-flex align-items-center gap-1 btn btn-sm p-0 border-0 bg-transparent text-muted"
                  >
                    <CIcon icon={expanded ? cilChevronBottom : cilChevronRight} size="sm" />
                    {totalSubtasks} subtasks
                  </button>
                  
                  {/* Expand All Button */}
                  <CButton
                    color="link"
                    size="sm"
                    className="p-0 d-flex align-items-center gap-1 text-primary"
                    onClick={handleExpandAll}
                  >
                    <CIcon icon={cilExpandDown} size="sm" />
                    {isAllExpanded ? 'All' : 'All'}
                  </CButton>
                </>
              )}
              
              {task.comments?.length > 0 && (
                <span className="d-flex align-items-center gap-1">
                  <CIcon icon={cilCommentSquare} size="sm" />
                  {task.comments.length}
                </span>
              )}
              
              {task.attachments_count > 0 && (
                <span className="d-flex align-items-center gap-1">
                  <CIcon icon={cilPaperclip} size="sm" />
                  {task.attachments_count}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Subtasks */}
        <CCollapse visible={expanded}>
          {hasChildren && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #f3f4f6' }}>
              <RecursiveSubtaskTree
                tasks={task.children}
                onStatusChange={onStatusChange}
                expandedIds={expandedIds}
                onToggleExpand={handleToggleExpand}
              />
            </div>
          )
          }
          
        </CCollapse>
        
      </CCardBody>
    </CCard>
  )
}

export default TaskCard