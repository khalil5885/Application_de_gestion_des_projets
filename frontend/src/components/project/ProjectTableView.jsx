// components/project/ProjectTableView.jsx
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  CBadge,
  CButton,
  CFormCheck,
  CProgress,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CAvatar,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CPagination,
  CPaginationItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilArrowBottom,
  cilArrowTop,
  cilCalendar,
  cilChart,
  cilFolder,
  cilMoney,
  cilOptions,
  cilPencil,
  cilTag,
  cilTrash,
  cilUser,
  cilZoom,
} from '@coreui/icons'

// ─── Shared config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  todo:             { label: 'To Do',            color: 'warning', bg: 'rgba(255,193,7,0.12)',   text: '#d39e00' },
  in_progress:      { label: 'In Progress',      color: 'primary', bg: 'rgba(50,31,219,0.12)',   text: '#321fdb' },
  ready_for_review: { label: 'Ready for Review', color: 'info',    bg: 'rgba(13,202,240,0.12)',  text: '#0dcaf0' },
  done:             { label: 'Done',             color: 'success', bg: 'rgba(46,184,92,0.12)',   text: '#2eb85c' },
  on_hold:          { label: 'On Hold',          color: 'danger',  bg: 'rgba(229,83,83,0.12)',   text: '#e55353' },
}

const PRIORITY_CONFIG = {
  high:   { label: 'High',   color: 'danger',  dot: '#e55353' },
  medium: { label: 'Medium', color: 'warning', dot: '#f9b115' },
  low:    { label: 'Low',    color: 'info',    dot: '#39f'    },
}

// ─── Pure helpers (defined outside component so they are never re-created) ────

const getProgressColor = (progress) => {
  if (progress >= 80) return 'success'
  if (progress >= 50) return 'warning'
  return 'danger'
}

