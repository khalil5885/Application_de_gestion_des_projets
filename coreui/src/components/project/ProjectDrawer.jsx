import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  COffcanvas,
  COffcanvasHeader,
  COffcanvasTitle,
  COffcanvasBody,
  CButton,
  CFormLabel,
  CFormInput,
  CBadge,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTask, cilPeople, cilArrowRight, cilPlus, cilSearch, cilX, cilCheckAlt } from '@coreui/icons'
import api from '../../api'

const PRIORITY_COLORS    = { low: 'success', medium: 'warning', high: 'danger' }
const TASK_STATUS_COLORS = { todo: 'secondary', in_progress: 'primary', done: 'success', review: 'info' }
const ROLE_OPTIONS       = ['manager', 'developer', 'viewer']
const ROLE_COLORS        = { manager: '#9333ea', developer: '#3b82f6', viewer: '#9ca3af' }

const formatDate   = (iso) => iso?.split('T')[0] || ''
const getInitials  = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

// ─── Member Chip (replaces the old plain chip) ────────────────────────────────
const MemberChip = ({ member, onRemove }) => {
  const role  = member.pivot?.project_role
  const color = ROLE_COLORS[role] || '#8a93a2'

  return (
    <div
      className="d-flex align-items-center gap-2 px-2 py-1 rounded-pill"
      style={{ background: `${color}14`, border: `1px solid ${color}40`, fontSize: 12 }}
      title={role}
    >
      <div
        className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
        style={{ width: 20, height: 20, fontSize: 8, background: color, flexShrink: 0 }}
      >
        {getInitials(member.name)}
      </div>
      <span className="fw-semibold" style={{ color }}>{member.name}</span>
      <span
        className="text-uppercase fw-bold"
        style={{ fontSize: 9, color, opacity: 0.7, letterSpacing: '0.8px' }}
      >
        {role}
      </span>
      <button
        onClick={() => onRemove(member.id)}
        style={{
          background: 'none', border: 'none', padding: 0,
          cursor: 'pointer', color, opacity: 0.6, lineHeight: 1,
          display: 'flex', alignItems: 'center',
        }}
        title="Remove member"
      >
        <CIcon icon={cilX} style={{ width: 10, height: 10 }} />
      </button>
    </div>
  )
}

