import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CAlert, CButton, CCard, CCardBody, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload, cilTask } from '@coreui/icons'
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

  const isAdmin = useMemo(() => getUserRole(user) === 'admin', [user])

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/api/requests')
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

  const handleAction = async (request, action) => {
    setBusyAction(`${request.id}:${action}`)
    setError(null)
    try {
      const response = await api.patch(`/api/requests/${request.id}/${action}`)
      const updated = response.data?.data || {
        ...request,
        status: action === 'approve' ? 'approved' : 'rejected',
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

      {loading ? (
        <div className="text-center py-5">
          <CSpinner color="primary" />
          <div className="small text-body-secondary mt-2">Loading requests...</div>
        </div>
      ) : requests.length === 0 ? (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center py-5">
            <CIcon icon={cilTask} size="xl" className="mb-3 opacity-25" />
            <p className="text-body-secondary mb-0">No requests found</p>
          </CCardBody>
        </CCard>
      ) : (
        <div className="d-flex flex-column gap-3">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              busyAction={busyAction}
              onApprove={(item) => handleAction(item, 'approve')}
              onReject={(item) => handleAction(item, 'reject')}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default RequestManagement
