import React, { useContext, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CSpinner,
} from '@coreui/react'
import api from '../../api'
import { AuthContext } from '../../context/AuthContext'

const getUserRole = (user) => (user?.role || user?.global_role || user?.type || '').toLowerCase()

const normalizeList = (response) => {
  const data = response.data?.data || response.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

const RequestExtensionForm = ({
  requestableId,
  requestableType = 'task',
  currentDeadline,
  onCreated,
  compact = false,
}) => {
  const { user } = useContext(AuthContext)
  const [targetType, setTargetType] = useState(requestableType)
  const [selectedId, setSelectedId] = useState(requestableId || '')
  const [targets, setTargets] = useState([])
  const [requestedDeadline, setRequestedDeadline] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingTargets, setLoadingTargets] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const canCreateRequest = useMemo(() => getUserRole(user) === 'employee', [user])
  const selectedTarget = useMemo(
    () => targets.find((item) => String(item.id) === String(selectedId)),
    [selectedId, targets],
  )
  const resolvedDeadline =
    currentDeadline ||
    selectedTarget?.due_date ||
    selectedTarget?.end_date ||
    selectedTarget?.deadline

  useEffect(() => {
    if (!canCreateRequest || requestableId) return

    const fetchTargets = async () => {
      setLoadingTargets(true)
      try {
        const endpoint = targetType === 'project' ? '/api/employee/projects' : '/api/employee/tasks'
        const response = await api.get(endpoint)
        setTargets(normalizeList(response))
      } catch {
        setTargets([])
      } finally {
        setLoadingTargets(false)
      }
    }

    const timer = window.setTimeout(fetchTargets, 0)
    return () => window.clearTimeout(timer)
  }, [canCreateRequest, requestableId, targetType])

  if (!canCreateRequest) return null

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback(null)

    if (!selectedId || !requestedDeadline || !reason.trim()) {
      setFeedback({
        type: 'danger',
        message: 'Target, requested deadline, and reason are required.',
      })
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/employee/requests', {
        type: 'extension',
        requestable_id: selectedId,
        requestable_type: targetType,
        payload: {
          current_deadline: resolvedDeadline || null,
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
          {!requestableId && (
            <div className="d-flex flex-wrap gap-3">
              <div className="flex-grow-1">
                <CFormLabel className="small fw-semibold">Request target</CFormLabel>
                <CFormSelect
                  value={targetType}
                  onChange={(event) => {
                    setTargetType(event.target.value)
                    setSelectedId('')
                  }}
                  disabled={loading}
                >
                  <option value="task">Task</option>
                  <option value="project">Project</option>
                </CFormSelect>
              </div>
              <div className="flex-grow-1">
                <CFormLabel className="small fw-semibold">
                  {targetType === 'project' ? 'Project' : 'Task'}
                </CFormLabel>
                <CFormSelect
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                  disabled={loading || loadingTargets}
                >
                  <option value="">{loadingTargets ? 'Loading...' : 'Choose target'}</option>
                  {targets.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title || item.name || `#${item.id}`}
                    </option>
                  ))}
                </CFormSelect>
              </div>
            </div>
          )}

          <div>
            <div className="small text-body-secondary mb-2">
              Current deadline: <span className="fw-semibold">{resolvedDeadline || 'Not set'}</span>
            </div>
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
