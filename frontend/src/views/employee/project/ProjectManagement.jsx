import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCol,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CProgress,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCalendar,
  cilChart,
  cilCheckCircle,
  cilFilter,
  cilFolder,
  cilSearch,
  cilTask,
  cilWarning,
} from '@coreui/icons'

import api from '../../../api'
import { useAuth } from '../../../context/AuthContext'
import ProjectTableView from '../../../components/project/ProjectTableView'
import ProjectDrawer from '../../../components/project/ProjectDrawer'

const STATUS_FILTERS = [
  { key: 'todo', label: 'To Do', color: 'warning' },
  { key: 'in_progress', label: 'In Progress', color: 'primary' },
  { key: 'ready_for_review', label: 'Review', color: 'info' },
  { key: 'done', label: 'Done', color: 'success' },
  { key: 'on_hold', label: 'On Hold', color: 'danger' },
]

const normalizeList = (response) => {
  const data = response.data?.data || response.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data?.items)) return data.data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

const getDeadline = (project) => project.end_date || project.deadline

const isOverdue = (project) => {
  const deadline = getDeadline(project)
  return deadline && new Date(deadline) < new Date() && project.status !== 'done'
}

const StatTile = ({ icon, label, value, tone = 'primary', detail }) => (
  <div
    className="h-100 rounded-3 p-3"
    style={{
      background: 'var(--cui-body-bg)',
      border: '1px solid var(--cui-border-color-translucent)',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
    }}
  >
    <div className="d-flex justify-content-between align-items-start gap-3">
      <div>
        <div className="small text-body-secondary fw-semibold text-uppercase mb-1">
          {label}
        </div>
        <div className="fs-4 fw-bold">{value}</div>
      </div>
      <span
        className="d-inline-flex align-items-center justify-content-center rounded-3"
        style={{
          width: 40,
          height: 40,
          background: `var(--cui-${tone}-bg-subtle)`,
          color: `var(--cui-${tone})`,
        }}
      >
        <CIcon icon={icon} />
      </span>
    </div>
    {detail && <div className="small text-body-secondary mt-2">{detail}</div>}
  </div>
)

