// src/components/task/TaskDetailSidebar.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  CSpinner, CAlert, CBadge, CButton, CFormTextarea, CFormInput,
  CAvatar, CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilX, cilCalendar, cilUser, cilCommentSquare, cilSearch,
  cilTask, cilChevronBottom, cilChevronRight, cilArrowLeft,
  cilPlus, cilCloudUpload, cilTrash,
} from '@coreui/icons'
import api from '../../api'
import CreateTaskModal from './CreateTaskModal.jsx'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'todo',             label: 'To Do',            color: '#8a93a2', bg: 'rgba(138,147,162,0.1)' },
  { value: 'in_progress',      label: 'In Progress',      color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
  { value: 'on_hold',          label: 'On Hold',          color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  { value: 'ready_for_review', label: 'Ready for Review', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)'  },
  { value: 'done',             label: 'Done',             color: '#22c55e', bg: 'rgba(34,197,94,0.1)'   },
]

const PRIORITY_CONFIG = {
  low:    { color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)', label: 'Low'    },
  medium: { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)', label: 'Medium' },
  high:   { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'var(--danger-border)',  label: 'High'   },
  urgent: { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'var(--danger-border)',  label: 'Urgent' },
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const isOverdue = (d, status) => d && status !== 'done' && new Date(d) < new Date()

// ─── Helper: Recursively collect all undone subtasks ─────────────────────────

const getUndoneSubtasks = (task) => {
  const undone = []
  const collect = (t) => {
    if (t.children && t.children.length > 0) {
      t.children.forEach(child => {
        if (child.status !== 'done') {
          undone.push(child)
        }
        collect(child)
      })
    }
  }
  collect(task)
  return undone
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const cfg = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 6,
      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}30`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

// ─── Breadcrumb Helper ────────────────────────────────────────────────────────

const Breadcrumb = ({ history, tasks, onNavigate }) => {
  if (history.length <= 1) return null

  const items = history.map((id, idx) => {
    const task = tasks.find(t => t.id === id)
    return { id, title: task?.title || `Task ${id}`, idx }
  })

  let displayItems = items
  if (items.length > 3) {
    displayItems = [
      { id: items[0].id, title: '...', idx: 0, isEllipsis: true },
      ...items.slice(-2)
    ]
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: '0.75rem', color: 'var(--text-low)',
      marginBottom: 8, flexWrap: 'wrap',
    }}>
      {displayItems.map((item, idx) => (
        <React.Fragment key={item.idx}>
          {idx > 0 && <span style={{ color: 'var(--border-default)' }}>/</span>}
          {item.isEllipsis ? (
            <span style={{ color: 'var(--text-low)' }}>...</span>
          ) : (
            <button
              onClick={() => onNavigate(item.idx)}
              style={{
                background: 'none', border: 'none', padding: 0,
                color: idx === displayItems.length - 1 ? 'var(--text-high)' : 'var(--accent)',
                fontWeight: idx === displayItems.length - 1 ? 700 : 500,
                cursor: idx === displayItems.length - 1 ? 'default' : 'pointer',
                fontSize: '0.75rem',
              }}
              disabled={idx === displayItems.length - 1}
            >
              {item.title}
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── Assignee Selector ────────────────────────────────────────────────────────

const AssigneeSelector = ({ task, employees, onChange, isAdmin }) => {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return employees
    return employees.filter(e => 
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase())
    )
  }, [employees, search])

  const currentAssignee = employees.find(e => e.id === task.assignee?.id) || task.assignee

  return (
    <CDropdown className="w-100">
      <CDropdownToggle
        caret={false}
        color="transparent"
        className="p-0 border-0 shadow-none w-100 text-start"
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 8,
          background: 'var(--surface-bg)', border: '1px solid var(--border-faint)',
          cursor: 'pointer', transition: 'border-color 0.15s',
        }}>
          <CAvatar size="sm" color="primary" textColor="white" style={{ fontWeight: 700 }}>
            {currentAssignee?.name?.charAt(0) || '?'}
          </CAvatar>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-high)' }}>
              {currentAssignee?.name || 'Unassigned'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-low)' }}>
              {currentAssignee?.email || 'Click to change assignee'}
            </div>
          </div>
          <CIcon icon={cilChevronBottom} size="sm" style={{ color: 'var(--text-low)' }} />
        </div>
      </CDropdownToggle>
      <CDropdownMenu style={{ width: '100%', maxHeight: 300, overflow: 'auto' }}>
        <CDropdownItem onClick={() => onChange(null)} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CAvatar size="sm" color="secondary" textColor="white">—</CAvatar>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-low)' }}>Unassigned</span>
          </div>
        </CDropdownItem>
        <CDropdownItem divider />
        
        <div style={{ padding: '8px 12px', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 1 }}>
          <div style={{ position: 'relative' }}>
            <CIcon icon={cilSearch} size="sm" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-low)' }} />
            <CFormInput
              size="sm"
              placeholder="Search employees..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32, fontSize: '0.85rem' }}
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>

        {filtered.map(employee => (
          <CDropdownItem
            key={employee.id}
            onClick={() => { onChange(employee.id); setSearch('') }}
            active={employee.id === task.assignee?.id}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CAvatar size="sm" color="primary" textColor="white" style={{ fontWeight: 700 }}>
                {employee.name?.charAt(0)}
              </CAvatar>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{employee.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-low)' }}>{employee.email}</div>
              </div>
            </div>
          </CDropdownItem>
        ))}
        {filtered.length === 0 && (
          <CDropdownItem disabled>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-low)' }}>No employees found</span>
          </CDropdownItem>
        )}
      </CDropdownMenu>
    </CDropdown>
  )
}

// ─── Parent Task Card ─────────────────────────────────────────────────────────

const ParentTaskCard = ({ parentId, onNavigate, isAdmin }) => {
  const [parent, setParent] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!parentId) return
    setLoading(true)
    const prefix = isAdmin ? 'admin' : 'employee'
    api.get(`/api/${prefix}/tasks/${parentId}`)
      .then(res => setParent(res.data?.data || res.data))
      .catch(() => setParent(null))
      .finally(() => setLoading(false))
  }, [parentId, isAdmin])

  if (!parentId || loading) return null

  return (
    <div
      onClick={() => onNavigate(parent)}
      style={{
        padding: '10px 12px', borderRadius: 8,
        background: 'var(--info-bg)', border: '1px solid var(--info-border)',
        marginBottom: '1rem', cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { 
        e.currentTarget.style.transform = 'translateX(4px)'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' 
      }}
      onMouseLeave={e => { 
        e.currentTarget.style.transform = 'translateX(0)'
        e.currentTarget.style.boxShadow = 'none' 
      }}
    >
      <div style={{ 
        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', 
        textTransform: 'uppercase', color: 'var(--info)', marginBottom: 4 
      }}>
        Parent Task
      </div>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-high)' }}>
        {parent?.title || 'Loading...'}
      </div>
      {parent?.description && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-med)', marginTop: 4, lineHeight: 1.4 }}>
          {parent.description.length > 80 
            ? parent.description.substring(0, 80) + '...' 
            : parent.description}
        </div>
      )}
    </div>
  )
}

// ─── Subtask Row ──────────────────────────────────────────────────────────────

const SubtaskRow = ({ task, depth = 0, onDrillDown }) => {
  const [open, setOpen] = useState(false)
  const hasChildren = task.children?.length > 0
  const cfg = STATUS_OPTIONS.find(s => s.value === task.status) || STATUS_OPTIONS[0]
  const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium

  const handleRowClick = () => onDrillDown?.(task)

  const handleToggle = (e) => {
    e.stopPropagation()
    if (!hasChildren) return
    setOpen(o => !o)
  }

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 10px',
          paddingLeft: `${10 + depth * 20}px`,
          borderRadius: 8,
          background: 'var(--surface-bg)',
          border: '1px solid var(--border-faint)',
          marginBottom: 4,
          cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
        }}
        onClick={handleRowClick}
        onMouseEnter={e => { 
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.background = 'var(--accent-bg)' 
        }}
        onMouseLeave={e => { 
          e.currentTarget.style.borderColor = 'var(--border-faint)'
          e.currentTarget.style.background = 'var(--surface-bg)' 
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="status-check"
            onClick={handleToggle}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', padding: 0, margin: 0,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <CIcon 
              icon={open ? cilChevronBottom : cilChevronRight} 
              size="sm" 
              style={{ color: 'var(--text-low)', flexShrink: 0 }} 
            />
          </button>
        ) : (
          <span style={{ width: 16, flexShrink: 0 }} />
        )}

        <span style={{
          flex: 1, fontSize: '0.82rem', fontWeight: 500,
          color: task.status === 'done' ? 'var(--text-low)' : 'var(--text-high)',
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {task.title}
        </span>

        <span style={{
          fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em', 
          textTransform: 'uppercase',
          background: pCfg.bg, color: pCfg.color, 
          border: `1px solid ${pCfg.border}`,
          borderRadius: 4, padding: '1px 6px', flexShrink: 0,
        }}>
          {pCfg.label}
        </span>

        <span className="status-check" style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: cfg.color,
            boxShadow: `0 0 4px ${cfg.color}88`,
          }} title={cfg.label} />
        </span>
      </div>

      {open && hasChildren && (
        <div>
          {task.children.map(child => (
            <SubtaskRow 
              key={child.id} 
              task={child} 
              depth={depth + 1} 
              onDrillDown={onDrillDown} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

const TaskDetailSidebar = ({
  taskId,
  visible,
  onClose,
  onStatusChange,
  onTaskUpdated,
  isAdmin = false,
}) => {
  // ── Navigation Stack ───────────────────────────────────────────────────────
  const [history, setHistory] = useState([])
  const [slideDirection, setSlideDirection] = useState('none')
  const contentRef = useRef(null)

  const activeTaskId = history.length > 0 ? history[history.length - 1] : taskId

  // ── Create Subtask Modal State ─────────────────────────────────────────────
  const [showCreateSubtask, setShowCreateSubtask] = useState(false)

  // ── Subtask Warning Modal State ────────────────────────────────────────────
  const [showSubtaskWarning, setShowSubtaskWarning] = useState(false)
  const [markingDone, setMarkingDone] = useState(false)

  // Reset history when external taskId changes
  useEffect(() => {
    if (taskId && visible) {
      setHistory([taskId])
    }
    if (!visible) {
      setHistory([])
      setShowSubtaskWarning(false)
    }
  }, [taskId, visible])

  // ── Task Data ──────────────────────────────────────────────────────────────
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // ── Employees ──────────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState([])
  const [employeesLoading, setEmployeesLoading] = useState(false)

  // ── UI State ───────────────────────────────────────────────────────────────
  const [comment, setComment] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [posting, setPosting] = useState(false)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [updatingPriority, setUpdatingPriority] = useState(false)
  const [updatingAssignee, setUpdatingAssignee] = useState(false)
  const fileInputRef = useRef(null)

  // ── Fetch Employees ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return
    setEmployeesLoading(true)
    const prefix = isAdmin ? 'admin' : 'employee'
    api.get(`/api/${prefix}/users?role=employee`)
      .then(res => {
        const list = res.data?.data?.items || res.data?.data || res.data || []
        setEmployees(list.filter(u => u.global_role === 'employee' || u.role === 'employee'))
      })
      .catch(() => setEmployees([]))
      .finally(() => setEmployeesLoading(false))
  }, [visible, isAdmin])

  // ── Fetch Task ─────────────────────────────────────────────────────────────
  const fetchTask = useCallback(async () => {
    if (!activeTaskId) return
    setLoading(true)
    setError(null)
    try {
      const prefix = isAdmin ? 'admin' : 'employee'
      const res = await api.get(`/api/${prefix}/tasks/${activeTaskId}`)
      setTask(res.data?.data || res.data)
    } catch {
      setError('Failed to load task details.')
    } finally {
      setLoading(false)
    }
  }, [activeTaskId, isAdmin])

  useEffect(() => {
    if (visible && activeTaskId) fetchTask()
  }, [visible, activeTaskId, fetchTask])

  // ── Close on Escape ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { 
      if (e.key === 'Escape') {
        if (showSubtaskWarning) {
          setShowSubtaskWarning(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, showSubtaskWarning])

  // ─── File Upload Helpers ───────────────────────────────────────────────────
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
    if (errors.length) {
      setError(errors.join(' '))
      setTimeout(() => setError(null), 5000)
    }
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
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  // ── Navigation Handlers ────────────────────────────────────────────────────
  const handleDrillDown = (subtask) => {
    setSlideDirection('in')
    setHistory(prev => [...prev, subtask.id])
    setTimeout(() => setSlideDirection('none'), 300)
  }

  const handleGoBack = () => {
    if (history.length <= 1) return
    setSlideDirection('out')
    setHistory(prev => prev.slice(0, -1))
    setTimeout(() => setSlideDirection('none'), 300)
  }

  const handleBreadcrumbNavigate = (index) => {
    setSlideDirection('out')
    setHistory(prev => prev.slice(0, index + 1))
    setTimeout(() => setSlideDirection('none'), 300)
  }

  // ── Task Actions ───────────────────────────────────────────────────────────

  const applyStatusChange = async (newStatus) => {
    setTask(prev => ({ ...prev, status: newStatus }))
    try {
      const prefix = isAdmin ? 'admin' : 'employee'
      await api.patch(`/api/${prefix}/tasks/${task.id}`, { status: newStatus })
      onStatusChange?.(task.id, newStatus)
      onTaskUpdated?.()
    } catch {
      fetchTask()
    }
  }

  const markAllSubtasksDone = async (taskNode) => {
    const prefix = isAdmin ? 'admin' : 'employee'
    
    const markDoneRecursive = async (t) => {
      if (t.children && t.children.length > 0) {
        for (const child of t.children) {
          if (child.status !== 'done') {
            await api.patch(`/api/${prefix}/tasks/${child.id}`, { status: 'done' })
          }
          await markDoneRecursive(child)
        }
      }
    }
    
    await markDoneRecursive(taskNode)
    await fetchTask()
  }

  const checkAndWarnSubtasks = (newStatus, onProceed) => {
    if (newStatus === 'done' && task) {
      const undone = getUndoneSubtasks(task)
      if (undone.length > 0) {
        // Store the callback to execute after user choice
        setPendingAction(() => onProceed)
        setShowSubtaskWarning(true)
        return false
      }
    }
    return true
  }

  // Store the pending action (status change or approve)
  const [pendingAction, setPendingAction] = useState(null)

  const handleStatusChange = async (newStatus) => {
    const proceed = () => applyStatusChange(newStatus)
    if (checkAndWarnSubtasks(newStatus, proceed)) {
      await proceed()
    }
  }

  const handlePriorityChange = async (newPriority) => {
    if (!task || task.priority === newPriority) return
    setUpdatingPriority(true)
    setTask(prev => ({ ...prev, priority: newPriority }))
    try {
      const prefix = isAdmin ? 'admin' : 'employee'
      await api.patch(`/api/${prefix}/tasks/${task.id}`, { priority: newPriority })
      onTaskUpdated?.()
    } catch {
      fetchTask()
    } finally {
      setUpdatingPriority(false)
    }
  }

  const handleAssigneeChange = async (newUserId) => {
    if (!task) return
    setUpdatingAssignee(true)
    const newAssignee = newUserId ? employees.find(e => e.id === newUserId) : null
    setTask(prev => ({ ...prev, assignee: newAssignee, assigned_to: newUserId }))
    try {
      const prefix = isAdmin ? 'admin' : 'employee'
      await api.patch(`/api/${prefix}/tasks/${task.id}`, { assigned_to: newUserId })
      onTaskUpdated?.()
    } catch {
      fetchTask()
    } finally {
      setUpdatingAssignee(false)
    }
  }

  const handleAddComment = async () => {
    if (!comment.trim() && selectedFiles.length === 0) return
    setPosting(true)
    setError(null)

    const formData = new FormData()
    formData.append('content', comment.trim())
    selectedFiles.forEach(file => {
      formData.append('attachments[]', file)
    })

    try {
      const prefix = isAdmin ? 'admin' : 'employee'
      await api.post(`/api/${prefix}/tasks/${task.id}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setComment('')
      setSelectedFiles([])
      await fetchTask()
    } catch (err) {
      console.error('Comment failed:', err)
      setError(err.response?.data?.message || 'Failed to post comment.')
    } finally {
      setPosting(false)
    }
  }

  const handleApprove = async () => {
    const proceed = async () => {
      setApproving(true)
      try {
        await api.patch(`/api/admin/tasks/${task.id}/approve`)
        setTask(prev => ({ ...prev, status: 'done' }))
        onTaskUpdated?.()
      } finally {
        setApproving(false)
      }
    }
    
    if (checkAndWarnSubtasks('done', proceed)) {
      await proceed()
    }
  }

  const handleReject = async () => {
    setRejecting(true)
    try {
      await api.patch(`/api/admin/tasks/${task.id}/reject`, { 
        feedback: comment || 'Needs revision.' 
      })
      setTask(prev => ({ ...prev, status: 'in_progress' }))
      setComment('')
      onTaskUpdated?.()
    } finally {
      setRejecting(false)
    }
  }

  const handleSubtaskCreated = () => {
    fetchTask()
    onTaskUpdated?.()
  }

  // ── Warning Modal Actions ──────────────────────────────────────────────────

  const undoneSubtasks = task ? getUndoneSubtasks(task) : []

  const handleMarkAllDone = async () => {
    setMarkingDone(true)
    try {
      await markAllSubtasksDone(task)
      if (pendingAction) {
        await pendingAction()
      }
      setShowSubtaskWarning(false)
      setPendingAction(null)
    } catch (err) {
      setError('Failed to mark subtasks as done.')
    } finally {
      setMarkingDone(false)
    }
  }

  const handleFinishSubtasksFirst = () => {
    setShowSubtaskWarning(false)
    // Navigate to the first undone subtask
    if (undoneSubtasks.length > 0) {
      handleDrillDown(undoneSubtasks[0])
    }
    setPendingAction(null)
  }

  const handleCancelWarning = () => {
    setShowSubtaskWarning(false)
    setPendingAction(null)
  }

  // ── Derived State ──────────────────────────────────────────────────────────
  const overdue = task && isOverdue(task.due_date, task.status)
  const pCfg = task ? (PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium) : null
  const totalSubtasks = task?.children?.length || 0
  const doneSubtasks = task?.children?.filter(c => c.status === 'done').length || 0
  const isSubtask = !!task?.parent_id
  const canGoBack = history.length > 1

  // ── Slide Animation Styles ─────────────────────────────────────────────────
  const getSlideStyle = () => {
    if (slideDirection === 'in') return { transform: 'translateX(20px)', opacity: 0.8 }
    if (slideDirection === 'out') return { transform: 'translateX(-20px)', opacity: 0.8 }
    return { transform: 'translateX(0)', opacity: 1 }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1040,
          background: 'rgba(0,0,0,0.35)',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'all' : 'none',
          transition: 'opacity 0.25s ease',
          backdropFilter: visible ? 'blur(2px)' : 'none',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 480, maxWidth: '95vw',
        zIndex: 1041,
        background: 'var(--card-bg)',
        borderLeft: '1px solid var(--border-default)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.25)',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-default)',
          flexShrink: 0,
        }}>
          <div className="d-flex align-items-center gap-2">
            {canGoBack && (
              <button
                onClick={handleGoBack}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--accent)', borderRadius: 6, padding: '4px 6px',
                  marginRight: 4,
                  transition: 'color 0.15s, background 0.15s',
                }}
                title="Go back"
              >
                <CIcon icon={cilArrowLeft} />
              </button>
            )}
            <CIcon icon={cilTask} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-high)' }}>
              Task Details
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-low)', borderRadius: 6, padding: '4px 6px',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { 
              e.currentTarget.style.color = 'var(--text-high)'
              e.currentTarget.style.background = 'var(--surface-bg)' 
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.color = 'var(--text-low)'
              e.currentTarget.style.background = 'transparent' 
            }}
          >
            <CIcon icon={cilX} />
          </button>
        </div>

        {/* Body */}
        <div
          ref={contentRef}
          style={{
            flex: 1, overflowY: 'auto', padding: '1.25rem',
            transition: 'transform 0.3s ease, opacity 0.3s ease',
            ...getSlideStyle(),
          }}
        >
          {/* Breadcrumb */}
          {history.length > 1 && (
            <Breadcrumb
              history={history}
              tasks={task ? [task, ...(task.children || [])] : []}
              onNavigate={handleBreadcrumbNavigate}
            />
          )}

          {loading && (
            <div className="text-center py-5">
              <CSpinner color="primary" size="sm" />
              <div className="small mt-2" style={{ color: 'var(--text-low)' }}>Loading...</div>
            </div>
          )}

          {error && <CAlert color="danger" className="small">{error}</CAlert>}

          {task && !loading && (
            <>
              {/* Parent Task Card */}
              {isSubtask && (
                <ParentTaskCard
                  parentId={task.parent_id}
                  onNavigate={(parent) => {
                    const parentIdx = history.indexOf(parent.id)
                    if (parentIdx >= 0) {
                      handleBreadcrumbNavigate(parentIdx)
                    } else {
                      setSlideDirection('out')
                      setHistory(prev => {
                        const currentIdx = prev.indexOf(task.id)
                        return [...prev.slice(0, currentIdx), parent.id]
                      })
                      setTimeout(() => setSlideDirection('none'), 300)
                    }
                  }}
                  isAdmin={isAdmin}
                />
              )}

              {/* Title & Meta */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h5 style={{
                  fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-high)',
                  lineHeight: 1.3, marginBottom: 8, wordBreak: 'break-word',
                }}>
                  {task.title}
                </h5>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <StatusBadge status={task.status} />
                  
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 600,
                    background: pCfg.bg, color: pCfg.color,
                    border: `1px solid ${pCfg.border}`,
                    borderRadius: 6, padding: '2px 8px',
                  }}>
                    {pCfg.label} Priority
                  </span>

                  {overdue && (
                    <CBadge color="danger" style={{ fontSize: '0.7rem' }}>
                      Overdue
                    </CBadge>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                marginBottom: '1.25rem',
              }}>
                <div style={{
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--surface-bg)', border: '1px solid var(--border-faint)',
                }}>
                  <div style={{ 
                    fontSize: '0.7rem', color: 'var(--text-low)', marginBottom: 4, 
                    textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 
                  }}>
                    Created
                  </div>
                  <div style={{ 
                    fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-high)', 
                    display: 'flex', alignItems: 'center', gap: 6 
                  }}>
                    <CIcon icon={cilCalendar} size="sm" style={{ color: 'var(--accent)' }} />
                    {formatDate(task.created_at)}
                  </div>
                </div>
                <div style={{
                  padding: '10px 12px', borderRadius: 8,
                  background: overdue ? 'var(--danger-bg)' : 'var(--surface-bg)',
                  border: `1px solid ${overdue ? 'var(--danger-border)' : 'var(--border-faint)'}`,
                }}>
                  <div style={{ 
                    fontSize: '0.7rem', color: 'var(--text-low)', marginBottom: 4, 
                    textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 
                  }}>
                    Due Date
                  </div>
                  <div style={{ 
                    fontSize: '0.85rem', fontWeight: 600, 
                    color: overdue ? 'var(--danger)' : 'var(--text-high)', 
                    display: 'flex', alignItems: 'center', gap: 6 
                  }}>
                    <CIcon icon={cilCalendar} size="sm" style={{ color: overdue ? 'var(--danger)' : 'var(--accent)' }} />
                    {formatDate(task.due_date)}
                  </div>
                </div>
              </div>

              {/* Assignee */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ 
                  fontSize: '0.7rem', color: 'var(--text-low)', marginBottom: 8, 
                  textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 
                }}>
                  Assignee
                </div>
                <AssigneeSelector
                  task={task}
                  employees={employees}
                  onChange={handleAssigneeChange}
                  isAdmin={isAdmin}
                />
                {updatingAssignee && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-low)', marginTop: 4 }}>
                    <CSpinner size="sm" color="primary" /> Updating...
                  </div>
                )}
              </div>

              {/* Description */}
              {task.description && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ 
                    fontSize: '0.7rem', color: 'var(--text-low)', marginBottom: 8, 
                    textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 
                  }}>
                    Description
                  </div>
                  <div style={{
                    fontSize: '0.85rem', color: 'var(--text-med)', lineHeight: 1.6,
                    padding: '12px', borderRadius: 8,
                    background: 'var(--surface-bg)', border: '1px solid var(--border-faint)',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {task.description}
                  </div>
                </div>
              )}

              {/* Subtasks */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 8,
                }}>
                  <div style={{ 
                    fontSize: '0.7rem', color: 'var(--text-low)', 
                    textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 
                  }}>
                    Subtasks
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-low)' }}>
                      {doneSubtasks}/{totalSubtasks} completed
                    </span>
                    
                    <button
                      onClick={() => setShowCreateSubtask(true)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px', borderRadius: 6,
                        fontSize: '0.72rem', fontWeight: 600,
                        background: 'var(--accent)', color: 'white',
                        border: 'none', cursor: 'pointer',
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <CIcon icon={cilPlus} size="sm" />
                      Add Subtask
                    </button>
                  </div>
                </div>
                
                {/* Progress bar */}
                {totalSubtasks > 0 && (
                  <div style={{
                    height: 4, borderRadius: 2,
                    background: 'var(--border-default)',
                    marginBottom: 12, overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', 
                      width: `${(doneSubtasks / totalSubtasks) * 100}%`,
                      background: 'var(--success)', borderRadius: 2,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                )}

                {totalSubtasks > 0 ? (
                  <div>
                    {task.children.map(child => (
                      <SubtaskRow
                        key={child.id}
                        task={child}
                        onDrillDown={handleDrillDown}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center', padding: '20px',
                    color: 'var(--text-low)', fontSize: '0.85rem',
                  }}>
                    No subtasks yet. Click the button above to create one.
                  </div>
                )}
              </div>

              {/* Status Actions */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ 
                  fontSize: '0.7rem', color: 'var(--text-low)', marginBottom: 8, 
                  textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 
                }}>
                  Status
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusChange(opt.value)}
                      disabled={task.status === opt.value}
                      style={{
                        padding: '6px 12px', borderRadius: 6,
                        fontSize: '0.75rem', fontWeight: 600,
                        border: `1px solid ${task.status === opt.value ? opt.color : 'var(--border-default)'}`,
                        background: task.status === opt.value ? opt.bg : 'var(--surface-bg)',
                        color: task.status === opt.value ? opt.color : 'var(--text-med)',
                        cursor: task.status === opt.value ? 'default' : 'pointer',
                        transition: 'all 0.15s',
                        opacity: task.status === opt.value ? 1 : 0.7,
                      }}
                      onMouseEnter={e => {
                        if (task.status !== opt.value) {
                          e.currentTarget.style.borderColor = opt.color
                          e.currentTarget.style.color = opt.color
                          e.currentTarget.style.opacity = 1
                        }
                      }}
                      onMouseLeave={e => {
                        if (task.status !== opt.value) {
                          e.currentTarget.style.borderColor = 'var(--border-default)'
                          e.currentTarget.style.color = 'var(--text-med)'
                          e.currentTarget.style.opacity = 0.7
                        }
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ 
                  fontSize: '0.7rem', color: 'var(--text-low)', marginBottom: 8, 
                  textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 
                }}>
                  Priority
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => handlePriorityChange(key)}
                      disabled={task.priority === key || updatingPriority}
                      style={{
                        padding: '6px 12px', borderRadius: 6,
                        fontSize: '0.75rem', fontWeight: 600,
                        border: `1px solid ${task.priority === key ? cfg.border : 'var(--border-default)'}`,
                        background: task.priority === key ? cfg.bg : 'var(--surface-bg)',
                        color: task.priority === key ? cfg.color : 'var(--text-med)',
                        cursor: task.priority === key ? 'default' : 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Actions */}
              {isAdmin && task.status === 'ready_for_review' && (
                <div style={{
                  padding: '12px', borderRadius: 8,
                  background: 'var(--warning-bg)', 
                  border: '1px solid var(--warning-border)',
                  marginBottom: '1.25rem',
                }}>
                  <div style={{ 
                    fontSize: '0.8rem', fontWeight: 700, 
                    color: 'var(--warning)', marginBottom: 8 
                  }}>
                    Review Required
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <CButton
                      color="success"
                      size="sm"
                      onClick={handleApprove}
                      disabled={approving}
                    >
                      {approving ? <CSpinner size="sm" /> : 'Approve'}
                    </CButton>
                    <CButton
                      color="danger"
                      size="sm"
                      variant="outline"
                      onClick={handleReject}
                      disabled={rejecting}
                    >
                      {rejecting ? <CSpinner size="sm" /> : 'Reject'}
                    </CButton>
                  </div>
                </div>
              )}

              {/* Comments Section with File Upload */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  marginBottom: 12,
                }}>
                  <CIcon icon={cilCommentSquare} size="sm" style={{ color: 'var(--accent)' }} />
                  <div style={{ 
                    fontSize: '0.7rem', color: 'var(--text-low)', 
                    textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 
                  }}>
                    Comments
                  </div>
                  <span style={{
                    fontSize: '0.7rem', color: 'var(--text-low)',
                    background: 'var(--surface-bg)', padding: '1px 6px', borderRadius: 10,
                  }}>
                    {task.comments?.length || 0}
                  </span>
                </div>

                {/* Comment List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                  {task.comments?.length === 0 && (
                    <div style={{
                      textAlign: 'center', padding: '20px',
                      color: 'var(--text-low)', fontSize: '0.85rem',
                    }}>
                      No comments yet. Be the first to comment.
                    </div>
                  )}
                  {task.comments?.map((c, idx) => (
                    <div key={idx} style={{
                      padding: '10px 12px', borderRadius: 8,
                      background: 'var(--surface-bg)', 
                      border: '1px solid var(--border-faint)',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                      }}>
                        <CAvatar 
                          size="xs" 
                          color="primary" 
                          textColor="white" 
                          style={{ fontWeight: 700, fontSize: '0.7rem' }}
                        >
                          {c.user?.name?.charAt(0) || c.author?.name?.charAt(0) || '?'}
                        </CAvatar>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-high)' }}>
                          {c.user?.name || c.author?.name || 'Unknown'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-low)', marginLeft: 'auto' }}>
                          {formatDate(c.created_at)}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '0.85rem', color: 'var(--text-med)', lineHeight: 1.5,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        marginBottom: c.attachments?.length ? 8 : 0,
                      }}>
                        {c.content}
                      </div>
                      {/* Display existing attachments if backend provides them */}
                      {c.attachments && c.attachments.length > 0 && (
                        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {c.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                fontSize: '0.7rem', color: 'var(--accent)',
                                background: 'rgba(var(--accent-rgb), 0.08)',
                                padding: '2px 8px', borderRadius: 12,
                                textDecoration: 'none',
                              }}
                            >
                              <CIcon icon={cilPlus} size="sm" />
                              {att.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Comment with Drag & Drop and File Attachments */}
                <div
                  className={`position-relative ${dragActive ? 'bg-light border-primary' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  style={{
                    border: dragActive ? '2px dashed var(--cui-primary)' : '2px dashed var(--border-default)',
                    borderRadius: 8,
                    transition: 'all 0.2s',
                    marginBottom: 8,
                  }}
                >
                  <CFormTextarea
                    size="sm"
                    rows={2}
                    placeholder="Write a comment... You can also drag & drop files here."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="border-0"
                    style={{
                      fontSize: '0.85rem', resize: 'vertical',
                      background: 'transparent',
                    }}
                  />
                  <div className="d-flex justify-content-between align-items-center p-2 border-top">
                    <div>
                      <CButton
                        color="secondary"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current.click()}
                      >
                        <CIcon icon={cilCloudUpload} className="me-1" />
                        Attach files
                      </CButton>
                      <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileSelect(e.target.files)}
                        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,.zip,.rar"
                      />
                    </div>
                    <CButton
                      color="primary"
                      size="sm"
                      disabled={posting || (!comment.trim() && selectedFiles.length === 0)}
                      onClick={handleAddComment}
                    >
                      {posting ? <CSpinner size="sm" /> : 'Post Comment'}
                    </CButton>
                  </div>
                </div>

                {/* Selected files preview */}
                {selectedFiles.length > 0 && (
                  <div className="mb-3">
                    <div className="small fw-semibold mb-2">Attachments to upload:</div>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="d-flex align-items-center gap-2 bg-body-tertiary rounded-3 p-2"
                          style={{ fontSize: '0.8rem', background: 'var(--surface-bg)' }}
                        >
                          <CIcon icon={cilPlus} />
                          <span className="text-truncate" style={{ maxWidth: '180px' }}>
                            {file.name}
                          </span>
                          <span className="text-muted">({formatFileSize(file.size)})</span>
                          <CButton
                            color="danger"
                            variant="ghost"
                            size="sm"
                            className="p-0"
                            onClick={() => removeFile(idx)}
                          >
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Subtask Modal */}
      <CreateTaskModal
        visible={showCreateSubtask}
        onClose={() => setShowCreateSubtask(false)}
        onCreated={handleSubtaskCreated}
        projectId={task?.project_id}
        members={employees}
        parentTask={task}
        isAdmin={isAdmin}
      />

      {/* Subtask Warning Modal */}
      {showSubtaskWarning && (
        <div style={{ 
          position: 'fixed', inset: 0, zIndex: 1050, 
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          {/* Backdrop */}
          <div 
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} 
            onClick={handleCancelWarning} 
          />
          
          {/* Modal */}
          <div style={{ 
            position: 'relative', 
            background: 'var(--card-bg)', 
            borderRadius: 12, 
            padding: '1.5rem', 
            width: 420, 
            maxWidth: '90vw', 
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-default)',
          }}>
            <h6 style={{ fontWeight: 700, marginBottom: 12, color: 'var(--warning)' }}>
              ⚠️ Incomplete Subtasks
            </h6>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-med)', marginBottom: 16, lineHeight: 1.5 }}>
              This task has <strong>{undoneSubtasks.length}</strong> subtask(s) that aren't done yet.
            </p>
            
            {/* List of undone subtasks */}
            {undoneSubtasks.length > 0 && (
              <div style={{ 
                maxHeight: 150, 
                overflow: 'auto', 
                marginBottom: 16, 
                padding: '8px 12px', 
                background: 'var(--surface-bg)', 
                borderRadius: 6,
                border: '1px solid var(--border-faint)',
              }}>
                {undoneSubtasks.map(st => (
                  <div key={st.id} style={{
                    fontSize: '0.8rem', 
                    padding: '3px 0', 
                    color: 'var(--text-med)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    • {st.title}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelWarning}
                disabled={markingDone}
                style={{
                  padding: '8px 16px', 
                  borderRadius: 6, 
                  fontSize: '0.8rem', 
                  fontWeight: 600,
                  background: 'var(--surface-bg)', 
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-med)', 
                  cursor: markingDone ? 'not-allowed' : 'pointer',
                  opacity: markingDone ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAllDone}
                disabled={markingDone}
                style={{
                  padding: '8px 16px', 
                  borderRadius: 6, 
                  fontSize: '0.8rem', 
                  fontWeight: 600,
                  background: 'var(--success)', 
                  border: 'none',
                  color: 'white', 
                  cursor: markingDone ? 'not-allowed' : 'pointer',
                  opacity: markingDone ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {markingDone && <CSpinner size="sm" color="light" />}
                {markingDone ? 'Marking...' : 'Mark All Done'}
              </button>
              <button
                onClick={handleFinishSubtasksFirst}
                disabled={markingDone}
                style={{
                  padding: '8px 16px', 
                  borderRadius: 6, 
                  fontSize: '0.8rem', 
                  fontWeight: 600,
                  background: 'var(--accent)', 
                  border: 'none',
                  color: 'white', 
                  cursor: markingDone ? 'not-allowed' : 'pointer',
                  opacity: markingDone ? 0.7 : 1,
                }}
              >
                Finish Subtasks First
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TaskDetailSidebar

