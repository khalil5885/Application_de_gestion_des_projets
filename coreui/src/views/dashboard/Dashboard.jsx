import React from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CRow,
  CBadge,
  CListGroup,
  CListGroupItem,
  CAvatar,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBriefcase,
  cilTask,
  cilPeople,
  cilClock,
  cilPlus,
  cilCheckCircle,
  cilWarning,
  cilUser,
  cilArrowRight,
} from '@coreui/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, subtitle, color }) => (
  <CCard
    className="border-0 shadow-sm h-100"
    style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease', cursor: 'default' }}
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
      <div className="d-flex align-items-start justify-content-between mb-3">
        <div
          className={`d-flex align-items-center justify-content-center rounded-3 bg-${color} bg-opacity-10`}
          style={{ width: 48, height: 48, flexShrink: 0 }}
        >
          <CIcon icon={icon} size="lg" className={`text-${color}`} />
        </div>
      </div>
      <div className="fs-2 fw-bold mb-1">{value}</div>
      <div className="text-body-secondary small mb-1">{label}</div>
      {subtitle && (
        <div className="text-success small fw-semibold">{subtitle}</div>
      )}
    </CCardBody>
  </CCard>
)

// ─── Mock Data ────────────────────────────────────────────────────────────────
const recentActivity = [
  { id: 1, user: 'Alice', action: 'created project', target: 'Website Redesign', time: '2m ago', color: 'primary' },
  { id: 2, user: 'Bob', action: 'completed task', target: 'API Integration', time: '18m ago', color: 'success' },
  { id: 3, user: 'Carol', action: 'added comment on', target: 'Mobile App Phase 1', time: '1h ago', color: 'info' },
  { id: 4, user: 'Dave', action: 'updated task status in', target: 'CRM Dashboard', time: '3h ago', color: 'warning' },
  { id: 5, user: 'Eve', action: 'joined project', target: 'Data Pipeline', time: '5h ago', color: 'secondary' },
]

const todayTasks = [
  { id: 1, title: 'Review API endpoints', priority: 'high', done: false },
  { id: 2, title: 'Update project documentation', priority: 'medium', done: true },
  { id: 3, title: 'Fix login redirect bug', priority: 'high', done: true },
  { id: 4, title: 'Sync with design team', priority: 'low', done: false },
]

const upcomingDeadlines = [
  { id: 1, title: 'Website Redesign - Phase 1', due: 'Tomorrow', color: 'danger' },
  { id: 2, title: 'API Integration Final', due: 'Apr 14', color: 'warning' },
  { id: 3, title: 'Mobile App Beta', due: 'Apr 18', color: 'info' },
]

