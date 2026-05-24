import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CBadge, CSpinner, CAlert, CCard, CCardBody, CCol, CProgress, CRow, CFormTextarea, CButton, CForm } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilArrowLeft, cilCalendar, cilUser, cilBriefcase,
  cilFilter, cilGrid, cilList, cilCheckCircle, cilPeople,
  cilPencil, cilCommentSquare, cilCloudUpload, cilFile, cilTrash,
  cilXCircle, cilWarning, cilChevronBottom, cilChevronTop
} from '@coreui/icons'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../../api'
import AiEstimationCard from '../../../components/project/AiEstimationCard'
import ActivityFeed from '../../../components/dashboard/ActivityFeed'

// Import your custom attachment features (Keep only one copy here)
import { CommentBubble, AttachmentList, FileTypeIcon, formatFileSize as formatAttachmentSize } from '../../../components/comment/AttachmentIcon'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (name) => {
  if (!name || name === 'Unassigned') return 'U'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const getRoleColor = (role, isUnassigned) => {
  if (isUnassigned) return '#e55353'
  switch (role?.toLowerCase()) {
    case 'manager': return '#9333ea'
    case 'developer': return '#3b82f6'
    case 'viewer': return '#9ca3af'
    default: return '#8a93a2'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// Use the imported formatFileSize from AttachmentIcon to avoid duplication
const formatFileSize = formatAttachmentSize

const STATUS_COLORS = {
  todo: 'warning',
  in_progress: 'primary',
  ready_for_review: 'info',
  done: 'success',
  on_hold: 'danger',
}

const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  ready_for_review: 'Ready for Review',
  done: 'Done',
  on_hold: 'On Hold',
}

// ─── Meta Item ────────────────────────────────────────────────────────────────

const MetaItem = ({ icon, label, value, color = 'primary' }) => (
  <div className="meta-item d-flex align-items-center gap-3 px-4 py-3 rounded-3">
    <div
      className={`rounded-circle d-flex align-items-center justify-content-center bg-${color} bg-opacity-10`}
      style={{ width: 38, height: 38, flexShrink: 0 }}
    >
      <CIcon icon={icon} size="sm" className={`text-${color}`} />
    </div>
    <div style={{ minWidth: 0 }}>
      <div
        className="text-uppercase fw-bold mb-1"
        style={{ fontSize: '0.6rem', letterSpacing: '1.5px', color: 'var(--cui-secondary-color)' }}
      >
        {label}
      </div>
      <div className="fw-bold" style={{ fontSize: '0.88rem' }}>
        {value || '—'}
      </div>
    </div>
    <div className="meta-edit-hint ms-auto">
      <CIcon icon={cilPencil} size="sm" />
    </div>
  </div>
)

// ─── Kanban Column ────────────────────────────────────────────────────────────

const KanbanColumn = ({ userId, group, onDragStart, onDragOver, onDragLeave, onDrop }) => {
  const isUnassigned = userId === 'unassigned'
  const roleColor = getRoleColor(group.role, isUnassigned)

  return (
    <div
      className="kanban-user-card p-4"
      style={{ borderTop: `3px solid ${roleColor}` }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div className="d-flex gap-3 align-items-center">
          <div
            className="user-avatar"
            style={{
              background: `${roleColor}18`,
              color: roleColor,
              border: `1.5px solid ${roleColor}40`,
            }}
          >
            {getInitials(group.name)}
            <span className="status-dot" style={{ backgroundColor: roleColor }} />
          </div>
          <div>
            <h5 className="mb-0 fw-bolder" style={{ fontSize: '0.95rem' }}>{group.name}</h5>
            <small
              className="fw-bold text-uppercase"
              style={{ fontSize: '0.6rem', letterSpacing: '1.5px', color: roleColor }}
            >
              {group.role || 'UNASSIGNED'}
            </small>
          </div>
        </div>
        <div
          className="rounded-pill px-3 py-1 fw-bold"
          style={{
            fontSize: '0.7rem',
            background: `${roleColor}18`,
            color: roleColor,
            border: `1px solid ${roleColor}30`,
          }}
        >
          {group.tasks.length} TASKS
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="drop-zone-container d-flex flex-column"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, userId)}
      >
        {group.tasks.length === 0 ? (
          <div className="empty-dropzone">
            <CIcon icon={cilCheckCircle} size="xl" className="mb-2 opacity-25" />
            NO ACTIVE TASKS
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {group.tasks.map(task => (
              <div
                key={task.id}
                className="task-card"
                draggable
                onDragStart={(e) => onDragStart(e, task.id)}
              >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h6 className="fw-bold mb-0" style={{ lineHeight: 1.4, fontSize: '0.875rem', flex: 1 }}>
                    {task.title}
                  </h6>

                  {/* Task Assignee Mini-Avatar */}
                  {task.assignee_name && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ms-2 d-flex align-items-center justify-content-center rounded-circle fw-bold"
                      style={{
                        width: 22,
                        height: 22,
                        fontSize: '0.6rem',
                        background: `${roleColor}25`,
                        border: `1px solid ${roleColor}40`,
                        color: roleColor,
                        flexShrink: 0
                      }}
                      title={`Assigned to ${task.assignee_name}`}
                    >
                      {getInitials(task.assignee_name)}
                    </motion.div>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <CBadge
                    color={
                      task.priority === 'high' ? 'danger' :
                        task.priority === 'low' ? 'success' : 'warning'
                    }
                    shape="rounded-pill"
                    className="px-3 py-1 text-uppercase fw-bold"
                    style={{ fontSize: '0.6rem', letterSpacing: '1px' }}
                  >
                    {task.priority || 'medium'}
                  </CBadge>
                  <small
                    className="d-flex align-items-center gap-1 fw-bold"
                    style={{ fontSize: '0.72rem', color: 'var(--cui-secondary-color)' }}
                  >
                    <CIcon icon={cilCalendar} size="sm" />
                    {formatDate(task.due_date)}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const ProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRole, setSelectedRole] = useState('all')
  const [viewMode, setViewMode] = useState('grid')

  // Comment & file states
  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  // Error state for file validation
  const [fileErrors, setFileErrors] = useState([])

  // Drag assignment states
  const [dragError, setDragError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  // ─── Comment Pagination State ──────────────────────────────────────────────
  const COMMENTS_PER_PAGE = 5
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(COMMENTS_PER_PAGE)
  const [commentsExpanded, setCommentsExpanded] = useState(false)

  const clearErrors = useCallback(() => {
    setError(null)
    setFileErrors([])
    setDragError(null)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    clearErrors()

    try {
      // Project details
      const projectRes = await api.get(`/api/admin/projects/${id}`)
      const projectData = projectRes.data?.data

      if (!projectData) {
        throw new Error('Project data not found in response')
      }

      console.log('Project response:', projectRes.data)
      setProject(projectData)

      // Tasks
      const tasksRes = await api.get(`/api/admin/projects/${id}/tasks`)
      const tasksArray = tasksRes.data?.data?.items || tasksRes.data?.data || tasksRes.data || []

      if (!Array.isArray(tasksArray)) {
        console.warn('Tasks response is not an array:', tasksArray)
        setTasks([])
      } else {
        console.log('Tasks response:', tasksRes.data)
        setTasks(tasksArray)
      }

    } catch (err) {
      console.error('Fetch error:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load project data.'
      setError(errorMessage)
      setProject(null)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [id, clearErrors])

  useEffect(() => {
    if (!id) {
      setError('No project ID provided')
      setLoading(false)
      return
    }

    const timer = window.setTimeout(fetchData, 0)
    return () => window.clearTimeout(timer)
  }, [id, fetchData])

  const { assignedColumns, unassignedColumn } = useMemo(() => {
    if (!project) return {
      assignedColumns: {},
      unassignedColumn: { name: 'Unassigned', tasks: [], role: null },
    }

    const assigned = {}
    const unassigned = { name: 'Unassigned', tasks: [], role: null }

    const members = project.employees || project.members || []

    members.forEach(m => {
      const employeeId = m.employee_id || m.id || m.user_id
      const userName = m.employee?.name || m.name || m.user?.name || 'Unknown'
      const role = m.role || m.employee?.global_role || 'member'

      if (employeeId) {
        assigned[employeeId] = {
          name: userName,
          tasks: [],
          role: role
        }
      }
    })

    tasks.forEach(task => {
      const assigneeId = task.assigned_to
      if (assigneeId && assigned[assigneeId]) {
        assigned[assigneeId].tasks.push({
          ...task,
          assignee_name: assigned[assigneeId].name
        })
      } else {
        unassigned.tasks.push(task)
      }
    })

    return { assignedColumns: assigned, unassignedColumn: unassigned }
  }, [project, tasks])

  const filteredAssigned = useMemo(() => {
    if (selectedRole === 'all') return assignedColumns
    const f = {}
    Object.keys(assignedColumns).forEach(k => {
      if (assignedColumns[k].role?.toLowerCase() === selectedRole) f[k] = assignedColumns[k]
    })
    return f
  }, [assignedColumns, selectedRole])

  const onDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId)
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
    clearErrors()
  }

  const onDragEnd = () => {
    setIsDragging(false)
  }

  const onDragOver = (e) => { 
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    e.currentTarget.classList.add('drag-over') 
  }

  const onDragLeave = (e) => { 
    e.currentTarget.classList.remove('drag-over') 
  }

  const onDrop = async (e, targetUserId) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
    setIsDragging(false)

    const taskId = e.dataTransfer.getData('taskId')
    if (!taskId) {
      setDragError('No task ID found in drag data')
      return
    }

    try {
      setDragError(null)

      if (targetUserId === 'unassigned') {
        await api.patch(`/api/admin/tasks/${taskId}/unassignEmployee`)
      } else {
        await api.patch(`/api/admin/tasks/${taskId}/assignEmployee`, {
          assigned_to: parseInt(targetUserId, 10)
        })
      }

      // Refresh data after successful assignment
      await fetchData()
    } catch (err) {
      console.error('Assignment failed:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to assign task'
      setDragError(errorMessage)
    }
  }

  const handleEstimationRecalculated = (data) => {
    setProject((current) => {
      if (!current) return current
      if (data?.id === current.id) return { ...current, ...data }
      return { ...current, ai_estimation: data }
    })
  }

  // ─── File upload helpers ────────────────────────────────────────────────────
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
      setFileErrors(errors)
      // Auto-clear file errors after 5 seconds
      setTimeout(() => setFileErrors([]), 5000)
    }

    return valid
  }

  const handleFileSelect = (fileList) => {
    clearErrors()
    const newFiles = Array.from(fileList)

    if (newFiles.length === 0) return

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
    clearErrors()

    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const handlePostComment = async () => {
    if (!comment.trim() && selectedFiles.length === 0) return

    setPosting(true)
    clearErrors()

    const formData = new FormData()
    formData.append('content', comment.trim())
    selectedFiles.forEach(file => {
      formData.append('attachments[]', file)
    })

    try {
      const response = await api.post(`/api/admin/projects/${id}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const newComment = response.data?.data || response.data

      if (!newComment) {
        throw new Error('No comment data returned from server')
      }

      setProject(current => ({
        ...current,
        comments: [newComment, ...(current?.comments || [])],
      }))
      setComment('')
      setSelectedFiles([])
      // Reset pagination to show the new comment
      setVisibleCommentsCount(COMMENTS_PER_PAGE)
      setCommentsExpanded(false)
    } catch (err) {
      console.error('Comment post error:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to post comment.'
      setError(errorMessage)
    } finally {
      setPosting(false)
    }
  }

  // ─── Comment Pagination Handlers ────────────────────────────────────────────
  const handleViewMoreComments = () => {
    setVisibleCommentsCount(prev => prev + COMMENTS_PER_PAGE)
  }

  const handleToggleCommentsExpand = () => {
    if (commentsExpanded) {
      setCommentsExpanded(false)
      setVisibleCommentsCount(COMMENTS_PER_PAGE)
    } else {
      setCommentsExpanded(true)
      setVisibleCommentsCount(comments.length)
    }
  }

  // ─── Error Display Component ────────────────────────────────────────────────
  const ErrorAlert = ({ message, onDismiss }) => (
    <CAlert color="danger" className="d-flex align-items-center gap-2 mb-3">
      <CIcon icon={cilXCircle} />
      <div className="flex-grow-1">{message}</div>
      {onDismiss && (
        <CButton color="danger" variant="ghost" size="sm" onClick={onDismiss}>
          <CIcon icon={cilXCircle} size="sm" />
        </CButton>
      )}
    </CAlert>
  )

  if (loading) return <div className="text-center py-5"><CSpinner color="primary" /></div>
  if (error && !project) return (
    <div className="py-5">
      <ErrorAlert message={error} onDismiss={() => { clearErrors(); navigate('/admin/projects') }} />
      <div className="text-center">
        <CButton color="primary" onClick={() => navigate('/admin/projects')}>
          <CIcon icon={cilArrowLeft} className="me-2" />
          Back to Projects
        </CButton>
      </div>
    </div>
  )
  if (!project) return null

  const completedTasks = tasks.filter(task => task.status === 'done').length
  const readyTasks = tasks.filter(task => task.status === 'ready_for_review').length
  const overdueTasks = tasks.filter(task => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done').length
  const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0
  const members = project.employees || project.members || []

  // Normalize comments to ensure attachments have proper fields for FileTypeIcon
  const comments = (project.comments || []).map(comment => ({
    ...comment,
    // Normalize attachments to ensure they have the fields FileTypeIcon expects
    attachments: (comment.attachments || []).map(att => ({
      ...att,
      id: att.id || att.attachment_id || `att-${Math.random().toString(36).substr(2, 9)}`,
      file_name: att.file_name || att.name || att.filename || 'Attachment',
      mime_type: att.mime_type || att.type || att.content_type || '',
      file_size: att.file_size || att.size || att.fileSize || 0,
      file_path: att.file_path || att.path || att.url || att.link || '#',
      url: att.url || att.file_path || att.path || att.link || '#',
    }))
  }))

  // ─── Comment Pagination Logic ─────────────────────────────────────────────
  const totalComments = comments.length
  const hasMoreComments = totalComments > visibleCommentsCount
  const visibleComments = comments.slice(0, visibleCommentsCount)
  const remainingComments = totalComments - visibleCommentsCount

  const files = project.files || project.documents || project.attachments || []
  const activity = project.recent_activity || project.activity || comments

  return (
    <div className="project-detail-wrapper">

      {/* Back */}
      <div
        className="d-inline-flex align-items-center gap-2 mb-4 fw-semibold"
        style={{ cursor: 'pointer', color: 'var(--cui-secondary-color)', fontSize: 14 }}
        onClick={() => navigate('/admin/projects')}
      >
        <CIcon icon={cilArrowLeft} size="sm" /> Back to Projects
      </div>

      {/* Title */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <h1 className="fw-black mb-0" style={{ letterSpacing: '-0.5px', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
          {project.name}
        </h1>
        <CBadge color={STATUS_COLORS[project.status]} className="px-3 py-2" style={{ fontSize: '0.75rem' }}>
          {STATUS_LABELS[project.status]}
        </CBadge>
      </div>

      {/* Global Error Display */}
      {error && <ErrorAlert message={error} onDismiss={clearErrors} />}

      {/* Drag Assignment Error */}
      {dragError && (
        <CAlert color="warning" className="d-flex align-items-center gap-2 mb-3">
          <CIcon icon={cilWarning} />
          {dragError}
          <CButton color="warning" variant="ghost" size="sm" className="ms-auto" onClick={() => setDragError(null)}>
            <CIcon icon={cilXCircle} size="sm" />
          </CButton>
        </CAlert>
      )}

      {/* Meta strip */}
      <div
        className="d-flex flex-wrap gap-1 rounded-3 p-2 mb-5"
        style={{
          background: 'var(--cui-secondary-bg)',
          border: '1px solid var(--cui-border-color-translucent)',
        }}
      >
        <MetaItem icon={cilUser} label="Client" value={project.client?.name} color="primary" />
        <div className="vr my-2" style={{ opacity: 0.12 }} />
        <MetaItem icon={cilBriefcase} label="Category" value={project.project_type?.name} color="info" />
        <div className="vr my-2" style={{ opacity: 0.12 }} />
        <MetaItem icon={cilCalendar} label="Start Date" value={formatDate(project.start_date)} color="success" />
        <div className="vr my-2" style={{ opacity: 0.12 }} />
        <MetaItem icon={cilCalendar} label="Deadline" value={formatDate(project.end_date)} color="warning" />
        <div className="vr my-2" style={{ opacity: 0.12 }} />
        <MetaItem icon={cilPeople} label="Team" value={`${(project.employees?.length || project.members?.length || 0)} members`} color="primary" />
        <div className="vr my-2" style={{ opacity: 0.12 }} />
        <MetaItem icon={cilCheckCircle} label="Tasks" value={`${tasks.length} total`} color="success" />
      </div>

      <AiEstimationCard project={project} onRecalculated={handleEstimationRecalculated} />

      <CRow className="g-4 mb-5">
        <CCol md={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="small text-body-secondary mb-1">Progress</div>
              <div className="fs-3 fw-bold mb-2">{progress}%</div>
              <CProgress value={progress} color={progress >= 80 ? 'success' : 'primary'} />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="small text-body-secondary mb-1">Ready for Review</div>
              <div className="fs-3 fw-bold text-info">{readyTasks}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="small text-body-secondary mb-1">Overdue Tasks</div>
              <div className="fs-3 fw-bold text-danger">{overdueTasks}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="small text-body-secondary mb-1">Files</div>
              <div className="fs-3 fw-bold text-success">{files.length}</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="g-4 mb-5">
        <CCol lg={4}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <h6 className="fw-bold mb-3">Members</h6>
              {members.length === 0 ? (
                <div className="text-body-secondary small">No members assigned.</div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {members.slice(0, 6).map(member => {
                    const name = member.employee?.name || member.user?.name || member.name || 'Member'
                    return (
                      <div key={member.id || name} className="d-flex justify-content-between align-items-center rounded-3 p-2 bg-body-tertiary">
                        <span className="fw-semibold small">{name}</span>
                        <CBadge color="secondary">{member.role || member.employee?.global_role || 'member'}</CBadge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={4}>
          <ActivityFeed title="Recent Activity" items={activity} emptyText="No activity yet." />
        </CCol>
        <CCol lg={4}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex align-items-center gap-2 mb-3">
                <CIcon icon={cilCommentSquare} className="text-primary" />
                <h6 className="fw-bold mb-0">Discussion</h6>
                {totalComments > 0 && (
                  <CBadge color="primary" shape="rounded-pill" className="ms-2">
                    {totalComments}
                  </CBadge>
                )}
              </div>

              {/* Comment Form with Drag & Drop and File Attachments */}
              <CForm>
                {/* File validation errors */}
                {fileErrors.length > 0 && (
                  <div className="mb-2">
                    {fileErrors.map((err, idx) => (
                      <CAlert key={idx} color="warning" className="py-1 px-2 mb-1 d-flex align-items-center gap-2">
                        <CIcon icon={cilWarning} size="sm" />
                        <small>{err}</small>
                      </CAlert>
                    ))}
                  </div>
                )}

                {/* Drag & drop zone */}
                <div
                  className={`position-relative mb-3 ${dragActive ? 'bg-light border-primary' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  style={{
                    border: dragActive ? '2px dashed var(--cui-primary)' : '2px dashed var(--cui-border-color)',
                    borderRadius: '0.5rem',
                    transition: 'all 0.2s',
                  }}
                >
                  <CFormTextarea
                    rows={3}
                    placeholder="Write a comment... You can also drag & drop files here."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="border-0"
                    style={{ background: 'transparent' }}
                  />
                  <div className="d-flex justify-content-between align-items-center p-2 border-top">
                    <div>
                      <CButton
                        color="secondary"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={posting}
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
                      onClick={handlePostComment}
                    >
                      {posting ? <CSpinner size="sm" /> : 'Post'}
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
                          style={{ fontSize: '0.8rem' }}
                        >
                          <FileTypeIcon mimeType={file.type} fileName={file.name} size={20} />
                          <span className="text-truncate" style={{ maxWidth: '180px' }}>{file.name}</span>
                          <span className="text-muted">({formatFileSize(file.size)})</span>
                          <CButton
                            color="danger"
                            variant="ghost"
                            size="sm"
                            className="p-0"
                            onClick={() => removeFile(idx)}
                            disabled={posting}
                          >
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CForm>

              {/* Existing comments with pagination - ONLY this section expands */}
              {comments.length === 0 ? (
                <div className="text-body-secondary small py-3 text-center">No comments yet.</div>
              ) : (
                <>
                  <div className="d-flex flex-column gap-3">
                    {visibleComments.map((item) => (
                      <CommentBubble key={item.id || `comment-${Math.random().toString(36).substr(2, 9)}`} comment={item} />
                    ))}
                  </div>

                  {/* Pagination Controls - Only for comments */}
                  {totalComments > COMMENTS_PER_PAGE && (
                    <div className="d-flex flex-column align-items-center gap-2 mt-3 pt-3 border-top">
                      <div className="small text-body-secondary">
                        Showing {visibleComments.length} of {totalComments} comments
                      </div>
                      <div className="d-flex gap-2">
                        {!commentsExpanded && hasMoreComments && (
                          <CButton
                            color="primary"
                            variant="outline"
                            size="sm"
                            onClick={handleViewMoreComments}
                          >
                            <CIcon icon={cilChevronBottom} className="me-1" />
                            View More ({remainingComments} remaining)
                          </CButton>
                        )}
                        <CButton
                          color="secondary"
                          variant="outline"
                          size="sm"
                          onClick={handleToggleCommentsExpand}
                        >
                          <CIcon icon={commentsExpanded ? cilChevronTop : cilChevronBottom} className="me-1" />
                          {commentsExpanded ? 'Show Less' : 'Show All'}
                        </CButton>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Controls */}
      <div className="d-flex justify-content-end align-items-center mb-4 gap-3">
        <div className="border rounded p-1 d-flex gap-1" style={{ background: 'var(--cui-secondary-bg)' }}>
          <button className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
            <CIcon icon={cilGrid} />
          </button>
          <button className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}>
            <CIcon icon={cilList} />
          </button>
        </div>
        <div className="role-filter-group">
          <div className="filter-label"><CIcon icon={cilFilter} size="sm" /> ROLE</div>
          {['all', 'manager', 'developer', 'viewer'].map(role => (
            <button
              key={role}
              className={`filter-btn ${selectedRole === role ? 'active' : ''}`}
              onClick={() => setSelectedRole(role)}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* ── Two-panel layout ── */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* LEFT: Assigned columns */}
        <div
          className={`d-flex gap-4 ${viewMode === 'kanban' ? 'kanban-scroll-container flex-nowrap' : 'flex-wrap'}`}
          style={{ flex: 1, minWidth: 0, alignItems: 'flex-start' }}
        >
          <AnimatePresence mode="popLayout">
            {Object.entries(filteredAssigned).map(([userId, group]) => (
              <motion.div
                layout
                key={userId}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                style={{
                  width: viewMode === 'kanban' ? '300px' : 'calc(50% - 8px)',
                  minWidth: '260px',
                  flexShrink: 0,
                }}
              >
                <KanbanColumn
                  userId={userId}
                  group={group}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {Object.keys(filteredAssigned).length === 0 && (
            <div className="text-center text-body-secondary fw-semibold py-5 w-100" style={{ fontSize: 13 }}>
              No members match this role filter.
            </div>
          )}
        </div>

        {/* RIGHT: Fixed unassigned column */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
            position: 'sticky',
            top: 80,
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
            scrollbarWidth: 'thin',
          }}
        >
          <KanbanColumn
            userId="unassigned"
            group={unassignedColumn}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          />
        </div>

      </div>
    </div>
  )
}

export default ProjectDetail