import React, { useEffect, useState, useRef } from 'react'
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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilX, cilCommentSquare, cilCalendar, cilCheck, cilChevronBottom } from '@coreui/icons'
import TaskStatusBadge from './TaskStatusBadge'
import PriorityDot from './PriorityDot'
import ProgressBar from './ProgressBar'
import RecursiveSubtaskTree from './RecursiveSubtaskTree'
import { formatDueDate, calculateProgress } from './utils/taskHelpers'
import RequestExtensionForm from '../../../components/request/RequestExtensionForm'
import api from '../../../api'

const TASK_STATUSES = [
  { value: 'todo', label: 'To Do', color: '#8a93a2' },
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'ready_for_review', label: 'Ready for Review', color: '#0ea5e9' },
  { value: 'on_hold', label: 'On Hold', color: '#f59e0b' },
  
]

const TaskDetailModal = ({ visible, task, onClose, onStatusChange, onTaskUpdated }) => {
  const handleSafeClose = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    onClose()
  }

  const [localTask, setLocalTask] = useState(task)
  const [comment, setComment] = useState('')
  const [markingReady, setMarkingReady] = useState(false)
  const [actionFeedback, setActionFeedback] = useState(null)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const statusMenuRef = useRef(null)

  useEffect(() => {
    setLocalTask(task)
    setActionFeedback(null)
    setStatusMenuOpen(false)
  }, [task])

  useEffect(() => {
    if (!statusMenuOpen) return
    const handler = (e) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) {
        setStatusMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [statusMenuOpen])

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
      const newComment = response.data?.data || response.data
      const safeComment = newComment?.user ? newComment : { ...newComment, user: { name: 'You' } }
      setLocalTask(prev => ({ ...prev, comments: [...(prev.comments || []), safeComment] }))
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

  const handleStatusSelect = (newStatus) => {
    if (newStatus === localTask.status) {
      setStatusMenuOpen(false)
      return
    }
    setLocalTask(prev => ({ ...prev, status: newStatus }))
    onStatusChange?.(localTask.id, newStatus)
    setStatusMenuOpen(false)
  }

  const currentStatus = TASK_STATUSES.find(s => s.value === localTask.status) || TASK_STATUSES[0]

  return (
    <CModal
      visible={visible}
      onClose={handleSafeClose}
      size="lg"
      backdrop="static"
      className="task-detail-modal"
    >
      <CModalHeader className="border-bottom-0 pb-0" onClose={handleSafeClose}>
        <CModalTitle className="fs-5 fw-bold">{localTask.title}</CModalTitle>
      </CModalHeader>

      <CModalBody>
        {actionFeedback && (
          <CAlert color={actionFeedback.type} className="py-2 small" dismissible onClose={() => setActionFeedback(null)}>
            {actionFeedback.message}
          </CAlert>
        )}

        {/* Meta Bar */}
        <div className="d-flex flex-wrap align-items-center gap-3 mb-4 p-3 rounded-3" style={{ backgroundColor: 'var(--cui-secondary-bg)' }}>

          {/* STATUS DROPDOWN */}
          <div ref={statusMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setStatusMenuOpen(o => !o)}
              className="btn p-0 border-0 shadow-none"
              style={{ cursor: 'pointer', backgroundColor: 'transparent' }}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 6,
                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                backgroundColor: `${currentStatus.color}15`, color: currentStatus.color,
                border: `1px solid ${currentStatus.color}40`,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: currentStatus.color, flexShrink: 0 }} />
                {currentStatus.label}
                <CIcon icon={cilChevronBottom} size="xs" style={{ marginLeft: 2, opacity: 0.6 }} />
              </span>
            </button>

            {statusMenuOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 9999,
                backgroundColor: 'var(--cui-body-bg)', border: '1px solid var(--cui-border-color)',
                borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                minWidth: 180, padding: '4px 0',
              }}>
                {TASK_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusSelect(s.value)}
                    className="d-flex align-items-center gap-2 w-100 border-0"
                    style={{
                      padding: '8px 12px', fontSize: '0.85rem', fontWeight: 500,
                      backgroundColor: localTask.status === s.value ? `${s.color}15` : 'transparent',
                      color: localTask.status === s.value ? s.color : 'var(--cui-body-color)',
                      cursor: 'pointer', transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${s.color}10` }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = localTask.status === s.value ? `${s.color}15` : 'transparent'
                    }}
                  >
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, flexShrink: 0,
                      boxShadow: localTask.status === s.value ? `0 0 6px ${s.color}88` : 'none',
                    }} />
                    {s.label}
                    {localTask.status === s.value && (
                      <CIcon icon={cilCheck} size="sm" style={{ marginLeft: 'auto', color: s.color }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <PriorityDot priority={localTask.priority} showLabel />

          <div className="d-flex align-items-center gap-2 small">
            <CIcon icon={cilCalendar} size="sm" className="text-muted" />
            <span style={{ color: dueInfo.color, fontWeight: dueInfo.urgent ? 600 : 400 }}>
              {dueInfo.text}
            </span>
          </div>

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

          <div className="d-flex flex-column gap-3 mb-3">
            {(localTask.comments || []).filter(Boolean).map(comment => (
              <div key={comment.id || `comment-${Math.random()}`} className="d-flex gap-3 p-3 rounded-3" style={{ backgroundColor: 'var(--cui-secondary-bg)' }}>
                <CAvatar size="sm" color="secondary">
                  {(comment.user?.name || 'U')?.charAt(0)}
                </CAvatar>
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="fw-bold small">{comment.user?.name || 'Unknown User'}</span>
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <p className="small mb-0">{comment.content || comment.body || ''}</p>
                </div>
              </div>
            ))}
          </div>

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
        <CButton color="secondary" variant="outline" onClick={onClose}>Close</CButton>
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
          onClick={() => onStatusChange?.(localTask.id, localTask.status === 'done' ? 'todo' : 'done')}
        >
          {localTask.status === 'done' ? 'Reopen Task' : 'Mark Complete'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default TaskDetailModal