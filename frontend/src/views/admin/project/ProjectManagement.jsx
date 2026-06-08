import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import {
  CBadge,
  CButton,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilFolder, cilGrid, cilList, cilPlus, cilSearch, cilTrash, cilWarning } from '@coreui/icons'

import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

import { useAuth } from '../../../context/AuthContext'
import api from '../../../api'

import KanbanColumn, { STATUS_COLUMNS } from '../../../components/project/KanbanColumn'
import ProjectTableView from '../../../components/project/ProjectTableView.jsx'
import ProjectCard from '../../../components/project/ProjectCard'
import CreateProjectModal from '../../../components/project/CreateProjectModal'
import ProjectDrawer from '../../../components/project/ProjectDrawer'

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

const DeleteConfirmModal = ({ visible, projectName, onConfirm, onCancel, deleting }) => (
  <CModal visible={visible} onClose={onCancel} alignment="center">
    <CModalHeader onClose={onCancel}>
      <CModalTitle className="d-flex align-items-center gap-2">
        <span
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(229,83,83,0.12)',
            border: '1px solid rgba(229,83,83,0.3)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CIcon icon={cilWarning} style={{ color: '#e55353', width: 16, height: 16 }} />
        </span>
        Delete Project
      </CModalTitle>
    </CModalHeader>
    <CModalBody>
      <p className="mb-1">
        Are you sure you want to delete{' '}
        <strong>{projectName}</strong>?
      </p>
      <p className="text-body-secondary small mb-0">
        This will permanently remove the project and all its tasks, members, and comments. This action cannot be undone.
      </p>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="ghost" onClick={onCancel} disabled={deleting}>
        Cancel
      </CButton>
      <CButton
        color="danger"
        onClick={onConfirm}
        disabled={deleting}
        className="d-flex align-items-center gap-2"
      >
        {deleting
          ? <><CSpinner size="sm" /> Deleting...</>
          : <><CIcon icon={cilTrash} size="sm" /> Delete Project</>
        }
      </CButton>
    </CModalFooter>
  </CModal>
)

// ─── ProjectManagement ────────────────────────────────────────────────────────

