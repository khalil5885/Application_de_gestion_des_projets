import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  CAlert,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormTextarea,
  CAvatar,
  CBadge,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCommentSquare,
  cilCalendar,
  cilCheck,
  cilMediaPlay,
  cilX,
  cilArrowLeft,
  cilTask,
  cilCloudUpload,
  cilFile,
  cilTrash,
  cilImage,
  cilSpreadsheet,
  cilDescription,
  cilDataTransferDown,
} from '@coreui/icons'
import ProgressBar from './ProgressBar'
import RecursiveSubtaskTree from './RecursiveSubtaskTree'
import { formatDueDate, calculateProgress } from './utils/taskHelpers'
import RequestExtensionForm from '../../../components/request/RequestExtensionForm'
import api from '../../../api'
import PriorityDot from './PriorityDot'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const updateSubtaskStatusInTree = (children, taskId, newStatus) =>
  children.map((child) => {
    if (child.id === taskId) return { ...child, status: newStatus }
    if (child.children?.length)
      return { ...child, children: updateSubtaskStatusInTree(child.children, taskId, newStatus) }
    return child
  })

const findSubtaskInTree = (children, taskId) => {
  for (const child of children) {
    if (child.id === taskId) return child
    if (child.children?.length) {
      const found = findSubtaskInTree(child.children, taskId)
      if (found) return found
    }
  }
  return null
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const isOverdue = (d, status) => d && status !== 'done' && new Date(d) < new Date()

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// ─── File Type Helpers ───────────────────────────────────────────────────────

const getFileIcon = (mimeType) => {
  if (mimeType?.startsWith('image/')) return cilImage
  if (mimeType?.includes('pdf')) return cilDescription
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel') || mimeType?.includes('csv')) return cilSpreadsheet
  if (mimeType?.includes('word') || mimeType?.includes('document')) return cilDescription
  if (mimeType?.includes('zip') || mimeType?.includes('rar') || mimeType?.includes('archive')) return cilFile
  return cilFile
}

const isImageFile = (mimeType) => mimeType?.startsWith('image/')

// ─── Fetch the full ancestor chain using parent_id ────────────────────────────
const fetchAncestorChain = async (task) => {
  const ancestors = []
  let currentParentId = task?.parent_id
  const seen = new Set()

  while (currentParentId && !seen.has(currentParentId)) {
    seen.add(currentParentId)
    try {
      const res = await api.get(`/api/employee/tasks/${currentParentId}`)
      const parent = res.data?.data || res.data
      ancestors.unshift(parent)
      currentParentId = parent?.parent_id
    } catch {
      break
    }
  }
  return ancestors
}

// ─── Status / Priority configs ────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'todo',             label: 'To Do',            color: '#8a93a2', bg: 'rgba(138,147,162,0.1)' },
  { value: 'in_progress',      label: 'In Progress',      color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
  { value: 'on_hold',          label: 'On Hold',          color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  { value: 'ready_for_review', label: 'Ready for Review', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)'  },
  { value: 'done',             label: 'Done',             color: '#22c55e', bg: 'rgba(34,197,94,0.1)'   },
]

const PRIORITY_CONFIG = {
  low:    { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  label: 'Low'    },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', label: 'Medium' },
  high:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  label: 'High'   },
  urgent: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  label: 'Urgent' },
}

// ─── Small UI pieces ──────────────────────────────────────────────────────────

const InlineStatusBadge = ({ status }) => {
  const cfg = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 6,
      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

const Breadcrumb = ({ ancestors, currentTitle, onNavigateToAncestor }) => {
  if (!ancestors.length) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: '0.75rem', marginBottom: 12, flexWrap: 'wrap',
    }}>
      {ancestors.map((ancestor, idx) => (
        <React.Fragment key={ancestor.id}>
          <button
            onClick={() => onNavigateToAncestor(ancestor)}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: 'var(--cui-primary)', fontWeight: 500,
              cursor: 'pointer', fontSize: '0.75rem',
            }}
          >
            {ancestor.title}
          </button>
          <span style={{ color: 'var(--cui-border-color)' }}>/</span>
        </React.Fragment>
      ))}
      <span style={{ fontWeight: 700, color: 'var(--cui-body-color)', fontSize: '0.75rem' }}>
        {currentTitle}
      </span>
    </div>
  )
}

