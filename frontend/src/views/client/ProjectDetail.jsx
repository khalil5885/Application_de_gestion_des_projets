import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  CAlert, CBadge, CButton, CCard, CCardBody, CCol,
  CFormTextarea, CProgress, CRow, CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilArrowLeft, cilCalendar, cilCommentSquare,
  cilFile, cilTask, cilTrash, cilCloudUpload,
} from '@coreui/icons'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api'
import ActivityFeed from '../../components/dashboard/ActivityFeed'
import AiEstimationCard from '../../components/project/AiEstimationCard'
import { CommentBubble, AttachmentList, FileTypeIcon, formatFileSize } from '../../components/comment/AttachmentIcon.jsx'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeList = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.data)) return value.data
  return []
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const statusColor = (status) => {
  if (status === 'done') return 'success'
  if (status === 'on_hold') return 'secondary'
  if (status === 'in_progress') return 'primary'
  if (status === 'ready_for_review') return 'info'
  return 'warning'
}

// ─── Selected-file chips (before posting) ────────────────────────────────────

const PendingFileChips = ({ files, onRemove }) => {
  if (!files.length) return null
  return (
    <div className="mb-3">
      <div className="small fw-semibold mb-2" style={{ color: 'var(--cui-secondary-color)' }}>
        Ready to upload:
      </div>
      <div className="d-flex flex-wrap gap-2">
        {files.map((file, idx) => (
          <div
            key={idx}
            className="d-flex align-items-center gap-2 rounded-3 p-2"
            style={{ fontSize: '0.8rem', background: 'var(--cui-secondary-bg)', border: '1px solid var(--cui-border-color)' }}
          >
            <FileTypeIcon mimeType={file.type} fileName={file.name} size={18} />
            <span className="text-truncate" style={{ maxWidth: 160 }}>{file.name}</span>
            <span style={{ color: 'var(--cui-secondary-color)', flexShrink: 0 }}>({formatFileSize(file.size)})</span>
            <button
              onClick={() => onRemove(idx)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cui-danger)', padding: 0 }}
            >
              <CIcon icon={cilTrash} size="sm" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const ClientProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [project, setProject]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [comment, setComment]         = useState('')
  const [posting, setPosting]         = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [dragActive, setDragActive]   = useState(false)
  const fileInputRef = useRef(null)

  const fetchProject = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/api/client/projects/${id}`)
      setProject(res.data?.data || res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const t = window.setTimeout(fetchProject, 0)
    return () => window.clearTimeout(t)
  }, [fetchProject])

  const tasks      = useMemo(() => normalizeList(project?.tasks || project?.root_tasks), [project])
  const comments   = useMemo(() => normalizeList(project?.comments), [project])
  const files      = useMemo(() => normalizeList(project?.files || project?.documents || project?.attachments), [project])
  const activity   = useMemo(() => normalizeList(project?.recent_activity || project?.activity), [project])
  const milestones = useMemo(() => normalizeList(project?.milestones || project?.timeline), [project])

  const progress       = Number(project?.progress ?? project?.progress_percentage ?? 0)
  const completedTasks = tasks.filter(t => t.status === 'done').length

  // ── File helpers ─────────────────────────────────────────────────────────

  const validateFiles = (fileList) => {
    const valid = []; const errors = []
    for (const file of fileList) {
      if (file.type.startsWith('video/')) { errors.push(`${file.name}: videos are not allowed.`); continue }
      if (file.size > 10 * 1024 * 1024)  { errors.push(`${file.name}: exceeds 10 MB.`); continue }
      valid.push(file)
    }
    if (errors.length) setError(errors.join(' '))
    return valid
  }

  const handleFileSelect = (fileList) => {
    const valid = validateFiles(Array.from(fileList))
    if (valid.length) setSelectedFiles(prev => [...prev, ...valid])
  }

  const removeFile = (index) => setSelectedFiles(prev => prev.filter((_, i) => i !== index))

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    if (e.dataTransfer.files?.length) handleFileSelect(e.dataTransfer.files)
  }

  // ── Post comment ─────────────────────────────────────────────────────────

  const handleComment = async () => {
    if (!comment.trim() && selectedFiles.length === 0) return
    setPosting(true)
    setError(null)

    const formData = new FormData()
    formData.append('content', comment.trim())
    selectedFiles.forEach(file => formData.append('attachments[]', file))

    try {
      await api.post(`/api/client/projects/${id}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setComment('')
      setSelectedFiles([])
      // Re-fetch so attachments carry server-side URLs
      await fetchProject()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment.')
    } finally {
      setPosting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="text-center py-5">
      <CSpinner color="primary" />
      <div className="small text-body-secondary mt-2">Loading project...</div>
    </div>
  )

  if (error && !project) return <CAlert color="danger">{error}</CAlert>
  if (!project) return null

  return (
    <div className="pb-5">
      <button className="btn btn-link px-0 mb-3 text-decoration-none" onClick={() => navigate('/client/projects')}>
        <CIcon icon={cilArrowLeft} className="me-2" />
        Back to projects
      </button>

      {error && <CAlert color="danger" dismissible onClose={() => setError(null)}>{error}</CAlert>}

      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <h3 className="fw-bold mb-0">{project.name}</h3>
            <CBadge color={statusColor(project.status)}>
              {(project.status || 'active').replaceAll('_', ' ')}
            </CBadge>
          </div>
          <p className="text-body-secondary mb-0">
            {project.description || 'Project progress and delivery details.'}
          </p>
        </div>
        <div className="text-end">
          <div className="small text-body-secondary">Deadline</div>
          <div className="fw-bold">{formatDate(project.end_date || project.deadline)}</div>
        </div>
      </div>

      {/* Stat cards */}
      <CRow className="g-4 mb-4">
        <CCol md={4}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex align-items-center gap-2 mb-3">
                <CIcon icon={cilTask} className="text-primary" />
                <h6 className="fw-bold mb-0">Task Progress</h6>
              </div>
              <div className="d-flex justify-content-between small mb-2">
                <span>{completedTasks}/{tasks.length} completed</span>
                <span className="fw-semibold">{progress}%</span>
              </div>
              <CProgress value={progress} color={progress >= 80 ? 'success' : 'primary'} />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex align-items-center gap-2 mb-3">
                <CIcon icon={cilCalendar} className="text-warning" />
                <h6 className="fw-bold mb-0">Milestones</h6>
              </div>
              <div className="fs-3 fw-bold">{milestones.length}</div>
              <div className="small text-body-secondary">Tracked delivery moments</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex align-items-center gap-2 mb-3">
                <CIcon icon={cilFile} className="text-success" />
                <h6 className="fw-bold mb-0">Documents</h6>
              </div>
              <div className="fs-3 fw-bold">{files.length}</div>
              <div className="small text-body-secondary">Shared files and deliverables</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <AiEstimationCard project={project} showRecalculate={false} />

      <CRow className="g-4">
        <CCol lg={7}>
          <ActivityFeed title="Project Timeline" items={milestones} emptyText="No timeline items yet." />
        </CCol>
        <CCol lg={5}>
          <ActivityFeed title="Recent Activity" items={activity} />
        </CCol>

        {/* Task list */}
        <CCol lg={7}>
          <CCard className="border-0 shadow-sm">
            <CCardBody>
              <h6 className="fw-bold mb-3">Tasks</h6>
              {tasks.length === 0 ? (
                <div className="text-body-secondary small py-4 text-center">No tasks available.</div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {tasks.slice(0, 8).map(task => (
                    <div key={task.id} className="d-flex justify-content-between align-items-center rounded-3 p-3 bg-body-tertiary">
                      <div>
                        <div className="fw-semibold small">{task.title}</div>
                        <div className="text-body-secondary" style={{ fontSize: 12 }}>{formatDate(task.due_date)}</div>
                      </div>
                      <CBadge color={statusColor(task.status)}>
                        {(task.status || 'todo').replaceAll('_', ' ')}
                      </CBadge>
                    </div>
                  ))}
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        {/* Discussion */}
        <CCol lg={5}>
          <CCard className="border-0 shadow-sm">
            <CCardBody>
              <div className="d-flex align-items-center gap-2 mb-3">
                <CIcon icon={cilCommentSquare} className="text-primary" />
                <h6 className="fw-bold mb-0">Discussion</h6>
                <span className="badge bg-secondary ms-1">{comments.length}</span>
              </div>

              {/* Compose box */}
              <div
                onDragEnter={handleDrag} onDragOver={handleDrag}
                onDragLeave={handleDrag} onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragActive ? 'var(--cui-primary)' : 'var(--cui-border-color)'}`,
                  borderRadius: '0.5rem',
                  transition: 'all 0.2s',
                  marginBottom: 8,
                  background: dragActive ? 'rgba(var(--cui-primary-rgb), 0.05)' : 'transparent',
                }}
              >
                <CFormTextarea
                  rows={3}
                  placeholder="Write a project comment… or drag & drop files here."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="border-0"
                  style={{ background: 'transparent' }}
                />
                <div className="d-flex justify-content-between align-items-center p-2 border-top">
                  <CButton color="secondary" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <CIcon icon={cilCloudUpload} className="me-1" /> Attach files
                  </CButton>
                  <input
                    type="file" multiple ref={fileInputRef} style={{ display: 'none' }}
                    onChange={e => handleFileSelect(e.target.files)}
                    accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,.zip,.rar"
                  />
                  <CButton
                    color="primary" size="sm"
                    disabled={posting || (!comment.trim() && selectedFiles.length === 0)}
                    onClick={handleComment}
                  >
                    {posting ? <CSpinner size="sm" /> : 'Post'}
                  </CButton>
                </div>
              </div>

              {/* Pending file chips */}
              <PendingFileChips files={selectedFiles} onRemove={removeFile} />

              {/* Comment list — uses CommentBubble which renders AttachmentList with icons */}
              {comments.length === 0 ? (
                <div className="text-body-secondary small py-3 text-center">No comments yet.</div>
              ) : (
                <div className="d-flex flex-column gap-3 mt-3">
                  {comments.map((item, idx) => (
                    <CommentBubble key={item.id || idx} comment={item} />
                  ))}
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default ClientProjectDetail