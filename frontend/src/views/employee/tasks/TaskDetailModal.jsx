import React, { useEffect, useState } from 'react'
import {
  CAlert,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormTextarea,
  CAvatar,
  CSpinner,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilX, cilCommentSquare, cilCalendar, cilUser, cilTask } from '@coreui/icons'
import TaskStatusBadge from './TaskStatusBadge'
import PriorityDot from './PriorityDot'
import ProgressBar from './ProgressBar'
import RecursiveSubtaskTree from './RecursiveSubtaskTree'
import { formatDueDate, calculateProgress } from './utils/taskHelpers'
import RequestExtensionForm from '../../../components/request/RequestExtensionForm'
import api from '../../../api'

const TaskDetailModal = ({ visible, task, onClose, onStatusChange, onTaskUpdated }) => {
  const handleSafeClose = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    } onClose();
  };
  const [localTask, setLocalTask] = useState(task)
  const [comment, setComment] = useState('')
  const [markingReady, setMarkingReady] = useState(false)
  const [actionFeedback, setActionFeedback] = useState(null)

  useEffect(() => {
    setLocalTask(task)
    setActionFeedback(null)
  }, [task])

  if (!localTask) return null

  const dueInfo = formatDueDate(localTask.due_date)
  const progress = calculateProgress(localTask)
  const canMarkReady = !['ready_for_review', 'done'].includes(localTask.status)

  const handleAddComment = async () => {
  if (!comment.trim()) return

  try {
    const response = await api.post(`/api/employee/tasks/${localTask.id}/comments`, {
      content: comment.trim(),
    })

    const newComment = response.data?.data

    setLocalTask(prev => ({
      ...prev,
      comments: [...(prev.comments || []), newComment],
    }))

    setComment('')
  } catch (error) {
    setActionFeedback({
      type: 'danger',
      message: error.response?.data?.message || 'Failed to add comment.',
    })
  }
}

  const handleMarkReady = async () => {
    setMarkingReady(true)
    setActionFeedback(null)
    try {
      const response = await api.patch(`/api/tasks/${localTask.id}/mark-ready`)
      const updatedTask = response.data?.data || { ...localTask, status: 'ready_for_review' }
      setLocalTask(updatedTask)
      setActionFeedback({ type: 'success', message: 'Task marked as ready for review.' })
      onTaskUpdated?.(updatedTask)
    } catch (error) {
      setActionFeedback({
        type: 'danger',
        message: error.response?.data?.message || 'Unable to mark task as ready for review.',
      })
    } finally {
      setMarkingReady(false)
    }
  }
  const TASK_STATUSES = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'ready_for_review', label: 'Ready for Review' },
    { value: 'done', label: 'Done' },
    { value: 'on_hold', label: 'On Hold' }
  ]

  return (
    <CModal
      visible={visible}
      onClose={handleSafeClose}
      size="lg"
      backdrop="static"
      className="task-detail-modal"
    >
      <CModalHeader
        className="border-bottom-0 pb-0"
        onClose={() => {
          document.activeElement?.blur(); // Fixes the aria-hidden warning!
          handleSafeClose();
        }}
      >
        <CModalTitle className="fs-5 fw-bold">{localTask.title}</CModalTitle>
      </CModalHeader>

      <CModalBody>
        {actionFeedback && (
          <CAlert color={actionFeedback.type} className="py-2 small" dismissible onClose={() => setActionFeedback(null)}>
            {actionFeedback.message}
          </CAlert>
        )}

        {/* Meta Bar */}
        <div className="d-flex flex-wrap align-items-center gap-3 mb-4 p-3 rounded-3" style={{ background: '#f8fafc' }}>
          
          {/* INTERACTIVE STATUS DROPDOWN */}
          <CDropdown>
            <CDropdownToggle color="transparent" caret={false} className="p-0 border-0 shadow-none">
              <TaskStatusBadge status={localTask.status} />
            </CDropdownToggle>
            <CDropdownMenu>
              {TASK_STATUSES.map((s) => (
                <CDropdownItem 
                  key={s.value}
                  onClick={() => {
                    // 1. Instantly update the visual badge in the modal
                    setLocalTask(prev => ({ ...prev, status: s.value }));
                    // 2. Fire the hook to update the database
                    onStatusChange(localTask.id, s.value);
                  }}
                  active={localTask.status === s.value}
                  style={{ cursor: 'pointer' }}
                >
                  {s.label}
                </CDropdownItem>
              ))}
            </CDropdownMenu>
          </CDropdown>
          
          {/* PRIORITY (Just one!) */}
          <PriorityDot priority={localTask.priority} showLabel />

          {/* DATE INFO */}
          <div className="d-flex align-items-center gap-2 small">
            <CIcon icon={cilCalendar} size="sm" className="text-muted" />
            <span style={{ color: dueInfo.color, fontWeight: dueInfo.urgent ? 600 : 400 }}>
              {dueInfo.text}
            </span>
          </div>

          {/* ASSIGNEE */}
          {localTask.assignee && (
            <div className="d-flex align-items-center gap-2 small">
              <CAvatar size="sm" color="primary" textColor="white">
                {localTask.assignee.name?.charAt(0)}
              </CAvatar>
              <span className="text-muted">{localTask.assignee.name}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {localTask.description && (
          <div className="mb-4">
            <h6 className="fw-bold small text-uppercase text-muted mb-2" style={{ letterSpacing: '0.5px' }}>
              Description
            </h6>
            <p className="small text-body-secondary" style={{ lineHeight: 1.6 }}>
              {localTask.description}
            </p>
          </div>
        )}

        {/* Progress */}
        {localTask.children?.length > 0 && (
          <div className="mb-4">
            <h6 className="fw-bold small text-uppercase text-muted mb-2" style={{ letterSpacing: '0.5px' }}>
              Progress
            </h6>
            <ProgressBar progress={progress} height={8} />
          </div>
        )}

        {/* Subtasks */}
        {localTask.children?.length > 0 && (
          <div className="mb-4">
            <h6 className="fw-bold small text-uppercase text-muted mb-2" style={{ letterSpacing: '0.5px' }}>
              Subtasks
            </h6>
            <RecursiveSubtaskTree
              tasks={localTask.children}
              onStatusChange={onStatusChange}
            />
          </div>
        )}

        {/* Extension Request */}
        <div className="mb-4">
          <h6 className="fw-bold small text-uppercase text-muted mb-3" style={{ letterSpacing: '0.5px' }}>
            Deadline Extension
          </h6>
          <RequestExtensionForm
            compact
            requestableId={localTask.id}
            requestableType="task"
            currentDeadline={localTask.due_date}
          />
        </div>

        {/* Comments */}
        <div>
          <h6 className="fw-bold small text-uppercase text-muted mb-3" style={{ letterSpacing: '0.5px' }}>
            <CIcon icon={cilCommentSquare} className="me-1" />
            Comments ({localTask.comments?.length || 0})
          </h6>

          {/* Existing Comments */}
          <div className="d-flex flex-column gap-3 mb-3">
            {localTask.comments?.map(comment => (
              <div key={comment.id} className="d-flex gap-3 p-3 rounded-3" style={{ background: '#f8fafc' }}>
                <CAvatar size="sm" color="secondary">
                  {comment.user?.name?.charAt(0)}
                </CAvatar>
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="fw-bold small">{comment.user?.name}</span>
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="small mb-0">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment */}
          <div className="d-flex gap-2">
            <CFormTextarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="shadow-none"
            />
            <CButton color="primary" onClick={handleAddComment} disabled={!comment.trim()}>
              Post
            </CButton>
          </div>
        </div>
      </CModalBody>

      <CModalFooter className="border-top-0">
        <CButton color="light" onClick={onClose}>Close</CButton>
        {canMarkReady && (
          <CButton color="info" variant="outline" onClick={handleMarkReady} disabled={markingReady}>
            {markingReady ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Sending...
              </>
            ) : (
              'Mark as Ready for Review'
            )}
          </CButton>
        )}
        <CButton
          color="primary"
          onClick={() => onStatusChange(localTask.id, localTask.status === 'done' ? 'todo' : 'done')}
        >
          {localTask.status === 'done' ? 'Reopen Task' : 'Mark Complete'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default TaskDetailModal
