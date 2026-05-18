import React, { useState } from 'react'
import {
  CCard,
  CCardBody,
  CBadge,
  CButton,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CCollapse,
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
  cilExpandDown,
  cilCheck,
  cilMediaPlay,
  cilX,
} from '@coreui/icons'
import TaskStatusBadge from './TaskStatusBadge'
import PriorityDot from './PriorityDot'
import ProgressBar from './ProgressBar'
import RecursiveSubtaskTree from './RecursiveSubtaskTree'
import TaskDetailModal from './TaskDetailModal'
import { formatDueDate, calculateProgress, countAllSubtasks } from './utils/taskHelpers'

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

const TaskCard = ({ task, onStatusChange, onClick, onMarkReady }) => {
  const [expanded, setExpanded] = useState(false)
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [selectedSubtask, setSelectedSubtask] = useState(null)
  const [subtaskModalVisible, setSubtaskModalVisible] = useState(false)

  const dueInfo = formatDueDate(task.due_date)
  const progress = calculateProgress(task)
  const totalSubtasks = countAllSubtasks(task)
  const hasChildren = task.children && task.children.length > 0
  const allIds = hasChildren ? getAllTaskIds(task) : new Set()
  const isAllExpanded = expanded && expandedIds.size === allIds.size

  const isTodo = task.status === 'todo'
  const isInProgress = task.status === 'in_progress'
  const isReadyForReview = task.status === 'ready_for_review'
  const isDone = task.status === 'done'

  const handleExpandAll = () => {
    if (isAllExpanded) {
      setExpanded(false)
      setExpandedIds(new Set())
    } else {
      setExpanded(true)
      setExpandedIds(new Set(allIds))
    }
  }

  const handleToggleExpand = (id) => {
    const newSet = new Set(expandedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExpandedIds(newSet)
    if (newSet.size > 0 && !expanded) setExpanded(true)
  }

  const handleSubtaskClick = (subtask) => {
    setSelectedSubtask(subtask)
    setSubtaskModalVisible(true)
  }

  const handleSubtaskStatusChange = (subtaskId, newStatus) => {
    // If the subtask detail modal is open and this is its task, update it
    if (selectedSubtask?.id === subtaskId) {
      setSelectedSubtask(prev => ({ ...prev, status: newStatus }))
    }
    onStatusChange?.(subtaskId, newStatus)
  }

  return (
    <>
      <CCard
        className="border-0 shadow-sm mb-3"
        style={{
          borderLeft: dueInfo.urgent ? '3px solid #ef4444' : '3px solid transparent',
          transition: 'all 0.2s ease',
        }}
      >
        <CCardBody className="p-4">
          <div className="d-flex align-items-start gap-3">
            <div className="flex-grow-1">

              {/* Title & Actions */}
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div
                  className="cursor-pointer"
                  onClick={() => onClick?.(task)}
                  style={{ cursor: 'pointer' }}
                >
                  <h6 className={`fw-bold mb-1 ${isDone ? 'text-decoration-line-through text-muted' : ''}`}>
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

              {/* Action Buttons */}
              <div className="d-flex gap-2 mb-3">
                {isTodo && (
                  <CButton
                    color="primary"
                    size="sm"
                    onClick={() => onStatusChange(task.id, 'in_progress')}
                  >
                    <CIcon icon={cilMediaPlay} size="sm" className="me-1" />
                    Start Task
                  </CButton>
                )}

                {isInProgress && (
                  <CButton
                    color="info"
                    size="sm"
                    onClick={() => onMarkReady?.(task)}
                  >
                    <CIcon icon={cilCheck} size="sm" className="me-1" />
                    Submit for Review
                  </CButton>
                )}

                {isReadyForReview && (
                  <>
                    <CBadge color="info" className="py-2 px-3">
                      <CIcon icon={cilCheck} size="sm" className="me-1" />
                      Pending Admin Review
                    </CBadge>
                    <CButton
                      color="warning"
                      size="sm"
                      variant="outline"
                      onClick={() => onStatusChange?.(task.id, 'in_progress')}
                    >
                      <CIcon icon={cilX} size="sm" className="me-1" />
                      Cancel Review
                    </CButton>
                  </>
                )}

                {isDone && (
                  <CBadge color="success" className="py-2 px-3">
                    <CIcon icon={cilCheck} size="sm" className="me-1" />
                    Completed
                  </CBadge>
                )}
              </div>

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

                    <CButton
                      color="link"
                      size="sm"
                      className="p-0 d-flex align-items-center gap-1 text-primary"
                      onClick={handleExpandAll}
                    >
                      <CIcon icon={cilExpandDown} size="sm" />
                      {isAllExpanded ? 'Collapse All' : 'Expand All'}
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
                  onStatusChange={handleSubtaskStatusChange}
                  onSubtaskClick={handleSubtaskClick}
                  expandedIds={expandedIds}
                  onToggleExpand={handleToggleExpand}
                />
              </div>
            )}
          </CCollapse>
        </CCardBody>
      </CCard>

      {/* Subtask Detail Modal */}
      {selectedSubtask && (
        <TaskDetailModal
          visible={subtaskModalVisible}
          task={selectedSubtask}
          onClose={() => {
            setSubtaskModalVisible(false)
            setSelectedSubtask(null)
          }}
          onStatusChange={handleSubtaskStatusChange}
          onMarkReady={(subtask) => handleSubtaskStatusChange(subtask.id, 'ready_for_review')}
        />
      )}
    </>
  )
}

export default TaskCard