const EmployeeProjectManagement = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const drawerOpenedFromUrl = useRef(false)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/api/employee/projects')
      setProjects(normalizeList(response))
    } catch (err) {
      setProjects([])
      setError(err.response?.data?.message || 'Failed to load your assigned projects.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    if (loading || drawerOpenedFromUrl.current) return

    const projectIdParam = searchParams.get('projectId') || searchParams.get('open')
    if (!projectIdParam) return

    const targetId = parseInt(projectIdParam, 10)
    const found = projects.find((project) => project.id === targetId)

    if (found) {
      setSelectedProject(found)
      setShowDrawer(true)
      drawerOpenedFromUrl.current = true
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('projectId')
        next.delete('open')
        return next
      }, { replace: true })
    }
  }, [loading, projects, searchParams, setSearchParams])

  useEffect(() => {
    if (searchParams.has('projectId') || searchParams.has('open')) {
      drawerOpenedFromUrl.current = false
    }
  }, [searchParams])

  const stats = useMemo(() => {
    const active = projects.filter((project) => project.status !== 'done').length
    const done = projects.filter((project) => project.status === 'done').length
    const review = projects.filter((project) => project.status === 'ready_for_review').length
    const overdue = projects.filter(isOverdue).length
    const averageProgress = projects.length
      ? Math.round(projects.reduce((sum, project) => sum + Number(project.progress || 0), 0) / projects.length)
      : 0

    return { active, done, review, overdue, averageProgress }
  }, [projects])

  const handleStatusFilterChange = useCallback((key) => {
    setStatusFilter((prev) => {
      const next = prev === key ? null : key
      setSearchParams((prevParams) => {
        const params = new URLSearchParams(prevParams)
        if (next) params.set('status', next)
        else params.delete('status')
        return params
      }, { replace: true })
      return next
    })
  }, [setSearchParams])

  const handleOpenProject = useCallback((project) => {
    setSelectedProject(project)
    setShowDrawer(true)
  }, [])

  if (user && user.global_role !== 'employee') return <Navigate to="/dashboard" replace />

  return (
    <div className="pb-4">
      <div
        className="rounded-3 p-4 mb-4"
        style={{
          background: 'linear-gradient(135deg, var(--cui-body-bg), var(--cui-tertiary-bg))',
          border: '1px solid var(--cui-border-color-translucent)',
        }}
      >
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <div className="d-inline-flex align-items-center gap-2 text-primary fw-semibold small mb-2">
              <CIcon icon={cilFolder} size="sm" />
              Employee Workspace
            </div>
            <h4 className="fw-bold mb-1">Project Management</h4>
            <p className="text-body-secondary mb-0">
              Review assigned projects, deadlines, progress, team activity, and comments.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <CBadge color="primary" shape="rounded-pill" className="px-3 py-2">
              {projects.length} assigned
            </CBadge>
          </div>
        </div>
      </div>

      <CRow className="g-3 mb-4">
        <CCol sm={6} xl={3}>
          <StatTile icon={cilTask} label="Active" value={stats.active} detail="Projects still moving" />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatTile icon={cilChart} label="Avg. Progress" value={`${stats.averageProgress}%`} tone="info" />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatTile icon={cilCheckCircle} label="Completed" value={stats.done} tone="success" detail={`${stats.review} ready for review`} />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatTile icon={cilWarning} label="Overdue" value={stats.overdue} tone={stats.overdue ? 'danger' : 'success'} detail="Based on project end date" />
        </CCol>
      </CRow>

      <div
        className="rounded-3 p-3 mb-4"
        style={{
          background: 'var(--cui-body-bg)',
          border: '1px solid var(--cui-border-color-translucent)',
        }}
      >
        <div className="d-flex flex-wrap align-items-center gap-3">
          <CInputGroup style={{ maxWidth: 420 }}>
            <CInputGroupText className="bg-transparent border-end-0">
              <CIcon icon={cilSearch} />
            </CInputGroupText>
            <CFormInput
              className="border-start-0 shadow-none"
              placeholder="Search projects, clients, or descriptions..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </CInputGroup>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="d-inline-flex align-items-center gap-1 small text-body-secondary fw-semibold">
              <CIcon icon={cilFilter} size="sm" />
              Status
            </span>
            {STATUS_FILTERS.map((status) => {
              const count = projects.filter((project) => project.status === status.key).length
              const isActive = statusFilter === status.key
              return (
                <CButton
                  key={status.key}
                  color={isActive ? status.color : 'secondary'}
                  variant={isActive ? undefined : 'outline'}
                  size="sm"
                  className="d-flex align-items-center gap-2"
                  onClick={() => handleStatusFilterChange(status.key)}
                >
                  <span>{status.label}</span>
                  <CBadge color={isActive ? 'light' : status.color} textColor={isActive ? status.color : undefined}>
                    {count}
                  </CBadge>
                </CButton>
              )
            })}
          </div>
        </div>

        <div className="d-flex align-items-center gap-3 mt-3">
          <div className="small text-body-secondary d-flex align-items-center gap-2">
            <CIcon icon={cilCalendar} size="sm" />
            Deadline awareness
          </div>
          <CProgress
            value={stats.averageProgress}
            color={stats.averageProgress >= 80 ? 'success' : stats.averageProgress >= 45 ? 'primary' : 'warning'}
            height={6}
            className="flex-grow-1 rounded-pill"
          />
        </div>
      </div>

      {error && (
        <CAlert color="danger" className="d-flex align-items-center gap-2">
          <CIcon icon={cilWarning} />
          <span>{error}</span>
        </CAlert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <CSpinner color="primary" />
          <div className="small text-body-secondary mt-2">Loading assigned projects...</div>
        </div>
      ) : (
        <ProjectTableView
          projects={projects}
          onCardClick={handleOpenProject}
          search={search}
          statusFilter={statusFilter}
          readOnly
          selectable={false}
        />
      )}

      <ProjectDrawer
        visible={showDrawer}
        project={selectedProject}
        onClose={() => setShowDrawer(false)}
        onUpdate={fetchProjects}
        readOnly
        apiBasePath="/api/employee/projects"
        commentBasePath="/api/employee/projects"
        tasksPathBuilder={(project) => `/employee/tasks?projectId=${project.id}`}
        detailPathBuilder={null}
      />
    </div>
  )
}

export default EmployeeProjectManagement
