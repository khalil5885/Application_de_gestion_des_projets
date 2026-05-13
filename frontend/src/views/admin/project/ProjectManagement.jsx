import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { 
  CBadge, 
  CButton, 
  CFormInput, 
  CInputGroup, 
  CInputGroupText, 
  CSpinner,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CAvatar,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CProgress,
  CPagination,
  CPaginationItem,
  CTooltip,
  CFormCheck
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
  cilPlus, 
  cilSearch, 
  cilFolder, 
  cilGrid,
  cilList,
  cilOptions,
  cilPencil,
  cilTrash,
  cilZoom,
  cilArrowTop,
  cilArrowBottom,
  cilCalendar,
  cilUser,
  cilMoney,
  cilTag,
  cilChart
} from '@coreui/icons'

// DND Kit Imports
import { 
  DndContext, 
  closestCorners, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay 
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'

import { useAuth } from '../../../context/AuthContext'
import api from '../../../api'
import CreateProjectModal from '../../../components/project/CreateProjectModal';
import ProjectCard from '../../../components/project/ProjectCard';
import ProjectDrawer from '../../../components/project/ProjectDrawer';

const STATUS_COLUMNS = [
  { key: 'todo',             label: 'To Do',           color: 'warning' },
  { key: 'in_progress',      label: 'In Progress',     color: 'primary' },
  { key: 'ready_for_review', label: 'Ready for Review', color: 'info' },
  { key: 'done',             label: 'Done',            color: 'success' },
  { key: 'on_hold',          label: 'On Hold',         color: 'danger'  },
]

const STATUS_CONFIG = {
  todo:             { label: 'To Do',           color: 'warning',  bg: 'rgba(255, 193, 7, 0.12)', text: '#d39e00' },
  in_progress:      { label: 'In Progress',     color: 'primary',  bg: 'rgba(50, 31, 219, 0.12)', text: '#321fdb' },
  ready_for_review: { label: 'Ready for Review', color: 'info',    bg: 'rgba(13, 202, 240, 0.12)', text: '#0dcaf0' },
  done:             { label: 'Done',            color: 'success',  bg: 'rgba(46, 184, 92, 0.12)', text: '#2eb85c' },
  on_hold:          { label: 'On Hold',         color: 'danger',   bg: 'rgba(229, 83, 83, 0.12)', text: '#e55353' },
}

const PRIORITY_CONFIG = {
  high:   { label: 'High',   color: 'danger',  dot: '#e55353' },
  medium: { label: 'Medium', color: 'warning', dot: '#f9b115' },
  low:    { label: 'Low',    color: 'info',    dot: '#39f' },
}

const KanbanColumn = ({ col, projects, onDelete, onCardClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });

  const columnStyle = {
    flexShrink: 0,
    width: 300,
    minHeight: '600px',
    borderRadius: '12px',
    transition: 'all 0.25s ease',
    backgroundColor: isOver ? 'rgba(50, 31, 219, 0.08)' : 'rgba(0,0,0,0.02)',
    outline: isOver ? '2px dashed #321fdb' : '2px dashed transparent',
    outlineOffset: '2px',
    padding: '12px'
  };

  return (
    <div ref={setNodeRef} style={columnStyle}>
      <div className="d-flex align-items-center justify-content-between mb-3 px-1">
        <div className="d-flex align-items-center gap-2">
          <CBadge color={col.color} shape="rounded-pill" style={{ width: 8, height: 8, padding: 0 }} />
          <span className={`fw-bold small ${isOver ? 'text-primary' : ''}`}>{col.label}</span>
        </div>
        <CBadge color={col.color} variant="outline" shape="rounded-pill">{projects.length}</CBadge>
      </div>

      <div className="d-flex flex-column gap-3">
        {projects.map(p => (
          <ProjectCard key={p.id} project={p} onDelete={onDelete} onClick={onCardClick} />
        ))}
        {isOver && projects.length === 0 && (
          <div className="py-5 text-center text-primary small fw-bold border rounded-3 border-dashed">
            Drop Here
          </div>
        )}
      </div>
    </div>
  );
};

// ─── TABLE VIEW COMPONENT ─────────────────────────────────────────────

