import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CAvatar,
  CBadge,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CProgress,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilArrowLeft,
  cilArrowRight,
  cilBell,
  cilCalendar,
  cilCheckCircle,
  cilClock,
  cilCommentBubble,
  cilGraph,
  cilList,
  cilReload,
  cilTask,
  cilUser,
  cilWarning,
} from '@coreui/icons'
import { CChartBar, CChartDoughnut, CChartLine } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'
import api from '../../../api'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const eventConfig = {
  overdue: { color: 'danger', tone: '#dc2626', label: 'Overdue' },
  done: { color: 'success', tone: '#16a34a', label: 'Completed' },
  completed: { color: 'success', tone: '#16a34a', label: 'Completed' },
  in_progress: { color: 'primary', tone: '#0891b2', label: 'In Progress' },
  ready_for_review: { color: 'info', tone: '#06b6d4', label: 'Ready Review' },
  high_priority: { color: 'danger', tone: '#dc2626', label: 'High Priority' },
  extension_pending: { color: 'warning', tone: '#d97706', label: 'Extension' },
  project_deadline: { color: 'warning', tone: '#d97706', label: 'Project' },
  todo: { color: 'secondary', tone: '#64748b', label: 'To Do' },
  on_hold: { color: 'warning', tone: '#d97706', label: 'Blocked' },
}

const healthConfig = {
  healthy: { color: 'success', label: 'Healthy' },
  at_risk: { color: 'warning', label: 'At Risk' },
  critical: { color: 'danger', label: 'Critical' },
  blocked: { color: 'secondary', label: 'Blocked' },
}

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  ready_for_review: 'Ready for Review',
  done: 'Done',
  on_hold: 'On Hold',
}

const formatDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const fromNow = (value) => {
  if (!value) return ''
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.round(diff / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

const getInitials = (name = '') =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U'

const chartOptions = {
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: getStyle('--cui-body-color'), boxWidth: 10, usePointStyle: true } },
  },
  scales: {
    x: {
      grid: { color: getStyle('--cui-border-color-translucent'), drawOnChartArea: false },
      ticks: { color: getStyle('--cui-body-color') },
    },
    y: {
      beginAtZero: true,
      grid: { color: getStyle('--cui-border-color-translucent') },
      ticks: { color: getStyle('--cui-body-color'), precision: 0 },
    },
  },
}

const doughnutOptions = {
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: getStyle('--cui-body-color'), boxWidth: 10, usePointStyle: true },
    },
  },
}

const WorkspaceMetric = ({ icon, label, value, color = 'primary', caption }) => (
  <CCard className="h-100">
    <CCardBody>
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div>
          <div className="small text-body-secondary mb-1">{label}</div>
          <div className="fs-3 fw-bold">{value ?? 0}</div>
          {caption && <div className={`small text-${color} fw-semibold mt-1`}>{caption}</div>}
        </div>
        <div className={`workspace-icon-box text-${color}`}>
          <CIcon icon={icon} />
        </div>
      </div>
    </CCardBody>
  </CCard>
)

const TaskSummaryItem = ({ task, onOpen }) => {
  const health = healthConfig[task.health] || healthConfig.healthy
  const status = eventConfig[task.status] || eventConfig.todo

  return (
    <button className="workspace-task-row text-start" onClick={() => onOpen(task)}>
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div className="min-w-0">
          <div className="fw-semibold text-truncate">{task.title}</div>
          <div className="small text-body-secondary text-truncate">
            {task.project_name || 'No project'}
          </div>
        </div>
        <CBadge color={health.color}>{health.label}</CBadge>
      </div>
      <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
        <CBadge color={status.color}>{statusLabels[task.status] || status.label}</CBadge>
        {task.priority && (
          <CBadge color={task.priority === 'high' ? 'danger' : 'secondary'}>{task.priority}</CBadge>
        )}
        <span className="small text-body-secondary ms-auto">{formatDate(task.due_date)}</span>
      </div>
      <CProgress
        value={task.progress || 0}
        color={health.color}
        height={6}
        className="rounded-pill mt-3"
      />
    </button>
  )
}

