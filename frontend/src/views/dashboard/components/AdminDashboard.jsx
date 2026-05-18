import React, { useMemo } from 'react'
import { CRow, CCol, CProgress, CBadge } from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import {
  cilBriefcase,
  cilCheckCircle,
  cilClock,
  cilPeople,
  cilWarning,
  cilLayers,
  cilArrowTop,
  cilBolt,
  cilChart,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'

// ─── Hero KPI Card ────────────────────────────────────────────────────────────
const HeroCard = ({ icon, label, value, delta, deltaLabel, color = 'primary', onClick }) => (
  <div className={`dash-hero-card dash-hero-card--${color}`} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
    <div className="dash-hero-card__icon">
      <CIcon icon={icon} />
    </div>
    <div className="dash-hero-card__body">
      <span className="dash-hero-card__label">{label}</span>
      <span className="dash-hero-card__value">{value}</span>
      {delta !== undefined && (
        <span className="dash-hero-card__delta">
          <CIcon icon={cilArrowTop} className="dash-hero-card__delta-arrow" />
          {delta} {deltaLabel}
        </span>
      )}
    </div>
  </div>
)

// ─── Secondary Metric Card ────────────────────────────────────────────────────
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

// ─── Section Header ────────────────────────────────────────────────────────────
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

// ─── Activity Item ────────────────────────────────────────────────────────────
const ActivityItem = ({ activity }) => {
  const typeMap = {
    task_created:   { label: 'Created',   color: 'info' },
    task_completed: { label: 'Completed', color: 'success' },
    task_overdue:   { label: 'Overdue',   color: 'danger' },
    project_update: { label: 'Updated',   color: 'warning' },
  }
  const meta = typeMap[activity?.type] || { label: 'Activity', color: 'secondary' }

  return (
    <div className="dash-activity-item">
      <div className={`dash-activity-item__dot dash-activity-item__dot--${meta.color}`} />
      <div className="dash-activity-item__body">
        <span className="dash-activity-item__text">{activity?.description || activity?.message || 'No description'}</span>
        <span className="dash-activity-item__time">{activity?.created_at_human || activity?.time || '—'}</span>
      </div>
      <CBadge className={`dash-badge dash-badge--${meta.color}`}>{meta.label}</CBadge>
    </div>
  )
}

// ─── Deadline Item ─────────────────────────────────────────────────────────────
const DeadlineItem = ({ deadline }) => {
  const isUrgent = deadline?.days_left <= 2
  const isWarning = deadline?.days_left <= 7

  return (
    <div className={`dash-deadline-item ${isUrgent ? 'dash-deadline-item--urgent' : isWarning ? 'dash-deadline-item--warning' : ''}`}>
      <div className="dash-deadline-item__meta">
        <span className="dash-deadline-item__name">{deadline?.name || deadline?.title}</span>
        <span className="dash-deadline-item__project">{deadline?.project_name}</span>
      </div>
      <div className={`dash-deadline-item__days ${isUrgent ? 'text-danger' : isWarning ? 'text-warning' : 'text-muted'}`}>
        {deadline?.days_left != null ? (
          <>
            <span className="dash-deadline-item__days-num">{deadline.days_left}</span>
            <span className="dash-deadline-item__days-label">days</span>
          </>
        ) : (
          <span className="dash-deadline-item__days-label">{deadline?.due_date}</span>
        )}
      </div>
    </div>
  )
}

// ─── Progress Overview ─────────────────────────────────────────────────────────
const PortfolioProgress = ({ value }) => {
  const pct = Number(value || 0)
  const color = pct >= 75 ? 'success' : pct >= 40 ? 'warning' : 'danger'

  return (
    <div className="dash-portfolio-progress">
      <div className="dash-portfolio-progress__header">
        <span className="dash-portfolio-progress__label">Portfolio completion</span>
        <span className={`dash-portfolio-progress__pct dash-portfolio-progress__pct--${color}`}>{pct}%</span>
      </div>
      <CProgress value={pct} color={color} className="dash-progress" />
      <span className="dash-portfolio-progress__hint">Average across all active projects</span>
    </div>
  )
}

// ─── Risk Summary ──────────────────────────────────────────────────────────────
const RiskSummary = ({ high = 0, medium = 0, ai_summary }) => (
  <div className="dash-risk-summary">
    <div className="dash-risk-summary__row">
      <div className="dash-risk-item dash-risk-item--danger">
        <CIcon icon={cilWarning} className="dash-risk-item__icon" />
        <span className="dash-risk-item__num">{high}</span>
        <span className="dash-risk-item__label">High risk</span>
      </div>
      <div className="dash-risk-item dash-risk-item--warning">
        <CIcon icon={cilWarning} className="dash-risk-item__icon" />
        <span className="dash-risk-item__num">{medium}</span>
        <span className="dash-risk-item__label">Medium risk</span>
      </div>
    </div>
    {ai_summary && (
      <p className="dash-risk-summary__text">{ai_summary}</p>
    )}
  </div>
)

// ─── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ icon, message, action, actionLabel }) => (
  <div className="dash-empty-state">
    <CIcon icon={icon} className="dash-empty-state__icon" />
    <p className="dash-empty-state__text">{message}</p>
    {action && (
      <button className="dash-empty-state__btn" onClick={action}>{actionLabel}</button>
    )}
  </div>
)

