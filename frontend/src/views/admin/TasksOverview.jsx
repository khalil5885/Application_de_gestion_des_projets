import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CBadge,
  CFormSelect,
  CFormInput,
  CFormCheck,
  CButton,
  CSpinner,
  CAlert,
  CPagination,
  CPaginationItem,
  CProgress,
  CCollapse,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilFilter, cilSearch, cilChartPie, cilUser, cilCalendar, cilFlagAlt, cilCheckAlt, cilWarning, cilX, cilTask } from '@coreui/icons'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Filler } from 'chart.js'
import { Pie, Bar, Line } from 'react-chartjs-2'
import api from '../../api'
import TaskDetailSidebar from '../../components/task/TaskDetailSidebar' // adjust path if needed

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Filler)

// ─── STATUS CONFIG ───────────────────────────────────────────────
const STATUS_CONFIG = {
  todo: { color: 'secondary', label: 'To Do' },
  in_progress: { color: 'primary', label: 'In Progress' },
  ready_for_review: { color: 'warning', label: 'Ready for Review' },
  done: { color: 'success', label: 'Done' },
  on_hold: { color: 'dark', label: 'On Hold' },
}

const PRIORITY_CONFIG = {
  low: { color: 'success', label: 'Low' },
  medium: { color: 'info', label: 'Medium' },
  high: { color: 'warning', label: 'High' },
  urgent: { color: 'danger', label: 'Urgent' },
}

const HEALTH_CONFIG = {
  critical: { color: 'danger', icon: cilFlagAlt },
  'at risk': { color: 'warning', icon: cilWarning },
  healthy: { color: 'success', icon: cilCheckAlt },
}

// ─── UTILS ───────────────────────────────────────────────────────
function getTaskHealth(task) {
  if (task.overdue && task.progress < 50) return 'critical'
  if (task.overdue) return 'at risk'
  if (task.progress < 30) return 'at risk'
  return 'healthy'
}

function buildQueryParams(filters) {
  const params = new URLSearchParams()
  if (filters.status.length > 0) params.append('status', filters.status.join(','))
  if (filters.employee_id) params.append('employee_id', filters.employee_id)
  if (filters.client_id) params.append('client_id', filters.client_id)
  if (filters.project_id) params.append('project_id', filters.project_id)
  if (filters.priority) params.append('priority', filters.priority)
  if (filters.from) params.append('from', filters.from)
  if (filters.to) params.append('to', filters.to)
  if (filters.overdue) params.append('overdue', '1')
  if (filters.search) params.append('search', filters.search)
  return params.toString()
}

