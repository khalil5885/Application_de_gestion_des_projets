import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilFilter, cilReload, cilSearch, cilTask } from '@coreui/icons'
import RequestCard from '../../components/request/RequestCard'
import api from '../../api'
import { AuthContext } from '../../context/AuthContext'

const getUserRole = (user) => (user?.role || user?.global_role || user?.type || '').toLowerCase()

const normalizeRequests = (response) => {
  const data = response.data?.data || response.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

const RequestManagement = () => {
  const { user } = useContext(AuthContext)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyAction, setBusyAction] = useState(null)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [typeFilter, setTypeFilter] = useState('all')
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectFeedback, setRejectFeedback] = useState('')

  const isAdmin = useMemo(() => getUserRole(user) === 'admin', [user])

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/api/admin/requests')
      setRequests(normalizeRequests(response))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(fetchRequests, 0)
    return () => window.clearTimeout(timer)
  }, [fetchRequests])

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const employee =
        request.employee?.name ||
        request.user?.name ||
        request.requester?.name ||
        request.employee_name ||
        ''
      const matchesStatus = statusFilter === 'all' || (request.status || 'pending') === statusFilter
      const matchesType = typeFilter === 'all' || request.type === typeFilter
      const matchesEmployee =
        !employeeFilter || employee.toLowerCase().includes(employeeFilter.toLowerCase())
      return matchesStatus && matchesType && matchesEmployee
    })
  }, [employeeFilter, requests, statusFilter, typeFilter])

  const requestTypes = useMemo(
    () => ['all', ...Array.from(new Set(requests.map((request) => request.type).filter(Boolean)))],
    [requests],
  )

  const counts = useMemo(
    () =>
      requests.reduce((acc, request) => {
        const status = request.status || 'pending'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {}),
    [requests],
  )

  const handleAction = async (request, action, feedback = '') => {
    setBusyAction(`${request.id}:${action}`)
    setError(null)
    try {
      // API returns full request object on success
      const response = await api.patch(`/api/admin/requests/${request.id}/${action}`, {
        feedback: feedback || undefined,
      })
      const updated = response.data?.data || {
        ...request,
        status: action === 'approve' ? 'approved' : 'rejected',
        handled_by: user?.id,
        handled_at: new Date().toISOString(),
        feedback,
      }
      setRequests((current) =>
        current.map((item) => (item.id === request.id ? { ...item, ...updated } : item)),
      )
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} request.`)
    } finally {
      setBusyAction(null)
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectTarget) return
    await handleAction(rejectTarget, 'reject', rejectFeedback.trim())
    setRejectTarget(null)
    setRejectFeedback('')
  }

  if (!isAdmin) {
    return <CAlert color="warning">You do not have permission to manage requests.</CAlert>
  }

  return (
    <div className="pb-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="fw-black mb-1">Requests</h4>
          <div className="text-body-secondary small">
            Review employee deadline extension requests.
          </div>
        </div>
        <CButton color="primary" variant="outline" onClick={fetchRequests} disabled={loading}>
          <CIcon icon={cilReload} className="me-2" />
          Refresh
        </CButton>
      </div>

      {error && (
        <CAlert color="danger" dismissible onClose={() => setError(null)}>
          {error}
        </CAlert>
      )}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardBody>
          <div className="d-flex flex-wrap gap-3 align-items-center">
            <div className="d-flex flex-wrap gap-2">
              {['pending', 'approved', 'rejected', 'all'].map((status) => (
                <CButton
                  key={status}
                  color={statusFilter === status ? 'primary' : 'light'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status.replaceAll('_', ' ')}
                  {status !== 'all' && <span className="ms-2">{counts[status] || 0}</span>}
                </CButton>
              ))}
            </div>
            <CInputGroup style={{ maxWidth: 240 }}>
              <CInputGroupText>
                <CIcon icon={cilFilter} size="sm" />
              </CInputGroupText>
              <CFormSelect
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                {requestTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All types' : type}
                  </option>
                ))}
              </CFormSelect>
            </CInputGroup>
            <CInputGroup style={{ maxWidth: 280 }}>
              <CInputGroupText>
                <CIcon icon={cilSearch} size="sm" />
              </CInputGroupText>
              <CFormInput
                placeholder="Filter by employee..."
                value={employeeFilter}
                onChange={(event) => setEmployeeFilter(event.target.value)}
              />
            </CInputGroup>
          </div>
        </CCardBody>
      </CCard>

      {loading ? (
        <div className="text-center py-5">
          <CSpinner color="primary" />
          <div className="small text-body-secondary mt-2">Loading requests...</div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center py-5">
            <CIcon icon={cilTask} size="xl" className="mb-3 opacity-25" />
            <p className="text-body-secondary mb-0">No requests found</p>
          </CCardBody>
        </CCard>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              busyAction={busyAction}
              onApprove={(item) => handleAction(item, 'approve')}
              onReject={(item) => setRejectTarget(item)}
            />
          ))}
        </div>
      )}

      <CModal visible={!!rejectTarget} onClose={() => setRejectTarget(null)} alignment="center">
        <CModalHeader>
          <CModalTitle>Reject Request</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="small text-body-secondary">
            Add feedback so the employee understands why this request was rejected.
          </p>
          <CFormTextarea
            rows={4}
            value={rejectFeedback}
            onChange={(event) => setRejectFeedback(event.target.value)}
            placeholder="Reason for rejection..."
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="light" onClick={() => setRejectTarget(null)}>
            Cancel
          </CButton>
          <CButton
            color="danger"
            onClick={handleRejectSubmit}
            disabled={busyAction?.endsWith(':reject') || !rejectFeedback.trim()}
          >
            {busyAction?.endsWith(':reject') ? <CSpinner size="sm" /> : 'Reject Request'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default RequestManagement