const ProjectTableView = ({ 
  projects, 
  onDelete, 
  onCardClick, 
  onStatusChange,
  search,
  statusFilter
}) => {
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedProjects = useMemo(() => {
    const searchTerm = search.toLowerCase();
    const filtered = projects.filter(p => {
      const matchesSearch = !search || 
        p.name?.toLowerCase().includes(searchTerm) || 
        p.client?.name?.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm);
      const matchesStatus = !statusFilter || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
    
    return [...filtered].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (sortConfig.key === 'client') {
        aVal = a.client?.name || '';
        bVal = b.client?.name || '';
      }
      if (sortConfig.key === 'budget') {
        aVal = parseFloat(a.budget) || 0;
        bVal = parseFloat(b.budget) || 0;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [projects, sortConfig, search, statusFilter]);

  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
  const paginatedProjects = sortedProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedProjects.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedProjects.map(p => p.id)));
    }
  };

  const toggleRow = (id) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRows(newSet);
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'danger';
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <CIcon icon={cilArrowTop} className="opacity-25" size="sm" />;
    return <CIcon icon={sortConfig.direction === 'asc' ? cilArrowTop : cilArrowBottom} size="sm" />;
  };

  return (
    <div className="project-table-wrapper">
      {/* Table Stats Bar */}
      <div className="d-flex align-items-center justify-content-between mb-3 px-1">
        <div className="d-flex align-items-center gap-3">
          <span className="text-muted small">
            Showing <strong>{Math.min(sortedProjects.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(currentPage * itemsPerPage, sortedProjects.length)}</strong> of <strong>{sortedProjects.length}</strong> projects
          </span>
          {selectedRows.size > 0 && (
            <CBadge color="primary" shape="rounded-pill">
              {selectedRows.size} selected
            </CBadge>
          )}
        </div>
        <div className="d-flex gap-2">
          {selectedRows.size > 0 && (
            <CButton color="danger" size="sm" variant="outline" onClick={() => {}}>
              <CIcon icon={cilTrash} className="me-1" size="sm" />
              Delete Selected
            </CButton>
          )}
        </div>
      </div>

      {/* Modern Table */}
      <div className="table-responsive rounded-3 border" style={{ background: '#fff' }}>
        <CTable hover className="mb-0 align-middle" style={{ fontSize: '0.875rem' }}>
          <CTableHead>
            <CTableRow style={{ background: 'rgba(0,0,0,0.02)' }}>
              <CTableHeaderCell className="ps-4" style={{ width: 40 }}>
                <CFormCheck 
                  checked={selectedRows.size === paginatedProjects.length && paginatedProjects.length > 0}
                  onChange={toggleSelectAll}
                />
              </CTableHeaderCell>
              <CTableHeaderCell 
                className="fw-semibold text-uppercase small text-muted cursor-pointer user-select-none"
                onClick={() => handleSort('name')}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex align-items-center gap-1">
                  Project <SortIcon column="name" />
                </div>
              </CTableHeaderCell>
              <CTableHeaderCell 
                className="fw-semibold text-uppercase small text-muted"
                onClick={() => handleSort('client')}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex align-items-center gap-1">
                  <CIcon icon={cilUser} size="sm" className="me-1" />Client <SortIcon column="client" />
                </div>
              </CTableHeaderCell>
              <CTableHeaderCell 
                className="fw-semibold text-uppercase small text-muted"
                onClick={() => handleSort('status')}
                style={{ cursor: 'pointer', width: 140 }}
              >
                <div className="d-flex align-items-center gap-1">
                  Status <SortIcon column="status" />
                </div>
              </CTableHeaderCell>
              <CTableHeaderCell 
                className="fw-semibold text-uppercase small text-muted"
                style={{ width: 100 }}
              >
                <div className="d-flex align-items-center gap-1">
                  <CIcon icon={cilTag} size="sm" className="me-1" />Priority
                </div>
              </CTableHeaderCell>
              <CTableHeaderCell 
                className="fw-semibold text-uppercase small text-muted"
                onClick={() => handleSort('budget')}
                style={{ cursor: 'pointer', width: 120 }}
              >
                <div className="d-flex align-items-center gap-1">
                  <CIcon icon={cilMoney} size="sm" className="me-1" />Budget <SortIcon column="budget" />
                </div>
              </CTableHeaderCell>
              <CTableHeaderCell 
                className="fw-semibold text-uppercase small text-muted"
                style={{ width: 160 }}
              >
                <div className="d-flex align-items-center gap-1">
                  <CIcon icon={cilChart} size="sm" className="me-1" />Progress
                </div>
              </CTableHeaderCell>
              <CTableHeaderCell 
                className="fw-semibold text-uppercase small text-muted"
                onClick={() => handleSort('deadline')}
                style={{ cursor: 'pointer', width: 130 }}
              >
                <div className="d-flex align-items-center gap-1">
                  <CIcon icon={cilCalendar} size="sm" className="me-1"/>Deadline <SortIcon column="deadline" />
                </div>
              </CTableHeaderCell>
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
                const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.pending;
                const priority = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.medium;
                const isSelected = selectedRows.has(project.id);
                const progress = project.progress || 0;

                return (
                  <CTableRow 
                    key={project.id}
                    className={isSelected ? 'table-active' : ''}
                    style={{ transition: 'all 0.15s ease' }}
                  >
                    <CTableDataCell className="ps-4">
                      <CFormCheck 
                        checked={isSelected}
                        onChange={() => toggleRow(project.id)}
                      />
                    </CTableDataCell>
                    
                    {/* Project Name & Description */}
                    <CTableDataCell>
                      <div 
                        className="d-flex flex-column cursor-pointer"
                        onClick={() => onCardClick(project)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="fw-semibold text-dark">{project.name}</span>
                        <span className="small text-muted text-truncate" style={{ maxWidth: 250 }}>
                          {project.description || 'No description'}
                        </span>
                        {project.tags?.length > 0 && (
                          <div className="d-flex gap-1 mt-1">
                            {project.tags.slice(0, 3).map((tag, i) => (
                              <CBadge key={i} color="light" textColor="secondary" shape="rounded-pill" className="small">
                                {tag}
                              </CBadge>
                            ))}
                            {project.tags.length > 3 && (
                              <CBadge color="light" textColor="secondary" shape="rounded-pill" className="small">
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
                        <CAvatar 
                          size="sm" 
                          color="primary" 
                          textColor="white"
                          className="small"
                        >
                          {project.client?.name?.charAt(0) || 'C'}
                        </CAvatar>
                        <div className="d-flex flex-column">
                          <span className="fw-medium">{project.client?.name || 'Unknown'}</span>
                          <span className="small text-muted">{project.client?.email || ''}</span>
                        </div>
                      </div>
                    </CTableDataCell>

                    {/* Status */}
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
                              border: `1px solid ${status.text}30`
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
                          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <CDropdownItem 
                              key={key}
                              onClick={() => onStatusChange(project.id, key)}
                              className="d-flex align-items-center gap-2"
                            >
                              <span 
                                className="d-inline-block rounded-circle" 
                                style={{ width: 8, height: 8, backgroundColor: config.text }}
                              />
                              {config.label}
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
                        {project.deadline && new Date(project.deadline) < new Date() && project.status !== 'done' && (
                          <CBadge color="danger" shape="rounded-pill" className="small mt-1" style={{ width: 'fit-content' }}>
                            Overdue
                          </CBadge>
                        )}
                      </div>
                    </CTableDataCell>

                    {/* Actions */}
                    <CTableDataCell className="text-end pe-4">
                      <CDropdown alignment="end">
                        <CDropdownToggle color="transparent" className="p-1 border-0 shadow-none">
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
                          <CDropdownItem className="text-danger" onClick={() => onDelete(project.id)}>
                            <CIcon icon={cilTrash} className="me-2" size="sm" />
                            Delete
                          </CDropdownItem>
                        </CDropdownMenu>
                      </CDropdown>
                    </CTableDataCell>
                  </CTableRow>
                );
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
            <CPaginationItem 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              Previous
            </CPaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <CPaginationItem
                key={page}
                active={page === currentPage}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </CPaginationItem>
            ))}
            <CPaginationItem 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </CPaginationItem>
          </CPagination>
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────

const ProjectManagement = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [viewMode, setViewMode] = useState('kanban') // 'kanban' | 'table'
  
  // Read status from URL query param on mount
  const urlStatus = searchParams.get('status')
  const [statusFilter, setStatusFilter] = useState(urlStatus)
  
  const [selectedProject, setSelectedProject] = useState(null)
  const [showDrawer, setShowDrawer] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { 
    activationConstraint: { distance: 8 } 
  }))

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

  // Sync URL when statusFilter changes
  const handleStatusFilterChange = useCallback((newStatus) => {
    setStatusFilter(prev => {
      const next = prev === newStatus ? null : newStatus
      if (next) {
        setSearchParams({ status: next })
      } else {
        setSearchParams({})
      }
      return next
    })
  }, [setSearchParams])

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const projectId = active.id;
    const newStatus = over.id;

    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
    try {
      await api.patch(`/api/admin/projects/${projectId}`, { status: newStatus });
    } catch { fetchProjects() }
  };

  const handleStatusChange = async (projectId, newStatus) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
    try {
      await api.patch(`/api/admin/projects/${projectId}`, { status: newStatus });
    } catch { fetchProjects() }
  };

  if (user && user.global_role !== 'admin') return <Navigate to="/dashboard" replace />

    return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">
          <CIcon icon={cilFolder} className="me-2" />
          Project Management
        </h4>
        <div className="d-flex align-items-center gap-3">
          {/* View Toggle */}
          <div 
            className="d-flex align-items-center p-1 rounded-3"
            style={{ background: 'var(--cui-secondary-bg)', border: '1px solid var(--cui-border-color-translucent)' }}
          >
            <CTooltip content="Kanban View">
              <CButton
                color={viewMode === 'kanban' ? 'primary' : 'secondary'}
                variant={viewMode === 'kanban' ? undefined : 'ghost'}
                size="sm"
                className="d-flex align-items-center gap-1 px-3"
                onClick={() => setViewMode('kanban')}
                style={{ 
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
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
                onClick={() => setViewMode('table')}
                style={{ 
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
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

      <div className="mb-4 d-flex align-items-center gap-3">
        <CInputGroup style={{ maxWidth: '400px' }}>
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
        
        {/* Quick Filters */}
        <div className="d-flex gap-2">
          {STATUS_COLUMNS.map(col => {
            const count = projects.filter(p => p.status === col.key).length;
            const isActive = statusFilter === col.key;
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
                <span className={`small ${isActive ? 'text-white' : 'text-muted'}`}>{col.label}</span>
                <CBadge color={col.color} shape="rounded-pill" className="small">{count}</CBadge>
              </CButton>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><CSpinner color="primary" /></div>
      ) : viewMode === 'kanban' ? (
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCorners} 
          onDragStart={handleDragStart} 
          onDragEnd={handleDragEnd}
        >
          <div className="d-flex gap-3 pb-4" style={{ overflowX: 'auto', minHeight: 'calc(100vh - 250px)' }}>
            {STATUS_COLUMNS.filter(col => !statusFilter || col.key === statusFilter).map(col => {
              const colProjects = projects.filter(p => 
                p.status === col.key && 
                (!search || 
                  p.name?.toLowerCase().includes(search.toLowerCase()) || 
                  p.client?.name?.toLowerCase().includes(search.toLowerCase()))
              );
              return (
                <KanbanColumn 
                  key={col.key} 
                  col={col} 
                  projects={colProjects} 
                  onDelete={fetchProjects}
                  onCardClick={(p) => { setSelectedProject(p); setShowDrawer(true); }}
                />
              )
            })}
          </div>

          <DragOverlay>
            {activeId ? (
              <div style={{ transform: 'rotate(-4deg)', cursor: 'grabbing', width: '280px' }}>
                <ProjectCard 
                  project={projects.find(p => p.id === activeId)} 
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
          onCardClick={(p) => { setSelectedProject(p); setShowDrawer(true); }}
          onStatusChange={handleStatusChange}
          search={search}
          statusFilter={statusFilter}
        />
      )}

      <CreateProjectModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={fetchProjects} />
      <ProjectDrawer visible={showDrawer} project={selectedProject} onClose={() => setShowDrawer(false)} onUpdate={fetchProjects} />
    </>
  )
}

export default ProjectManagement