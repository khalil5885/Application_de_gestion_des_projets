import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilArrowLeft,
  cilCalendar,
  cilUser,
  cilPeople,
  cilTask,
  cilBriefcase,
  cilClock,
} from '@coreui/icons'
import api from '../../../api'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const STATUS_COLORS = {
  pending:     'warning',
  in_progress: 'primary',
  completed:   'success',
  on_hold:     'danger',
}

const STATUS_LABELS = {
  pending:     'Pending',
  in_progress: 'In Progress',
  completed:   'Completed',
  on_hold:     'On Hold',
}

const PRIORITY_COLORS = {
  low:    'success',
  medium: 'warning',
  high:   'danger',
}

const TASK_STATUS_COLORS = {
  todo:        'secondary',
  in_progress: 'primary',
  done:        'success',
  review:      'info',
}

// ─── Info Card ────────────────────────────────────────────────────────────────

const InfoCard = ({ icon, label, value }) => (
  <CCard className="border-0 shadow-sm h-100">
    <CCardBody className="p-3">
      <div className="d-flex align-items-center gap-2 mb-1">
        <CIcon icon={icon} size="sm" className="text-primary" />
        <span className="text-body-secondary small fw-semibold text-uppercase" style={{ letterSpacing: '0.05em', fontSize: 10 }}>
          {label}
        </span>
      </div>
      <div className="fw-bold" style={{ fontSize: 15 }}>{value || '—'}</div>
    </CCardBody>
  </CCard>
)

// ─── Main Component ───────────────────────────────────────────────────────────

