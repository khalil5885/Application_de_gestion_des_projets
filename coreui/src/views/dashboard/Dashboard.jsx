import React, { useEffect, useState } from 'react'
import {
  CButton, CCard, CCardBody, CCol, CRow,
  CBadge, CListGroup, CListGroupItem, CAvatar, CSpinner, CProgressBar, CProgress,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBriefcase, cilTask, cilPeople, cilClock,
  cilPlus, cilCheckCircle, cilWarning, cilArrowRight,
} from '@coreui/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityColors = { high: 'danger', medium: 'warning', low: 'secondary' }

const statusColors = {
  pending:     'secondary',
  in_progress: 'primary',
  completed:   'success',
  on_hold:     'warning',
}

const deadlineColor = (dateStr) => {
  const days = Math.ceil((new Date(dateStr) - new Date()) / 86400000)
  if (days <= 1)  return 'danger'
  if (days <= 3)  return 'warning'
  return 'info'
}

const getEndpoint = (role) => {
  if (role === 'admin')    return '/api/admin/dashboard'
  if (role === 'employee') return '/api/employee/dashboard'
  if (role === 'client')   return '/api/client/dashboard'
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, subtitle, color }) => (
  <CCard
    className="border-0 shadow-sm h-100"
    style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-3px)'
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = ''
    }}
  >
    <CCardBody className="p-4">
      <div
        className={`d-flex align-items-center justify-content-center rounded-3 bg-${color} bg-opacity-10 mb-3`}
        style={{ width: 48, height: 48 }}
      >
        <CIcon icon={icon} size="lg" className={`text-${color}`} />
      </div>
      <div className="fs-2 fw-bold mb-1">{value ?? '—'}</div>
      <div className="text-body-secondary small mb-1">{label}</div>
      {subtitle && <div className="text-success small fw-semibold">{subtitle}</div>}
    </CCardBody>
  </CCard>
)

// ─── Role Views ───────────────────────────────────────────────────────────────