// ─── DEBOUNCE HOOK ───────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────
const TasksOverview = () => {
  // ── State ─────────────────────────────────────────────────────

  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtersVisible, setFiltersVisible] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [kpiData, setKpiData] = useState({
    total: 0,
    active: 0,
    overdue: 0,
    readyForReview: 0,
    completedThisWeek: 0,
  })

  // ── Task Detail Sidebar State ─────────────────────────────────
  const location = useLocation()
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [sidebarVisible, setSidebarVisible] = useState(false)

  const [filters, setFilters] = useState({
    status: [],
    employee_id: '',
    client_id: '',
    project_id: '',
    priority: '',
    from: '',
    to: '',
    overdue: false,
    search: '',
  })

  const debouncedSearch = useDebounce(filters.search, 400)

  // ── Derived data ────────────────────────────────────────────
  const employees = useMemo(() => users.filter((u) => u.global_role === 'employee'), [users])
  const owners = useMemo(() => users.filter((u) => u.global_role === 'client'), [users])

  // ── Fetch Users (once on mount) ─────────────────────────────
  useEffect(() => {
    const fetchUsers = async () => {
      if (location.state?.openTaskId) {
        setSelectedTaskId(location.state.openTaskId)
        setSidebarVisible(true)
        window.history.replaceState({}, document.title)
      }

      try {
        const res = await api.get('/api/admin/users')
        if (res.data?.status === 'success') {
          setUsers(res.data.data.items || [])
        }
      } catch (err) {
        console.error('Failed to load users:', err)
      }
    }
    fetchUsers()
  }, [location], [])

  // ── Fetch Projects (once on mount) ──────────────────────────
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/api/admin/projects')
        if (res.data?.status === 'success') {
          setProjects(res.data.data.items || [])
        }
      } catch (err) {
        console.error('Failed to load projects:', err)
        setProjects([])
      }
    }
    fetchProjects()
  }, [])

  // ── Fetch Tasks ─────────────────────────────────────────────
  const fetchTasks = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const query = buildQueryParams({
        ...filters,
        search: debouncedSearch,
      })
      const res = await api.get(`/api/admin/tasks-overview?${query ? query + '&' : ''}page=${page}`)
      if (res.data?.status === 'success') {
        const data = res.data.data
        setTasks(data.items || [])
        setCurrentPage(data.current_page || 1)
        setTotalPages(data.last_page || 1)
        setKpiData({
          total: data.total_tasks || 0,
          active: data.active_tasks || 0,
          overdue: data.overdue_tasks || 0,
          readyForReview: data.ready_for_review_tasks || 0,
          completedThisWeek: data.completed_this_week || 0,
        })
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [filters, debouncedSearch])

  // ── Trigger fetch when filters/search change ────────────────
  useEffect(() => {
    fetchTasks(1)
  }, [filters.status, filters.employee_id, filters.client_id, filters.project_id, filters.priority, filters.from, filters.to, filters.overdue, debouncedSearch, fetchTasks])

  // ── Task Detail Handlers ────────────────────────────────────
  const handleTaskClick = (taskId) => {
    setSelectedTaskId(taskId)
    setSidebarVisible(true)
  }

  const handleCloseSidebar = () => {
    setSidebarVisible(false)
    setSelectedTaskId(null)
  }

  const handleTaskStatusChange = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  }

  const handleTaskUpdated = () => {
    fetchTasks(currentPage)
  }

  // ── Handlers ────────────────────────────────────────────────
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleStatusToggle = (status) => {
    setFilters((prev) => {
      const current = prev.status
      const next = current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status]
      return { ...prev, status: next }
    })
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      status: [],
      employee_id: '',
      client_id: '',
      project_id: '',
      priority: '',
      from: '',
      to: '',
      overdue: false,
      search: '',
    })
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page)
      fetchTasks(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // ── Chart Data ──────────────────────────────────────────────
  const statusChartData = useMemo(() => {
    const counts = {}
    tasks.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1 })
    const labels = Object.keys(counts).map((s) => STATUS_CONFIG[s]?.label || s)
    const data = Object.values(counts)
    const colors = Object.keys(counts).map((s) => {
      const map = { secondary: '#6c757d', primary: '#0d6efd', warning: '#ffc107', success: '#198754', dark: '#212529' }
      return map[STATUS_CONFIG[s]?.color] || '#495057'
    })
    return {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }],
    }
  }, [tasks])

  const employeeChartData = useMemo(() => {
    const counts = {}
    tasks.forEach((t) => {
      const name = t.assigned_employee_name || t.assigned_employee?.name || 'Unassigned'
      counts[name] = (counts[name] || 0) + 1
    })
    const labels = Object.keys(counts)
    const data = Object.values(counts)
    return {
      labels,
      datasets: [{ label: 'Tasks', data, backgroundColor: 'rgba(13, 110, 253, 0.7)', borderColor: '#0d6efd', borderWidth: 1 }],
    }
  }, [tasks])

  const trendChartData = useMemo(() => {
    const dates = []
    const overdueCounts = []
    const completedCounts = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      dates.push(dateStr)
      overdueCounts.push(tasks.filter((t) => t.due_date === dateStr && t.overdue).length)
      completedCounts.push(tasks.filter((t) => t.completed_at?.startsWith(dateStr)).length)
    }
    return {
      labels: dates.map((d) => d.slice(5)),
      datasets: [
        { label: 'Overdue', data: overdueCounts, borderColor: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.1)', tension: 0.4, fill: true },
        { label: 'Completed', data: completedCounts, borderColor: '#198754', backgroundColor: 'rgba(25, 135, 84, 0.1)', tension: 0.4, fill: true },
      ],
    }
  }, [tasks])

  // ── Chart Options ───────────────────────────────────────────
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
    },
  }), [])

  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  }), [])

  const lineOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } },
  }), [])

  // ── Render ──────────────────────────────────────────────────
  return (
    <div>
      {/* Page Header */}
      <CRow className="mb-4">
        <CCol>
          <h2 className="fw-bold">
            <CIcon icon={cilChartPie} className="me-2" />
            Tasks Overview
          </h2>
          <p className="text-muted">Global command center for all tasks across projects</p>
        </CCol>
      </CRow>

      {/* ── KPI CARDS ───────────────────────────────────────── */}
      <CRow className="g-3 mb-4">
        {[
          { title: 'Total Tasks', value: kpiData.total, color: 'primary', icon: cilChartPie },
          { title: 'Active Tasks', value: kpiData.active, color: 'info', icon: cilUser },
          { title: 'Overdue Tasks', value: kpiData.overdue, color: 'danger', icon: cilWarning },
          { title: 'Ready for Review', value: kpiData.readyForReview, color: 'warning', icon: cilCheckAlt },
          { title: 'Completed This Week', value: kpiData.completedThisWeek, color: 'success', icon: cilCalendar },
        ].map((kpi, idx) => (
          <CCol sm={6} lg={idx === 0 ? 3 : undefined} key={kpi.title} className={idx > 0 ? 'col-xl' : ''}>
            <CCard className={`h-100 border-start border-start-4 border-start-${kpi.color}`}>
              <CCardBody className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-muted text-uppercase small fw-semibold">{kpi.title}</div>
                  <div className="fs-2 fw-bold mt-1">{kpi.value}</div>
                </div>
                <CIcon icon={kpi.icon} size="xl" className={`text-${kpi.color} opacity-25`} />
              </CCardBody>
            </CCard>
          </CCol>
        ))}
      </CRow>

      {/* ── CHARTS ──────────────────────────────────────────── */}
      <CRow className="g-3 mb-4">
        <CCol lg={4}>
          <CCard className="h-100">
            <CCardHeader className="fw-semibold">
              <CIcon icon={cilChartPie} className="me-2" />
              Tasks by Status
            </CCardHeader>
            <CCardBody style={{ height: '280px' }}>
              {tasks.length > 0 ? (
                <Pie data={statusChartData} options={chartOptions} />
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted">No data</div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={4}>
          <CCard className="h-100">
            <CCardHeader className="fw-semibold">
              <CIcon icon={cilUser} className="me-2" />
              Tasks by Employee
            </CCardHeader>
            <CCardBody style={{ height: '280px' }}>
              {tasks.length > 0 ? (
                <Bar data={employeeChartData} options={barOptions} />
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted">No data</div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={4}>
          <CCard className="h-100">
            <CCardHeader className="fw-semibold">
              <CIcon icon={cilCalendar} className="me-2" />
              Overdue vs Completed Trend
            </CCardHeader>
            <CCardBody style={{ height: '280px' }}>
              {tasks.length > 0 ? (
                <Line data={trendChartData} options={lineOptions} />
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted">No data</div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ── FILTER PANEL ──────────────────────────────────────── */}
      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <span className="fw-semibold">
            <CIcon icon={cilFilter} className="me-2" />
            Filters
          </span>
          <CButton color="link" size="sm" onClick={() => setFiltersVisible(!filtersVisible)}>
            {filtersVisible ? 'Hide' : 'Show'}
          </CButton>
        </CCardHeader>
        <CCollapse visible={filtersVisible}>
          <CCardBody>
            <CRow className="g-3">
              {/* Search */}
              <CCol md={4} lg={3}>
                <div className="position-relative">
                  <CFormInput
                    placeholder="Search tasks..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                  <span className="position-absolute top-50 end-0 translate-middle-y me-2 text-muted">
                    <CIcon icon={cilSearch} size="sm" />
                  </span>
                </div>
              </CCol>

              {/* Status Multi-select (visual chips) */}
                           <CCol md={8} lg={9}>
                <div className="d-flex flex-wrap gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const isActive = filters.status.includes(key)
                    return (
                      <CButton
                        key={key}
                        color={isActive ? cfg.color : 'secondary'}
                        size="sm"
                        variant={isActive ? undefined : 'outline'}
                        onClick={() => handleStatusToggle(key)}
                        className="text-nowrap"
                        style={!isActive ? { 
                          '--cui-btn-color': 'var(--cui-secondary-color)',
                          borderColor: 'var(--cui-border-color)',
                        } : undefined}
                      >
                        {cfg.label}
                      </CButton>
                    )
                  })}
                </div>
              </CCol>

              {/* Employee */}
              <CCol md={6} lg={3}>
                <label className="form-label small fw-semibold">Employee</label>
                <CFormSelect
                  value={filters.employee_id}
                  onChange={(e) => handleFilterChange('employee_id', e.target.value)}
                >
                  <option value="">All Employees</option>
                  {employees.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </CFormSelect>
              </CCol>

              {/* Owner */}
              <CCol md={6} lg={3}>
                <label className="form-label small fw-semibold">Owner</label>
                <CFormSelect
                  value={filters.client_id}
                  onChange={(e) => handleFilterChange('client_id', e.target.value)}
                >
                  <option value="">All Owners</option>
                  {owners.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.global_role})</option>
                  ))}
                </CFormSelect>
              </CCol>

              {/* Project */}
              <CCol md={6} lg={3}>
                <label className="form-label small fw-semibold">Project</label>
                <CFormSelect
                  value={filters.project_id}
                  onChange={(e) => handleFilterChange('project_id', e.target.value)}
                >
                  <option value="">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </CFormSelect>
              </CCol>

              {/* Priority */}
              <CCol md={6} lg={3}>
                <label className="form-label small fw-semibold">Priority</label>
                <CFormSelect
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                >
                  <option value="">All Priorities</option>
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </CFormSelect>
              </CCol>

              {/* Date Range */}
              <CCol md={6} lg={3}>
                <label className="form-label small fw-semibold">From</label>
                <CFormInput
                  type="date"
                  value={filters.from}
                  onChange={(e) => handleFilterChange('from', e.target.value)}
                />
              </CCol>
              <CCol md={6} lg={3}>
                <label className="form-label small fw-semibold">To</label>
                <CFormInput
                  type="date"
                  value={filters.to}
                  onChange={(e) => handleFilterChange('to', e.target.value)}
                />
              </CCol>

              {/* Overdue Toggle */}
              <CCol md={6} lg={3} className="d-flex align-items-end">
                <CFormCheck
                  id="overdue-check"
                  checked={filters.overdue}
                  onChange={(e) => handleFilterChange('overdue', e.target.checked)}
                  label="Show Overdue Only"
                />
              </CCol>

              {/* Clear Filters */}
              <CCol md={6} lg={3} className="d-flex align-items-end justify-content-end">
                <CButton color="light" variant="outline" size="sm" onClick={clearFilters}>
                  <CIcon icon={cilX} className="me-1" />
                  Clear All
                </CButton>
              </CCol>
            </CRow>
          </CCardBody>
        </CCollapse>
      </CCard>

      {/* ── ERROR STATE ───────────────────────────────────────── */}
      {error && (
        <CAlert color="danger" dismissible onClose={() => setError(null)} className="mb-4">
          <strong>Error loading tasks:</strong> {error}
        </CAlert>
      )}

      {/* ── TASK TABLE ────────────────────────────────────────── */}
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <span className="fw-semibold">Tasks ({tasks.length})</span>
          {loading && <CSpinner size="sm" color="primary" />}
        </CCardHeader>
        <CCardBody className="p-0">
          <div className="table-responsive">
            <CTable hover align="middle" className="mb-0">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Title</CTableHeaderCell>
                  <CTableHeaderCell>Project</CTableHeaderCell>
                  <CTableHeaderCell>Assigned</CTableHeaderCell>
                  <CTableHeaderCell>Owner</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Priority</CTableHeaderCell>
                  <CTableHeaderCell>Due Date</CTableHeaderCell>
                  <CTableHeaderCell>Progress</CTableHeaderCell>
                  <CTableHeaderCell>Health</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {loading && tasks.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={10} className="text-center py-5">
                      <CSpinner color="primary" />
                      <div className="mt-2 text-muted">Loading tasks...</div>
                    </CTableDataCell>
                  </CTableRow>
                ) : tasks.length === 0 ? (
                  <CTableRow >
                    <CTableDataCell colSpan={10} className="text-center py-5 text-muted">
                      <CIcon icon={cilSearch} size="xl" className="mb-2 d-block mx-auto opacity-25" />
                      No tasks found. Try adjusting your filters.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  tasks.map((task) => {
                    const health = getTaskHealth(task)
                    const healthCfg = HEALTH_CONFIG[health]
                    return (
                      <CTableRow
                        key={task.id}
                        onClick={() => handleTaskClick(task.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <CTableDataCell>
                          <div className="fw-semibold">{task.title}</div>
                          <div className="small text-muted text-truncate" style={{ maxWidth: '200px' }}>
                            {task.description || 'No description'}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="light" textColor="dark" shape="rounded-pill">
                            {task.project_name || task.project?.name || '—'}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="d-flex align-items-center">
                            <div className="bg-light rounded-circle me-2 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28, fontSize: 12 }}>
                              {(task.assigned_employee_name || task.assigned_employee?.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <span>{task.assigned_employee_name || task.assigned_employee?.name || 'Unassigned'}</span>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <span className="small">{task.project?.client?.name || '—'}</span>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={STATUS_CONFIG[task.status]?.color || 'secondary'}>
                            {STATUS_CONFIG[task.status]?.label || task.status}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={PRIORITY_CONFIG[task.priority]?.color || 'secondary'}>
                            {PRIORITY_CONFIG[task.priority]?.label || task.priority}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <span className={task.overdue ? 'text-danger fw-semibold' : ''}>
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                            {task.overdue && <CIcon icon={cilWarning} className="ms-1 text-danger" />}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell style={{ minWidth: 120 }}>
                          <CProgress value={task.progress || 0} color={task.progress >= 80 ? 'success' : task.progress >= 50 ? 'primary' : 'warning'} className="mb-1" style={{ height: 6 }} />
                          <span className="small text-muted">{task.progress || 0}%</span>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={healthCfg.color} className="d-inline-flex align-items-center gap-1">
                            <CIcon icon={healthCfg.icon} size="sm" />
                            {health}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="text-end">
                          <CButton
                            color="light"
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTaskClick(task.id)
                            }}
                          >
                            View
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })
                )}
              </CTableBody>
            </CTable>
          </div>

          {/* ── PAGINATION ────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center p-3">
              <CPagination align="center" aria-label="Task pagination">
                <CPaginationItem disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
                  Previous
                </CPaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <CPaginationItem
                    key={page}
                    active={page === currentPage}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </CPaginationItem>
                ))}
                <CPaginationItem disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
                  Next
                </CPaginationItem>
              </CPagination>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* ── TASK DETAIL SIDEBAR ───────────────────────────────── */}
      <TaskDetailSidebar
        taskId={selectedTaskId}
        visible={sidebarVisible}
        onClose={handleCloseSidebar}
        onStatusChange={handleTaskStatusChange}
        onTaskUpdated={handleTaskUpdated}
        isAdmin={true}
      />
    </div>
  )
}

export default TasksOverview