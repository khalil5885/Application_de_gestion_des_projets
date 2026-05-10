import React, { useState } from 'react'
import { CBadge, CButton, CCard, CCardBody, CCol, CCollapse, CRow, CSpinner } from '@coreui/react'

const STATUS_COLORS = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
}

const TYPE_COLORS = {
  extension: 'info',
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const readPayload = (request) => request.payload || request.data || {}

const getEmployeeName = (request) =>
  request.employee?.name ||
  request.user?.name ||
  request.requester?.name ||
  request.employee_name ||
  'Unknown employee'

const getRelatedName = (request) =>
  request.requestable?.title ||
  request.requestable?.name ||
  request.task?.title ||
  request.project?.name ||
  request.related_name ||
  `${request.requestable_type || 'Item'} #${request.requestable_id || request.id}`

const formatJson = (value) => {
  try {
    return JSON.stringify(value || {}, null, 2)
  } catch {
    return '{}'
  }
}

const RequestCard = ({ request, onApprove, onReject, busyAction }) => {
  const [showDetails, setShowDetails] = useState(false)
  const payload = readPayload(request)
  const status = request.status || 'pending'
  const isHandled = status !== 'pending'
  const type = request.type || 'request'
  const isApproving = busyAction === `${request.id}:approve`
  const isRejecting = busyAction === `${request.id}:reject`

  return (
    <CCard className="border-0 shadow-sm">
      <CCardBody>
        <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <h6 className="fw-bold mb-0">{getEmployeeName(request)}</h6>
              <CBadge color={TYPE_COLORS[type] || 'secondary'}>{type.replaceAll('_', ' ')}</CBadge>
              <CBadge color={STATUS_COLORS[status] || 'secondary'}>
                {status.replaceAll('_', ' ')}
              </CBadge>
            </div>
            <div className="small text-body-secondary">{getRelatedName(request)}</div>
            <div className="small text-body-secondary">
              Created {formatDate(request.created_at)}
            </div>
          </div>

          <div className="d-flex align-items-start gap-2">
            <CButton
              color="success"
              size="sm"
              disabled={isHandled || !!busyAction}
              onClick={() => onApprove(request)}
            >
              {isApproving ? <CSpinner size="sm" /> : 'Approve'}
            </CButton>
            <CButton
              color="danger"
              variant="outline"
              size="sm"
              disabled={isHandled || !!busyAction}
              onClick={() => onReject(request)}
            >
              {isRejecting ? <CSpinner size="sm" /> : 'Reject'}
            </CButton>
            <CButton color="light" size="sm" onClick={() => setShowDetails((value) => !value)}>
              Details
            </CButton>
          </div>
        </div>

        <CRow className="g-3">
          <CCol md={6}>
            <div className="small text-body-secondary">Current deadline</div>
            <div className="fw-semibold">
              {formatDate(payload.current_deadline || request.current_deadline)}
            </div>
          </CCol>
          <CCol md={6}>
            <div className="small text-body-secondary">Requested deadline</div>
            <div className="fw-semibold">
              {formatDate(payload.requested_deadline || request.requested_deadline)}
            </div>
          </CCol>
          <CCol xs={12}>
            <div className="small text-body-secondary">Reason</div>
            <p className="mb-0 small" style={{ lineHeight: 1.6 }}>
              {payload.reason || request.reason || 'No reason provided.'}
            </p>
          </CCol>
          {(request.feedback || request.admin_feedback || payload.feedback) && (
            <CCol xs={12}>
              <div className="small text-body-secondary">Feedback</div>
              <p className="mb-0 small" style={{ lineHeight: 1.6 }}>
                {request.feedback || request.admin_feedback || payload.feedback}
              </p>
            </CCol>
          )}
        </CRow>
        <CCollapse visible={showDetails}>
          <pre
            className="small rounded-3 p-3 mt-3 mb-0 bg-body-tertiary"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {formatJson(payload)}
          </pre>
        </CCollapse>
      </CCardBody>
    </CCard>
  )
}

export default RequestCard
