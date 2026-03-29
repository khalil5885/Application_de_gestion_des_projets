import React, { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import {
  CBadge,
  CButton,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilSearch, cilFolder } from '@coreui/icons'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../api'
import ProjectCard from './ProjectCard'
import CreateProjectModal from './CreateProjectModal'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLUMNS = [
  { key: 'pending',     label: 'Pending',     color: 'warning' },
  { key: 'in_progress', label: 'In Progress',  color: 'primary' },
  { key: 'completed',  label: 'Completed',    color: 'success' },
  { key: 'on_hold',    label: 'On Hold',      color: 'danger'  },
]

// ─── Component ────────────────────────────────────────────────────────────────

const ProjectManagement = () => {
  const { user }                    = useAuth()
  const [projects, setProjects]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch]         = useState('')

  // Auth guard
  if (user && user.global_role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await api.get('/api/admin/projects')
      const data = res.data?.data
      setProjects(Array.isArray(data) ? data : data?.data ?? [])
    } catch {
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return
    try {
      await api.delete(`/api/admin/projects/${id}`)
      setProjects(p => p.filter(x => x.id !== id))
    } catch {}
  }

  const filtered = projects.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.client?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <CIcon icon={cilFolder} className="text-primary" />
            <h4 className="fw-bold mb-0">Project Management</h4>
          </div>
          <p className="text-body-secondary mb-0 small">
            Manage and track all client projects across their lifecycle.
          </p>
        </div>
        <CButton
          color="primary"
          onClick={() => setShowCreate(true)}
          className="d-flex align-items-center gap-2"
        >
          <CIcon icon={cilPlus} />
          New Project
        </CButton>
      </div>

      {/* Search */}
      <div className="mb-4" style={{ maxWidth: 360 }}>
        <CInputGroup>
          <CInputGroupText className="bg-transparent">
            <CIcon icon={cilSearch} size="sm" />
          </CInputGroupText>
          <CFormInput
            placeholder="Search projects or clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </CInputGroup>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="text-center py-5">
          <CSpinner color="primary" />
        </div>
      ) : (
        <div
          className="d-flex gap-3 pb-3"
          style={{ overflowX: 'auto', alignItems: 'flex-start' }}
        >
          {STATUS_COLUMNS.map(col => {
            const colProjects = filtered.filter(p => p.status === col.key)
            return (
              <div key={col.key} style={{ flexShrink: 0, width: 280 }}>
                {/* Column Header */}
                <div className="d-flex align-items-center gap-2 mb-3 px-1">
                  <CBadge
                    color={col.color}
                    shape="rounded-pill"
                    style={{ width: 8, height: 8, padding: 0, flexShrink: 0 }}
                  />
                  <span className="fw-bold small">{col.label}</span>
                  <CBadge color={col.color} className="ms-1">{colProjects.length}</CBadge>
                </div>

                {/* Cards */}
                {colProjects.length === 0 ? (
                  <div
                    className="rounded-2 text-center text-body-secondary small fw-semibold py-4"
                    style={{ border: '2px dashed var(--cui-border-color-translucent)' }}
                  >
                    No projects here
                  </div>
                ) : (
                  colProjects.map(p => (
                    <ProjectCard key={p.id} project={p} onDelete={handleDelete} />
                  ))
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <CreateProjectModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchProjects}
      />
    </>
  )
}

export default ProjectManagement