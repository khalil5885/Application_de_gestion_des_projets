import React, { useState, useEffect, useCallback } from 'react'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople, cilSearch, cilTrash, cilWarning } from '@coreui/icons'
import api from '../../api'

const ROLE_COLORS = {
  admin: 'danger',
  employee: 'primary',
  client: 'success',
}

const UserList = ({ refreshKey }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await api.get('/api/admin/users')
      const data = res.data?.data || res.data
      setUsers(Array.isArray(data) ? data : data?.data || [])
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers, refreshKey])

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/users/${deleteTarget.id}`)
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {
      // keep modal open, user can retry
    } finally {
      setDeleting(false)
    }
  }

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  )

  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <>
      <CCard className="border-0 shadow-sm">
        <CCardHeader className="bg-transparent border-bottom-0 pt-4 px-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={cilPeople} size="lg" className="text-primary" />
              <h5 className="mb-0 fw-semibold">All Users</h5>
              {!loading && (
                <CBadge color="secondary" shape="rounded-pill" className="ms-1">
                  {users.length}
                </CBadge>
              )}
            </div>
            <CInputGroup style={{ maxWidth: 280 }}>
              <CInputGroupText className="bg-transparent">
                <CIcon icon={cilSearch} size="sm" />
              </CInputGroupText>
              <CFormInput
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </CInputGroup>
          </div>
        </CCardHeader>
        <CCardBody className="px-4 pb-4">
          {fetchError && (
            <CAlert color="danger">
              <CIcon icon={cilWarning} className="me-2" />
              {fetchError}
              <CButton
                size="sm"
                color="danger"
                variant="ghost"
                className="ms-3"
                onClick={fetchUsers}
              >
                Retry
              </CButton>
            </CAlert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />
              <p className="text-body-secondary small mt-2 mb-0">Loading users…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-body-secondary">
              <CIcon icon={cilPeople} size="3xl" className="mb-3 opacity-25" />
              <p className="mb-0">
                {search ? `No users match "${search}"` : 'No users yet. Create the first one!'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <CTable align="middle" hover striped className="mb-0 border rounded">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell className="bg-body-tertiary">#</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Name</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Email</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Role</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Created</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary text-center">
                      Actions
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filtered.map((user, idx) => (
                    <CTableRow key={user.id}>
                      <CTableDataCell className="text-body-secondary small">
                        {idx + 1}
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="fw-medium">{user.name}</div>
                      </CTableDataCell>
                      <CTableDataCell className="text-body-secondary">
                        {user.email}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge
                          color={ROLE_COLORS[user.global_role] || 'secondary'}
                          shape="rounded-pill"
                          className="text-capitalize px-2 py-1"
                        >
                          {user.global_role}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-body-secondary small text-nowrap">
                        {formatDate(user.created_at)}
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        {user.global_role !== 'admin' && (
                        <CButton
                          size="sm"
                          color="danger"
                          variant="ghost"
                          title="Delete user"
                          onClick={() => setDeleteTarget(user)}
                        >
                          <CIcon icon={cilTrash} size="sm" />
                        </CButton>)}
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* Delete Confirmation Modal */}
      <CModal
        visible={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>Delete User</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to delete{' '}
          <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})?
          <div className="text-danger small mt-2">This action cannot be undone.</div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="ghost"
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
          >
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleDeleteConfirm} disabled={deleting}>
            {deleting ? <CSpinner size="sm" /> : 'Delete'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default UserList