// ─── AdminDashboard ────────────────────────────────────────────────────────────
const AdminDashboard = ({ data, navigate }) => {
  const s = data?.stats || {}
  const activities   = data?.recent_activity      || []
  const deadlines    = data?.upcoming_deadlines    || []
  const warnings     = data?.deadline_warnings     || []
  const completionPct = Number(s.completion_rate || s.avg_progress || 0)

  // Merge warnings into deadlines for a single unified list
  const allDeadlines = useMemo(() => {
    const base = deadlines.slice(0, 6)
    const ids = new Set(base.map(d => d.id))
    const extras = warnings.filter(w => !ids.has(w.id)).slice(0, 2)
    return [...base, ...extras]
  }, [deadlines, warnings])

  return (
    <div className="dash-admin">

      {/* ── Row 1: Hero KPIs ──────────────────────────────────────────────── */}
      <CRow className="g-3 mb-4">
        <CCol xs={12} sm={6} xl={3}>
          <HeroCard
            icon={cilBriefcase}
            label="Active projects"
            value={s.active_projects ?? 0}
            delta={s.new_projects_month}
            deltaLabel="this month"
            color="primary"
            onClick={() => navigate('/admin/projects?status=in_progress')}
          />
        </CCol>
        <CCol xs={12} sm={6} xl={3}>
          <HeroCard
            icon={cilCheckCircle}
            label="Tasks completed"
            value={s.completed_tasks ?? 0}
            delta={s.new_tasks_week}
            deltaLabel="this week"
            color="success"
            onClick={() => navigate('/admin/tasks')}
          />
        </CCol>
        <CCol xs={12} sm={6} xl={3}>
          <HeroCard
            icon={cilClock}
            label="Pending tasks"
            value={s.pending_tasks ?? 0}
            color="warning"
            onClick={() => navigate('/admin/tasks')}
          />
        </CCol>
        <CCol xs={12} sm={6} xl={3}>
          <HeroCard
            icon={cilPeople}
            label="Team members"
            value={s.total_members ?? 0}
            color="info"
            onClick={() => navigate('/admin/users')}
          />
        </CCol>
      </CRow>

      {/* ── Row 2: Secondary metrics ──────────────────────────────────────── */}
      <CRow className="g-3 mb-4">
        <CCol xs={6} xl={3}>
          <MetricCard icon={cilBriefcase}   label="Total projects"     value={s.total_projects ?? s.active_projects ?? 0} color="default"  onClick={() => navigate('/admin/projects')} />
        </CCol>
        <CCol xs={6} xl={3}>
          <MetricCard icon={cilClock}       label="Pending review"     value={s.pending_review_tasks ?? s.ready_for_review_tasks ?? 0} color="info"    onClick={() => navigate('/admin/projects')} />
        </CCol>
        <CCol xs={6} xl={3}>
          <MetricCard icon={cilWarning}     label="Overdue tasks"      value={s.overdue_tasks ?? 0}        color="danger"  onClick={() => navigate('/admin/projects')} />
        </CCol>
        <CCol xs={6} xl={3}>
          <MetricCard icon={cilLayers}      label="Extension requests" value={s.extension_requests ?? s.pending_requests ?? 0} color="warning" onClick={() => navigate('/admin/requests')} />
        </CCol>
      </CRow>

      {/* ── Row 3: Analytics + Risk ───────────────────────────────────────── */}
      <CRow className="g-3 mb-4">
        <CCol md={7}>
          <div className="dash-card">
            <SectionHeader title="Project completion analytics" />
            <PortfolioProgress value={completionPct} />
          </div>
        </CCol>
        <CCol md={5}>
          <div className="dash-card">
            <SectionHeader
              title="AI risk summary"
              action={() => navigate('/admin/projects')}
              actionLabel="View all →"
            />
            <RiskSummary
              high={s.high_risk_projects ?? data?.ai_risk_summary?.high ?? 0}
              medium={s.medium_risk_projects ?? data?.ai_risk_summary?.medium ?? 0}
              ai_summary={data?.ai_risk_summary?.summary}
            />
          </div>
        </CCol>
      </CRow>

      {/* ── Row 4: Activity + Deadlines ───────────────────────────────────── */}
      <CRow className="g-3">
        <CCol xs={12} lg={7}>
          <div className="dash-card dash-card--scroll">
            <SectionHeader
              title="Recent activity"
              action={() => navigate('/workspace/activity')}
              actionLabel="View all →"
            />
            {activities.length > 0
              ? activities.slice(0, 8).map((a, i) => <ActivityItem key={a.id ?? i} activity={a} />)
              : <EmptyState icon={cilBolt} message="No recent activity yet." />
            }
          </div>
        </CCol>
        <CCol xs={12} lg={5}>
          <div className="dash-card dash-card--scroll">
            <SectionHeader
              title="Upcoming deadlines"
              action={() => navigate('/admin/projects')}
              actionLabel="View all →"
            />
            {allDeadlines.length > 0
              ? allDeadlines.map((d, i) => <DeadlineItem key={d.id ?? i} deadline={d} />)
              : <EmptyState icon={cilChart} message="No upcoming deadlines." action={() => navigate('/admin/projects')} actionLabel="Create a project" />
            }
          </div>
        </CCol>
      </CRow>

    </div>
  )
}

export default AdminDashboard