// src/components/project/ProjectDrawer.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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
import {cilTask,
  cilPeople,
  cilArrowRight,
  cilPlus,
  cilSearch,
  cilX,
  cilCheckAlt,
  cilCommentSquare,
  cilSend,
  cilCloudUpload,   
  cilFile,     
  cilTrash,  
} from '@coreui/icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS = { low: 'success', medium: 'warning', high: 'danger' }

const TASK_STATUS_COLORS = {
  todo: 'secondary',
  in_progress: 'primary',
  ready_for_review: 'info',
  done: 'success',
  on_hold: 'danger',
}

const ROLE_OPTIONS = ['manager', 'developer', 'viewer']

const ROLE_COLORS = {
  manager: '#9333ea',
  developer: '#3b82f6',
  viewer: '#9ca3af',
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const formatDate = (iso) => iso?.split('T')[0] || ''

const getInitials = (name) =>
  name
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

const formatCommentDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  )
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────

const SectionLabel = ({ icon, label, badge }) => (
  <div className="d-flex align-items-center gap-2 mb-2">
    <CIcon icon={icon} size="sm" className="text-primary" />
    <CFormLabel className="mb-0 fw-bold">{label}</CFormLabel>
    {badge != null && <CBadge color="secondary">{badge}</CBadge>}
  </div>
)

// ─── MemberChip ───────────────────────────────────────────────────────────────

