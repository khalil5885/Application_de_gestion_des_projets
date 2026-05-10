import React, { useMemo } from 'react'
import { CRow, CCol, CBadge } from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import {
  cilBriefcase,
  cilClock,
  cilCheckCircle,
  cilTask,
  cilWarning,
  cilFile,
  cilArrowTop,
  cilBolt,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'

// ─── Hero KPI Card (same pattern as AdminDashboard) ────────────────────────
const HeroCard = ({ icon, label, value, delta, deltaLabel, color = 'primary', onClick }) => (
  <div className={`dash-hero-card dash-hero-card--${color}`} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
    <div className="dash-hero-card__icon">
      <CIcon icon={icon} />
    </div>
    <div className="dash-hero-card__body">
      <span className="dash-hero-card__label">{label}</span>
      <span className="dash-hero-card__value">{value ?? 0}</span>
      {delta !== undefined && (
        <span className="dash-hero-card__delta">
          <CIcon icon={cilArrowTop} className="dash-hero-card__delta-arrow" />
          {delta} {deltaLabel}
        </span>
      )}
    </div>
  </div>
)

// ─── Secondary Metric Card ─────────────────────────────────────────────────
const MetricCard = ({ icon, label, value, color = 'default', onClick }) => (
  <div className={`dash-metric-card dash-metric-card--${color}`} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
    <div className="dash-metric-card__icon">
      <CIcon icon={icon} />
    </div>
    <div className="dash-metric-card__body">
      <span className="dash-metric-card__value">{value ?? 0}</span>
      <span className="dash-metric-card__label">{label}</span>
    </div>
  </div>
)

// ─── Section Header ────────────────────────────────────────────────────────
const SectionHeader = ({ title, action, actionLabel }) => (
  <div className="dash-section-header">
    <span className="dash-section-header__title">{title}</span>
    {action && (
      <button className="dash-section-header__action" onClick={action}>
        {actionLabel}
      </button>
    )}
  </div>
)

// ─── Project Progress Row ──────────────────────────────────────────────────
// Client sees their projects as a progress list — not a task board
const ProjectProgressItem = ({ project, onClick }) => {
  const pct    = Number(project?.progress ?? project?.completion_rate ?? 0)
  const status = project?.status || 'active'
  const isDelayed  = status === 'delayed' || status === 'overdue'
  const isComplete = status === 'completed' || status === 'done'

  const barColor = isDelayed ? 'danger' : isComplete ? 'success' : pct >= 70 ? 'primary' : 'warning'

  return (
    <div className="dash-project-row" onClick={onClick} role="button" tabIndex={0}>
      <div className="dash-project-row__header">
        <span className="dash-project-row__name">{project?.name || project?.title}</span>
        <div className="dash-project-row__badges">
          {isDelayed && (
            <CBadge className="dash-badge dash-badge--danger">Delayed</CBadge>
          )}
          {isComplete && (
            <CBadge className="dash-badge dash-badge--success">Done</CBadge>
          )}
          {!isDelayed && !isComplete && (
            <CBadge className="dash-badge dash-badge--info">Active</CBadge>
          )}
          <span className={`dash-project-row__pct dash-project-row__pct--${barColor}`}>{pct}%</span>
        </div>
      </div>
      <div className="dash-project-row__track">
        <div
          className={`dash-project-row__bar dash-project-row__bar--${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {project?.due_date && (
        <span className="dash-project-row__due">Due {project.due_date}</span>
      )}
    </div>
  )
}

// ─── Milestone Item ────────────────────────────────────────────────────────
const MilestoneItem = ({ milestone }) => {
  const isUrgent = milestone?.days_left <= 3

  return (
    <div className={`dash-milestone-item ${isUrgent ? 'dash-milestone-item--urgent' : ''}`}>
      <div className="dash-milestone-item__dot" />
      <div className="dash-milestone-item__body">
        <span className="dash-milestone-item__name">{milestone?.title || milestone?.name}</span>
        <span className="dash-milestone-item__project">{milestone?.project_name}</span>
      </div>
      {milestone?.due_date && (
        <span className={`dash-milestone-item__date ${isUrgent ? 'text-danger' : 'text-muted'}`}>
          {milestone.due_date}
        </span>
      )}
    </div>
  )
}

// ─── Activity Item ─────────────────────────────────────────────────────────
const ActivityItem = ({ activity }) => {
  const typeMap = {
    task_created:   { label: 'Created',   color: 'info' },
    task_completed: { label: 'Completed', color: 'success' },
    project_update: { label: 'Updated',   color: 'warning' },
    comment:        { label: 'Comment',   color: 'info' },
  }
  const meta = typeMap[activity?.type] || { label: 'Update', color: 'secondary' }

  return (
    <div className="dash-activity-item">
      <div className={`dash-activity-item__dot dash-activity-item__dot--${meta.color}`} />
      <div className="dash-activity-item__body">
        <span className="dash-activity-item__text">{activity?.description || activity?.message || '—'}</span>
        <span className="dash-activity-item__time">{activity?.created_at_human || activity?.time || '—'}</span>
      </div>
      <CBadge className={`dash-badge dash-badge--${meta.color}`}>{meta.label}</CBadge>
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────
const EmptyState = ({ icon, message, action, actionLabel }) => (
  <div className="dash-empty-state">
    <CIcon icon={icon} className="dash-empty-state__icon" />
    <p className="dash-empty-state__text">{message}</p>
    {action && (
      <button className="dash-empty-state__btn" onClick={action}>{actionLabel}</button>
    )}
  </div>
)

// ─── ClientDashboard ───────────────────────────────────────────────────────
const ClientDashboard = ({ data }) => {
  const navigate   = useNavigate()
  const s          = data?.stats || {}
  const projects   = data?.projects || []
  const activities = data?.recent_activity || []
  const milestones = data?.upcoming_milestones || []
  const avgPct     = Number(s.avg_progress || 0)

  const delayedProjects = useMemo(
    () => projects.filter(p => p.status === 'delayed' || p.status === 'overdue'),
    [projects]
  )

  return (
    <div className="dash-client">

      {/* ── Row 1: Hero KPIs ─────────────────────────────────────────────── */}
      <CRow className="g-3 mb-4">
        <CCol xs={12} sm={6} xl={3}>
          <HeroCard
            icon={cilBriefcase}
            label="My projects"
            value={s.total_projects ?? 0}
            color="primary"
            onClick={() => navigate('/projects')}
          />
        </CCol>
        <CCol xs={12} sm={6} xl={3}>
          <HeroCard
            icon={cilClock}
            label="In progress"
            value={s.active_projects ?? 0}
            color="warning"
            onClick={() => navigate('/projects')}
          />
        </CCol>
        <CCol xs={12} sm={6} xl={3}>
          <HeroCard
            icon={cilCheckCircle}
            label="Completed"
            value={s.completed_projects ?? 0}
            color="success"
            onClick={() => navigate('/projects')}
          />
        </CCol>
        <CCol xs={12} sm={6} xl={3}>
          <HeroCard
            icon={cilTask}
            label="Avg. progress"
            value={`${avgPct}%`}
            color="info"
          />
        </CCol>
      </CRow>

      {/* ── Row 2: Secondary metrics ──────────────────────────────────────── */}
      <CRow className="g-3 mb-4">
        <CCol xs={6} xl={3}>
          <MetricCard icon={cilWarning}      label="Delayed projects"    value={s.delayed_projects ?? 0}             color="danger"  onClick={() => navigate('/projects')} />
        </CCol>
        <CCol xs={6} xl={3}>
          <MetricCard icon={cilClock}        label="Upcoming milestones" value={milestones.length}                   color="warning" />
        </CCol>
        <CCol xs={6} xl={3}>
          <MetricCard icon={cilTask}         label="Open updates"        value={s.open_updates ?? 0}                 color="info"    />
        </CCol>
        <CCol xs={6} xl={3}>
          <MetricCard icon={cilFile}         label="Documents"           value={s.documents ?? 0}                    color="default" onClick={() => navigate('/documents')} />
        </CCol>
      </CRow>

      {/* ── Row 3: Projects progress list ────────────────────────────────── */}
      <CRow className="g-3 mb-4">
        <CCol xs={12}>
          <div className="dash-card">
            <SectionHeader
              title="Your projects"
              action={() => navigate('/projects')}
              actionLabel="View all →"
            />
            {projects.length > 0
              ? projects.slice(0, 6).map((p, i) => (
                  <ProjectProgressItem
                    key={p.id ?? i}
                    project={p}
                    onClick={() => navigate(`/projects/${p.id}`)}
                  />
                ))
              : <EmptyState icon={cilBriefcase} message="No projects assigned yet." />
            }
          </div>
        </CCol>
      </CRow>

      {/* ── Row 4: Activity + Milestones ──────────────────────────────────── */}
      <CRow className="g-3">
        <CCol xs={12} lg={7}>
          <div className="dash-card dash-card--scroll">
            <SectionHeader title="Recent activity" />
            {activities.length > 0
              ? activities.slice(0, 8).map((a, i) => <ActivityItem key={a.id ?? i} activity={a} />)
              : <EmptyState icon={cilBolt} message="No recent activity on your projects." />
            }
          </div>
        </CCol>
        <CCol xs={12} lg={5}>
          <div className="dash-card dash-card--scroll">
            <SectionHeader title="Upcoming milestones" />
            {milestones.length > 0
              ? milestones.map((m, i) => <MilestoneItem key={m.id ?? i} milestone={m} />)
              : <EmptyState icon={cilClock} message="No upcoming milestones." />
            }
          </div>
        </CCol>
      </CRow>

    </div>
  )
}

export default ClientDashboard