// ─── Add Member Panel ─────────────────────────────────────────────────────────
const AddMemberPanel = ({ projectId, currentMemberIds, onAdded }) => {
  const [open, setOpen]       = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState(null)   // { id, name, email }
  const [role, setRole]       = useState('developer')
  const [adding, setAdding]   = useState(false)
  const [success, setSuccess] = useState(false)
  const searchRef = useRef(null)

  // Fetch employees once when the panel opens
  useEffect(() => {
    if (!open) { setSearch(''); setSelected(null); setSuccess(false); return }
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.get('/api/admin/users')
        const employees = (res.data.data?.data || res.data.data || [])
          .filter(u => u.global_role === 'employee')
        setAllUsers(employees)
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    load()
    setTimeout(() => searchRef.current?.focus(), 120)
  }, [open])

  // Employees not yet in the project, filtered by search
  const available = useMemo(() =>
    allUsers.filter(u =>
      !currentMemberIds.includes(u.id) &&
      u.name.toLowerCase().includes(search.toLowerCase())
    ),
    [allUsers, currentMemberIds, search]
  )

  const handleAdd = async () => {
    if (!selected) return
    setAdding(true)
    try {
      await api.post(`/api/admin/projects/${projectId}/assignEmployee`, {
        member_id: selected.id,
        role,
      })
      setSuccess(true)
      setSelected(null)
      setSearch('')
      setTimeout(() => { setSuccess(false); onAdded() }, 900)
    } catch { /* silent */ }
    finally { setAdding(false) }
  }

  return (
    <div>
      {/* ── Toggle button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: open ? 'var(--cui-primary)' : 'transparent',
          color: open ? '#fff' : 'var(--cui-primary)',
          border: '1.5px dashed var(--cui-primary)',
          borderRadius: 20, padding: '3px 12px 3px 8px',
          fontSize: 11, fontWeight: 700, cursor: 'pointer',
          letterSpacing: '0.5px', transition: 'all .2s',
        }}
      >
        <CIcon icon={open ? cilX : cilPlus} style={{ width: 11, height: 11 }} />
        {open ? 'CANCEL' : 'ADD MEMBER'}
      </button>

      {/* ── Animated expandable panel ── */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: open ? 460 : 0,
          transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div
          className="mt-3 rounded-3 p-3"
          style={{
            background: 'var(--cui-secondary-bg)',
            border: '1px solid var(--cui-border-color-translucent)',
          }}
        >
          {/* Search input */}
          <div className="position-relative mb-3">
            <CIcon
              icon={cilSearch}
              style={{
                position: 'absolute', left: 10, top: '50%',
                transform: 'translateY(-50%)',
                width: 13, height: 13, color: 'var(--cui-secondary-color)',
              }}
            />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employees..."
              style={{
                width: '100%', border: '1px solid var(--cui-border-color)',
                borderRadius: 8, padding: '7px 10px 7px 30px',
                fontSize: 12, background: 'var(--cui-body-bg)',
                color: 'var(--cui-body-color)', outline: 'none',
              }}
            />
          </div>

          {/* Employee list */}
          <div style={{ maxHeight: 190, overflowY: 'auto', scrollbarWidth: 'thin', marginBottom: 12 }}>
            {loading ? (
              <div className="text-center py-3"><CSpinner size="sm" /></div>
            ) : available.length === 0 ? (
              <p className="text-body-secondary small fst-italic text-center mb-0 py-2">
                {search ? 'No employees match your search.' : 'All employees are already members.'}
              </p>
            ) : (
              available.map(u => {
                const isSelected = selected?.id === u.id
                return (
                  <div
                    key={u.id}
                    onClick={() => setSelected(isSelected ? null : u)}
                    className="d-flex align-items-center gap-3 px-2 py-2 rounded-2 mb-1"
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'var(--cui-primary)' : 'transparent',
                      color: isSelected ? '#fff' : 'var(--cui-body-color)',
                      transition: 'background .15s',
                    }}
                  >
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                      style={{
                        width: 28, height: 28, fontSize: 10,
                        background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--cui-primary)',
                        color: '#fff',
                      }}
                    >
                      {getInitials(u.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="fw-semibold" style={{ fontSize: 12 }}>{u.name}</div>
                      <div style={{ fontSize: 10, opacity: 0.65 }}>{u.email}</div>
                    </div>
                    {isSelected && (
                      <CIcon icon={cilCheckAlt} style={{ width: 14, height: 14, flexShrink: 0 }} />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Role picker + confirm — only when someone is selected */}
          {selected && (
            <div style={{ borderTop: '1px solid var(--cui-border-color-translucent)', paddingTop: 12 }}>
              <div
                className="mb-2"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', color: 'var(--cui-secondary-color)', textTransform: 'uppercase' }}
              >
                Role for {selected.name}
              </div>
              <div className="d-flex gap-2 mb-3">
                {ROLE_OPTIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    style={{
                      flex: 1, borderRadius: 6,
                      padding: '5px 0', fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', textTransform: 'capitalize',
                      letterSpacing: '0.5px', transition: 'all .15s',
                      background: role === r ? ROLE_COLORS[r] : 'var(--cui-body-bg)',
                      color: role === r ? '#fff' : ROLE_COLORS[r],
                      border: `1.5px solid ${ROLE_COLORS[r]}`,
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAdd}
                disabled={adding || success}
                style={{
                  width: '100%', border: 'none', borderRadius: 8,
                  padding: '9px 0', fontWeight: 700, fontSize: 12,
                  cursor: adding || success ? 'default' : 'pointer',
                  background: success ? '#2eb85c' : 'var(--cui-primary)',
                  color: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 6, transition: 'background .2s',
                }}
              >
                {adding ? (
                  <><CSpinner size="sm" /> Adding...</>
                ) : success ? (
                  <><CIcon icon={cilCheckAlt} style={{ width: 14, height: 14 }} /> Added!</>
                ) : (
                  <><CIcon icon={cilPlus} style={{ width: 13, height: 13 }} /> Add as {role}</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
const ProjectDrawer = ({ visible, project, onClose, onUpdate }) => {
  const navigate = useNavigate()
  const [showTasks, setShowTasks]         = useState(false)
  const [detail, setDetail]               = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const fetchDetail = async () => {
    if (!project?.id) return
    setLoadingDetail(true)
    try {
      const res = await api.get(`/api/admin/projects/${project.id}`)
      setDetail(res.data.data)
    } catch {}
    finally { setLoadingDetail(false) }
  }

  useEffect(() => {
    if (!visible || !project?.id) return
    setShowTasks(false)
    setDetail(null)
    fetchDetail()
  }, [visible, project?.id])

  const handleUpdate = async (field, value) => {
    try {
      await api.patch(`/api/admin/projects/${project.id}`, { [field]: value })
      onUpdate()
    } catch (err) { console.error('Update failed', err) }
  }

  const handleRemoveMember = async (memberId) => {
    try {
      await api.delete(`/api/admin/projects/${project.id}/members`, {
        data: { member_id: memberId },
      })
      fetchDetail()
      onUpdate()
    } catch (err) { console.error('Remove failed', err) }
  }

  if (!project) return null

  const members          = detail?.members || project.members || []
  const currentMemberIds = members.map(m => m.id)
  const tasks            = detail?.tasks || []

  return (
    <COffcanvas placement="end" visible={visible} onHide={onClose} scroll style={{ width: 400 }}>
      <COffcanvasHeader className="border-bottom">
        <COffcanvasTitle className="fw-bold fs-5">{project.name}</COffcanvasTitle>
      </COffcanvasHeader>

      <COffcanvasBody className="d-flex flex-column gap-4 pt-4">

        {/* Client */}
        <div>
          <CFormLabel className="small text-body-secondary text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.05em', fontSize: 10 }}>Client</CFormLabel>
          <div className="fw-semibold">{project.client?.name || '—'}</div>
        </div>

        {/* Dates */}
        <div>
          <CFormLabel className="small text-body-secondary text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.05em', fontSize: 10 }}>Start Date</CFormLabel>
          <CFormInput type="date" defaultValue={formatDate(project.start_date)} onBlur={e => handleUpdate('start_date', e.target.value)} />
        </div>
        <div>
          <CFormLabel className="small text-body-secondary text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.05em', fontSize: 10 }}>End Date</CFormLabel>
          <CFormInput type="date" defaultValue={formatDate(project.end_date)} onBlur={e => handleUpdate('end_date', e.target.value)} />
        </div>

        {/* ── Team Members ─────────────────────────────────── */}
        <div>
          {/* Header row with ADD MEMBER button on the right */}
          <div className="d-flex align-items-center gap-2 mb-3">
            <CIcon icon={cilPeople} size="sm" className="text-primary" />
            <CFormLabel className="mb-0 fw-bold">Team Members</CFormLabel>
            <CBadge color="secondary">{members.length}</CBadge>
            <div className="ms-auto">
              <AddMemberPanel
                projectId={project.id}
                currentMemberIds={currentMemberIds}
                onAdded={() => { fetchDetail(); onUpdate() }}
              />
            </div>
          </div>

          {/* Member chips */}
          {loadingDetail ? (
            <div className="text-center py-2"><CSpinner size="sm" /></div>
          ) : members.length === 0 ? (
            <p className="text-body-secondary small fst-italic mb-0">No members assigned yet.</p>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              {members.map(m => (
                <MemberChip key={m.id} member={m} onRemove={handleRemoveMember} />
              ))}
            </div>
          )}
        </div>

        {/* ── Tasks ────────────────────────────────────────── */}
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={cilTask} size="sm" className="text-primary" />
              <CFormLabel className="mb-0 fw-bold">Tasks</CFormLabel>
              <CBadge color="secondary">{tasks.length}</CBadge>
            </div>
            <CButton size="sm" color={showTasks ? 'secondary' : 'primary'} variant="ghost"
              className="fw-semibold" style={{ fontSize: 12 }}
              onClick={() => setShowTasks(s => !s)}>
              {showTasks ? 'Hide' : 'Show Tasks'}
            </CButton>
          </div>

          {showTasks && (
            <div className="rounded-3 p-3" style={{ background: 'var(--cui-secondary-bg)', border: '1px solid var(--cui-border-color-translucent)' }}>
              {loadingDetail ? (
                <div className="text-center py-2"><CSpinner size="sm" /></div>
              ) : tasks.length === 0 ? (
                <p className="text-body-secondary small fst-italic mb-0">No tasks yet.</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {tasks.map(task => (
                    <div key={task.id} className="rounded-2 p-2" style={{ background: 'var(--cui-body-bg)', border: '1px solid var(--cui-border-color-translucent)' }}>
                      <div className="fw-semibold mb-1" style={{ fontSize: 13 }}>{task.name}</div>
                      <div className="d-flex gap-2">
                        <CBadge color={TASK_STATUS_COLORS[task.status] || 'secondary'} style={{ fontSize: 10 }}>{task.status?.replace('_', ' ')}</CBadge>
                        <CBadge color={PRIORITY_COLORS[task.priority] || 'warning'} style={{ fontSize: 10 }}>{task.priority}</CBadge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-grow-1" />
        <hr className="my-0" />

        {/* Action buttons */}
        <div className="d-flex flex-column gap-2 pb-2">
          <CButton color="primary" className="w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
            onClick={() => { onClose(); navigate(`/admin/projects/${project.id}/tasks`) }}>
            <CIcon icon={cilTask} /> Manage Tasks
          </CButton>
          <CButton color="primary" variant="outline" className="w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
            onClick={() => { onClose(); navigate(`/admin/projects/${project.id}`) }}>
            <CIcon icon={cilArrowRight} /> View Team & Tasks
          </CButton>
        </div>

      </COffcanvasBody>
    </COffcanvas>
  )
}

export default ProjectDrawer