const ProjectDetail = () => {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/api/admin/projects/${id}`)
        setProject(res.data.data)
      } catch (err) {
        setError('Failed to load project details.')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  if (loading) return (
    <div className="text-center py-5">
      <CSpinner color="primary" />
    </div>
  )

  if (error) return <CAlert color="danger">{error}</CAlert>

  if (!project) return null

  return (
    <>
      {/* ── Header ── */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <CButton
            color="secondary"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/projects')}
            className="d-flex align-items-center gap-1"
          >
            <CIcon icon={cilArrowLeft} size="sm" />
            Back
          </CButton>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="fw-bold mb-0">{project.name}</h4>
              <CBadge color={STATUS_COLORS[project.status]}>
                {STATUS_LABELS[project.status]}
              </CBadge>
            </div>
            <p className="text-body-secondary small mb-0 mt-1">
              {project.description}
            </p>
          </div>
        </div>
      </div>

      {/* ── Info Cards Row ── */}
      <CRow className="g-3 mb-4">
        <CCol sm={6} lg={3}>
          <InfoCard icon={cilUser}      label="Client"       value={project.client?.name} />
        </CCol>
        <CCol sm={6} lg={3}>
          <InfoCard icon={cilBriefcase} label="Project Type" value={project.project_type?.name} />
        </CCol>
        <CCol sm={6} lg={3}>
          <InfoCard icon={cilCalendar}  label="Start Date"   value={formatDate(project.start_date)} />
        </CCol>
        <CCol sm={6} lg={3}>
          <InfoCard icon={cilClock}     label="End Date"     value={formatDate(project.end_date)} />
        </CCol>
      </CRow>

      <CRow className="g-4">
        {/* ── Tasks Table ── */}
        <CCol lg={8}>
          <CCard className="border-0 shadow-sm">
            <CCardHeader className="bg-transparent border-bottom d-flex align-items-center justify-content-between py-3">
              <div className="d-flex align-items-center gap-2">
                <CIcon icon={cilTask} className="text-primary" />
                <span className="fw-bold">Tasks</span>
                <CBadge color="secondary" className="ms-1">{project.tasks?.length || 0}</CBadge>
              </div>
            </CCardHeader>
            <CCardBody className="p-0">
              {!project.tasks?.length ? (
                <div className="text-center text-body-secondary py-5 small fw-semibold">
                  No tasks assigned to this project yet.
                </div>
              ) : (
                <CTable align="middle" hover responsive className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell className="bg-body-tertiary ps-4">Title</CTableHeaderCell>
                      <CTableHeaderCell className="bg-body-tertiary">Status</CTableHeaderCell>
                      <CTableHeaderCell className="bg-body-tertiary">Priority</CTableHeaderCell>
                      <CTableHeaderCell className="bg-body-tertiary">Due Date</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {project.tasks.map(task => (
                      <CTableRow key={task.id}>
                        <CTableDataCell className="ps-4">
                          <div className="fw-semibold">{task.title}</div>
                          {task.description && (
                            <div
                              className="text-body-secondary small text-truncate"
                              style={{ maxWidth: 260 }}
                            >
                              {task.description}
                            </div>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={TASK_STATUS_COLORS[task.status] || 'secondary'}>
                            {task.status?.replace('_', ' ')}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={PRIORITY_COLORS[task.priority] || 'secondary'}>
                            {task.priority}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="small text-body-secondary">
                          {formatDate(task.due_date)}
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        {/* ── Right Column: Members + Meta ── */}
        <CCol lg={4}>

          {/* Team Members */}
          <CCard className="border-0 shadow-sm mb-4">
            <CCardHeader className="bg-transparent border-bottom d-flex align-items-center gap-2 py-3">
              <CIcon icon={cilPeople} className="text-primary" />
              <span className="fw-bold">Team Members</span>
              <CBadge color="secondary" className="ms-1">{project.members?.length || 0}</CBadge>
            </CCardHeader>
            <CCardBody className="p-0">
              {!project.members?.length ? (
                <div className="text-center text-body-secondary py-4 small fw-semibold">
                  No members assigned yet.
                </div>
              ) : (
                <div className="px-3 py-2">
                  {project.members.map(member => (
                    <div
                      key={member.id}
                      className="d-flex align-items-center justify-content-between py-2"
                      style={{ borderBottom: '1px solid var(--cui-border-color-translucent)' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold"
                          style={{ width: 32, height: 32, fontSize: 13, flexShrink: 0 }}
                        >
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-semibold small">{member.name}</div>
                          <div className="text-body-secondary" style={{ fontSize: 11 }}>{member.email}</div>
                        </div>
                      </div>
                      <CBadge color="info" className="text-capitalize">
                        {member.pivot?.project_role || 'member'}
                      </CBadge>
                    </div>
                  ))}
                </div>
              )}
            </CCardBody>
          </CCard>

          {/* Project Meta */}
          <CCard className="border-0 shadow-sm">
            <CCardHeader className="bg-transparent border-bottom py-3">
              <span className="fw-bold">Project Info</span>
            </CCardHeader>
            <CCardBody>
              <div className="d-flex flex-column gap-3">
                <div>
                  <div className="text-body-secondary small fw-semibold text-uppercase mb-1" style={{ fontSize: 10, letterSpacing: '0.05em' }}>Created By</div>
                  <div className="fw-semibold small">{project.creator?.name || '—'}</div>
                </div>
                <div>
                  <div className="text-body-secondary small fw-semibold text-uppercase mb-1" style={{ fontSize: 10, letterSpacing: '0.05em' }}>Created At</div>
                  <div className="fw-semibold small">{formatDate(project.created_at)}</div>
                </div>
                <div>
                  <div className="text-body-secondary small fw-semibold text-uppercase mb-1" style={{ fontSize: 10, letterSpacing: '0.05em' }}>Project Type</div>
                  <div className="fw-semibold small">{project.project_type?.name || '—'}</div>
                </div>
                <div>
                  <div className="text-body-secondary small fw-semibold text-uppercase mb-1" style={{ fontSize: 10, letterSpacing: '0.05em' }}>Total Tasks</div>
                  <div className="fw-semibold small">{project.tasks?.length || 0} tasks</div>
                </div>
              </div>
            </CCardBody>
          </CCard>

        </CCol>
      </CRow>
    </>
  )
}

export default ProjectDetail