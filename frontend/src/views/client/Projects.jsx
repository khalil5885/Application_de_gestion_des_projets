import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CProgress,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilGrid, cilList, cilSearch } from '@coreui/icons'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import ProjectSummaryCard from '../../components/project/ProjectSummaryCard'

const STATUS_COLORS = {
  active: 'primary',
  in_progress: 'primary',
  pending: 'warning',
  completed: 'success',
  delayed: 'danger',
  on_hold: 'secondary',
}

const normalizeList = (response) => {
  const data = response.data?.data || response.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
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

const ClientProjects = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [viewMode, setViewMode] = useState('cards')

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/api/client/projects')
      setProjects(normalizeList(response))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(fetchProjects, 0)
    return () => window.clearTimeout(timer)
  }, [fetchProjects])

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        !search ||
        project.name?.toLowerCase().includes(search.toLowerCase()) ||
        project.description?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === 'all' || project.status === status
      return matchesSearch && matchesStatus
    })
  }, [projects, search, status])

  return (
    <div className="pb-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1">Projects</h4>
          <p className="text-body-secondary mb-0">
            Track project health, progress, risks, and deadlines.
          </p>
        </div>
        <div className="d-flex gap-2">
          <CButton
            color={viewMode === 'cards' ? 'primary' : 'light'}
            onClick={() => setViewMode('cards')}
          >
            <CIcon icon={cilGrid} />
          </CButton>
          <CButton
            color={viewMode === 'table' ? 'primary' : 'light'}
            onClick={() => setViewMode('table')}
          >
            <CIcon icon={cilList} />
          </CButton>
        </div>
      </div>

      <CCard className="border-0 shadow-sm mb-4">
        <CCardBody>
          <div className="d-flex flex-wrap gap-3">
            <CInputGroup style={{ maxWidth: 320 }}>
              <CInputGroupText>
                <CIcon icon={cilSearch} size="sm" />
              </CInputGroupText>
              <CFormInput
                placeholder="Search projects..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </CInputGroup>
            <CFormSelect
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              style={{ maxWidth: 220 }}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="delayed">Delayed</option>
              <option value="on_hold">On Hold</option>
            </CFormSelect>
          </div>
        </CCardBody>
      </CCard>

      {error && <CAlert color="danger">{error}</CAlert>}

      {loading ? (
        <div className="text-center py-5">
          <CSpinner color="primary" />
          <div className="small text-body-secondary mt-2">Loading projects...</div>
        </div>
      ) : filtered.length === 0 ? (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center py-5 text-body-secondary">No projects found.</CCardBody>
        </CCard>
      ) : viewMode === 'cards' ? (
        <CRow className="g-4">
          {filtered.map((project) => (
            <CCol md={6} xl={4} key={project.id}>
              <ProjectSummaryCard
                project={project}
                onClick={() => navigate(`/client/projects/${project.id}`)}
              />
            </CCol>
          ))}
        </CRow>
      ) : (
        <CCard className="border-0 shadow-sm">
          <CCardBody>
            <CTable responsive hover align="middle">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Project</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Progress</CTableHeaderCell>
                  <CTableHeaderCell>Deadline</CTableHeaderCell>
                  <CTableHeaderCell>Risk</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filtered.map((project) => {
                  const progress = Number(project.progress ?? project.progress_percentage ?? 0)
                  const risk = project.risk_level || project.ai_estimation?.risk_level || 'low'
                  return (
                    <CTableRow
                      key={project.id}
                      onClick={() => navigate(`/client/projects/${project.id}`)}
                    >
                      <CTableDataCell className="fw-semibold">{project.name}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={STATUS_COLORS[project.status] || 'secondary'}>
                          {(project.status || 'active').replaceAll('_', ' ')}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell style={{ minWidth: 180 }}>
                        <div className="d-flex align-items-center gap-2">
                          <CProgress value={progress} className="flex-grow-1" />
                          <span className="small fw-semibold">{progress}%</span>
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>
                        {formatDate(project.end_date || project.deadline)}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge
                          color={
                            risk === 'high' ? 'danger' : risk === 'medium' ? 'warning' : 'success'
                          }
                        >
                          {risk}
                        </CBadge>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      )}
    </div>
  )
}

export default ClientProjects