const AdminDashboard = ({ data, navigate }) => (
  <>
    <CRow className="g-4 mb-4">
      <CCol xs={12} sm={6} xl={3}>
        <StatCard icon={cilBriefcase} label="Active Projects"   value={data.stats.active_projects}   subtitle={`↑ ${data.stats.new_projects_month} new this month`} color="primary" />
      </CCol>
      <CCol xs={12} sm={6} xl={3}>
        <StatCard icon={cilCheckCircle} label="Tasks Completed" value={data.stats.completed_tasks}   subtitle={`↑ ${data.stats.new_tasks_week} this week`}         color="success" />
      </CCol>
      <CCol xs={12} sm={6} xl={3}>
        <StatCard icon={cilClock}       label="Pending Tasks"   value={data.stats.pending_tasks}     color="warning" />
      </CCol>
      <CCol xs={12} sm={6} xl={3}>
        <StatCard icon={cilPeople}      label="Team Members"    value={data.stats.total_members}     color="info" />
      </CCol>
    </CRow>

    <CRow className="g-4">
      {/* Recent Activity */}
      <CCol xs={12} lg={7}>
        <CCard className="border-0 shadow-sm h-100">
          <CCardBody className="p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-semibold mb-0">Recent Activity</h5>
              <CButton color="link" size="sm" className="p-0 text-decoration-none"
                onClick={() => navigate('/workspace/activity')}>
                View all <CIcon icon={cilArrowRight} size="sm" />
              </CButton>
            </div>
            <CListGroup flush>
              {data.recent_activity?.length === 0 && (
                <p className="text-body-secondary small">No activity yet.</p>
              )}
              {data.recent_activity?.map(item => (
                <CListGroupItem key={item.id} className="px-0 py-3 border-bottom d-flex align-items-center gap-3" style={{ background: 'transparent' }}>
                  <CAvatar color="primary" textColor="white" size="sm">
                    {item.user?.[0] ?? '?'}
                  </CAvatar>
                  <div className="flex-grow-1 small">
                    <strong>{item.user}</strong>{' '}
                    <span className="text-body-secondary">{item.event}</span>{' '}
                    <span className="fw-semibold">{item.subject_type}: {item.subject_name}</span>
                  </div>
                  <span className="text-body-secondary small text-nowrap">{item.time}</span>
                </CListGroupItem>
              ))}
            </CListGroup>
          </CCardBody>
        </CCard>
      </CCol>

      {/* Upcoming Deadlines */}
      <CCol xs={12} lg={5}>
        <CCard className="border-0 shadow-sm h-100">
          <CCardBody className="p-4">
            <h5 className="fw-semibold mb-3">Upcoming Deadlines</h5>
            {data.upcoming_deadlines?.length === 0 && (
              <p className="text-body-secondary small">No upcoming deadlines 🎉</p>
            )}
            <CListGroup flush>
              {data.upcoming_deadlines?.map(item => {
                const color = deadlineColor(item.end_date)
                return (
                  <CListGroupItem key={item.id} className="px-0 py-2 border-bottom d-flex align-items-center gap-2" style={{ background: 'transparent' }}>
                    <CIcon icon={cilWarning} className={`text-${color}`} size="sm" />
                    <span className="flex-grow-1 small">{item.name}</span>
                    <CBadge color={color} shape="rounded-pill">
                      {new Date(item.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </CBadge>
                  </CListGroupItem>
                )
              })}
            </CListGroup>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  </>
)

const EmployeeDashboard = ({ data, navigate }) => (
  <>
    <CRow className="g-4 mb-4">
      <CCol xs={12} sm={6} xl={3}>
        <StatCard icon={cilTask}        label="My Tasks"         value={data.stats.total_tasks}     color="primary" />
      </CCol>
      <CCol xs={12} sm={6} xl={3}>
        <StatCard icon={cilCheckCircle} label="Completed"        value={data.stats.completed_tasks} color="success" />
      </CCol>
      <CCol xs={12} sm={6} xl={3}>
        <StatCard icon={cilClock}       label="In Progress"      value={data.stats.in_progress}     color="warning" />
      </CCol>
      <CCol xs={12} sm={6} xl={3}>
        <StatCard icon={cilBriefcase}   label="To Do"            value={data.stats.todo}            color="info" />
      </CCol>
    </CRow>

    <CRow className="g-4">
      {/* My Projects */}
      <CCol xs={12} lg={7}>
        <CCard className="border-0 shadow-sm h-100">
          <CCardBody className="p-4">
            <h5 className="fw-semibold mb-3">My Projects</h5>
            {data.my_projects?.length === 0 && (
              <p className="text-body-secondary small">No projects assigned yet.</p>
            )}
            <div className="d-flex flex-column gap-3">
              {data.my_projects?.map(p => (
                <div key={p.id} className="d-flex flex-column gap-1"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/projects/${p.id}`)}>
                  <div className="d-flex justify-content-between small">
                    <span className="fw-semibold">{p.name}</span>
                    <span className="text-body-secondary">{p.progress}%</span>
                  </div>
                  <CProgress height={6}>
                    <CProgressBar value={p.progress} color={p.progress === 100 ? 'success' : 'primary'} />
                  </CProgress>
                </div>
              ))}
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      {/* Upcoming Tasks */}
      <CCol xs={12} lg={5}>
        <CCard className="border-0 shadow-sm h-100">
          <CCardBody className="p-4">
            <h5 className="fw-semibold mb-3">Upcoming Tasks</h5>
            {data.upcoming_tasks?.length === 0 && (
              <p className="text-body-secondary small">No upcoming tasks 🎉</p>
            )}
            <CListGroup flush>
              {data.upcoming_tasks?.map(task => (
                <CListGroupItem key={task.id} className="px-0 py-2 border-bottom d-flex align-items-center gap-2" style={{ background: 'transparent' }}>
                  <CIcon icon={cilTask} className="text-body-secondary" size="sm" />
                  <span className="flex-grow-1 small">{task.title}</span>
                  <CBadge color={priorityColors[task.priority]} shape="rounded-pill">
                    {task.priority}
                  </CBadge>
                </CListGroupItem>
              ))}
            </CListGroup>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  </>
)

const ClientDashboard = ({ data }) => (
  <>
    <CRow className="g-4 mb-4">
      <CCol xs={12} sm={6} xl={3}>
        <StatCard icon={cilBriefcase}   label="My Projects"      value={data.stats.total_projects}     color="primary" />
      </CCol>
      <CCol xs={12} sm={6} xl={3}>
        <StatCard icon={cilClock}       label="Active"           value={data.stats.active_projects}    color="warning" />
      </CCol>
      <CCol xs={12} sm={6} xl={3}>
        <StatCard icon={cilCheckCircle} label="Completed"        value={data.stats.completed_projects} color="success" />
      </CCol>
      <CCol xs={12} sm={6} xl={3}>
        <StatCard icon={cilTask}        label="Avg. Progress"    value={`${data.stats.avg_progress}%`} color="info" />
      </CCol>
    </CRow>

    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="border-0 shadow-sm">
          <CCardBody className="p-4">
            <h5 className="fw-semibold mb-4">My Projects</h5>
            <div className="d-flex flex-column gap-4">
              {data.projects?.length === 0 && (
                <p className="text-body-secondary small">No projects yet.</p>
              )}
              {data.projects?.map(p => (
                <div key={p.id}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-semibold small">{p.name}</span>
                    <div className="d-flex align-items-center gap-2">
                      <CBadge color={statusColors[p.status] ?? 'secondary'}>
                        {p.status?.replace('_', ' ')}
                      </CBadge>
                      <span className="text-body-secondary small">{p.progress}%</span>
                    </div>
                  </div>
                  <CProgress height={8}>
                    <CProgressBar value={p.progress} color={p.progress === 100 ? 'success' : 'primary'} />
                  </CProgress>
                </div>
              ))}
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  </>
)

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // 1. Identify User/Role from Context OR LocalStorage fallback
    let currentRole = user?.global_role
    if (!currentRole) {
      const saved = localStorage.getItem('user')
      if (saved) currentRole = JSON.parse(saved).global_role
    }

    if (!currentRole) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      setLoading(true)
      try {
        const endpoints = {
          admin: '/api/admin/dashboard',
          employee: '/api/employee/dashboard',
          client: '/api/client/dashboard'
        }
        const res = await api.get(endpoints[currentRole])
        setData(res.data.data)
      } catch (err) {
        setError('Failed to load dashboard.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  if (loading) return <div className="text-center py-5"><CSpinner color="primary" /></div>
  if (error) return <p className="text-danger p-4">{error}</p>

  const activeUser = user || JSON.parse(localStorage.getItem('user'))
  const role = activeUser?.global_role

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Welcome back, {activeUser?.name || 'User'} 👋</h4>
          <p className="text-body-secondary mb-0">Workspace: {role?.toUpperCase()}</p>
        </div>
      </div>

      {data && role === 'admin' && <AdminDashboard data={data} navigate={navigate} />}
      {data && role === 'employee' && <EmployeeDashboard data={data} navigate={navigate} />}
      {data && role === 'client' && <ClientDashboard data={data} />}
      
      {!data && !loading && <p>No data available for your role.</p>}
    </div>
  )
}

export default Dashboard