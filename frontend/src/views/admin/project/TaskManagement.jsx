// src/views/admin/TaskManagement.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CBadge, CButton, CSpinner, CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
  cilArrowLeft, cilPlus, cilTask, cilCalendar, 
  cilUser, cilTrash 
} from '@coreui/icons'
import { motion, AnimatePresence } from 'motion/react'
import api from '../../../api'
import TaskReviewActions from '../../../components/task/TaskReviewActions'
import TaskDetailSidebar from '../../../components/task/TaskDetailSidebar'
import CreateTaskModal from '../../../components/task/CreateTaskModal'

// ─── Constants ────────────────────────────────────────────────────────────────

const TASK_COLUMNS = [
  { key: 'todo',             label: 'To Do',           color: '#8a93a2' },
  { key: 'in_progress',      label: 'In Progress',     color: '#3b82f6' },
  { key: 'on_hold',          label: 'On Hold',         color: '#f59e0b' },
  { key: 'ready_for_review', label: 'Ready for Review', color: '#0ea5e9' },
  { key: 'done',             label: 'Done',            color: '#22c55e' },
]

const PRIORITY_COLORS = { 
  low: 'success', 
  medium: 'warning', 
  high: 'danger', 
  urgent: 'danger' 
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Task Card ────────────────────────────────────────────────────────────────

const TaskCard = ({ task, members, onDragStart, onReviewed, onClick }) => {
  const assignee = members.find(m => m.id === task.assigned_to)
  return (
    <div 
      className="task-card" 
      draggable 
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onClick?.(task.id)} 
    >
      <h6 className="fw-bold mb-3" style={{ lineHeight: 1.4, fontSize: '0.875rem' }}>
        {task.title}
      </h6>
      <div className="d-flex justify-content-between align-items-center">
        <CBadge 
          color={PRIORITY_COLORS[task.priority] || 'warning'} 
          shape="rounded-pill" 
          className="px-3 py-1 text-uppercase fw-bold" 
          style={{ fontSize: '0.6rem', letterSpacing: '1px' }}
        >
          {task.priority || 'medium'}
        </CBadge>
        <div className="d-flex align-items-center gap-2">
          {task.due_date && (
            <small 
              className="d-flex align-items-center gap-1" 
              style={{ fontSize: '0.7rem', color: 'var(--cui-secondary-color)' }}
            >
              <CIcon icon={cilCalendar} size="sm" />
              {formatDate(task.due_date)}
            </small>
          )}
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
            style={{ 
              width: 22, height: 22, fontSize: 9, 
              background: assignee ? '#3b82f6' : 'var(--cui-secondary-bg)', 
              flexShrink: 0 
            }}
            title={assignee?.name || 'Unassigned'}
          >
            {assignee ? assignee.name?.charAt(0).toUpperCase() : (
              <CIcon icon={cilUser} size="sm" className="text-body-secondary" />
            )}
          </div>
        </div>
      </div>
      {task.status === 'ready_for_review' && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--cui-border-color-translucent)' }}>
          <TaskReviewActions task={task} onReviewed={onReviewed} />
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TaskManagement = () => {
  const [sidebarTaskId, setSidebarTaskId] = useState(null)
  const { id } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const [deleteHover, setDeleteHover] = useState(false)
  const dragTaskIdRef = useRef(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/admin/projects/${id}`)
      setProject(res.data.data)
      setTasks(res.data.data.tasks || [])
    } catch {
      setError('Failed to load project tasks.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const timer = window.setTimeout(fetchData, 0)
    return () => window.clearTimeout(timer)
  }, [fetchData])

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

  useEffect(() => {
    const handleDragEnd = () => {
      setIsDragging(false)
      setDeleteHover(false)
      dragTaskIdRef.current = null
    }
    window.addEventListener('dragend', handleDragEnd)
    return () => window.removeEventListener('dragend', handleDragEnd)
  }, [])

  const onColumnDragOver = (e) => { 
    e.preventDefault()
    e.currentTarget.classList.add('drag-over') 
  }
  
  const onColumnDragLeave = (e) => { 
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over') 
  }

  const onColumnDrop = async (e, newStatus) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
    const taskId = e.dataTransfer.getData('taskId')
    if (!taskId) return
    setTasks(prev => prev.map(t => 
      t.id === parseInt(taskId) ? { ...t, status: newStatus } : t
    ))
    try {
      await api.patch(`/api/admin/tasks/${taskId}`, { status: newStatus })
    } catch {
      fetchData()
    }
  }

  // ── Delete zone handlers ──────────────────────────────────────────────────

  const onDeleteZoneDragOver = (e) => {
    e.preventDefault()
    setDeleteHover(true)
  }

  const onDeleteZoneDragLeave = (e) => {
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
    setTasks(prev => prev.filter(t => t.id !== parseInt(taskId)))
    try {
      await api.delete(`/api/admin/tasks/${taskId}`)
    } catch {
      fetchData()
    }
  }

  const handleTaskReviewed = (updatedTask) => {
    if (!updatedTask?.id) {
      fetchData()
      return
    }
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? { ...task, ...updatedTask } : task
    ))
    fetchData()
  }

  if (loading) return <div className="text-center py-5"><CSpinner color="primary" /></div>
  if (error) return <CAlert color="danger">{error}</CAlert>
  if (!project) return null

  const members = project.members || []

  return (
    <div className="project-detail-wrapper" style={{ position: 'relative' }}>
      {/* Fixed Delete Zone */}
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
              top: 64,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 280px)',
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

      {/* Back Button */}
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
            Drag tasks between columns to update status. Drag to the{' '}
            <span style={{ color: '#e55353', fontWeight: 700 }}>red zone</span>{' '}
            at the top to delete.
          </p>
        </div>
        <CButton 
          color="primary" 
          className="d-flex align-items-center gap-2 fw-semibold" 
          onClick={() => setShowCreate(true)}
        >
          <CIcon icon={cilPlus} /> New Task
        </CButton>
      </div>

      {/* Stats strip */}
      <div
        className="d-flex flex-wrap gap-4 rounded-3 px-4 py-3 mb-5"
        style={{ 
          background: 'var(--cui-secondary-bg)', 
          border: '1px solid var(--cui-border-color-translucent)' 
        }}
      >
        {TASK_COLUMNS.map(col => (
          <div key={col.key} className="d-flex align-items-center gap-2">
            <span 
              className="rounded-circle d-inline-block" 
              style={{ width: 8, height: 8, background: col.color, flexShrink: 0 }} 
            />
            <span className="small fw-semibold text-body-secondary">{col.label}</span>
            <CBadge style={{ 
              background: `${col.color}20`, 
              color: col.color, 
              border: `1px solid ${col.color}40` 
            }}>
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
                <span 
                  className="rounded-circle d-inline-block" 
                  style={{ width: 8, height: 8, background: col.color, flexShrink: 0 }} 
                />
                <span className="fw-bold small">{col.label}</span>
                <span 
                  className="rounded-pill px-2 fw-bold ms-1" 
                  style={{ 
                    fontSize: '0.7rem', 
                    background: `${col.color}18`, 
                    color: col.color, 
                    border: `1px solid ${col.color}30` 
                  }}
                >
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
                        <TaskCard
                          task={task}
                          members={members}
                          onDragStart={onDragStart}
                          onReviewed={handleTaskReviewed}
                          onClick={(id) => setSidebarTaskId(id)}
                        />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchData}
        projectId={parseInt(id)}
        members={members}
        isAdmin={true}
      />

      {/* Task Detail Sidebar */}
      <TaskDetailSidebar
        taskId={sidebarTaskId}
        visible={!!sidebarTaskId}
        onClose={() => setSidebarTaskId(null)}
        onTaskUpdated={fetchData}
        isAdmin={true}
      />
    </div>
  )
}

export default TaskManagement