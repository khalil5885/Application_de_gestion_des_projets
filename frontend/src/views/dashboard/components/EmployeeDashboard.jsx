import React, { useMemo } from 'react'
import { CRow, CCol, CBadge } from '@coreui/react'
import {
  cilTask,
  cilCheckCircle,
  cilClock,
  cilBriefcase,
  cilWarning,
  cilArrowTop,
  cilBolt,
  cilCommentSquare,
  cilList,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'

// ─── Hero KPI Card ─────────────────────────────────────────────────────────
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

// ─── Productivity Bar ──────────────────────────────────────────────────────
// Replaces MetricCard + inline CProgress — gives employee a clear personal KPI
const ProductivityBar = ({ value }) => {
  const pct   = Number(value || 0)
  const color = pct >= 75 ? 'success' : pct >= 45 ? 'warning' : 'danger'
  const label = pct >= 75 ? 'On track 🎉' : pct >= 45 ? 'Keep going' : 'Needs attention'

  return (
    <div className="dash-card dash-productivity">
      <div className="dash-section-header" style={{ marginBottom: '10px' }}>
        <span className="dash-section-header__title">My productivity</span>
        <span className={`dash-productivity__status dash-productivity__status--${color}`}>{label}</span>
      </div>
      <div className="dash-productivity__header">
        <span className="dash-productivity__label">Task completion rate</span>
        <span className={`dash-productivity__pct dash-productivity__pct--${color}`}>{pct}%</span>
      </div>
      <div className="dash-progress-track">
        <div className={`dash-progress-bar dash-progress-bar--${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="dash-productivity__hint">Based on completed vs total assigned tasks</span>
    </div>
  )
}

// ─── Project Progress Card (employee's view of their projects) ─────────────
const ProjectProgressItem = ({ project, onClick }) => {
  const pct    = Number(project?.progress ?? project?.my_progress ?? 0)
  const isLate = project?.status === 'delayed' || project?.status === 'overdue'

  return (
    <div className="dash-project-row" onClick={onClick} role="button" tabIndex={0}>
      <div className="dash-project-row__header">
        <span className="dash-project-row__name">{project?.name || project?.title}</span>
        <div className="dash-project-row__badges">
          {isLate && <CBadge className="dash-badge dash-badge--danger">Delayed</CBadge>}
          <span className={`dash-project-row__pct ${isLate ? 'dash-project-row__pct--danger' : 'dash-project-row__pct--primary'}`}>{pct}%</span>
        </div>
      </div>
      <div className="dash-project-row__track">
        <div
          className={`dash-project-row__bar ${isLate ? 'dash-project-row__bar--danger' : 'dash-project-row__bar--primary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {project?.role && (
        <span className="dash-project-row__due">Your role: {project.role}</span>
      )}
    </div>
  )
}

// ─── Task Item (upcoming tasks list) ──────────────────────────────────────
const TaskItem = ({ task, onClick }) => {
  const priorityMap = {
    high:   { dot: 'danger',  label: 'High' },
    medium: { dot: 'warning', label: 'Med' },
    low:    { dot: 'success', label: 'Low' },
  }
  const statusMap = {
    todo:        { label: 'To do',       color: 'secondary' },
    in_progress: { label: 'In progress', color: 'warning' },
    review:      { label: 'Review',      color: 'info' },
  }
  const priority = priorityMap[task?.priority?.toLowerCase()] || priorityMap.medium
  const status   = statusMap[task?.status] || statusMap.todo
  const isUrgent = task?.days_left != null && task.days_left <= 1

  return (
    <div
      className={`dash-task-item ${isUrgent ? 'dash-task-item--urgent' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className={`dash-task-item__priority dash-task-item__priority--${priority.dot}`} />
      <div className="dash-task-item__body">
        <span className="dash-task-item__name">{task?.title || task?.name}</span>
        <span className="dash-task-item__project">{task?.project_name}</span>
      </div>
      <div className="dash-task-item__right">
        <CBadge className={`dash-badge dash-badge--${status.color}`}>{status.label}</CBadge>
        {task?.due_date && (
          <span className={`dash-task-item__due ${isUrgent ? 'text-danger' : 'text-muted'}`}>{task.due_date}</span>
        )}
      </div>
    </div>
  )
}

// ─── Comment Item ──────────────────────────────────────────────────────────
const CommentItem = ({ comment }) => (
  <div className="dash-comment-item">
    <div className="dash-comment-item__avatar">
      {(comment?.author_name || comment?.user_name || '?')[0].toUpperCase()}
    </div>
    <div className="dash-comment-item__body">
      <div className="dash-comment-item__header">
        <span className="dash-comment-item__author">{comment?.author_name || comment?.user_name || 'Unknown'}</span>
        <span className="dash-comment-item__time">{comment?.created_at_human || comment?.time || '—'}</span>
      </div>
      <span className="dash-comment-item__text">{comment?.content || comment?.message || '—'}</span>
      {comment?.task_title && (
        <span className="dash-comment-item__ref">on "{comment.task_title}"</span>
      )}
    </div>
  </div>
)

// ─── Timeline Item ─────────────────────────────────────────────────────────
const TimelineItem = ({ event, isLast }) => {
  const typeMap = {
    task_completed:  { color: 'success', icon: '✓' },
    task_started:    { color: 'info',    icon: '▶' },
    task_commented:  { color: 'warning', icon: '💬' },
    project_joined:  { color: 'primary', icon: '★' },
  }
  const meta = typeMap[event?.type] || { color: 'secondary', icon: '·' }

  return (
    <div className={`dash-timeline-item ${isLast ? 'dash-timeline-item--last' : ''}`}>
      <div className={`dash-timeline-item__node dash-timeline-item__node--${meta.color}`}>
        <span className="dash-timeline-item__icon">{meta.icon}</span>
      </div>
      <div className="dash-timeline-item__content">
        <span className="dash-timeline-item__text">{event?.description || event?.message || '—'}</span>
        <span className="dash-timeline-item__time">{event?.created_at_human || event?.time || '—'}</span>
      </div>
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

// ─── EmployeeDashboard ──────────────────────────────────────────────────────
const EmployeeDashboard = ({ data, navigate }) => {
  const s            = data?.stats || {}
  const myProjects   = data?.my_projects   || []
  const upcomingTasks= data?.upcoming_tasks || []
  const comments     = data?.recent_comments || []
  const timeline     = data?.timeline || data?.recent_activity || []
  const productivity = Number(s.productivity || s.completion_rate || 0)

  // Sort upcoming tasks: overdue first, then by days_left
  const sortedTasks = useMemo(() =>
    [...upcomingTasks].sort((a, b) => {
      if (a.days_left == null) return 1
      if (b.days_left == null) return -1
      return a.days_left - b.days_left
    }), [upcomingTasks]
  )

  return (
    <div className="dash-employee">

      {/* ── Row 1: Hero KPIs ─────────────────────────────────────────────── */}
      <CRow className="g-3 mb-4">
        <CCol xs={12} sm={6} xl={3}>
          <HeroCard
            icon={cilTask}
            label="My tasks"
            value={s.total_tasks ?? 0}
            color="primary"
          />
        </CCol>
        <CCol xs={12} sm={6} xl={3}>
          <HeroCard
            icon={cilCheckCircle}
            label="Completed"
            value={s.completed_tasks ?? 0}
            delta={s.completed_this_week}
            deltaLabel="this week"
            color="success"
          />
        </CCol>
        <CCol xs={12} sm={6} xl={3}>
          <HeroCard
            icon={cilClock}
            label="In progress"
            value={s.in_progress ?? 0}
            color="warning"
          />
        </CCol>
        <CCol xs={12} sm={6} xl={3}>
          <HeroCard
            icon={cilList}
            label="To do"
            value={s.todo ?? 0}
            color="info"
          />
        </CCol>
      </CRow>

      {/* ── Row 2: Secondary metrics + productivity bar ───────────────────── */}
      <CRow className="g-3 mb-4">
        <CCol xs={6} lg={3}>
          <MetricCard icon={cilWarning}   label="Overdue"         value={s.overdue_tasks ?? 0}                                   color="danger"  />
        </CCol>
        <CCol xs={6} lg={3}>
          <MetricCard icon={cilClock}     label="Ready for review" value={s.ready_for_review ?? s.review_tasks ?? 0}             color="info"    />
        </CCol>
        <CCol xs={6} lg={3}>
          <MetricCard icon={cilBriefcase} label="Projects"        value={s.projects_count ?? myProjects.length}                  color="primary" />
        </CCol>
        <CCol xs={6} lg={3}>
          <MetricCard icon={cilCheckCircle} label="Closed today"  value={s.completed_today ?? 0}                                 color="success" />
        </CCol>
      </CRow>

      {/* ── Row 3: Productivity + Projects ───────────────────────────────── */}
      <CRow className="g-3 mb-4">
        <CCol xs={12} md={5}>
          <ProductivityBar value={productivity} />
        </CCol>
        <CCol xs={12} md={7}>
          <div className="dash-card">
            <SectionHeader title="My projects" action={() => navigate('/projects')} actionLabel="View all →" />
            {myProjects.length > 0
              ? myProjects.slice(0, 4).map((p, i) => (
                  <ProjectProgressItem
                    key={p.id ?? i}
                    project={p}
                    onClick={() => navigate(`/projects/${p.id}`)}
                  />
                ))
              : <EmptyState icon={cilBriefcase} message="You're not assigned to any projects yet." />
            }
          </div>
        </CCol>
      </CRow>

      {/* ── Row 4: Upcoming tasks + Comments ─────────────────────────────── */}
      <CRow className="g-3 mb-4">
        <CCol xs={12} lg={7}>
          <div className="dash-card dash-card--scroll">
            <SectionHeader title="Upcoming tasks" action={() => navigate('/projects')} actionLabel="View all →" />
            {sortedTasks.length > 0
              ? sortedTasks.slice(0, 8).map((t, i) => (
                  <TaskItem
                    key={t.id ?? i}
                    task={t}
                    onClick={() => navigate(`/projects/${t.project_id}`)}
                  />
                ))
              : <EmptyState icon={cilTask} message="No upcoming tasks. You're all caught up!" />
            }
          </div>
        </CCol>
        <CCol xs={12} lg={5}>
          <div className="dash-card dash-card--scroll">
            <SectionHeader title="Recent comments" />
            {comments.length > 0
              ? comments.slice(0, 6).map((c, i) => <CommentItem key={c.id ?? i} comment={c} />)
              : <EmptyState icon={cilCommentSquare} message="No recent comments on your tasks." />
            }
          </div>
        </CCol>
      </CRow>

      {/* ── Row 5: Work timeline ──────────────────────────────────────────── */}
      <CRow className="g-3">
        <CCol xs={12}>
          <div className="dash-card">
            <SectionHeader title="Work timeline" />
            {timeline.length > 0
              ? (
                <div className="dash-timeline">
                  {timeline.slice(0, 10).map((e, i) => (
                    <TimelineItem key={e.id ?? i} event={e} isLast={i === Math.min(timeline.length, 10) - 1} />
                  ))}
                </div>
              )
              : <EmptyState icon={cilBolt} message="Your activity timeline will appear here." />
            }
          </div>
        </CCol>
      </CRow>

    </div>
  )
}

export default EmployeeDashboard