const priorityColors = { high: 'danger', medium: 'warning', low: 'secondary' }

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.global_role === 'admin'

  return (
    <>
      {/* ── Welcome Banner + Quick Actions ─────────────────────── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            Welcome back, {user?.name || 'there'} 👋
          </h4>
          <p className="text-body-secondary mb-0">
            Here&apos;s what&apos;s happening in your workspace today.
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <CButton
            color="primary"
            className="d-flex align-items-center gap-2"
            onClick={() => navigate('/admin/projects')}
          >
            <CIcon icon={cilPlus} />
            Create Project
          </CButton>
          {isAdmin && (
            <CButton
              color="secondary"
              variant="outline"
              className="d-flex align-items-center gap-2"
              onClick={() => navigate('/admin/users')}
            >
              <CIcon icon={cilPeople} />
              Manage Users
            </CButton>
          )}
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────── */}
      <CRow className="g-4 mb-4">
        <CCol xs={12} sm={6} xl={3}>
          <StatCard
            icon={cilBriefcase}
            label="Active Projects"
            value="8"
            subtitle="↑ 2 new this week"
            color="primary"
          />
        </CCol>
        <CCol xs={12} sm={6} xl={3}>
          <StatCard
            icon={cilCheckCircle}
            label="Tasks Completed"
            value="34"
            subtitle="↑ 12 this week"
            color="success"
          />
        </CCol>
        <CCol xs={12} sm={6} xl={3}>
          <StatCard
            icon={cilClock}
            label="Pending Tasks"
            value="17"
            subtitle="3 due today"
            color="warning"
          />
        </CCol>
        <CCol xs={12} sm={6} xl={3}>
          <StatCard
            icon={cilPeople}
            label="Team Members"
            value="12"
            subtitle="↑ 1 joined recently"
            color="info"
          />
        </CCol>
      </CRow>

      {/* ── Main Content Row ────────────────────────────────────── */}
      <CRow className="g-4">
        {/* Recent Activity */}
        <CCol xs={12} lg={7}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="fw-semibold mb-0">Recent Activity</h5>
                <CButton color="link" size="sm" className="text-decoration-none p-0">
                  View all <CIcon icon={cilArrowRight} size="sm" />
                </CButton>
              </div>
              <CListGroup flush>
                {recentActivity.map((item) => (
                  <CListGroupItem
                    key={item.id}
                    className="px-0 py-3 border-bottom d-flex align-items-center gap-3"
                    style={{ background: 'transparent' }}
                  >
                    <CAvatar
                      color={item.color}
                      textColor="white"
                      size="sm"
                    >
                      {item.user[0]}
                    </CAvatar>
                    <div className="flex-grow-1 small">
                      <strong>{item.user}</strong> {item.action}{' '}
                      <span className={`text-${item.color} fw-semibold`}>{item.target}</span>
                    </div>
                    <span className="text-body-secondary small text-nowrap">{item.time}</span>
                  </CListGroupItem>
                ))}
              </CListGroup>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Right column: Today's Tasks + Upcoming Deadlines */}
        <CCol xs={12} lg={5}>
          <div className="d-flex flex-column gap-4 h-100">
            {/* Today's Tasks */}
            <CCard className="border-0 shadow-sm">
              <CCardBody className="p-4">
                <h5 className="fw-semibold mb-3">Today&apos;s Tasks</h5>
                {todayTasks.length === 0 ? (
                  <p className="text-body-secondary small mb-0">No tasks for today 🎉</p>
                ) : (
                  <CListGroup flush>
                    {todayTasks.map((task) => (
                      <CListGroupItem
                        key={task.id}
                        className="px-0 py-2 border-bottom d-flex align-items-center gap-2"
                        style={{ background: 'transparent' }}
                      >
                        <CIcon
                          icon={task.done ? cilCheckCircle : cilTask}
                          className={task.done ? 'text-success' : 'text-body-secondary'}
                          size="sm"
                        />
                        <span
                          className={`flex-grow-1 small ${task.done ? 'text-decoration-line-through text-body-secondary' : ''}`}
                        >
                          {task.title}
                        </span>
                        <CBadge color={priorityColors[task.priority]} shape="rounded-pill">
                          {task.priority}
                        </CBadge>
                      </CListGroupItem>
                    ))}
                  </CListGroup>
                )}
              </CCardBody>
            </CCard>

            {/* Upcoming Deadlines */}
            <CCard className="border-0 shadow-sm">
              <CCardBody className="p-4">
                <h5 className="fw-semibold mb-3">Upcoming Deadlines</h5>
                {upcomingDeadlines.length === 0 ? (
                  <p className="text-body-secondary small mb-0">No upcoming deadlines — great job!</p>
                ) : (
                  <CListGroup flush>
                    {upcomingDeadlines.map((item) => (
                      <CListGroupItem
                        key={item.id}
                        className="px-0 py-2 border-bottom d-flex align-items-center gap-2"
                        style={{ background: 'transparent' }}
                      >
                        <CIcon icon={cilWarning} className={`text-${item.color}`} size="sm" />
                        <span className="flex-grow-1 small">{item.title}</span>
                        <CBadge color={item.color} shape="rounded-pill">
                          {item.due}
                        </CBadge>
                      </CListGroupItem>
                    ))}
                  </CListGroup>
                )}
              </CCardBody>
            </CCard>
          </div>
        </CCol>
      </CRow>
    </>
  )
}

export default Dashboard