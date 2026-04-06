import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CBadge, CButton, CSpinner, CAlert,
  CModal, CModalHeader, CModalTitle, CModalBody,
  CForm, CFormLabel, CFormInput, CFormSelect,
  CFormTextarea, CFormFeedback, CRow, CCol,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilPlus, cilTask, cilCalendar, cilUser, cilTrash } from '@coreui/icons'
import { motion, AnimatePresence } from 'motion/react'
import api from '../../../api'

// ─── Constants ────────────────────────────────────────────────────────────────

const TASK_COLUMNS = [
  { key: 'todo',        label: 'To Do',       color: '#8a93a2' },
  { key: 'in_progress', label: 'In Progress',  color: '#3b82f6' },
  { key: 'review',      label: 'In Review',    color: '#9333ea' },
  { key: 'done',        label: 'Done',         color: '#22c55e' },
]

const PRIORITY_OPTIONS = ['low', 'medium', 'high']
const PRIORITY_COLORS  = { low: 'success', medium: 'warning', high: 'danger' }

const initialForm = {
  title: '', description: '', priority: 'medium',
  status: 'todo', due_date: '', assigned_to: '',
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Create Task Modal ────────────────────────────────────────────────────────

const CreateTaskModal = ({ visible, onClose, onCreated, projectId, members }) => {
  const [form, setForm]             = useState(initialForm)
  const [errors, setErrors]         = useState({})
  const [loading, setLoading]       = useState(false)
  const [globalError, setGlobalError] = useState(null)

  useEffect(() => { if (visible) { setForm(initialForm); setErrors({}) } }, [visible])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setGlobalError(null)
    try {
      await api.post('/api/admin/tasks', {
        ...form,
        project_id:  projectId,
        assigned_to: form.assigned_to || null,
      })
      onCreated()
      onClose()
    } catch (err) {
      if (err.response?.status === 422) {
        const raw = err.response.data.errors || {}
        const mapped = {}
        Object.keys(raw).forEach(k => { mapped[k] = Array.isArray(raw[k]) ? raw[k][0] : raw[k] })
        setErrors(mapped)
      } else {
        setGlobalError(err.response?.data?.message || 'Failed to create task.')
      }
    } finally { setLoading(false) }
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader>
        <CModalTitle className="fw-bold">
          <CIcon icon={cilPlus} className="me-2 text-primary" /> New Task
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {globalError && <CAlert color="danger" dismissible onClose={() => setGlobalError(null)}>{globalError}</CAlert>}
        <CForm onSubmit={handleSubmit} noValidate>
          <CRow className="g-3">
            <CCol md={12}>
              <CFormLabel className="fw-medium small">Title *</CFormLabel>
              <CFormInput name="title" value={form.title} onChange={handleChange} invalid={!!errors.title} placeholder="e.g. Design login screen" />
              {errors.title && <CFormFeedback invalid>{errors.title}</CFormFeedback>}
            </CCol>
            <CCol md={6}>
              <CFormLabel className="fw-medium small">Priority</CFormLabel>
              <CFormSelect name="priority" value={form.priority} onChange={handleChange}>
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel className="fw-medium small">Status</CFormLabel>
              <CFormSelect name="status" value={form.status} onChange={handleChange}>
                {TASK_COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel className="fw-medium small">Due Date</CFormLabel>
              <CFormInput type="date" name="due_date" value={form.due_date} onChange={handleChange} invalid={!!errors.due_date} />
              {errors.due_date && <CFormFeedback invalid>{errors.due_date}</CFormFeedback>}
            </CCol>
            <CCol md={6}>
              <CFormLabel className="fw-medium small">Assign To</CFormLabel>
              <CFormSelect name="assigned_to" value={form.assigned_to} onChange={handleChange}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </CFormSelect>
            </CCol>
            <CCol md={12}>
              <CFormLabel className="fw-medium small">Description</CFormLabel>
              <CFormTextarea name="description" rows={3} value={form.description} onChange={handleChange} placeholder="Task details..." />
            </CCol>
            <CCol md={12}>
              <CButton type="submit" color="primary" disabled={loading} className="w-100 fw-semibold">
                {loading ? <><CSpinner size="sm" className="me-2" />Creating...</> : <><CIcon icon={cilPlus} className="me-2" />Create Task</>}
              </CButton>
            </CCol>
          </CRow>
        </CForm>
      </CModalBody>
    </CModal>
  )
}

// ─── Task Card ────────────────────────────────────────────────────────────────

const TaskCard = ({ task, members, onDragStart }) => {
  const assignee = members.find(m => m.id === task.assigned_to)
  return (
    <div className="task-card" draggable onDragStart={(e) => onDragStart(e, task.id)}>
      <h6 className="fw-bold mb-3" style={{ lineHeight: 1.4, fontSize: '0.875rem' }}>{task.title}</h6>
      <div className="d-flex justify-content-between align-items-center">
        <CBadge color={PRIORITY_COLORS[task.priority] || 'warning'} shape="rounded-pill" className="px-3 py-1 text-uppercase fw-bold" style={{ fontSize: '0.6rem', letterSpacing: '1px' }}>
          {task.priority || 'medium'}
        </CBadge>
        <div className="d-flex align-items-center gap-2">
          {task.due_date && (
            <small className="d-flex align-items-center gap-1" style={{ fontSize: '0.7rem', color: 'var(--cui-secondary-color)' }}>
              <CIcon icon={cilCalendar} size="sm" />{formatDate(task.due_date)}
            </small>
          )}
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
            style={{ width: 22, height: 22, fontSize: 9, background: assignee ? '#3b82f6' : 'var(--cui-secondary-bg)', flexShrink: 0 }}
            title={assignee?.name || 'Unassigned'}
          >
            {assignee ? assignee.name?.charAt(0).toUpperCase() : <CIcon icon={cilUser} size="sm" className="text-body-secondary" />}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TaskManagement = () => {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [project, setProject]       = useState(null)
  const [tasks, setTasks]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  // Drag state — controls delete zone visibility
  const [isDragging, setIsDragging]       = useState(false)
  const [deleteHover, setDeleteHover]     = useState(false)
  const dragTaskIdRef = useRef(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/admin/projects/${id}`)
      setProject(res.data.data)
      setTasks(res.data.data.tasks || [])
    } catch { setError('Failed to load project tasks.') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const tasksByStatus = useMemo(() => {
    const grouped = {}
    TASK_COLUMNS.forEach(col => { grouped[col.key] = [] })
    tasks.forEach(task => {
      if (grouped[task.status]) grouped[task.status].push(task)
      else grouped['todo'].push(task)
    })
    return grouped
  }, [tasks])

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const onDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', String(taskId))
    dragTaskIdRef.current = taskId
    setIsDragging(true)
  }

  // Global dragend — fires when mouse is released anywhere
  useEffect(() => {
    const handleDragEnd = () => {
      setIsDragging(false)
      setDeleteHover(false)
      dragTaskIdRef.current = null
    }
    window.addEventListener('dragend', handleDragEnd)
    return () => window.removeEventListener('dragend', handleDragEnd)
  }, [])

  const onColumnDragOver  = (e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over') }
  const onColumnDragLeave = (e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over') }

  const onColumnDrop = async (e, newStatus) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
    const taskId = e.dataTransfer.getData('taskId')
    if (!taskId) return
    setTasks(prev => prev.map(t => t.id === parseInt(taskId) ? { ...t, status: newStatus } : t))
    try { await api.patch(`/api/admin/tasks/${taskId}`, { status: newStatus }) }
    catch { fetchData() }
  }

  // ── Delete zone handlers ──────────────────────────────────────────────────

  const onDeleteZoneDragOver = (e) => {
    e.preventDefault()
    setDeleteHover(true)
  }

  const onDeleteZoneDragLeave = (e) => {
    // Only clear hover if we actually left the zone (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDeleteHover(false)
    }
  }

  const onDeleteZoneDrop = async (e) => {
    e.preventDefault()
    setDeleteHover(false)
    setIsDragging(false)
    const taskId = e.dataTransfer.getData('taskId')
    if (!taskId) return
    // Optimistic remove
    setTasks(prev => prev.filter(t => t.id !== parseInt(taskId)))
    try { await api.delete(`/api/admin/tasks/${taskId}`) }
    catch { fetchData() } // rollback
  }

  if (loading) return <div className="text-center py-5"><CSpinner color="primary" /></div>
  if (error)   return <CAlert color="danger">{error}</CAlert>
  if (!project) return null

  const members = project.members || []

  return (
    <div className="project-detail-wrapper" style={{ position: 'relative' }}>

      {/* ── Fixed Delete Zone — only visible while dragging ── */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            onDragOver={onDeleteZoneDragOver}
            onDragLeave={onDeleteZoneDragLeave}
            onDrop={onDeleteZoneDrop}
            style={{
              position: 'fixed',
              // sits right below the CoreUI header (64px) and above the stats strip
              top: 64,
              // align with the content area — leave sidebar space
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 280px)', // 280px = sidebar width
              zIndex: 1050,
              height: 56,
              borderRadius: '0 0 16px 16px',
              background: deleteHover
                ? 'rgba(229, 83, 83, 0.25)'
                : 'rgba(229, 83, 83, 0.10)',
              border: `2px dashed ${deleteHover ? '#e55353' : 'rgba(229,83,83,0.4)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: deleteHover ? '#e55353' : 'rgba(229,83,83,0.6)',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
              pointerEvents: 'all',
              userSelect: 'none',
            }}
          >
            <CIcon icon={cilTrash} />
            Drop here to delete task
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back */}
      <div
        className="d-inline-flex align-items-center gap-2 mb-4 fw-semibold"
        style={{ cursor: 'pointer', color: 'var(--cui-secondary-color)', fontSize: 14 }}
        onClick={() => navigate(`/admin/projects/${id}`)}
      >
        <CIcon icon={cilArrowLeft} size="sm" /> Back to Project
      </div>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-5">
        <div>
          <h1 className="fw-black mb-1" style={{ letterSpacing: '-0.5px', fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>
            {project.name} — Tasks
          </h1>
          <p className="text-body-secondary small mb-0">
            Drag tasks between columns to update status. Drag to the <span style={{ color: '#e55353', fontWeight: 700 }}>red zone</span> at the top to delete.
          </p>
        </div>
        <CButton color="primary" className="d-flex align-items-center gap-2 fw-semibold" onClick={() => setShowCreate(true)}>
          <CIcon icon={cilPlus} /> New Task
        </CButton>
      </div>

      {/* Stats strip */}
      <div
        className="d-flex flex-wrap gap-4 rounded-3 px-4 py-3 mb-5"
        style={{ background: 'var(--cui-secondary-bg)', border: '1px solid var(--cui-border-color-translucent)' }}
      >
        {TASK_COLUMNS.map(col => (
          <div key={col.key} className="d-flex align-items-center gap-2">
            <span className="rounded-circle d-inline-block" style={{ width: 8, height: 8, background: col.color, flexShrink: 0 }} />
            <span className="small fw-semibold text-body-secondary">{col.label}</span>
            <CBadge style={{ background: `${col.color}20`, color: col.color, border: `1px solid ${col.color}40` }}>
              {tasksByStatus[col.key]?.length || 0}
            </CBadge>
          </div>
        ))}
        <div className="ms-auto d-flex align-items-center gap-2">
          <CIcon icon={cilTask} size="sm" className="text-primary" />
          <span className="small fw-bold">{tasks.length} Total Tasks</span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="d-flex gap-4 kanban-scroll-container" style={{ alignItems: 'flex-start' }}>
        {TASK_COLUMNS.map(col => {
          const colTasks = tasksByStatus[col.key] || []
          return (
            <div key={col.key} style={{ flexShrink: 0, width: 300, minWidth: 260 }}>
              {/* Column header */}
              <div className="d-flex align-items-center gap-2 mb-3 px-1">
                <span className="rounded-circle d-inline-block" style={{ width: 8, height: 8, background: col.color, flexShrink: 0 }} />
                <span className="fw-bold small">{col.label}</span>
                <span className="rounded-pill px-2 fw-bold ms-1" style={{ fontSize: '0.7rem', background: `${col.color}18`, color: col.color, border: `1px solid ${col.color}30` }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Drop zone */}
              <div
                className="drop-zone-container d-flex flex-column"
                style={{
                  minHeight: 200,
                  borderRadius: 16,
                  background: 'var(--cui-secondary-bg)',
                  border: '1px solid var(--cui-border-color-translucent)',
                  borderTop: `3px solid ${col.color}`,
                  padding: 12,
                }}
                onDragOver={onColumnDragOver}
                onDragLeave={onColumnDragLeave}
                onDrop={(e) => onColumnDrop(e, col.key)}
              >
                <AnimatePresence mode="popLayout">
                  {colTasks.length === 0 ? (
                    <div className="empty-dropzone">
                      <CIcon icon={cilTask} size="xl" className="mb-2 opacity-25" />
                      DROP TASKS HERE
                    </div>
                  ) : (
                    colTasks.map(task => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="mb-2"
                      >
                        <TaskCard task={task} members={members} onDragStart={onDragStart} />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Modal */}
      <CreateTaskModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchData}
        projectId={parseInt(id)}
        members={members}
      />
    </div>
  )
}

export default TaskManagement