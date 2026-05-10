import React, { useState } from 'react'
import {
  CAlert,
  CButton,
  CFormLabel,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from '@coreui/react'
import api from '../../api'

const TaskReviewActions = ({ task, onReviewed, size = 'sm' }) => {
  const [loadingAction, setLoadingAction] = useState(null)
  const [rejectVisible, setRejectVisible] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState(null)

  if (task?.status !== 'ready_for_review') return null

  const handleApprove = async () => {
    setError(null)
    setLoadingAction('approve')
    try {
      const response = await api.patch(`/api/admin/tasks/${task.id}/approve`)
      onReviewed?.(response.data?.data || { ...task, status: 'done' })
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to approve task.')
    } finally {
      setLoadingAction(null)
    }
  }

  const handleReject = async () => {
    if (!feedback.trim()) {
      setError('Feedback is required when rejecting a task.')
      return
    }

    setError(null)
    setLoadingAction('reject')
    try {
    // Send feedback in the same request — backend handles comment + status
    const response = await api.patch(`/api/admin/tasks/${task.id}/reject`, {
      feedback: feedback.trim(),
    })

    setRejectVisible(false)
    setFeedback('')
    onReviewed?.(response.data?.data || { ...task, status: 'in_progress' })
  } catch (err) {
    setError(err.response?.data?.message || 'Unable to reject task.')
  } finally {
    setLoadingAction(null)
  }
}

  return (
    <>
      <div className="d-flex flex-column gap-2">
        {error && (
          <CAlert
            color="danger"
            className="py-2 small mb-0"
            dismissible
            onClose={() => setError(null)}
          >
            {error}
          </CAlert>
        )}
        <div className="d-flex gap-2">
          <CButton color="success" size={size} disabled={!!loadingAction} onClick={handleApprove}>
            {loadingAction === 'approve' ? <CSpinner size="sm" /> : 'Approve'}
          </CButton>
          <CButton
            color="danger"
            variant="outline"
            size={size}
            disabled={!!loadingAction}
            onClick={() => setRejectVisible(true)}
          >
            Reject
          </CButton>
        </div>
      </div>

      <CModal visible={rejectVisible} onClose={() => setRejectVisible(false)} alignment="center">
        <CModalHeader>
          <CModalTitle>Reject Task</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {error && <CAlert color="danger">{error}</CAlert>}
          <CFormLabel className="fw-semibold small">Feedback</CFormLabel>
          <CFormTextarea
            rows={4}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="Tell the employee what needs to change..."
            disabled={loadingAction === 'reject'}
          />
        </CModalBody>
        <CModalFooter>
          <CButton
            color="light"
            onClick={() => setRejectVisible(false)}
            disabled={loadingAction === 'reject'}
          >
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleReject} disabled={loadingAction === 'reject'}>
            {loadingAction === 'reject' ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Rejecting...
              </>
            ) : (
              'Reject Task'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default TaskReviewActions