const formatCurrency = (value) => {
  if (!value) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

const SortIcon = memo(({ column, sortConfig }) => {
  if (sortConfig.key !== column)
    return <CIcon icon={cilArrowTop} className="opacity-25" size="sm" />
  return (
    <CIcon
      icon={sortConfig.direction === 'asc' ? cilArrowTop : cilArrowBottom}
      size="sm"
    />
  )
})
SortIcon.displayName = 'SortIcon'

// ─── ProjectTableView ─────────────────────────────────────────────────────────

/**
 * ProjectTableView
 *
 * Receives `projects` (the full list, already fetched) together with the
 * current `search` string and `statusFilter`.  All filtering + sorting happens
 * locally so the parent doesn't need to re-derive data.
 *
 * Every handler that is passed down as a prop is wrapped in useCallback so
 * child rows don't get fresh function references on every render.
 *
 * Props
 * ─────
 * projects       – raw project array from the API
 * onDelete       – () => void  (triggers a re-fetch in the parent)
 * onCardClick    – (project) => void
 * onStatusChange – (projectId, newStatus) => void
 * search         – string
 * statusFilter   – string | null
 */
const ProjectTableView = memo(({
  projects,
  onDelete,
  onCardClick,
  onStatusChange,
  search,
  statusFilter,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' })
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Reset to page 1 whenever the external filter changes
  useEffect(() => { setCurrentPage(1) }, [search, statusFilter])

  // ── Stable sort handler ──────────────────────────────────────────────────
  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  // ── Derived list: filter → sort ──────────────────────────────────────────
  const sortedProjects = useMemo(() => {
    const searchTerm = search.toLowerCase()

    const filtered = projects.filter((p) => {
      const matchesSearch =
        !search ||
        p.name?.toLowerCase().includes(searchTerm) ||
        p.client?.name?.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm)

      const matchesStatus = !statusFilter || p.status === statusFilter
      return matchesSearch && matchesStatus
    })

    return [...filtered].sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]

      if (sortConfig.key === 'client') {
        aVal = a.client?.name || ''
        bVal = b.client?.name || ''
      }
      if (sortConfig.key === 'budget') {
        aVal = parseFloat(a.budget) || 0
        bVal = parseFloat(b.budget) || 0
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [projects, sortConfig, search, statusFilter])

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.ceil(sortedProjects.length / ITEMS_PER_PAGE)
  const paginatedProjects = useMemo(
    () => sortedProjects.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE,
    ),
    [sortedProjects, currentPage],
  )

  // ── Row selection ────────────────────────────────────────────────────────
  const toggleSelectAll = useCallback(() => {
    setSelectedRows((prev) =>
      prev.size === paginatedProjects.length
        ? new Set()
        : new Set(paginatedProjects.map((p) => p.id)),
    )
  }, [paginatedProjects])

  const toggleRow = useCallback((id) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  // ── Stable page handlers ─────────────────────────────────────────────────
  const goToPrev = useCallback(() => setCurrentPage((p) => Math.max(1, p - 1)), [])
  const goToNext = useCallback(
    () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    [totalPages],
  )

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="project-table-wrapper">
      {/* Stats bar */}
      <div className="d-flex align-items-center justify-content-between mb-3 px-1">
        <div className="d-flex align-items-center gap-3">
          <span className="text-muted small">
            Showing{' '}
            <strong>
              {Math.min(sortedProjects.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}–
              {Math.min(currentPage * ITEMS_PER_PAGE, sortedProjects.length)}
            </strong>{' '}
            of <strong>{sortedProjects.length}</strong> projects
          </span>
          {selectedRows.size > 0 && (
            <CBadge color="primary" shape="rounded-pill">
              {selectedRows.size} selected
            </CBadge>
          )}
        </div>

        {selectedRows.size > 0 && (
          <CButton color="danger" size="sm" variant="outline">
            <CIcon icon={cilTrash} className="me-1" size="sm" />
            Delete Selected
          </CButton>
        )}
      </div>

      {/* Table */}
      <div className="table-responsive rounded-3 border" style={{ background: '#fff' }}>
        <CTable hover className="mb-0 align-middle" style={{ fontSize: '0.875rem' }}>
          <CTableHead>
            <CTableRow style={{ background: 'rgba(0,0,0,0.02)' }}>
              {/* Checkbox */}
              <CTableHeaderCell className="ps-4" style={{ width: 40 }}>
                <CFormCheck
                  checked={
                    selectedRows.size === paginatedProjects.length &&
                    paginatedProjects.length > 0
                  }
                  onChange={toggleSelectAll}
                />
              </CTableHeaderCell>

              {/* Project name */}
              <CTableHeaderCell
                className="fw-semibold text-uppercase small text-muted"
                style={{ cursor: 'pointer' }}
                onClick={() => handleSort('name')}
              >
                <div className="d-flex align-items-center gap-1">
                  Project <SortIcon column="name" sortConfig={sortConfig} />
                </div>
              </CTableHeaderCell>

              {/* Client */}
              <CTableHeaderCell
                className="fw-semibold text-uppercase small text-muted"
                style={{ cursor: 'pointer' }}
                onClick={() => handleSort('client')}
              >
                <div className="d-flex align-items-center gap-1">
                  <CIcon icon={cilUser} size="sm" className="me-1" />
                  Client <SortIcon column="client" sortConfig={sortConfig} />
                </div>
              </CTableHeaderCell>

              {/* Status */}
              <CTableHeaderCell
                className="fw-semibold text-uppercase small text-muted"
                style={{ cursor: 'pointer', width: 140 }}
                onClick={() => handleSort('status')}
              >
                <div className="d-flex align-items-center gap-1">
                  Status <SortIcon column="status" sortConfig={sortConfig} />
                </div>
              </CTableHeaderCell>

              {/* Priority */}
              <CTableHeaderCell
                className="fw-semibold text-uppercase small text-muted"
                style={{ width: 100 }}
              >
                <div className="d-flex align-items-center gap-1">
                  <CIcon icon={cilTag} size="sm" className="me-1" />Priority
                </div>
              </CTableHeaderCell>

              {/* Budget */}
              <CTableHeaderCell
                className="fw-semibold text-uppercase small text-muted"
                style={{ cursor: 'pointer', width: 120 }}
                onClick={() => handleSort('budget')}
              >
                <div className="d-flex align-items-center gap-1">
                  <CIcon icon={cilMoney} size="sm" className="me-1" />
                  Budget <SortIcon column="budget" sortConfig={sortConfig} />
                </div>
              </CTableHeaderCell>

              {/* Progress */}
              <CTableHeaderCell
                className="fw-semibold text-uppercase small text-muted"
                style={{ width: 160 }}
              >
                <div className="d-flex align-items-center gap-1">
                  <CIcon icon={cilChart} size="sm" className="me-1" />Progress
                </div>
              </CTableHeaderCell>

              {/* Deadline */}
              <CTableHeaderCell
                className="fw-semibold text-uppercase small text-muted"
                style={{ cursor: 'pointer', width: 130 }}
                onClick={() => handleSort('deadline')}
              >
                <div className="d-flex align-items-center gap-1">
                  <CIcon icon={cilCalendar} size="sm" className="me-1" />
                  Deadline <SortIcon column="deadline" sortConfig={sortConfig} />
                </div>
              </CTableHeaderCell>

              {/* Actions */}
              <CTableHeaderCell className="text-end pe-4" style={{ width: 60 }}>
                <span className="fw-semibold text-uppercase small text-muted">Actions</span>
              </CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {paginatedProjects.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan={9} className="text-center py-5 text-muted">
                  <CIcon icon={cilFolder} size="xl" className="mb-2 opacity-25" />
                  <div>No projects found</div>
                </CTableDataCell>
              </CTableRow>
            ) : (
              paginatedProjects.map((project) => {
                const status   = STATUS_CONFIG[project.status]   || STATUS_CONFIG.todo
                const priority = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.medium
                const isSelected = selectedRows.has(project.id)
                const progress   = project.progress || 0

                return (
                  <CTableRow
                    key={project.id}
                    className={isSelected ? 'table-active' : ''}
                    style={{ transition: 'all 0.15s ease' }}
                  >
                    {/* Checkbox */}
                    <CTableDataCell className="ps-4">
                      <CFormCheck
                        checked={isSelected}
                        onChange={() => toggleRow(project.id)}
                      />
                    </CTableDataCell>

                    {/* Project name + description + tags */}
                    <CTableDataCell>
                      <div
                        className="d-flex flex-column"
                        style={{ cursor: 'pointer' }}
                        onClick={() => onCardClick(project)}
                      >
                        <span className="fw-semibold text-dark">{project.name}</span>
                        <span
                          className="small text-muted text-truncate"
                          style={{ maxWidth: 250 }}
                        >
                          {project.description || 'No description'}
                        </span>
                        {project.tags?.length > 0 && (
                          <div className="d-flex gap-1 mt-1">
                            {project.tags.slice(0, 3).map((tag, i) => (
                              <CBadge
                                key={i}
                                color="light"
                                textColor="secondary"
                                shape="rounded-pill"
                                className="small"
                              >
                                {tag}
                              </CBadge>
                            ))}
                            {project.tags.length > 3 && (
                              <CBadge
                                color="light"
                                textColor="secondary"
                                shape="rounded-pill"
                                className="small"
                              >
                                +{project.tags.length - 3}
                              </CBadge>
                            )}
                          </div>
                        )}
                      </div>
                    </CTableDataCell>

                    {/* Client */}
                    <CTableDataCell>
                      <div className="d-flex align-items-center gap-2">
                        <CAvatar size="sm" color="primary" textColor="white" className="small">
                          {project.client?.name?.charAt(0) || 'C'}
                        </CAvatar>
                        <div className="d-flex flex-column">
                          <span className="fw-medium">{project.client?.name || 'Unknown'}</span>
                          <span className="small text-muted">{project.client?.email || ''}</span>
                        </div>
                      </div>
                    </CTableDataCell>

                    {/* Status dropdown */}
                    <CTableDataCell>
                      <CDropdown>
                        <CDropdownToggle
                          color="secondary"
                          variant="ghost"
                          className="p-0 border-0 shadow-none d-flex align-items-center gap-2"
                        >
                          <span
                            className="d-inline-flex align-items-center gap-2 px-2 py-1 rounded-pill small fw-medium"
                            style={{
                              backgroundColor: status.bg,
                              color: status.text,
                              border: `1px solid ${status.text}30`,
                            }}
                          >
                            <span
                              className="d-inline-block rounded-circle"
                              style={{ width: 6, height: 6, backgroundColor: status.text }}
                            />
                            {status.label}
                          </span>
                        </CDropdownToggle>
                        <CDropdownMenu>
                          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <CDropdownItem
                              key={key}
                              onClick={() => onStatusChange(project.id, key)}
                              className="d-flex align-items-center gap-2"
                            >
                              <span
                                className="d-inline-block rounded-circle"
                                style={{ width: 8, height: 8, backgroundColor: cfg.text }}
                              />
                              {cfg.label}
                            </CDropdownItem>
                          ))}
                        </CDropdownMenu>
                      </CDropdown>
                    </CTableDataCell>

                    {/* Priority */}
                    <CTableDataCell>
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="d-inline-block rounded-circle"
                          style={{ width: 8, height: 8, backgroundColor: priority.dot }}
                        />
                        <span className="small">{priority.label}</span>
                      </div>
                    </CTableDataCell>

                    {/* Budget */}
                    <CTableDataCell>
                      <span className="fw-semibold small">{formatCurrency(project.budget)}</span>
                    </CTableDataCell>

                    {/* Progress */}
                    <CTableDataCell>
                      <div className="d-flex flex-column gap-1">
                        <div className="d-flex justify-content-between small">
                          <span className="text-muted">{progress}%</span>
                          <span className="text-muted">
                            {project.tasks_completed || 0}/{project.tasks_total || 0} tasks
                          </span>
                        </div>
                        <CProgress
                          value={progress}
                          color={getProgressColor(progress)}
                          height={6}
                          className="rounded-pill"
                        />
                      </div>
                    </CTableDataCell>

                    {/* Deadline */}
                    <CTableDataCell>
                      <div className="d-flex flex-column">
                        <span className="small fw-medium">{formatDate(project.deadline)}</span>
                        {project.deadline &&
                          new Date(project.deadline) < new Date() &&
                          project.status !== 'done' && (
                            <CBadge
                              color="danger"
                              shape="rounded-pill"
                              className="small mt-1"
                              style={{ width: 'fit-content' }}
                            >
                              Overdue
                            </CBadge>
                          )}
                      </div>
                    </CTableDataCell>

                    {/* Actions */}
                    <CTableDataCell className="text-end pe-4">
                      <CDropdown alignment="end">
                        <CDropdownToggle
                          color="transparent"
                          className="p-1 border-0 shadow-none"
                        >
                          <CIcon icon={cilOptions} />
                        </CDropdownToggle>
                        <CDropdownMenu>
                          <CDropdownItem onClick={() => onCardClick(project)}>
                            <CIcon icon={cilZoom} className="me-2" size="sm" />
                            View Details
                          </CDropdownItem>
                          <CDropdownItem>
                            <CIcon icon={cilPencil} className="me-2" size="sm" />
                            Edit Project
                          </CDropdownItem>
                          <CDropdownItem
                            className="text-danger"
                            onClick={() => onDelete(project.id)}
                          >
                            <CIcon icon={cilTrash} className="me-2" size="sm" />
                            Delete
                          </CDropdownItem>
                        </CDropdownMenu>
                      </CDropdown>
                    </CTableDataCell>
                  </CTableRow>
                )
              })
            )}
          </CTableBody>
        </CTable>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <span className="small text-muted">
            Page {currentPage} of {totalPages}
          </span>
          <CPagination size="sm" aria-label="Project pagination">
            <CPaginationItem disabled={currentPage === 1} onClick={goToPrev}>
              Previous
            </CPaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <CPaginationItem
                key={page}
                active={page === currentPage}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </CPaginationItem>
            ))}
            <CPaginationItem disabled={currentPage === totalPages} onClick={goToNext}>
              Next
            </CPaginationItem>
          </CPagination>
        </div>
      )}
    </div>
  )
})

ProjectTableView.displayName = 'ProjectTableView'

export default ProjectTableView