import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CAlert,
  CAvatar,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CFormCheck,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CPagination,
  CPaginationItem,
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
import { 
  cilArrowLeft, 
  cilCalendar, 
  cilChevronBottom, 
  cilChevronRight, 
  cilSearch, 
  cilUser, 
  cilWarning,
  cilList,
  cilLevelUp,
} from '@coreui/icons'
import api from '../../../api'
import TaskDetailSidebar from '../../../components/task/TaskDetailSidebar'
import EmployeePerformanceCard from '../../../components/workload/EmployeePerformanceCard'
import WorkloadStatsCards from '../../../components/workload/WorkloadStatsCards'
import {
  MonthlyAssignmentChart,
  PriorityDistributionChart,
  TaskStatusBreakdownChart,
} from '../../../components/workload/WorkloadCharts'
import {
  getInitials,
  isOverdueTask,
  normalizeEmployee,
  normalizeTask,
  WORKLOAD_LEVELS,
} from '../../../components/workload/workloadUtils'

const PRIORITY_COLORS = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  urgent: 'danger',
}

const STATUS_OPTIONS = {
  todo: { label: 'To Do', color: '#8a93a2' },
  in_progress: { label: 'In Progress', color: '#3b82f6' },
  on_hold: { label: 'On Hold', color: '#f59e0b' },
  ready_for_review: { label: 'Ready for Review', color: '#0ea5e9' },
  done: { label: 'Done', color: '#22c55e' },
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

// ─── Hierarchical Task Table ──────────────────────────────────────────────────

const HierarchicalTaskTable = ({ tasks, onTaskClick }) => {
  const [expandedTasks, setExpandedTasks] = useState({})
  const [childrenCache, setChildrenCache] = useState({})
  const [loadingChildren, setLoadingChildren] = useState({})
  const [viewMode, setViewMode] = useState('parents') // 'parents' | 'drilled'

  // Separate parent tasks and subtasks from the initial data
  const parentTasks = useMemo(() => {
    return tasks.filter(t => t.parent_id === null || t.parent_id === undefined)
  }, [tasks])

  const subtasksMap = useMemo(() => {
    const map = {}
    tasks.forEach(task => {
      if (task.parent_id) {
        if (!map[task.parent_id]) map[task.parent_id] = []
        map[task.parent_id].push(task)
      }
    })
    return map
  }, [tasks])

  const fetchChildren = async (parentId) => {
    if (childrenCache[parentId]) return // Already loaded
    
    setLoadingChildren(prev => ({ ...prev, [parentId]: true }))
    try {
      const res = await api.get(`/api/admin/tasks/${parentId}`)
      const taskData = res.data?.data || res.data
      const children = taskData?.children || []
      setChildrenCache(prev => ({ ...prev, [parentId]: children }))
    } catch (err) {
      console.error('Failed to fetch subtasks:', err)
      setChildrenCache(prev => ({ ...prev, [parentId]: [] }))
    } finally {
      setLoadingChildren(prev => ({ ...prev, [parentId]: false }))
    }
  }

  const handleToggleExpand = (taskId) => {
    setExpandedTasks(prev => {
      const newState = { ...prev, [taskId]: !prev[taskId] }
      
      // Fetch children if expanding
      if (!prev[taskId]) {
        fetchChildren(taskId)
      }
      
      return newState
    })
  }

  const handleResetView = () => {
    setViewMode('parents')
    setExpandedTasks({})
  }

  // Flatten the visible tasks (parents + expanded children)
  const visibleTasks = useMemo(() => {
    if (viewMode !== 'parents') return parentTasks
    
    const flat = []
    parentTasks.forEach(parent => {
      flat.push({ ...parent, depth: 0, isParent: true })
      
      if (expandedTasks[parent.id]) {
        const children = childrenCache[parent.id] || subtasksMap[parent.id] || []
        children.forEach(child => {
          flat.push({ ...child, depth: 1, isChild: true, parentId: parent.id })
        })
      }
    })
    return flat
  }, [parentTasks, expandedTasks, childrenCache, subtasksMap, viewMode])

  const getProgressPercent = (task) => {
    if (task.children?.length) {
      const done = task.children.filter(c => c.status === 'done').length
      return Math.round((done / task.children.length) * 100)
    }
    return task.status === 'done' ? 100 : task.status === 'in_progress' ? 50 : 0
  }

  return (
    <div>
      {/* View Controls */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <CButton
          color={viewMode === 'parents' ? 'primary' : 'secondary'}
          variant={viewMode === 'parents' ? 'solid' : 'ghost'}
          size="sm"
          onClick={() => {
            setViewMode('parents')
            setExpandedTasks({})
          }}
        >
          <CIcon icon={cilList} className="me-1" />
          Parent Tasks ({parentTasks.length})
        </CButton>
        {Object.keys(expandedTasks).length > 0 && (
          <CButton
            color="secondary"
            variant="ghost"
            size="sm"
            onClick={handleResetView}
          >
            <CIcon icon={cilLevelUp} className="me-1" />
            Collapse All
          </CButton>
        )}
      </div>

      <CTable hover responsive striped>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell style={{ width: 50 }}></CTableHeaderCell>
            <CTableHeaderCell>Title</CTableHeaderCell>
            <CTableHeaderCell>Project</CTableHeaderCell>
            <CTableHeaderCell>Status</CTableHeaderCell>
            <CTableHeaderCell>Priority</CTableHeaderCell>
            <CTableHeaderCell>Due Date</CTableHeaderCell>
            <CTableHeaderCell>Progress</CTableHeaderCell>
            <CTableHeaderCell>Parent / Milestone</CTableHeaderCell>
            <CTableHeaderCell>Created</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {visibleTasks.map((task) => {
            const isExpanded = expandedTasks[task.id]
            const isLoading = loadingChildren[task.id]
            const hasChildren = task.isParent && (
              (childrenCache[task.id]?.length > 0) || 
              (subtasksMap[task.id]?.length > 0) ||
              (task.children?.length > 0)
            )
            const statusCfg = STATUS_OPTIONS[task.status] || STATUS_OPTIONS.todo
            const progress = getProgressPercent(task)
            const isOverdue = isOverdueTask(task)

            return (
              <CTableRow 
                key={task.id}
                style={{
                  cursor: 'pointer',
                  background: task.isChild ? 'var(--cui-secondary-bg)' : undefined,
                  borderLeft: task.isChild ? '3px solid var(--cui-primary)' : undefined,
                }}
                onClick={() => onTaskClick(task.id)}
              >
                <CTableDataCell>
                  <div className="d-flex align-items-center gap-1">
                    {task.isParent && (
                      <button
                        className="btn btn-sm p-0 border-0"
                        style={{ background: 'transparent' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleExpand(task.id)
                        }}
                      >
                        {isLoading ? (
                          <CSpinner size="sm" />
                        ) : (
                          <CIcon 
                            icon={isExpanded ? cilChevronBottom : cilChevronRight} 
                            size="sm"
                          />
                        )}
                      </button>
                    )}
                  </div>
                </CTableDataCell>
                <CTableDataCell>
                  <div style={{ paddingLeft: task.isChild ? 20 : 0 }}>
                    <div className="fw-semibold" style={{ fontSize: '0.875rem' }}>
                      {task.title}
                    </div>
                    {task.isParent && hasChildren && (
                      <small className="text-body-secondary">
                        {task.children?.length || childrenCache[task.id]?.length || subtasksMap[task.id]?.length || 0} subtask(s)
                      </small>
                    )}
                  </div>
                </CTableDataCell>
                <CTableDataCell>
                  <small>{task.project?.name || '-'}</small>
                </CTableDataCell>
                <CTableDataCell>
                  <CBadge
                    style={{
                      background: `${statusCfg.color}20`,
                      color: statusCfg.color,
                      border: `1px solid ${statusCfg.color}40`,
                    }}
                  >
                    {statusCfg.label}
                  </CBadge>
                </CTableDataCell>
                <CTableDataCell>
                  <CBadge color={PRIORITY_COLORS[task.priority] || 'warning'} shape="rounded-pill">
                    {task.priority || 'medium'}
                  </CBadge>
                </CTableDataCell>
                <CTableDataCell>
                  <div className="d-flex align-items-center gap-1">
                    <CIcon 
                      icon={cilCalendar} 
                      size="sm" 
                      style={{ color: isOverdue ? 'var(--cui-danger)' : 'var(--cui-secondary-color)' }} 
                    />
                    <small style={{ color: isOverdue ? 'var(--cui-danger)' : undefined }}>
                      {formatDate(task.due_date)}
                    </small>
                    {isOverdue && (
                      <CBadge color="danger" size="sm">Overdue</CBadge>
                    )}
                  </div>
                </CTableDataCell>
                <CTableDataCell>
                  <div className="d-flex align-items-center gap-2">
                    <div 
                      className="progress flex-grow-1" 
                      style={{ height: 6, minWidth: 60 }}
                    >
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{
                          width: `${progress}%`,
                          background: progress === 100 
                            ? 'var(--cui-success)' 
                            : progress > 50 
                              ? 'var(--cui-warning)' 
                              : 'var(--cui-primary)',
                        }}
                      />
                    </div>
                    <small className="fw-bold" style={{ minWidth: 35 }}>
                      {progress}%
                    </small>
                  </div>
                </CTableDataCell>
                <CTableDataCell>
                  <small className="text-body-secondary">
                    {task.parent_id 
                      ? (tasks.find(t => t.id === task.parent_id)?.title || `Parent #${task.parent_id}`)
                      : '-'}
                  </small>
                </CTableDataCell>
                <CTableDataCell>
                  <small>{formatDate(task.created_at)}</small>
                </CTableDataCell>
              </CTableRow>
            )
          })}
          {visibleTasks.length === 0 && (
            <CTableRow>
              <CTableDataCell colSpan={9} className="text-center py-4 text-body-secondary">
                No tasks found.
              </CTableDataCell>
            </CTableRow>
          )}
        </CTableBody>
      </CTable>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const EmployeeWorkloadDetail = ({ user }) => {
  const { employeeId: paramEmployeeId } = useParams()
  const employeeId = user?.id || paramEmployeeId
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [stats, setStats] = useState({})
  const [charts, setCharts] = useState({})
  const [tasks, setTasks] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    overdueOnly: false,
    readyForReview: false,
    search: '',
  })

  const fetchEmployee = useCallback(async () => {
    if (!employeeId) return

    setLoading(true)
    setError(null)
    try {
      const params = {
        status: filters.readyForReview ? 'ready_for_review' : filters.status || undefined,
        priority: filters.priority || undefined,
        overdue: filters.overdueOnly ? 1 : undefined,
        search: filters.search || undefined,
        page,
      }
      const res = await api.get(`/api/admin/workload/${employeeId}`, { params })
      const payload = res.data?.data ?? res.data
      const rawEmployee = payload?.employee ?? payload
      const taskPayload = payload?.tasks?.items ?? payload?.tasks ?? []
      const normalizedTasks = Array.isArray(taskPayload) 
        ? taskPayload.map(normalizeTask) 
        : []

      const normalizedEmployee = normalizeEmployee({
        ...rawEmployee,
        active_tasks_count: payload?.stats?.active_tasks ?? rawEmployee?.active_tasks_count,
        completed_this_month_count:
          payload?.stats?.completed_this_month ?? rawEmployee?.completed_this_month_count,
        overdue_tasks_count: payload?.stats?.overdue_tasks ?? rawEmployee?.overdue_tasks_count,
        ready_for_review_tasks_count:
          payload?.stats?.ready_for_review ?? rawEmployee?.ready_for_review_tasks_count,
        average_completion_rate:
          payload?.stats?.average_completion_rate ?? rawEmployee?.average_completion_rate,
        productivity_score: payload?.stats?.productivity_score ?? rawEmployee?.productivity_score,
        tasks: normalizedTasks,
      })

      setEmployee(normalizedEmployee)
      setStats(payload?.stats ?? {})
      setCharts(payload?.charts ?? {})
      setTasks(normalizedTasks)
      setPagination(payload?.tasks?.meta ?? null)
    } catch (err) {
      console.error('Failed to fetch employee workload detail:', err)
      setEmployee(null)
      setStats({})
      setCharts({})
      setTasks([])
      setPagination(null)
      setError(err.response?.data?.message || 'Failed to load employee workload details.')
    } finally {
      setLoading(false)
    }
  }, [employeeId, filters, page])

  useEffect(() => {
    const timer = window.setTimeout(fetchEmployee, 0)
    return () => window.clearTimeout(timer)
  }, [fetchEmployee])

  const updateFilters = (updater) => {
    setPage(1)
    setFilters(updater)
  }

  const handleTaskClick = (taskId) => {
    setSelectedTaskId(taskId)
    setSidebarVisible(true)
  }

  const handleCloseSidebar = () => {
    setSidebarVisible(false)
    setSelectedTaskId(null)
  }

  const handleTaskStatusChange = (taskId, newStatus) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    )
  }

  const handleTaskUpdated = () => {
    fetchEmployee()
  }

  if (loading && !employee)
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  if (!employee)
    return (
      <CAlert color="danger" className="d-flex flex-wrap align-items-center gap-2">
        <CIcon icon={cilWarning} />
        <span className="me-auto">{error || 'Employee workload data could not be loaded.'}</span>
        <CButton color="danger" variant="outline" size="sm" onClick={fetchEmployee}>
          Retry
        </CButton>
      </CAlert>
    )

  const level = WORKLOAD_LEVELS[employee.workloadLevel] || WORKLOAD_LEVELS.low
  const parentTasks = tasks.filter(t => t.parent_id === null || t.parent_id === undefined)
  const upcomingDeadlines = parentTasks
    .filter((task) => task.due_date && task.status !== 'done')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 4)

  return (
    <div className="workload-page">
      {!user && (
        <CButton
          color="secondary"
          variant="ghost"
          className="mb-3 px-0"
          onClick={() => navigate('/admin/workload')}
        >
          <CIcon icon={cilArrowLeft} className="me-2" />
          Back to Team Workload
        </CButton>
      )}

      {error && (
        <CAlert color="danger" className="d-flex flex-wrap align-items-center gap-2">
          <CIcon icon={cilWarning} />
          <span className="me-auto">{error}</span>
          <CButton color="danger" variant="outline" size="sm" onClick={fetchEmployee}>
            Retry
          </CButton>
        </CAlert>
      )}

      <CCard className="mb-4">
        <CCardBody>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <CAvatar color="primary" textColor="white" size="xl" className="fw-bold">
                {getInitials(employee.name)}
              </CAvatar>
              <div>
                <h3 className="mb-1">{employee.name}</h3>
                <div className="text-body-secondary">
                  <CIcon icon={cilUser} className="me-2" />
                  {employee.email}
                </div>
              </div>
            </div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <CBadge color={level.color} className="px-3 py-2">
                {level.label}
              </CBadge>
              {employee.workloadLevel === 'overloaded' && (
                <CBadge color="danger" variant="outline" className="px-3 py-2">
                  Potential overload detected
                </CBadge>
              )}
            </div>
          </div>
        </CCardBody>
      </CCard>

      <WorkloadStatsCards
        stats={{
          activeTasks: employee.activeTasks,
          completedThisMonth: employee.completedThisMonth,
          overdueTasks: employee.overdueTasks,
          readyForReview: employee.readyForReview,
          averageCompletionRate: stats.average_completion_rate ?? employee.averageCompletionRate,
        }}
      />

      <CRow className="g-3 mb-4">
        <CCol xs={12} xl={8}>
          <MonthlyAssignmentChart activity={charts.assignment_activity || []} />
        </CCol>
        <CCol xs={12} xl={4}>
          <EmployeePerformanceCard employee={employee} />
        </CCol>
        <CCol xs={12} lg={6}>
          <TaskStatusBreakdownChart counts={charts.task_status_breakdown || {}} />
        </CCol>
        <CCol xs={12} lg={6}>
          <PriorityDistributionChart counts={charts.priority_distribution || {}} />
        </CCol>
      </CRow>

      <CRow className="g-3 mb-4">
        <CCol xs={12} lg={4}>
          <CCard className="h-100">
            <CCardBody>
              <div className="d-flex align-items-center gap-2 mb-3">
                <CIcon icon={cilCalendar} className="text-warning" />
                <h6 className="mb-0">Upcoming deadlines</h6>
              </div>
              {upcomingDeadlines.length ? (
                <div className="d-flex flex-column gap-3">
                  {upcomingDeadlines.map((task) => (
                    <div key={task.id} className="d-flex justify-content-between gap-3">
                      <div className="min-w-0">
                        <div className="fw-semibold small text-truncate">{task.title}</div>
                        <div className="small text-body-secondary text-truncate">
                          {task.project?.name || '-'}
                        </div>
                      </div>
                      <CBadge color={isOverdueTask(task) ? 'danger' : 'warning'}>
                        {task.due_date}
                      </CBadge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-body-secondary small">No upcoming task deadlines.</div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} lg={8}>
          <CCard className="h-100">
            <CCardBody>
              <div className="d-flex flex-wrap align-items-end gap-3">
                <div className="flex-grow-1" style={{ minWidth: 220 }}>
                  <label className="form-label">Search tasks</label>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Search by task title..."
                      value={filters.search}
                      onChange={(e) =>
                        updateFilters((prev) => ({ ...prev, search: e.target.value }))
                      }
                    />
                  </CInputGroup>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <CFormSelect
                    value={filters.status}
                    onChange={(e) => updateFilters((prev) => ({ ...prev, status: e.target.value }))}
                    disabled={filters.readyForReview}
                  >
                    <option value="">All statuses</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="ready_for_review">Ready for Review</option>
                    <option value="done">Done</option>
                    <option value="on_hold">On Hold</option>
                  </CFormSelect>
                </div>
                <div>
                  <label className="form-label">Priority</label>
                  <CFormSelect
                    value={filters.priority}
                    onChange={(e) =>
                      updateFilters((prev) => ({ ...prev, priority: e.target.value }))
                    }
                  >
                    <option value="">All priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </CFormSelect>
                </div>
                <CFormCheck
                  id="overdueOnly"
                  label="Overdue only"
                  checked={filters.overdueOnly}
                  onChange={(e) =>
                    updateFilters((prev) => ({ ...prev, overdueOnly: e.target.checked }))
                  }
                />
                <CFormCheck
                  id="readyForReview"
                  label="Ready for review"
                  checked={filters.readyForReview}
                  onChange={(e) =>
                    updateFilters((prev) => ({ ...prev, readyForReview: e.target.checked }))
                  }
                />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0">Assigned Tasks</h5>
        <span className="small text-body-secondary">
          {loading ? 'Refreshing...' : `${parentTasks.length} parent task${parentTasks.length === 1 ? '' : 's'}`}
          {pagination?.total != null ? ` of ${pagination.total}` : ''}
        </span>
      </div>
      
      <HierarchicalTaskTable 
        tasks={tasks} 
        onTaskClick={handleTaskClick} 
      />
      
      <TaskDetailSidebar
        taskId={selectedTaskId}
        visible={sidebarVisible}
        onClose={handleCloseSidebar}
        onStatusChange={handleTaskStatusChange}
        onTaskUpdated={handleTaskUpdated}
        isAdmin={true}
      />
      {pagination?.last_page > 1 && (
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-3">
          <span className="small text-body-secondary">
            Page {pagination.current_page} of {pagination.last_page}
          </span>
          <CPagination size="sm" aria-label="Workload task pagination" className="mb-0">
            <CPaginationItem disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              Previous
            </CPaginationItem>
            {Array.from({ length: pagination.last_page }, (_, index) => index + 1).map((item) => (
              <CPaginationItem key={item} active={item === page} onClick={() => setPage(item)}>
                {item}
              </CPaginationItem>
            ))}
            <CPaginationItem
              disabled={page >= pagination.last_page}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </CPaginationItem>
          </CPagination>
        </div>
      )}
    </div>
  )
}

export default EmployeeWorkloadDetail