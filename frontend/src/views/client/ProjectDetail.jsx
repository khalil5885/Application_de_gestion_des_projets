import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CFormTextarea,
  CProgress,
  CRow,
  CSpinner,
  CForm,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilArrowLeft,
  cilCalendar,
  cilCommentSquare,
  cilFile,
  cilTask,
  cilTrash,
  cilCloudUpload,
  
} from '@coreui/icons'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api'
import ActivityFeed from '../../components/dashboard/ActivityFeed'
import AiEstimationCard from '../../components/project/AiEstimationCard'

const normalizeList = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.data)) return value.data
  return []
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const statusColor = (status) => {
  if (status === 'done') return 'success'
  if (status === 'on_hold') return 'secondary'
  if (status === 'in_progress') return 'primary'
  if (status === 'ready_for_review') return 'info'
  return 'warning'
}

const ClientProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const fetchProject = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`/api/client/projects/${id}`)
      setProject(response.data?.data || response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const timer = window.setTimeout(fetchProject, 0)
    return () => window.clearTimeout(timer)
  }, [fetchProject])

  const tasks = useMemo(() => normalizeList(project?.tasks || project?.root_tasks), [project])
  const comments = useMemo(() => normalizeList(project?.comments), [project])
  const files = useMemo(
    () => normalizeList(project?.files || project?.documents || project?.attachments),
    [project],
  )
  const activity = useMemo(
    () => normalizeList(project?.recent_activity || project?.activity),
    [project],
  )
  const milestones = useMemo(
    () => normalizeList(project?.milestones || project?.timeline),
    [project],
  )

  const progress = Number(
    project?.progress ?? project?.progress_percentage ?? project?.completion ?? 0,
  )
  const completedTasks = tasks.filter((task) => task.status === 'done').length

  // Validate files: no videos, max size 10MB
  const validateFiles = (fileList) => {
    const validFiles = []
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
      validFiles.push(file)
    }
    if (errors.length) {
      setError(errors.join(' '))
    }
    return validFiles
  }

  const handleFileSelect = (fileList) => {
    const newFiles = Array.from(fileList)
    const validFiles = validateFiles(newFiles)
    if (validFiles.length) {
      setSelectedFiles(prev => [...prev, ...validFiles])
    }
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
    const files = e.dataTransfer.files
    if (files && files.length) {
      handleFileSelect(files)
    }
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleComment = async () => {
    if (!comment.trim() && selectedFiles.length === 0) return
    setPosting(true)
    setError(null)

    const formData = new FormData()
    formData.append('content', comment.trim())
    selectedFiles.forEach(file => {
      formData.append('attachments[]', file)
    })

    try {
      const response = await api.post(`/api/client/projects/${id}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const created = response.data?.data || response.data
      setProject((current) => ({
        ...current,
        comments: [created, ...normalizeList(current?.comments)],
        // If the API returns updated file list, you could merge it here
      }))
      setComment('')
      setSelectedFiles([])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment.')
    } finally {
      setPosting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
        <div className="small text-body-secondary mt-2">Loading project...</div>
      </div>
    )
  }

  if (error && !project) return <CAlert color="danger">{error}</CAlert>
  if (!project) return null

  return (
    <div className="pb-5">
      <button
        className="btn btn-link px-0 mb-3 text-decoration-none"
        onClick={() => navigate('/client/projects')}
      >
        <CIcon icon={cilArrowLeft} className="me-2" />
        Back to projects
      </button>

      {error && <CAlert color="danger">{error}</CAlert>}

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

      <CRow className="g-4 mb-4">
        <CCol md={4}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex align-items-center gap-2 mb-3">
                <CIcon icon={cilTask} className="text-primary" />
                <h6 className="fw-bold mb-0">Task Progress</h6>
              </div>
              <div className="d-flex justify-content-between small mb-2">
                <span>
                  {completedTasks}/{tasks.length} completed
                </span>
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
          <ActivityFeed
            title="Project Timeline"
            items={milestones}
            emptyText="No timeline items yet."
          />
        </CCol>
        <CCol lg={5}>
          <ActivityFeed title="Recent Activity" items={activity} />
        </CCol>
        <CCol lg={7}>
          <CCard className="border-0 shadow-sm">
            <CCardBody>
              <h6 className="fw-bold mb-3">Tasks</h6>
              {tasks.length === 0 ? (
                <div className="text-body-secondary small py-4 text-center">
                  No tasks available.
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {tasks.slice(0, 8).map((task) => (
                    <div
                      key={task.id}
                      className="d-flex justify-content-between align-items-center rounded-3 p-3 bg-body-tertiary"
                    >
                      <div>
                        <div className="fw-semibold small">{task.title}</div>
                        <div className="text-body-secondary" style={{ fontSize: 12 }}>
                          {formatDate(task.due_date)}
                        </div>
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
        <CCol lg={5}>
          <CCard className="border-0 shadow-sm">
            <CCardBody>
              <div className="d-flex align-items-center gap-2 mb-3">
                <CIcon icon={cilCommentSquare} className="text-primary" />
                <h6 className="fw-bold mb-0">Discussion</h6>
              </div>

              {/* Comment Form with Drag & Drop and File Attachments */}
              <CForm>
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
                    placeholder="Write a project comment... You can also drag & drop files here."
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    className="border-0"
                    style={{ background: 'transparent' }}
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
                      onClick={handleComment}
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
                          <CIcon icon={cilTask} />
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
              </CForm>

              {/* Existing comments */}
              {comments.length === 0 ? (
                <div className="text-body-secondary small py-3 text-center">No comments yet.</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {comments.slice(0, 5).map((item, index) => (
                    <div key={item.id || index} className="rounded-3 p-3 bg-body-tertiary">
                      <div className="fw-semibold small">
                        {item.user?.name || item.author?.name || 'Team'}
                      </div>
                      <div className="small">{item.content || item.message}</div>
                      {/* If the backend returns attachments per comment, render them here */}
                      {item.attachments && item.attachments.length > 0 && (
                        <div className="mt-2 d-flex flex-wrap gap-2">
                          {item.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="small text-primary"
                            >
                              <CIcon icon={cilTask} className="me-1" />
                              {att.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
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