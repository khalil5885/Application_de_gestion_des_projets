// pages/admin/ProjectManagement.jsx
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
import { cilFolder, cilGrid, cilList, cilPlus, cilSearch } from '@coreui/icons'

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

// ── Sub-components (now in separate files) ────────────────────────────────────
import KanbanColumn, { STATUS_COLUMNS } from '../../../components/project/KanbanColumn'
import ProjectTableView from '../../../components/project/ProjectTableView.jsx'
import ProjectCard from '../../../components/project/ProjectCard'
import CreateProjectModal from '../../../components/project/CreateProjectModal'
import ProjectDrawer from '../../../components/project/ProjectDrawer'

// ─── ProjectManagement ────────────────────────────────────────────────────────

/**
 * URL-based drawer auto-open
 * ──────────────────────────
 * When a user clicks a notification that is related to a project, the
 * NotificationsPage (or any other page) should navigate to:
 *
 *   /admin/projects?projectId=42
 *
 * On mount this component reads that param, waits until the project list has
 * loaded, finds the matching project, and opens the drawer automatically.
 * Once the drawer is open the param is cleared from the URL so the back-button
 * and refresh don't re-trigger it.
 *
 * The `drawerOpenedFromUrl` ref prevents the effect from running again if the
 * project list re-fetches while the drawer is already open.
 */
const ProjectManagement = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // ── Core state ─────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState(null)        // DnD active card id
  const [viewMode, setViewMode] = useState('kanban')    // 'kanban' | 'table'
  const [selectedProject, setSelectedProject] = useState(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  // Status filter — initialised from URL so a direct link like
  // /admin/projects?status=in_progress also works
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || null)

  // Guard so the URL-triggered drawer open only fires once per navigation
  const drawerOpenedFromUrl = useRef(false)

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
  //
  // This effect runs whenever `projects` or `loading` changes.
  // It exits early unless:
  //   1. loading is finished
  //   2. a `projectId` query param is present
  //   3. we haven't already opened the drawer from a URL param this navigation
  //
  // Finding the project by id is O(n) but happens at most once per page visit
  // so it does not need further optimisation.
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

      // Remove the param from the URL without adding a browser-history entry.
      // This keeps the address bar clean and prevents the drawer from
      // re-opening after a manual close + soft navigation.
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('projectId')
        next.delete('open')
        return next
      }, { replace: true })
    }
  }, [loading, projects, searchParams, setSearchParams])

  // Reset the guard when the user navigates away and back (searchParams change
  // and a new projectId appears)
  useEffect(() => {
    const hasParam =
      searchParams.has('projectId') || searchParams.has('open')
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

  // ── Drawer helpers (stable references for child callbacks) ─────────────────
  const handleCardClick = useCallback((project) => {
    setSelectedProject(project)
    setShowDrawer(true)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setShowDrawer(false)
  }, [])

  // ── DnD handlers ───────────────────────────────────────────────────────────
  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id)
  }, [])

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return

    const projectId = active.id
    const newStatus = over.id

    // Optimistic update
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p)),
    )

    try {
      await api.patch(`/api/admin/projects/${projectId}`, { status: newStatus })
    } catch {
      // Rollback to server state on failure
      fetchProjects()
    }
  }, [fetchProjects])

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

  // ── Per-column project slices for the Kanban board ────────────────────────
  //
  // Computed here (not inside KanbanColumn) so each column receives a stable
  // array reference that only updates when that column's cards actually change.
  // React.memo on KanbanColumn then skips re-renders for untouched columns.
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
            style={{ overflowX: 'auto', minHeight: 'calc(100vh - 250px)' }}
          >
            {STATUS_COLUMNS
              .filter((col) => !statusFilter || col.key === statusFilter)
              .map((col) => (
                <KanbanColumn
                  key={col.key}
                  col={col}
                  projects={kanbanSlices[col.key]}
                  onDelete={fetchProjects}
                  onCardClick={handleCardClick}
                />
              ))}
          </div>

          <DragOverlay>
            {activeDragProject ? (
              <div
                style={{ transform: 'rotate(-4deg)', cursor: 'grabbing', width: 280 }}
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
          onDelete={fetchProjects}
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