const MemberChip = ({ member, onRemove }) => {
  const role = member.role
  const color = ROLE_COLORS[role] || '#8a93a2'
  const userName = member.employee?.name || member.name || 'Unknown'

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
        {getInitials(userName)}
      </div>
      <span className="fw-semibold" style={{ color }}>{userName}</span>
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

// ─── AddMemberPanel ───────────────────────────────────────────────────────────

const AddMemberPanel = ({ projectId, currentMemberIds, onAdded }) => {
  const [open, setOpen]       = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState(null)
  const [role, setRole]       = useState('developer')
  const [adding, setAdding]   = useState(false)
  const [success, setSuccess] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    if (!open) { setSearch(''); setSelected(null); setSuccess(false); return }
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.get('/api/admin/users')
        const employees = (res.data.data?.data?.items || res.data.data?.items || [])
          .filter((u) => u.global_role === 'employee')
        setAllUsers(employees)
      } catch { /* silent */ } finally { setLoading(false) }
    }
    load()
    setTimeout(() => searchRef.current?.focus(), 120)
  }, [open])

  const available = useMemo(
    () =>
      allUsers.filter(
        (u) =>
          !currentMemberIds.includes(u.id) &&
          u.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [allUsers, currentMemberIds, search],
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
    } catch { /* silent */ } finally { setAdding(false) }
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
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
          {/* Search */}
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
              onChange={(e) => setSearch(e.target.value)}
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
                {search ? 'No members match your search.' : 'All employees already added.'}
              </p>
            ) : (
              available.map((u) => {
                const isSel = selected?.id === u.id
                return (
                  <div
                    key={u.id}
                    onClick={() => setSelected(isSel ? null : u)}
                    className="d-flex align-items-center gap-3 px-2 py-2 rounded-2 mb-1"
                    style={{
                      cursor: 'pointer',
                      background: isSel ? 'var(--cui-primary)' : 'transparent',
                      color: isSel ? '#fff' : 'var(--cui-body-color)',
                      transition: 'background .15s',
                    }}
                  >
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                      style={{
                        width: 28, height: 28, fontSize: 10,
                        background: isSel ? 'rgba(255,255,255,0.25)' : 'var(--cui-primary)',
                        color: '#fff',
                      }}
                    >
                      {getInitials(u.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="fw-semibold" style={{ fontSize: 12 }}>{u.name}</div>
                      <div style={{ fontSize: 10, opacity: 0.65 }}>{u.email}</div>
                    </div>
                    {isSel && <CIcon icon={cilCheckAlt} style={{ width: 14, height: 14, flexShrink: 0 }} />}
                  </div>
                )
              })
            )}
          </div>

          {/* Role picker + confirm */}
          {selected && (
            <div style={{ borderTop: '1px solid var(--cui-border-color-translucent)', paddingTop: 12 }}>
              <div
                className="mb-2"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', color: 'var(--cui-secondary-color)', textTransform: 'uppercase' }}
              >
                Role for {selected.name}
              </div>
              <div className="d-flex gap-2 mb-3">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    style={{
                      flex: 1, borderRadius: 6, padding: '5px 0',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      textTransform: 'capitalize', letterSpacing: '0.5px',
                      transition: 'all .15s',
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

// ─── CommentSection ───────────────────────────────────────────────────────────
//
// • Reads from `initialComments` (passed from detail.comments — already loaded
//   by the fetchDetail call in ProjectDrawer, no extra network request).
// • POSTs to  POST /api/admin/projects/{id}/comments  { content: string }
// • Optimistic insert: comment appears immediately, gets replaced by server
//   object on success, or rolled back with the text restored on failure.
// • Ctrl+Enter / Cmd+Enter keyboard shortcut to send.
// ─── CommentSection (with file attachments) ───────────────────────────────────

const CommentSection = ({ projectId, initialComments = [], currentUser }) => {
  const [comments, setComments] = useState(initialComments)
  const [body, setBody]         = useState('')
  const [sending, setSending]   = useState(false)
  const [error, setError]       = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)
  const bottomRef    = useRef(null)
  const textareaRef  = useRef(null)

  // File helpers
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const validateFiles = (fileList) => {
    const valid = []
    const errors = []
    for (const file of fileList) {
      if (file.type.startsWith('video/')) {
        errors.push(`${file.name} is a video. Videos are not allowed.`)
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name} exceeds 10MB limit.`)
        continue
      }
      valid.push(file)
    }
    if (errors.length) setError(errors.join(' '))
    return valid
  }

  const handleFileSelect = (fileList) => {
    const newFiles = Array.from(fileList)
    const validFiles = validateFiles(newFiles)
    if (validFiles.length) {
      setSelectedFiles(prev => [...prev, ...validFiles])
    }
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  // Sync when drawer opens for a different project
  useEffect(() => {
    setComments(initialComments)
    setBody('')
    setSelectedFiles([])
    setError(null)
  }, [initialComments])

  // Auto-scroll to newest comment
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  const handleSend = useCallback(async () => {
    const trimmed = body.trim()
    if ((!trimmed && selectedFiles.length === 0) || sending) return

    setSending(true)
    setError(null)

    const optimisticId = `optimistic-${Date.now()}`
    const optimistic = {
      id: optimisticId,
      content: trimmed,
      created_at: new Date().toISOString(),
      user: currentUser
        ? { name: currentUser.name || currentUser.email }
        : { name: 'You' },
    }

    setComments((prev) => [...prev, optimistic])
    setBody('')
    const optimisticFiles = [...selectedFiles]
    setSelectedFiles([])

    const formData = new FormData()
    formData.append('content', trimmed)
    optimisticFiles.forEach(file => {
      formData.append('attachments[]', file)
    })

    try {
      const res = await api.post(`/api/admin/projects/${projectId}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const saved = res.data?.data || res.data
      setComments((prev) =>
        prev.map((c) => (c.id === optimisticId ? { ...optimistic, ...saved } : c)),
      )
    } catch (err) {
      // Roll back and restore text + files
      setComments((prev) => prev.filter((c) => c.id !== optimisticId))
      setBody(trimmed)
      setSelectedFiles(optimisticFiles)
      setError(err.response?.data?.message || 'Failed to send. Try again.')
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }, [body, sending, projectId, currentUser, selectedFiles])

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div>
      <SectionLabel icon={cilCommentSquare} label="Comments" badge={comments.length} />

      {/* Comment feed */}
      <div
        style={{
          maxHeight: 260, overflowY: 'auto', scrollbarWidth: 'thin',
          display: 'flex', flexDirection: 'column', gap: 10,
          marginBottom: 12, paddingRight: 2,
        }}
      >
        {comments.length === 0 ? (
          <p className="text-body-secondary small fst-italic mb-0 py-2 text-center">
            No comments yet. Be the first to comment.
          </p>
        ) : (
          comments.map((c) => {
            const authorName   = c.user?.name || c.author?.name || 'Team'
            const isOptimistic = String(c.id).startsWith('optimistic-')

            return (
              <div
                key={c.id}
                className="d-flex gap-2 align-items-start"
                style={{ opacity: isOptimistic ? 0.65 : 1, transition: 'opacity .3s' }}
              >
                {/* Avatar */}
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                  style={{ width: 28, height: 28, fontSize: 9, background: 'var(--cui-primary)', marginTop: 1 }}
                >
                  {getInitials(authorName)}
                </div>

                {/* Bubble */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="d-flex align-items-baseline gap-2 mb-1 flex-wrap">
                    <span className="fw-bold" style={{ fontSize: 12 }}>{authorName}</span>
                    <span className="text-body-secondary" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                      {formatCommentDate(c.created_at)}
                    </span>
                    {isOptimistic && <CSpinner size="sm" style={{ width: 10, height: 10 }} />}
                  </div>
                  <div
                    className="rounded-3 px-3 py-2"
                    style={{
                      background: 'var(--cui-secondary-bg)',
                      border: '1px solid var(--cui-border-color-translucent)',
                      fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word',
                    }}
                  >
                    {c.content || c.message}
                    {/* Display attachments if returned from backend */}
                    {c.attachments && c.attachments.length > 0 && (
                      <div className="mt-2 d-flex flex-wrap gap-2">
                        {c.attachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="d-inline-flex align-items-center gap-1 small"
                            style={{ color: 'var(--cui-primary)' }}
                          >
                            <CIcon icon={cilFile} size="sm" />
                            {att.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Inline error */}
      {error && (
        <div
          className="rounded-2 px-3 py-2 mb-2 small text-danger"
          style={{ background: 'rgba(229,83,83,0.08)', border: '1px solid rgba(229,83,83,0.25)' }}
        >
          {error}
        </div>
      )}

      {/* Compose with drag & drop zone */}
      <div
        className={`rounded-3 overflow-hidden ${dragActive ? 'border-primary border-2' : ''}`}
        style={{
          border: dragActive ? '2px dashed var(--cui-primary)' : '1px solid var(--cui-border-color)',
          transition: 'border-color 0.2s',
        }}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a comment… (Ctrl+Enter to send) – you can also drag & drop files"
          rows={3}
          style={{
            width: '100%', border: 'none', padding: '10px 12px',
            fontSize: 13, resize: 'none', outline: 'none',
            background: 'var(--cui-body-bg)', color: 'var(--cui-body-color)', display: 'block',
          }}
        />

        {/* Bottom toolbar: attach button + send */}
        <div
          className="d-flex justify-content-between align-items-center px-2 py-1"
          style={{ background: 'var(--cui-secondary-bg)', borderTop: '1px solid var(--cui-border-color-translucent)' }}
        >
          <div className="d-flex gap-2 align-items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              style={{
                background: 'none', border: 'none', padding: '4px 8px',
                borderRadius: 6, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', color: 'var(--cui-primary)',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              <CIcon icon={cilCloudUpload} size="sm" />
              Attach files
            </button>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files)}
              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,.zip,.rar"
            />
            <span className="text-body-secondary me-auto" style={{ fontSize: 10, paddingLeft: 4 }}>
              Ctrl+Enter to send
            </span>
          </div>
          <CButton
            color="primary"
            size="sm"
            disabled={(!body.trim() && selectedFiles.length === 0) || sending}
            onClick={handleSend}
            className="d-flex align-items-center gap-2"
          >
            {sending ? <CSpinner size="sm" /> : <CIcon icon={cilSend} size="sm" />}
            Send
          </CButton>
        </div>
      </div>

      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="mt-2">
          <div className="small fw-semibold mb-1">Attachments to upload:</div>
          <div className="d-flex flex-wrap gap-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="d-flex align-items-center gap-2 rounded-3 p-2"
                style={{ background: 'var(--cui-secondary-bg)', fontSize: '0.75rem' }}
              >
                <CIcon icon={cilFile} />
                <span className="text-truncate" style={{ maxWidth: '150px' }}>{file.name}</span>
                <span className="text-muted">({formatFileSize(file.size)})</span>
                <button
                  onClick={() => removeFile(idx)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--cui-danger)', padding: 0, lineHeight: 1,
                  }}
                >
                  <CIcon icon={cilTrash} size="sm" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
// ─── ProjectDrawer ────────────────────────────────────────────────────────────

const ProjectDrawer = ({ visible, project, onClose, onUpdate }) => {
  const navigate = useNavigate()
  const { user } = useAuth()   // for optimistic comment avatar

  const [showTasks, setShowTasks]       = useState(false)
  const [detail, setDetail]             = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const fetchDetail = useCallback(async () => {
    if (!project?.id) return
    setLoadingDetail(true)
    try {
      const res = await api.get(`/api/admin/projects/${project.id}`)
      setDetail(res.data.data)
    } catch { /* silent */ } finally { setLoadingDetail(false) }
  }, [project?.id])

  useEffect(() => {
    if (!visible || !project?.id) return
    setShowTasks(false)
    setDetail(null)
    fetchDetail()
  }, [visible, project?.id, fetchDetail])

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

  const members          = detail?.members || detail?.employees || project.members || []
  const currentMemberIds = members.map((m) => m.employee_id || m.id)
  const tasks            = detail?.tasks || []
  const comments         = detail?.comments || []

  return (
    <COffcanvas placement="end" visible={visible} onHide={onClose} scroll style={{ width: 440 }}>
      <COffcanvasHeader className="border-bottom">
        <COffcanvasTitle className="fw-bold fs-5">{project.name}</COffcanvasTitle>
      </COffcanvasHeader>

      <COffcanvasBody className="d-flex flex-column gap-4 pt-4">

        {/* Client */}
        <div>
          <CFormLabel className="small text-body-secondary text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.05em', fontSize: 10 }}>Client</CFormLabel>
          <div className="fw-semibold">{project.client?.name || '—'}</div>
        </div>

        {/* Start date */}
        <div>
          <CFormLabel className="small text-body-secondary text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.05em', fontSize: 10 }}>Start Date</CFormLabel>
          <CFormInput type="date" defaultValue={formatDate(project.start_date)} onBlur={(e) => handleUpdate('start_date', e.target.value)} />
        </div>

        {/* End date */}
        <div>
          <CFormLabel className="small text-body-secondary text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.05em', fontSize: 10 }}>End Date</CFormLabel>
          <CFormInput type="date" defaultValue={formatDate(project.end_date)} onBlur={(e) => handleUpdate('end_date', e.target.value)} />
        </div>

        {/* Team members */}
        <div>
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

          {loadingDetail ? (
            <div className="text-center py-2"><CSpinner size="sm" /></div>
          ) : members.length === 0 ? (
            <p className="text-body-secondary small fst-italic mb-0">No members assigned yet.</p>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              {members.map((m) => (
                <MemberChip
                  key={m.id}
                  member={m}
                  onRemove={() => handleRemoveMember(m.employee_id || m.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={cilTask} size="sm" className="text-primary" />
              <CFormLabel className="mb-0 fw-bold">Tasks</CFormLabel>
              <CBadge color="secondary">{tasks.length}</CBadge>
            </div>
            <CButton size="sm" color={showTasks ? 'secondary' : 'primary'} variant="ghost"
              className="fw-semibold" style={{ fontSize: 12 }}
              onClick={() => setShowTasks((s) => !s)}>
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
                  {tasks.map((task) => (
                    <div key={task.id} className="rounded-2 p-2" style={{ background: 'var(--cui-body-bg)', border: '1px solid var(--cui-border-color-translucent)' }}>
                      <div className="fw-semibold mb-1" style={{ fontSize: 13 }}>{task.title}</div>
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

        {/* Comments */}
        {loadingDetail ? (
          <div className="text-center py-3">
            <CSpinner size="sm" />
            <span className="ms-2 small text-body-secondary">Loading comments…</span>
          </div>
        ) : (
          <CommentSection
            projectId={project.id}
            initialComments={comments}
            currentUser={user}
          />
        )}

        <div className="flex-grow-1" />
        <hr className="my-0" />

        {/* Footer actions */}
        <div className="d-flex flex-column gap-2 pb-2">
          <CButton color="primary" className="w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
            onClick={() => { onClose(); navigate(`/admin/projects/${project.id}/tasks`) }}>
            <CIcon icon={cilTask} /> Manage Tasks
          </CButton>
          <CButton color="primary" variant="outline" className="w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
            onClick={() => { onClose(); navigate(`/admin/projects/${project.id}`) }}>
            <CIcon icon={cilArrowRight} /> View Team &amp; Tasks
          </CButton>
        </div>

      </COffcanvasBody>
    </COffcanvas>
  )
}

export default ProjectDrawer