const ParentTaskCard = ({ parent, onNavigate }) => {
  if (!parent) return null
  return (
    <div
      onClick={onNavigate}
      style={{
        padding: '10px 12px', borderRadius: 8,
        background: 'rgba(14,165,233,0.08)',
        border: '1px solid rgba(14,165,233,0.25)',
        marginBottom: '1.25rem', cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0ea5e9', marginBottom: 4 }}>
        Parent Task
      </div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--cui-body-color)' }}>
        {parent.title}
      </div>
      {parent.description && (
        <div style={{ fontSize: '0.75rem', color: 'var(--cui-secondary-color)', marginTop: 4, lineHeight: 1.4 }}>
          {parent.description.length > 80 ? parent.description.slice(0, 80) + '...' : parent.description}
        </div>
      )}
    </div>
  )
}

// ─── Attachment Item Component ──────────────────────────────────────────────

const AttachmentItem = ({ attachment }) => {
  const icon = getFileIcon(attachment.mime_type)
  const isImage = isImageFile(attachment.mime_type)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {isImage ? (
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-decoration-none"
          title={attachment.file_name}
        >
          <img
            src={attachment.url}
            alt={attachment.file_name}
            style={{
              maxWidth: '140px',
              maxHeight: '100px',
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid var(--cui-border-color)',
              cursor: 'pointer',
            }}
          />
        </a>
      ) : (
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          download={attachment.file_name}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'var(--cui-body-bg)',
            border: '1px solid var(--cui-border-color)',
            textDecoration: 'none',
            color: 'var(--cui-body-color)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'background 0.15s, border-color 0.15s',
            maxWidth: '200px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--cui-secondary-bg)'
            e.currentTarget.style.borderColor = 'var(--cui-primary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--cui-body-bg)'
            e.currentTarget.style.borderColor = 'var(--cui-border-color)'
          }}
        >
          <CIcon icon={icon} size="sm" style={{ color: 'var(--cui-primary)', flexShrink: 0 }} />
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '120px',
          }}>
            {attachment.file_name}
          </span>
          <CIcon icon={cilDataTransferDown} size="sm" style={{ color: 'var(--cui-secondary-color)', flexShrink: 0 }} />
        </a>
      )}
      <span style={{ fontSize: '0.7rem', color: 'var(--cui-secondary-color)' }}>
        {formatFileSize(attachment.file_size)}
      </span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TaskDetailModal = ({ visible, task, onClose, onStatusChange, onMarkReady, onTaskUpdated }) => {
  const handleSafeClose = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    onClose()
  }

  const [localTask, setLocalTask] = useState(task)
  const [comment, setComment] = useState('')
  const [actionFeedback, setActionFeedback] = useState(null)

  const [ancestors, setAncestors] = useState([])
  const [ancestorsLoading, setAncestorsLoading] = useState(false)

  const [selectedSubtask, setSelectedSubtask] = useState(null)
  const [subtaskModalVisible, setSubtaskModalVisible] = useState(false)

  // File upload states
  const [selectedFiles, setSelectedFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [postingComment, setPostingComment] = useState(false)
  const fileInputRef = useRef(null)

  // Incomplete subtask warning modal state
  const [incompleteWarning, setIncompleteWarning] = useState({
    show: false,
    taskId: null,
    taskTitle: '',
    incompleteSubtasks: [],
  })
  const [markingAllDone, setMarkingAllDone] = useState(false)

  // ── Reset & fetch ancestors whenever the task changes ──────────────────────
  useEffect(() => {
    setLocalTask(task)
    setActionFeedback(null)
    setAncestors([])
    setSelectedFiles([])
    setComment('')

    if (!task?.parent_id) return

    setAncestorsLoading(true)
    fetchAncestorChain(task)
      .then(setAncestors)
      .finally(() => setAncestorsLoading(false))
  }, [task])

  if (!localTask) return null

  const dueInfo = formatDueDate(localTask.due_date)
  const progress = calculateProgress(localTask)
  const overdue = isOverdue(localTask.due_date, localTask.status)
  const pCfg = PRIORITY_CONFIG[localTask.priority] || PRIORITY_CONFIG.medium
  const isSubtask = !!localTask.parent_id
  const directParent = ancestors.length ? ancestors[ancestors.length - 1] : null

  // Helper to find a task by ID in the local tree (including the root)
  const findTaskById = (taskId, root = localTask) => {
    if (root.id === taskId) return root
    if (root.children) {
      for (const child of root.children) {
        const found = findTaskById(taskId, child)
        if (found) return found
      }
    }
    return null
  }

  // ── Wrapper for status changes with incomplete subtasks check ──────────────
  const handleStatusChange = async (taskId, newStatus) => {
    if (newStatus === 'done') {
      const taskToUpdate = findTaskById(taskId)
      if (taskToUpdate && taskToUpdate.children?.length > 0) {
        const incomplete = taskToUpdate.children.filter(child => child.status !== 'done')
        if (incomplete.length > 0) {
          setIncompleteWarning({
            show: true,
            taskId,
            taskTitle: taskToUpdate.title,
            incompleteSubtasks: incomplete,
          })
          return
        }
      }
    }
    onStatusChange?.(taskId, newStatus)
  }

  // Recursively mark all incomplete subtasks as done, then mark parent
  const handleMarkAllDone = async () => {
    const { taskId, incompleteSubtasks } = incompleteWarning
    setMarkingAllDone(true)
    setIncompleteWarning(prev => ({ ...prev, show: false }))
    try {
      for (const subtask of incompleteSubtasks) {
        await onStatusChange?.(subtask.id, 'done')
      }
      await onStatusChange?.(taskId, 'done')
      onTaskUpdated?.()
      setActionFeedback({ type: 'success', message: 'All subtasks and parent task marked as done.' })
      setTimeout(() => setActionFeedback(null), 3000)
    } catch (err) {
      setActionFeedback({ type: 'danger', message: 'Failed to mark all done. Please try again.' })
    } finally {
      setMarkingAllDone(false)
    }
  }

  // ── File Upload Helpers ──────────────────────────────────────────────────
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
      setActionFeedback({ type: 'danger', message: errors.join(' ') })
      setTimeout(() => setActionFeedback(null), 5000)
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

  // ── Comment Handlers ─────────────────────────────────────────────────────
  const handleAddComment = async () => {
    if (!comment.trim() && selectedFiles.length === 0) return

    setPostingComment(true)
    setActionFeedback(null)

    const formData = new FormData()
    formData.append('content', comment.trim() || ' ')
    if (selectedFiles.length > 0) {
      selectedFiles.forEach(file => {
        formData.append('attachments[]', file)
      })
    }

    try {
      const res = await api.post(`/api/employee/tasks/${localTask.id}/comments`, formData)
      const newComment = res.data?.data || res.data
      const safe = newComment?.user ? newComment : { ...newComment, user: { name: 'You' } }
      setLocalTask(prev => ({ ...prev, comments: [...(prev.comments || []), safe] }))
      setComment('')
      setSelectedFiles([])
    } catch (err) {
      console.error('Comment error:', err)
      setActionFeedback({
        type: 'danger',
        message: err.response?.data?.message || err.response?.data?.error || 'Failed to add comment.'
      })
      setTimeout(() => setActionFeedback(null), 5000)
    } finally {
      setPostingComment(false)
    }
  }

  const handleSubtaskStatusChange = async (subtaskId, newStatus) => {
    setLocalTask(prev => ({
      ...prev,
      children: updateSubtaskStatusInTree(prev.children || [], subtaskId, newStatus),
    }))
    if (selectedSubtask?.id === subtaskId) {
      setSelectedSubtask(prev => ({ ...prev, status: newStatus }))
    }

    if (newStatus === 'in_progress') {
      try {
        let subtask = findSubtaskInTree(localTask.children || [], subtaskId)
        if (!subtask && selectedSubtask?.id === subtaskId) subtask = selectedSubtask
        if (!subtask) {
          const res = await api.get(`/api/employee/tasks/${subtaskId}`)
          subtask = res.data?.data || res.data
        }

        const ancestors = await fetchAncestorChain(subtask)
        const skipStatuses = ['done', 'in_progress', 'ready_for_review']

        for (const ancestor of ancestors) {
          if (skipStatuses.includes(ancestor.status)) continue
          await api.patch(`/api/employee/tasks/${ancestor.id}`, { status: 'in_progress' })
        }

        onTaskUpdated?.()
        setActionFeedback({ type: 'success', message: 'Parent tasks updated to In Progress.' })
        setTimeout(() => setActionFeedback(null), 3000)
      } catch (err) {
        setActionFeedback({
          type: 'danger',
          message: err.message || 'Failed to update parent tasks. Please try again.',
        })
        console.error('Ancestor update error:', err)
      }
    }

    onStatusChange?.(subtaskId, newStatus)
  }

  const handleSubtaskClick = (subtask) => {
    const fresh = findSubtaskInTree(localTask.children || [], subtask.id) || subtask
    setSelectedSubtask(fresh)
    setSubtaskModalVisible(true)
  }

  const handleCancelReview = () => {
    handleStatusChange(localTask.id, 'in_progress')
  }

  const handleNavigateToAncestor = (ancestorTask) => {
    if (ancestorTask.id === directParent?.id) {
      handleSafeClose()
      return
    }
    handleSafeClose()
  }

  return (
    <>
      <CModal
        visible={visible}
        onClose={handleSafeClose}
        size="lg"
        backdrop={isSubtask ? true : 'static'}
        className="task-detail-modal"
      >
        <CModalHeader className="border-bottom-0 pb-0" onClose={handleSafeClose} style={{ alignItems: 'center' }}>
          <div className="d-flex align-items-center gap-2 flex-grow-1">
            {isSubtask && (
              <button
                onClick={handleSafeClose}
                title="Back to parent task"
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--cui-primary)', borderRadius: 6, padding: '4px 6px',
                  display: 'flex', alignItems: 'center', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--cui-secondary-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <CIcon icon={cilArrowLeft} />
              </button>
            )}
            <CIcon icon={cilTask} style={{ color: 'var(--cui-primary)', flexShrink: 0 }} />
            <CModalTitle className="fs-5 fw-bold mb-0">
              {isSubtask ? 'Subtask Details' : 'Task Details'}
            </CModalTitle>
          </div>
        </CModalHeader>

        <CModalBody className="pt-2">
          {actionFeedback && (
            <CAlert color={actionFeedback.type} className="py-2 small" dismissible onClose={() => setActionFeedback(null)}>
              {actionFeedback.message}
            </CAlert>
          )}

          {ancestorsLoading && (
            <div className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: '0.75rem', color: 'var(--cui-secondary-color)' }}>
              <CSpinner size="sm" /> Loading ancestry…
            </div>
          )}
          {!ancestorsLoading && ancestors.length > 0 && (
            <Breadcrumb
              ancestors={ancestors}
              currentTitle={localTask.title}
              onNavigateToAncestor={handleNavigateToAncestor}
            />
          )}

          {!ancestorsLoading && directParent && (
            <ParentTaskCard
              parent={directParent}
              onNavigate={handleSafeClose}
            />
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <h5 style={{
              fontSize: '1.1rem', fontWeight: 700, color: 'var(--cui-body-color)',
              lineHeight: 1.3, marginBottom: 8, wordBreak: 'break-word',
            }}>
              {localTask.title}
            </h5>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <InlineStatusBadge status={localTask.status} />
              <span style={{
                fontSize: '0.75rem', fontWeight: 600,
                background: pCfg.bg, color: pCfg.color,
                border: `1px solid ${pCfg.border}`,
                borderRadius: 6, padding: '2px 8px',
              }}>
                {pCfg.label} Priority
              </span>
              {overdue && <CBadge color="danger" style={{ fontSize: '0.7rem' }}>Overdue</CBadge>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.25rem' }}>
            {[
              { label: 'Created',  value: formatDate(localTask.created_at), warn: false },
              { label: 'Due Date', value: formatDate(localTask.due_date),   warn: overdue },
            ].map(({ label, value, warn }) => (
              <div key={label} style={{
                padding: '10px 12px', borderRadius: 8,
                background: warn ? 'rgba(239,68,68,0.08)' : 'var(--cui-secondary-bg)',
                border: `1px solid ${warn ? 'rgba(239,68,68,0.3)' : 'var(--cui-border-color)'}`,
              }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--cui-secondary-color)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                  {label}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: warn ? '#ef4444' : 'var(--cui-body-color)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CIcon icon={cilCalendar} size="sm" style={{ color: warn ? '#ef4444' : 'var(--cui-primary)' }} />
                  {value}
                </div>
              </div>
            ))}
          </div>

          {localTask.assignee && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--cui-secondary-color)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                Assignee
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8,
                background: 'var(--cui-secondary-bg)', border: '1px solid var(--cui-border-color)',
              }}>
                <CAvatar size="sm" color="primary" textColor="white" style={{ fontWeight: 700 }}>
                  {localTask.assignee.name?.charAt(0)}
                </CAvatar>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{localTask.assignee.name}</div>
                  {localTask.assignee.email && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--cui-secondary-color)' }}>
                      {localTask.assignee.email}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {localTask.description && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--cui-secondary-color)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                Description
              </div>
              <div style={{
                fontSize: '0.85rem', color: 'var(--cui-secondary-color)', lineHeight: 1.6,
                padding: '12px', borderRadius: 8,
                background: 'var(--cui-secondary-bg)', border: '1px solid var(--cui-border-color)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {localTask.description}
              </div>
            </div>
          )}

          {localTask.children?.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--cui-secondary-color)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                  Subtasks
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--cui-secondary-color)' }}>
                  {localTask.children.filter(c => c.status === 'done').length}/{localTask.children.length} completed
                </span>
              </div>
              <ProgressBar progress={progress} height={4} />
              <div style={{ marginTop: 12 }}>
                <RecursiveSubtaskTree
                  tasks={localTask.children}
                  onStatusChange={handleSubtaskStatusChange}
                  onSubtaskClick={handleSubtaskClick}
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--cui-secondary-color)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Deadline Extension
            </div>
            <RequestExtensionForm compact requestableId={localTask.id} requestableType="task" currentDeadline={localTask.due_date} />
          </div>

          {/* ─── COMMENTS SECTION WITH ATTACHMENTS ─────────────────────────── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <CIcon icon={cilCommentSquare} size="sm" style={{ color: 'var(--cui-primary)' }} />
              <div style={{ fontSize: '0.65rem', color: 'var(--cui-secondary-color)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                Comments
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--cui-secondary-color)', background: 'var(--cui-secondary-bg)', padding: '1px 6px', borderRadius: 10 }}>
                {localTask.comments?.length || 0}
              </span>
            </div>

            {/* Comments List */}
            <div className="d-flex flex-column gap-2 mb-3">
              {!localTask.comments?.length && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--cui-secondary-color)', fontSize: '0.85rem' }}>
                  No comments yet. Be the first to comment.
                </div>
              )}
              {(localTask.comments || []).filter(Boolean).map((c, idx) => (
                <div key={c.id || idx} style={{
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--cui-secondary-bg)', border: '1px solid var(--cui-border-color)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <CAvatar size="sm" color="secondary" textColor="white" style={{ fontSize: '0.7rem' }}>
                      {(c.user?.name || 'U').charAt(0)}
                    </CAvatar>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.user?.name || 'Unknown User'}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--cui-secondary-color)', marginLeft: 'auto' }}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--cui-secondary-color)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {c.content || c.body || ''}
                  </div>

                  {/* ✅ ATTACHMENTS — clickable with file type icons */}
                  {c.attachments && c.attachments.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{
                        fontSize: '0.65rem',
                        color: 'var(--cui-secondary-color)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontWeight: 700,
                        marginBottom: 8,
                      }}>
                        Attachments
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {c.attachments.map((att, i) => (
                          <AttachmentItem key={i} attachment={att} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Comment Input with File Upload */}
            <div
              style={{
                border: dragActive ? '2px dashed var(--cui-primary)' : '1px solid var(--cui-border-color)',
                borderRadius: 8,
                padding: '8px',
                background: dragActive ? 'rgba(59,130,246,0.05)' : 'var(--cui-body-bg)',
                transition: 'all 0.2s',
              }}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <CFormTextarea
                placeholder="Write a comment... Drag & drop files here or use the attach button."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="shadow-none border-0"
                style={{ fontSize: '0.85rem', background: 'transparent', resize: 'none' }}
              />

              {/* Selected files preview */}
              {selectedFiles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 8 }}>
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: 'var(--cui-secondary-bg)',
                        border: '1px solid var(--cui-border-color)',
                        fontSize: '0.75rem',
                      }}
                    >
                      <CIcon icon={getFileIcon(file.type)} size="sm" />
                      <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </span>
                      <span style={{ color: 'var(--cui-secondary-color)' }}>({formatFileSize(file.size)})</span>
                      <button
                        onClick={() => removeFile(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <CIcon icon={cilTrash} size="sm" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <div>
                  <CButton
                    color="secondary"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CIcon icon={cilCloudUpload} className="me-1" />
                    Attach
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
                  disabled={postingComment || (!comment.trim() && selectedFiles.length === 0)}
                  onClick={handleAddComment}
                >
                  {postingComment ? <CSpinner size="sm" /> : 'Post'}
                </CButton>
              </div>
            </div>
          </div>
        </CModalBody>

        <CModalFooter className="border-top-0">
          <CButton color="secondary" variant="outline" onClick={onClose}>Close</CButton>

          {localTask.status === 'todo' && (
            <CButton color="primary" onClick={() => handleStatusChange(localTask.id, 'in_progress')}>
              <CIcon icon={cilMediaPlay} size="sm" className="me-1" /> Start Task
            </CButton>
          )}

          {localTask.status === 'in_progress' && (
            <CButton color="info" onClick={() => onMarkReady?.(localTask)}>
              <CIcon icon={cilCheck} size="sm" className="me-1" /> Submit for Review
            </CButton>
          )}

          {localTask.status === 'ready_for_review' && (
            <>
              <CBadge color="info" className="py-2 px-3">
                <CIcon icon={cilCheck} size="sm" className="me-1" /> Pending Admin Review
              </CBadge>
              <CButton color="warning" variant="outline" onClick={handleCancelReview}>
                <CIcon icon={cilX} size="sm" className="me-1" /> Cancel Review
              </CButton>
            </>
          )}

          {localTask.status === 'done' && (
            <CBadge color="success" className="py-2 px-3">Completed</CBadge>
          )}

          {!isSubtask && localTask.children?.length > 0 && localTask.status !== 'done' && (
            <CButton color="success" onClick={() => handleStatusChange(localTask.id, 'done')}>
              <CIcon icon={cilCheck} size="sm" className="me-1" /> Mark as Done
            </CButton>
          )}
        </CModalFooter>
      </CModal>

      {/* Incomplete Subtasks Warning Modal */}
      <CModal visible={incompleteWarning.show} onClose={() => setIncompleteWarning(prev => ({ ...prev, show: false }))} size="sm">
        <CModalHeader>
          <CModalTitle>⚠️ Incomplete Subtasks</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Task <strong>"{incompleteWarning.taskTitle}"</strong> has{' '}
            {incompleteWarning.incompleteSubtasks.length} subtask(s) that aren't done yet.
          </p>
          <ul style={{ marginBottom: 0, paddingLeft: '1.5rem' }}>
            {incompleteWarning.incompleteSubtasks.map(sub => (
              <li key={sub.id} style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <PriorityDot priority={sub.priority} size={6} />
                <span>{sub.title}</span>
                {sub.status === 'in_progress' && <CBadge color="primary" size="sm">In Progress</CBadge>}
                {sub.status === 'todo' && <CBadge color="secondary" size="sm">To Do</CBadge>}
              </li>
            ))}
          </ul>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setIncompleteWarning(prev => ({ ...prev, show: false }))}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleMarkAllDone} disabled={markingAllDone}>
            {markingAllDone ? <CSpinner size="sm" /> : 'Mark All Done'}
          </CButton>
          <CButton color="primary" onClick={() => setIncompleteWarning(prev => ({ ...prev, show: false }))}>
            Finish Subtasks First
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Nested subtask modal ── */}
      {selectedSubtask && (
        <TaskDetailModal
          visible={subtaskModalVisible}
          task={selectedSubtask}
          onClose={() => {
            setSubtaskModalVisible(false)
            setSelectedSubtask(null)
          }}
          onStatusChange={handleSubtaskStatusChange}
          onMarkReady={(subtask) => handleSubtaskStatusChange(subtask.id, 'ready_for_review')}
          onTaskUpdated={onTaskUpdated}
        />
      )}
    </>
  )
}

export default TaskDetailModal