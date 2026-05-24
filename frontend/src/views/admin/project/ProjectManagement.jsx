import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import {
  CBadge,
  CButton,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CSpinner,
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilFolder, cilGrid, cilList, cilPlus, cilSearch, cilTrash } from '@coreui/icons'

import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'

import { useAuth } from '../../../context/AuthContext'
import api from '../../../api'

import KanbanColumn, { STATUS_COLUMNS } from '../../../components/project/KanbanColumn'
import ProjectTableView from '../../../components/project/ProjectTableView.jsx'
import ProjectCard from '../../../components/project/ProjectCard'
import CreateProjectModal from '../../../components/project/CreateProjectModal'
import ProjectDrawer from '../../../components/project/ProjectDrawer'

// ─── Fixed DeleteDropZone Component ──────────────────────────────────────────
// Absolutely positioned overlay that only appears and takes space when dragging
const DeleteDropZone = ({ isDragging }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'delete-zone',
    data: { type: 'delete' },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: isDragging ? '90px' : 0,
        marginBottom: 0,
        background: isDragging
          ? isOver
            ? 'rgba(229, 83, 83, 0.18)'
            : 'rgba(229, 83, 83, 0.06)'
          : 'transparent',
        borderBottom: isDragging
          ? `2px dashed ${isOver ? '#e55353' : 'rgba(229,83,83,0.3)'}`
          : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        color: isDragging
          ? isOver
            ? '#e55353'
            : 'rgba(229,83,83,0.5)'
          : 'transparent',
        fontWeight: 700,
        fontSize: '0.85rem',
        textTransform: 'uppercase',
        transition: 'height 0.2s ease, background 0.2s ease, border 0.2s ease',
        pointerEvents: isDragging ? 'auto' : 'none',
        userSelect: 'none',
        zIndex: 10,
      }}
    >
      <CIcon icon={cilTrash} size="lg" style={{ transform: isOver ? 'scale(1.3)' : 'scale(1)' }} />
      <span>Drop here to delete project</span>
    </div>
  );
};

// ─── ProjectManagement ────────────────────────────────────────────────────────

const ProjectManagement = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // ── Core state ─────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [viewMode, setViewMode] = useState('kanban')
  const [selectedProject, setSelectedProject] = useState(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || null)
  const drawerOpenedFromUrl = useRef(false)
  const kanbanContainerRef = useRef(null)

  // ── DnD sensors ────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  // ── Fetch ──────────────────────────────────────────────────────────────────
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

  // ── URL-based drawer auto-open ─────────────────────────────────────────────
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
    if (hasParam) {
      drawerOpenedFromUrl.current = false
    }
  }, [searchParams])

  // ── Status filter ──────────────────────────────────────────────────────────
  const handleStatusFilterChange = useCallback((key) => {
    setStatusFilter((prev) => {
      const next = prev === key ? null : key
      setSearchParams(
        (prevParams) => {
          const p = new URLSearchParams(prevParams)
          if (next) p.set('status', next)
          else p.delete('status')
          return p
        },
        { replace: true },
      )
      return next
    })
  }, [setSearchParams])

  // ── Drawer helpers ────────────────────────────────────────────────────────
  const handleCardClick = useCallback((project) => {
    setSelectedProject(project)
    setShowDrawer(true)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setShowDrawer(false)
  }, [])

  // ── DELETE HANDLER ──────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (projectId) => {
    if (!projectId) return

    setDeleteError(null)

    try {
      await api.delete(`/api/admin/projects/${projectId}`)
      fetchProjects() // Refresh the list
    } catch (err) {
      console.error('Failed to delete project:', err)
      const message = err.response?.data?.message || err.message || 'Failed to delete project.'
      setDeleteError(message)
      setTimeout(() => setDeleteError(null), 5000)
    }
  }, [fetchProjects])

  // ── DnD handlers ───────────────────────────────────────────────────────────
  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id)
    setDeleteError(null)
  }, [])

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const projectId = active.id
    const targetId = over.id

    // If dropped on delete zone
    if (targetId === 'delete-zone') {
      await handleDelete(projectId)
      return
    }

    // If dropped on same column, do nothing
    if (projectId === targetId) return

    // Otherwise it's a status change
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: targetId } : p)),
    )

    try {
      await api.patch(`/api/admin/projects/${projectId}`, { status: targetId })
    } catch {
      fetchProjects()
    }
  }, [fetchProjects, handleDelete])

  // ── Table status change ────────────────────────────────────────────────────
  const handleStatusChange = useCallback(async (projectId, newStatus) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p)),
    )
    try {
      await api.patch(`/api/admin/projects/${projectId}`, { status: newStatus })
    } catch {
      fetchProjects()
    }
  }, [fetchProjects])

  // ── Per-column project slices ─────────────────────────────────────────────
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

  // ── Active drag overlay project ────────────────────────────────────────────
  const activeDragProject = useMemo(
    () => (activeId ? projects.find((p) => p.id === activeId) : null),
    [activeId, projects],
  )

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (user && user.global_role !== 'admin') return <Navigate to="/dashboard" replace />

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">
          <CIcon icon={cilFolder} className="me-2" />
          Project Management
        </h4>

        <div className="d-flex align-items-center gap-3">
          {/* View toggle */}
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

      {/* Delete error toast */}
      {deleteError && (
        <div
          className="rounded-3 px-4 py-3 mb-3 d-flex align-items-center gap-2"
          style={{
            background: 'rgba(229,83,83,0.1)',
            border: '1px solid rgba(229,83,83,0.3)',
            color: '#e55353',
            fontSize: 14,
          }}
        >
          <CIcon icon={cilTrash} size="sm" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Search + quick filters */}
      <div className="mb-4 d-flex align-items-center gap-3">
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

        <div className="d-flex gap-2">
          {STATUS_COLUMNS.map((col) => {
            const count = projects.filter((p) => p.status === col.key).length
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
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: `var(--cui-${col.color})`,
                  }}
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
      style={{
        position: 'relative',
        overflowX: 'auto',
        minHeight: '200px',
      }}
    >
      <DeleteDropZone isDragging={!!activeId} />

      <div
        className="d-flex gap-3"
        style={{
          paddingTop: activeId ? '150px' : 0, // match dropzone height (150px)
          transition: 'padding-top 0.2s ease',
          flex: 1,
        }}
      >
        {STATUS_COLUMNS.filter(
          (col) => !statusFilter || col.key === statusFilter
        ).map((col) => (
          <KanbanColumn
            key={col.key}
            col={col}
            projects={kanbanSlices[col.key]}
            onDelete={handleDelete}
            onCardClick={handleCardClick}
          />
        ))}
      </div>
    </div>

    <DragOverlay>
      {activeDragProject ? (
        <div
          style={{
            transform: 'rotate(-4deg)',
            cursor: 'grabbing',
            width: 280,
          }}
        >
          <ProjectCard
            project={activeDragProject}
            onDelete={() => {}}
            onClick={() => {}}
          />
        </div>
      ) : null}
    </DragOverlay>
  </DndContext>

      ) : (
        <ProjectTableView
          projects={projects}
          onDelete={handleDelete}
          onCardClick={handleCardClick}
          onStatusChange={handleStatusChange}
          search={search}
          statusFilter={statusFilter}
        />
      )}

      {/* Modals / Drawer */}
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