const ProjectManagement = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // ── Core state ──────────────────────────────────────────────────────────────
  const [projects, setProjects]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [activeId, setActiveId]           = useState(null)
  const [viewMode, setViewMode]           = useState('kanban')
  const [selectedProject, setSelectedProject] = useState(null)
  const [showDrawer, setShowDrawer]       = useState(false)
  const [showCreate, setShowCreate]       = useState(false)

  // ── Delete modal state ──────────────────────────────────────────────────────
  const [deleteModal, setDeleteModal] = useState({ visible: false, projectId: null, projectName: '', deleting: false })

  const [statusFilter, setStatusFilter]   = useState(() => searchParams.get('status') || null)
  const drawerOpenedFromUrl               = useRef(false)

  // ── DnD sensors ─────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/projects')
      const items = res.data?.data?.items
      setProjects(Array.isArray(items) ? items : [])
    } catch (err) {
      console.error('Failed to fetch projects:', err)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  // ── URL-based drawer auto-open ───────────────────────────────────────────────
  useEffect(() => {
    if (loading) return
    if (drawerOpenedFromUrl.current) return

    const projectIdParam = searchParams.get('projectId') || searchParams.get('open')
    if (!projectIdParam) return

    const targetId = parseInt(projectIdParam, 10)
    const found = projects.find((p) => p.id === targetId)

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
    const hasParam = searchParams.has('projectId') || searchParams.has('open')
    if (hasParam) drawerOpenedFromUrl.current = false
  }, [searchParams])

  // ── Status filter ────────────────────────────────────────────────────────────
  const handleStatusFilterChange = useCallback((key) => {
    setStatusFilter((prev) => {
      const next = prev === key ? null : key
      setSearchParams((prevParams) => {
        const p = new URLSearchParams(prevParams)
        if (next) p.set('status', next)
        else p.delete('status')
        return p
      }, { replace: true })
      return next
    })
  }, [setSearchParams])

  // ── Drawer ───────────────────────────────────────────────────────────────────
  const handleCardClick = useCallback((project) => {
    setSelectedProject(project)
    setShowDrawer(true)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setShowDrawer(false)
  }, [])

  // ── Delete (with confirmation modal) ────────────────────────────────────────
  const handleDeleteRequest = useCallback((projectId) => {
    const project = projects.find((p) => p.id === projectId)
    setDeleteModal({ visible: true, projectId, projectName: project?.name || 'this project', deleting: false })
  }, [projects])

  const handleDeleteConfirm = useCallback(async () => {
    const { projectId } = deleteModal
    setDeleteModal((prev) => ({ ...prev, deleting: true }))
    try {
      await api.delete(`/api/admin/projects/${projectId}`)
      setDeleteModal({ visible: false, projectId: null, projectName: '', deleting: false })
      fetchProjects()
    } catch (err) {
      console.error('Failed to delete project:', err)
      setDeleteModal((prev) => ({ ...prev, deleting: false }))
    }
  }, [deleteModal, fetchProjects])

  const handleDeleteCancel = useCallback(() => {
    if (deleteModal.deleting) return
    setDeleteModal({ visible: false, projectId: null, projectName: '', deleting: false })
  }, [deleteModal.deleting])

  // ── DnD handlers ─────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((event) => {
    // dnd-kit gives string IDs — store as-is, compare carefully
    setActiveId(event.active.id)
  }, [])

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    // active.id is a string (dnd-kit converts IDs to strings)
    // over.id is the column key string e.g. 'in_progress'
    const draggedId   = active.id          // string
    const newStatus   = over.id            // column key string

    // Validate that over.id is actually a column key, not another card
    const isColumn = STATUS_COLUMNS.some((col) => col.key === newStatus)
    if (!isColumn) return

    // Find the project by comparing string IDs
    const project = projects.find((p) => String(p.id) === String(draggedId))
    if (!project) return

    // No-op if same status
    if (project.status === newStatus) return

    // Optimistic update
    setProjects((prev) =>
      prev.map((p) => String(p.id) === String(draggedId) ? { ...p, status: newStatus } : p)
    )

    try {
      await api.patch(`/api/admin/projects/${project.id}`, { status: newStatus })
    } catch (err) {
      console.error('Failed to update project status:', err)
      fetchProjects() // roll back on error
    }
  }, [projects, fetchProjects])

  // ── Table status change ───────────────────────────────────────────────────────
  const handleStatusChange = useCallback(async (projectId, newStatus) => {
    setProjects((prev) =>
      prev.map((p) => p.id === projectId ? { ...p, status: newStatus } : p)
    )
    try {
      await api.patch(`/api/admin/projects/${projectId}`, { status: newStatus })
    } catch {
      fetchProjects()
    }
  }, [fetchProjects])

  // ── Per-column slices ─────────────────────────────────────────────────────────
  const kanbanSlices = useMemo(() => {
    const searchTerm = search.toLowerCase()
    const result = {}
    STATUS_COLUMNS.forEach((col) => {
      result[col.key] = projects.filter(
        (p) =>
          p.status === col.key &&
          (!search ||
            p.name?.toLowerCase().includes(searchTerm) ||
            p.client?.name?.toLowerCase().includes(searchTerm)),
      )
    })
    return result
  }, [projects, search])

  // ── Active drag project (for overlay) ────────────────────────────────────────
  const activeDragProject = useMemo(
    () => activeId ? projects.find((p) => String(p.id) === String(activeId)) : null,
    [activeId, projects],
  )

  // ── Guard ─────────────────────────────────────────────────────────────────────
  if (user && user.global_role !== 'admin') return <Navigate to="/dashboard" replace />

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">
          <CIcon icon={cilFolder} className="me-2" />
          Project Management
        </h4>

        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center p-1 rounded-3"
            style={{
              background: 'var(--cui-secondary-bg)',
              border: '1px solid var(--cui-border-color-translucent)',
            }}
          >
            <CTooltip content="Kanban View">
              <CButton
                color={viewMode === 'kanban' ? 'primary' : 'secondary'}
                variant={viewMode === 'kanban' ? undefined : 'ghost'}
                size="sm"
                className="d-flex align-items-center gap-1 px-3"
                style={{ borderRadius: 6, transition: 'all 0.2s ease' }}
                onClick={() => setViewMode('kanban')}
              >
                <CIcon icon={cilGrid} size="sm" />
                <span className="small">Board</span>
              </CButton>
            </CTooltip>

            <CTooltip content="Table View">
              <CButton
                color={viewMode === 'table' ? 'primary' : 'secondary'}
                variant={viewMode === 'table' ? undefined : 'ghost'}
                size="sm"
                className="d-flex align-items-center gap-1 px-3"
                style={{ borderRadius: 6, transition: 'all 0.2s ease' }}
                onClick={() => setViewMode('table')}
              >
                <CIcon icon={cilList} size="sm" />
                <span className="small">List</span>
              </CButton>
            </CTooltip>
          </div>

          <CButton color="primary" onClick={() => setShowCreate(true)}>
            <CIcon icon={cilPlus} className="me-1" /> New Project
          </CButton>
        </div>
      </div>

      {/* Search + quick filters */}
      <div className="mb-4 d-flex align-items-center gap-3 flex-wrap">
        <CInputGroup style={{ maxWidth: 400 }}>
          <CInputGroupText className="bg-transparent border-end-0">
            <CIcon icon={cilSearch} />
          </CInputGroupText>
          <CFormInput
            className="border-start-0 shadow-none"
            placeholder="Search projects or clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CInputGroup>

        <div className="d-flex gap-2 flex-wrap">
          {STATUS_COLUMNS.map((col) => {
            const count    = projects.filter((p) => p.status === col.key).length
            const isActive = statusFilter === col.key
            return (
              <CButton
                key={col.key}
                color={isActive ? 'primary' : 'secondary'}
                variant={isActive ? undefined : 'outline'}
                size="sm"
                className="d-flex align-items-center gap-2"
                onClick={() => handleStatusFilterChange(col.key)}
              >
                <span
                  className="d-inline-block rounded-circle"
                  style={{ width: 8, height: 8, backgroundColor: `var(--cui-${col.color})` }}
                />
                <span className={`small ${isActive ? 'text-white' : 'text-muted'}`}>
                  {col.label}
                </span>
                <CBadge color={col.color} shape="rounded-pill" className="small">
                  {count}
                </CBadge>
              </CButton>
            )
          })}
        </div>
      </div>

      {/* Board / Table */}
      {loading ? (
        <div className="text-center py-5">
          <CSpinner color="primary" />
        </div>
      ) : viewMode === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div
            className="d-flex gap-3 pb-4"
            style={{ overflowX: 'auto', minHeight: 200 }}
          >
            {STATUS_COLUMNS.filter(
              (col) => !statusFilter || col.key === statusFilter,
            ).map((col) => (
              <KanbanColumn
                key={col.key}
                col={col}
                projects={kanbanSlices[col.key]}
                activeId={activeId}
                onDelete={handleDeleteRequest}
                onCardClick={handleCardClick}
              />
            ))}
          </div>

          {/* DragOverlay — renders a ghost of the card being dragged */}
          <DragOverlay dropAnimation={null}>
            {activeDragProject ? (
              <div style={{ width: 280, cursor: 'grabbing', transform: 'rotate(-1.5deg)', pointerEvents: 'none' }}>
                <ProjectCard
                  project={activeDragProject}
                  onDelete={() => {}}
                  onClick={() => {}}
                  isDragOverlay
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <ProjectTableView
          projects={projects}
          onDelete={handleDeleteRequest}
          onCardClick={handleCardClick}
          onStatusChange={handleStatusChange}
          search={search}
          statusFilter={statusFilter}
        />
      )}

      {/* Modals */}
      <DeleteConfirmModal
        visible={deleteModal.visible}
        projectName={deleteModal.projectName}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        deleting={deleteModal.deleting}
      />

      <CreateProjectModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchProjects}
      />

      <ProjectDrawer
        visible={showDrawer}
        project={selectedProject}
        onClose={handleCloseDrawer}
        onUpdate={fetchProjects}
      />
    </>
  )
}

export default ProjectManagement