const DependencyNode = ({ node, depth = 0 }) => {
  const health = healthConfig[node.health] || healthConfig.healthy

  return (
    <div className="workspace-tree-node" style={{ marginLeft: depth ? 18 : 0 }}>
      <div className="d-flex align-items-center gap-2">
        <span className={`workspace-tree-dot bg-${health.color}`} />
        <span className="fw-semibold small text-truncate">{node.title}</span>
        <CBadge color={health.color} className="ms-auto">
          {node.progress}%
        </CBadge>
      </div>
      {node.children?.length > 0 && (
        <div className="workspace-tree-children">
          {node.children.map((child) => (
            <DependencyNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

const Calendar = () => {
  const navigate = useNavigate()
  const today = useMemo(() => new Date(), [])
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(today)
  const [workspace, setWorkspace] = useState({
    events: [],
    today_focus: [],
    upcoming_deadlines: [],
    workload: {},
    dependency_tree: [],
  })
  const [productivity, setProductivity] = useState({})
  const [activity, setActivity] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const dateRange = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    return { start: formatDateKey(start), end: formatDateKey(end) }
  }, [currentDate])

  const fetchWorkspace = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [calendarRes, productivityRes, activityRes, notificationRes] = await Promise.all([
        api.get('/api/employee/workspace/calendar', { params: dateRange }),
        api.get('/api/employee/workspace/productivity'),
        api.get('/api/employee/workspace/activity', { params: { per_page: 12 } }),
        api.get('/api/notifications'),
      ])

      setWorkspace(calendarRes.data?.data || {})
      setProductivity(productivityRes.data?.data?.charts || {})
      setActivity(activityRes.data?.data?.items || [])
      setNotifications(notificationRes.data?.data?.data || notificationRes.data?.data?.items || [])
    } catch (err) {
      console.error('Failed to load productivity workspace:', err)
      setError(err.response?.data?.message || 'Failed to load productivity workspace.')
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    const timer = window.setTimeout(fetchWorkspace, 0)
    return () => window.clearTimeout(timer)
  }, [fetchWorkspace])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    return [
      ...Array.from({ length: firstDay }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ]
  }, [currentDate])

  const eventsByDate = useMemo(() => {
    return (workspace.events || []).reduce((acc, event) => {
      acc[event.date] = [...(acc[event.date] || []), event]
      return acc
    }, {})
  }, [workspace.events])

  const selectedKey = formatDateKey(selectedDate)
  const selectedEvents = eventsByDate[selectedKey] || []
  const workload = workspace.workload || {}
  const workloadStatus = workload.status || 'low'
  const workloadColor =
    workloadStatus === 'overloaded'
      ? 'danger'
      : workloadStatus === 'high'
        ? 'warning'
        : workloadStatus === 'medium'
          ? 'info'
          : 'success'

  const changeMonth = (direction) => {
    setCurrentDate((value) => new Date(value.getFullYear(), value.getMonth() + direction, 1))
  }

  const openTask = (task) => {
    navigate(`/employee/tasks?task=${task.source_id || task.id}`)
  }

  const markNotificationRead = async (id) => {
    await api.patch(`/api/notifications/${id}/read`)
    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, read_at: new Date().toISOString() } : item)),
    )
  }

  const markAllNotificationsRead = async () => {
    await api.patch('/api/notifications/read-all')
    setNotifications((items) =>
      items.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })),
    )
  }

  return (
    <div className="workspace-productivity">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            <CIcon icon={cilCalendar} className="me-2" />
            Employee Productivity Workspace
          </h4>
          <p className="text-body-secondary mb-0">
            Plan the day, inspect deadlines, monitor workload, and track momentum.
          </p>
        </div>
        <CButton color="primary" onClick={fetchWorkspace} disabled={loading}>
          {loading ? (
            <CSpinner size="sm" className="me-2" />
          ) : (
            <CIcon icon={cilReload} className="me-2" />
          )}
          Refresh
        </CButton>
      </div>

      {error && (
        <CAlert color="danger" className="d-flex flex-wrap align-items-center gap-2">
          <CIcon icon={cilWarning} />
          <span className="me-auto">{error}</span>
          <CButton color="danger" variant="outline" size="sm" onClick={fetchWorkspace}>
            Retry
          </CButton>
        </CAlert>
      )}

      {loading && !workspace.events?.length ? (
        <div className="text-center py-5">
          <CSpinner color="primary" />
          <div className="small text-body-secondary mt-2">Loading workspace...</div>
        </div>
      ) : (
        <>
          <CRow className="g-3 mb-4">
            <CCol xs={12} sm={6} xl={2}>
              <WorkspaceMetric
                icon={cilTask}
                label="Active Tasks"
                value={workload.active_tasks}
                color="primary"
              />
            </CCol>
            <CCol xs={12} sm={6} xl={2}>
              <WorkspaceMetric
                icon={cilWarning}
                label="Overdue"
                value={workload.overdue_tasks}
                color="danger"
              />
            </CCol>
            <CCol xs={12} sm={6} xl={2}>
              <WorkspaceMetric
                icon={cilCheckCircle}
                label="Done This Week"
                value={workload.completed_this_week}
                color="success"
              />
            </CCol>
            <CCol xs={12} sm={6} xl={2}>
              <WorkspaceMetric
                icon={cilGraph}
                label="Completion Rate"
                value={`${workload.completion_rate || 0}%`}
                color="info"
              />
            </CCol>
            <CCol xs={12} sm={6} xl={2}>
              <WorkspaceMetric
                icon={cilClock}
                label="Review Queue"
                value={workload.ready_for_review}
                color="warning"
              />
            </CCol>
            <CCol xs={12} sm={6} xl={2}>
              <WorkspaceMetric
                icon={cilList}
                label="Workload"
                value={workloadStatus}
                color={workloadColor}
                caption={`${workload.active_tasks || 0} active assignments`}
              />
            </CCol>
          </CRow>

          <CRow className="g-3 mb-4">
            <CCol xs={12} xl={8}>
              <CCard className="h-100">
                <CCardHeader>
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div>
                      <div className="fw-semibold">
                        {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                      </div>
                      <div className="small text-body-secondary">
                        Tasks, project deadlines, reviews, and extension requests
                      </div>
                    </div>
                    <CButtonGroup size="sm">
                      <CButton color="secondary" variant="outline" onClick={() => changeMonth(-1)}>
                        <CIcon icon={cilArrowLeft} />
                      </CButton>
                      <CButton
                        color="secondary"
                        variant="outline"
                        onClick={() => {
                          setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
                          setSelectedDate(today)
                        }}
                      >
                        Today
                      </CButton>
                      <CButton color="secondary" variant="outline" onClick={() => changeMonth(1)}>
                        <CIcon icon={cilArrowRight} />
                      </CButton>
                    </CButtonGroup>
                  </div>
                </CCardHeader>
                <CCardBody>
                  <div className="workspace-calendar-weekdays">
                    {WEEKDAYS.map((day) => (
                      <div key={day}>{day}</div>
                    ))}
                  </div>
                  <div className="workspace-calendar-grid">
                    {calendarDays.map((day, index) => {
                      if (!day)
                        return (
                          <div
                            key={`blank-${index}`}
                            className="workspace-calendar-cell is-empty"
                          />
                        )
                      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                      const key = formatDateKey(date)
                      const dayEvents = eventsByDate[key] || []
                      const isToday = key === formatDateKey(today)
                      const isSelected = key === selectedKey

                      return (
                        <button
                          key={key}
                          className={`workspace-calendar-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => setSelectedDate(date)}
                        >
                          <span className="workspace-calendar-day">{day}</span>
                          <div className="workspace-calendar-events">
                            {dayEvents.slice(0, 3).map((event) => {
                              const config = eventConfig[event.status] || eventConfig.todo
                              return (
                                <span
                                  key={event.id}
                                  className="workspace-event-pill"
                                  style={{ borderColor: config.tone }}
                                >
                                  <span style={{ background: config.tone }} />
                                  {event.title}
                                </span>
                              )
                            })}
                            {dayEvents.length > 3 && <small>+{dayEvents.length - 3} more</small>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} xl={4}>
              <CCard className="h-100">
                <CCardHeader>
                  <div className="fw-semibold">
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="small text-body-secondary fw-normal mt-1">
                    {selectedEvents.length} scheduled item{selectedEvents.length === 1 ? '' : 's'}
                  </div>
                </CCardHeader>
                <CCardBody>
                  {selectedEvents.length === 0 ? (
                    <div className="workspace-empty-state">
                      <CIcon icon={cilCalendar} />
                      <span>No scheduled work for this day.</span>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {selectedEvents.map((event) => {
                        const config = eventConfig[event.status] || eventConfig.todo
                        const health = healthConfig[event.health] || healthConfig.healthy
                        return (
                          <div key={event.id} className="workspace-event-card">
                            <div className="d-flex align-items-start justify-content-between gap-3">
                              <div className="min-w-0">
                                <div className="fw-semibold text-truncate">{event.title}</div>
                                <div className="small text-body-secondary text-truncate">
                                  {event.project_name || event.type}
                                </div>
                              </div>
                              <CBadge color={config.color}>{config.label}</CBadge>
                            </div>
                            <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
                              {event.priority && (
                                <CBadge color={event.priority === 'high' ? 'danger' : 'secondary'}>
                                  {event.priority}
                                </CBadge>
                              )}
                              <CBadge color={health.color}>{health.label}</CBadge>
                              <span className="small text-body-secondary ms-auto">
                                {event.progress || 0}%
                              </span>
                            </div>
                            <CProgress
                              value={event.progress || 0}
                              color={health.color}
                              height={6}
                              className="rounded-pill mt-3"
                            />
                            {event.type === 'task' && (
                              <CButton
                                color="primary"
                                size="sm"
                                variant="outline"
                                className="mt-3"
                                onClick={() => openTask(event)}
                              >
                                Open task
                              </CButton>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          <CRow className="g-3 mb-4">
            <CCol xs={12} lg={4}>
              <CCard className="h-100">
                <CCardHeader>
                  <div className="fw-semibold">Today's Focus</div>
                  <div className="small text-body-secondary fw-normal mt-1">
                    Priority, overdue, review, and blocked work
                  </div>
                </CCardHeader>
                <CCardBody>
                  {workspace.today_focus?.length ? (
                    <div className="d-flex flex-column gap-3">
                      {workspace.today_focus.map((task) => (
                        <TaskSummaryItem key={task.id} task={task} onOpen={openTask} />
                      ))}
                    </div>
                  ) : (
                    <div className="workspace-empty-state">
                      <CIcon icon={cilCheckCircle} />
                      <span>No urgent focus tasks right now.</span>
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} lg={4}>
              <CCard className="h-100">
                <CCardHeader>
                  <div className="fw-semibold">Upcoming Deadlines</div>
                  <div className="small text-body-secondary fw-normal mt-1">
                    Nearest due dates first
                  </div>
                </CCardHeader>
                <CCardBody>
                  {workspace.upcoming_deadlines?.length ? (
                    <div className="d-flex flex-column gap-3">
                      {workspace.upcoming_deadlines.map((task) => (
                        <TaskSummaryItem key={task.id} task={task} onOpen={openTask} />
                      ))}
                    </div>
                  ) : (
                    <div className="workspace-empty-state">
                      <CIcon icon={cilClock} />
                      <span>No upcoming deadlines.</span>
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} lg={4}>
              <CCard className="h-100">
                <CCardHeader>
                  <div className="d-flex align-items-center justify-content-between gap-3">
                    <div>
                      <div className="fw-semibold">Notifications</div>
                      <div className="small text-body-secondary fw-normal mt-1">
                        Assignments, comments, requests, and approvals
                      </div>
                    </div>
                    <CButton
                      color="secondary"
                      size="sm"
                      variant="outline"
                      onClick={markAllNotificationsRead}
                    >
                      Read all
                    </CButton>
                  </div>
                </CCardHeader>
                <CCardBody>
                  {notifications.length ? (
                    <div className="d-flex flex-column gap-3">
                      {notifications.slice(0, 8).map((notification) => (
                        <button
                          key={notification.id}
                          className={`workspace-notification text-start ${notification.read_at ? '' : 'is-unread'}`}
                          onClick={() => markNotificationRead(notification.id)}
                        >
                          <CIcon
                            icon={cilBell}
                            className={
                              notification.read_at ? 'text-body-secondary' : 'text-primary'
                            }
                          />
                          <div className="min-w-0">
                            <div className="fw-semibold text-truncate">
                              {notification.data?.message || notification.type}
                            </div>
                            <div className="small text-body-secondary">
                              {fromNow(notification.created_at)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="workspace-empty-state">
                      <CIcon icon={cilBell} />
                      <span>No notifications.</span>
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          <CRow className="g-3 mb-4">
            <CCol xs={12} lg={4}>
              <CCard className="h-100">
                <CCardHeader>
                  <div className="fw-semibold">Weekly Completion Trend</div>
                </CCardHeader>
                <CCardBody>
                  <div style={{ height: 260 }}>
                    <CChartLine
                      data={{
                        labels: productivity.weekly_completion_trend?.labels || [],
                        datasets: [
                          {
                            label: 'Completed tasks',
                            data: productivity.weekly_completion_trend?.data || [],
                            borderColor: getStyle('--cui-success'),
                            backgroundColor: 'rgba(22, 163, 74, 0.12)',
                            fill: true,
                            tension: 0.35,
                          },
                        ],
                      }}
                      options={chartOptions}
                    />
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={12} lg={4}>
              <CCard className="h-100">
                <CCardHeader>
                  <div className="fw-semibold">Task Status Distribution</div>
                </CCardHeader>
                <CCardBody>
                  <div style={{ height: 260 }}>
                    <CChartDoughnut
                      data={{
                        labels: ['To Do', 'In Progress', 'Ready Review', 'Done', 'On Hold'],
                        datasets: [
                          {
                            data: [
                              productivity.task_status_distribution?.todo || 0,
                              productivity.task_status_distribution?.in_progress || 0,
                              productivity.task_status_distribution?.ready_for_review || 0,
                              productivity.task_status_distribution?.done || 0,
                              productivity.task_status_distribution?.on_hold || 0,
                            ],
                            backgroundColor: [
                              '#64748b',
                              '#0891b2',
                              '#06b6d4',
                              '#16a34a',
                              '#d97706',
                            ],
                          },
                        ],
                      }}
                      options={doughnutOptions}
                    />
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xs={12} lg={4}>
              <CCard className="h-100">
                <CCardHeader>
                  <div className="fw-semibold">Monthly Productivity</div>
                </CCardHeader>
                <CCardBody>
                  <div style={{ height: 260 }}>
                    <CChartBar
                      data={{
                        labels: productivity.monthly_productivity?.labels || [],
                        datasets: [
                          {
                            label: 'Completed tasks',
                            data: productivity.monthly_productivity?.data || [],
                            backgroundColor: getStyle('--cui-primary'),
                            borderRadius: 6,
                          },
                        ],
                      }}
                      options={chartOptions}
                    />
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          <CRow className="g-3">
            <CCol xs={12} lg={7}>
              <CCard className="h-100">
                <CCardHeader>
                  <div className="fw-semibold">Employee Activity Timeline</div>
                  <div className="small text-body-secondary fw-normal mt-1">
                    Recent task, request, comment, and review activity
                  </div>
                </CCardHeader>
                <CCardBody>
                  {activity.length ? (
                    <div className="workspace-timeline">
                      {activity.map((item) => (
                        <div key={item.id} className="workspace-timeline-item">
                          <CAvatar color="primary" textColor="white" size="sm">
                            {getInitials(item.user?.name)}
                          </CAvatar>
                          <div className="workspace-timeline-line" />
                          <div className="min-w-0">
                            <div className="fw-semibold">{item.description || item.action}</div>
                            <div className="small text-body-secondary">
                              {item.action} - {fromNow(item.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="workspace-empty-state">
                      <CIcon icon={cilCommentBubble} />
                      <span>No recent activity.</span>
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} lg={5}>
              <CCard className="h-100">
                <CCardHeader>
                  <div className="fw-semibold">Task Dependency Tree</div>
                  <div className="small text-body-secondary fw-normal mt-1">
                    Parent tasks, recursive subtasks, and inherited progress
                  </div>
                </CCardHeader>
                <CCardBody>
                  {workspace.dependency_tree?.length ? (
                    <div className="d-flex flex-column gap-3">
                      {workspace.dependency_tree.map((node) => (
                        <DependencyNode key={node.id} node={node} />
                      ))}
                    </div>
                  ) : (
                    <div className="workspace-empty-state">
                      <CIcon icon={cilUser} />
                      <span>No dependency tree available.</span>
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </>
      )}
    </div>
  )
}

export default Calendar
