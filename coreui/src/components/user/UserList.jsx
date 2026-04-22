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
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople, cilSearch, cilTrash, cilWarning, cilUser, cilShieldAlt, cilBriefcase } from '@coreui/icons'
import { motion, AnimatePresence } from 'motion/react'
import api from '../../api'

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  admin:    { color: 'danger',  label: 'Admin',    icon: cilShieldAlt,  dot: '#e55353' },
  employee: { color: 'primary', label: 'Employee', icon: cilUser,       dot: '#3b82f6' },
  client:   { color: 'success', label: 'Client',   icon: cilBriefcase,  dot: '#22c55e' },
}

const ROLE_FILTERS = ['all', 'admin', 'employee', 'client']

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const Avatar = ({ name, role }) => {
  const dot = ROLE_CONFIG[role]?.dot || '#8a93a2'
  return (
    <div style={{ position: 'relative', width: 38, height: 38, flexShrink: 0 }}>
      <div
        style={{
          width: 38, height: 38, borderRadius: 12,
          background: `${dot}18`,
          border: `1.5px solid ${dot}40`,
          color: dot,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 13,
        }}
      >
        {getInitials(name)}
      </div>
      <span
        style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 11, height: 11, borderRadius: '50%',
          background: dot,
          border: '2px solid var(--cui-card-bg)',
        }}
      />
    </div>
  )
}

// ─── User Row ─────────────────────────────────────────────────────────────────

const UserRow = ({ user, idx, onDelete }) => {
  const cfg = ROLE_CONFIG[user.global_role] || { color: 'secondary', label: user.global_role, dot: '#8a93a2' }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.97 }}
      transition={{ duration: 0.22, delay: idx * 0.03 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 16px',
        borderRadius: 12,
        background: 'var(--cui-secondary-bg)',
        border: '1px solid var(--cui-border-color-translucent)',
        marginBottom: 8,
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--cui-border-color)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--cui-border-color-translucent)'}
    >
      {/* Avatar */}
      <Avatar name={user.name} role={user.global_role} />

      {/* Name & Email */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="fw-bold" style={{ fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {user.name}
        </div>
        <div className="text-body-secondary" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {user.email}
        </div>
      </div>

      {/* Role badge */}
      <CBadge
        color={cfg.color}
        shape="rounded-pill"
        className="text-capitalize px-3 py-1"
        style={{ fontSize: 11, flexShrink: 0 }}
      >
        {cfg.label}
      </CBadge>

      {/* Joined */}
      <div
        className="text-body-secondary text-nowrap"
        style={{ fontSize: 11, minWidth: 80, textAlign: 'right', flexShrink: 0 }}
      >
        {formatDate(user.created_at)}
      </div>

      {/* Delete */}
      {user.global_role !== 'admin' ? (
        <CButton
          size="sm"
          color="danger"
          variant="ghost"
          className="p-1"
          style={{ flexShrink: 0 }}
          onClick={() => onDelete(user)}
          title="Delete user"
        >
          <CIcon icon={cilTrash} size="sm" />
        </CButton>
      ) : (
        // placeholder so layout stays consistent
        <div style={{ width: 30, flexShrink: 0 }} />
      )}
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const UserList = ({ refreshKey }) => {
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]     = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res  = await api.get('/api/admin/users')
      const data = res.data?.data || res.data
      setUsers(Array.isArray(data) ? data : data?.data || [])
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers, refreshKey])

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/users/${deleteTarget.id}`)
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {}
    finally { setDeleting(false) }
  }

  // Apply search + role filter
  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.global_role === roleFilter
    return matchSearch && matchRole
  })

  // Counts per role for filter buttons
  const counts = users.reduce((acc, u) => {
    acc[u.global_role] = (acc[u.global_role] || 0) + 1
    return acc
  }, {})

  return (
    <>
      <CCard className="border-0 shadow-sm">
        <CCardHeader className="bg-transparent border-bottom-0 pt-4 px-4 pb-0">

          {/* Top row: title + search */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={cilPeople} size="lg" className="text-primary" />
              <h5 className="mb-0 fw-bold">All Users</h5>
              {!loading && (
                <CBadge color="secondary" shape="rounded-pill" className="ms-1">
                  {filtered.length}
                </CBadge>
              )}
            </div>
            <CInputGroup style={{ maxWidth: 260 }}>
              <CInputGroupText className="bg-transparent">
                <CIcon icon={cilSearch} size="sm" />
              </CInputGroupText>
              <CFormInput
                placeholder="Search name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </CInputGroup>
          </div>

          {/* Role filter pills */}
          <div className="d-flex gap-2 flex-wrap pb-3" style={{ borderBottom: '1px solid var(--cui-border-color-translucent)' }}>
            {ROLE_FILTERS.map(role => {
              const cfg   = ROLE_CONFIG[role]
              const count = role === 'all' ? users.length : (counts[role] || 0)
              const active = roleFilter === role

              return (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 14px',
                    borderRadius: 50,
                    border: active
                      ? `1.5px solid ${cfg?.dot || '#5856d6'}`
                      : '1.5px solid var(--cui-border-color-translucent)',
                    background: active
                      ? `${cfg?.dot || '#5856d6'}18`
                      : 'transparent',
                    color: active
                      ? (cfg?.dot || '#5856d6')
                      : 'var(--cui-secondary-color)',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {role === 'all' ? 'All' : cfg?.label}
                  <span
                    style={{
                      background: active ? (cfg?.dot || '#5856d6') : 'var(--cui-secondary-bg)',
                      color: active ? '#fff' : 'var(--cui-secondary-color)',
                      borderRadius: 50,
                      padding: '0 7px',
                      fontSize: 10,
                      fontWeight: 800,
                      minWidth: 20,
                      textAlign: 'center',
                    }}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

        </CCardHeader>

        <CCardBody className="px-4 pb-4 pt-3">

          {fetchError && (
            <CAlert color="danger">
              <CIcon icon={cilWarning} className="me-2" />
              {fetchError}
              <CButton size="sm" color="danger" variant="ghost" className="ms-3" onClick={fetchUsers}>
                Retry
              </CButton>
            </CAlert>
          )}

          {/* Column labels */}
          {!loading && filtered.length > 0 && (
            <div
              className="d-flex align-items-center gap-3 px-2 mb-2"
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--cui-secondary-color)' }}
            >
              <div style={{ width: 38, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>Name / Email</div>
              <div style={{ width: 72, textAlign: 'center' }}>Role</div>
              <div style={{ width: 80, textAlign: 'right' }}>Joined</div>
              <div style={{ width: 30 }} />
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />
              <p className="text-body-secondary small mt-2 mb-0">Loading users…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-body-secondary">
              <CIcon icon={cilPeople} size="3xl" className="mb-3 opacity-25" />
              <p className="mb-0 small">
                {search ? `No users match "${search}"` : `No ${roleFilter === 'all' ? '' : roleFilter + ' '}users found.`}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((user, idx) => (
                <UserRow
                  key={user.id}
                  user={user}
                  idx={idx}
                  onDelete={setDeleteTarget}
                />
              ))}
            </AnimatePresence>
          )}

        </CCardBody>
      </CCard>

      {/* Delete Confirmation Modal */}
      <CModal visible={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} alignment="center">
        <CModalHeader>
          <CModalTitle>Delete User</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to delete{' '}
          <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})?
          <div className="text-danger small mt-2">This action cannot be undone.</div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
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