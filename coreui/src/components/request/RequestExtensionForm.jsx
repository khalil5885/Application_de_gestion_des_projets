import React, { useContext, useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CSpinner,
} from '@coreui/react'
import api from '../../api'
import { AuthContext } from '../../context/AuthContext'

const getUserRole = (user) => (user?.role || user?.global_role || user?.type || '').toLowerCase()

const RequestExtensionForm = ({
  requestableId,
  requestableType = 'task',
  currentDeadline,
  onCreated,
  compact = false,
}) => {
  const { user } = useContext(AuthContext)
  const [requestedDeadline, setRequestedDeadline] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const canCreateRequest = useMemo(() => getUserRole(user) === 'employee', [user])

  if (!canCreateRequest || !requestableId) return null

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback(null)

    if (!requestedDeadline || !reason.trim()) {
      setFeedback({ type: 'danger', message: 'Requested deadline and reason are required.' })
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/requests', {
        type: 'extension',
        requestable_id: requestableId,
        requestable_type: requestableType,
        payload: {
          current_deadline: currentDeadline || null,
          requested_deadline: requestedDeadline,
          reason: reason.trim(),
        },
      })

      setRequestedDeadline('')
      setReason('')
      setFeedback({ type: 'success', message: 'Extension request submitted.' })
      onCreated?.(response.data?.data || response.data)
    } catch (error) {
      setFeedback({
        type: 'danger',
        message: error.response?.data?.message || 'Unable to submit extension request.',
      })
    } finally {
      setLoading(false)
    }
  }

  const form = (
    <>
      {feedback && (
        <CAlert
          color={feedback.type}
          className="py-2 small"
          dismissible
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </CAlert>
      )}

      <CForm onSubmit={handleSubmit}>
        <div className="d-flex flex-column gap-3">
          <div>
            <CFormLabel className="small fw-semibold">Requested deadline</CFormLabel>
            <CFormInput
              type="date"
              value={requestedDeadline}
              onChange={(event) => setRequestedDeadline(event.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <CFormLabel className="small fw-semibold">Reason</CFormLabel>
            <CFormTextarea
              rows={compact ? 2 : 3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain why this deadline needs to move..."
              disabled={loading}
            />
          </div>

          <CButton color="primary" type="submit" disabled={loading} className="fw-semibold">
            {loading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Submitting...
              </>
            ) : (
              'Request Extension'
            )}
          </CButton>
        </div>
      </CForm>
    </>
  )

  if (compact) return form

  return (
    <CCard className="border-0 shadow-sm">
      <CCardBody>
        <h6 className="fw-bold mb-3">Request deadline extension</h6>
        {form}
      </CCardBody>
    </CCard>
  )
}

export default RequestExtensionForm
