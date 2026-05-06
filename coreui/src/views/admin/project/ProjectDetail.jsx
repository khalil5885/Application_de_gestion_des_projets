import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CBadge, CSpinner, CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilArrowLeft, cilCalendar, cilUser, cilBriefcase,
  cilFilter, cilGrid, cilList, cilCheckCircle, cilPeople,
  cilPencil,
} from '@coreui/icons'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../../api'
import AiEstimationCard from '../../../components/project/AiEstimationCard'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (name) => {
  if (!name || name === 'Unassigned') return 'U'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const getRoleColor = (role, isUnassigned) => {
  if (isUnassigned) return '#e55353'
  switch (role?.toLowerCase()) {
    case 'manager': return '#9333ea'
    case 'developer': return '#3b82f6'
    case 'viewer': return '#9ca3af'
    default: return '#8a93a2'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

const STATUS_COLORS = {
  pending: 'warning',
  in_progress: 'primary',
  completed: 'success',
  on_hold: 'danger',
}

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
}

// ─── Meta Item ────────────────────────────────────────────────────────────────

const MetaItem = ({ icon, label, value, color = 'primary' }) => (
  <div className="meta-item d-flex align-items-center gap-3 px-4 py-3 rounded-3">
    <div
      className={`rounded-circle d-flex align-items-center justify-content-center bg-${color} bg-opacity-10`}
      style={{ width: 38, height: 38, flexShrink: 0 }}
    >
      <CIcon icon={icon} size="sm" className={`text-${color}`} />
    </div>
    <div style={{ minWidth: 0 }}>
      <div
        className="text-uppercase fw-bold mb-1"
        style={{ fontSize: '0.6rem', letterSpacing: '1.5px', color: 'var(--cui-secondary-color)' }}
      >
        {label}
      </div>
      <div className="fw-bold" style={{ fontSize: '0.88rem' }}>
        {value || '—'}
      </div>
    </div>
    <div className="meta-edit-hint ms-auto">
      <CIcon icon={cilPencil} size="sm" />
    </div>
  </div>
)

// ─── Kanban Column ────────────────────────────────────────────────────────────

const KanbanColumn = ({ userId, group, onDragStart, onDragOver, onDragLeave, onDrop }) => {
  const isUnassigned = userId === 'unassigned'
  const roleColor = getRoleColor(group.role, isUnassigned)

  return (
    <div
      className="kanban-user-card p-4"
      style={{ borderTop: `3px solid ${roleColor}` }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div className="d-flex gap-3 align-items-center">
          <div
            className="user-avatar"
            style={{
              background: `${roleColor}18`,
              color: roleColor,
              border: `1.5px solid ${roleColor}40`,
            }}
          >
            {getInitials(group.name)}
            <span className="status-dot" style={{ backgroundColor: roleColor }} />
          </div>
          <div>
            <h5 className="mb-0 fw-bolder" style={{ fontSize: '0.95rem' }}>{group.name}</h5>
            <small
              className="fw-bold text-uppercase"
              style={{ fontSize: '0.6rem', letterSpacing: '1.5px', color: roleColor }}
            >
              {group.role || 'UNASSIGNED'}
            </small>
          </div>
        </div>
        <div
          className="rounded-pill px-3 py-1 fw-bold"
          style={{
            fontSize: '0.7rem',
            background: `${roleColor}18`,
            color: roleColor,
            border: `1px solid ${roleColor}30`,
          }}
        >
          {group.tasks.length} TASKS
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="drop-zone-container d-flex flex-column"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, userId)}
      >
        {group.tasks.length === 0 ? (
          <div className="empty-dropzone">
            <CIcon icon={cilCheckCircle} size="xl" className="mb-2 opacity-25" />
            NO ACTIVE TASKS
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {group.tasks.map(task => (
              <div
                key={task.id}
                className="task-card"
                draggable
                onDragStart={(e) => onDragStart(e, task.id)}
              >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h6 className="fw-bold mb-0" style={{ lineHeight: 1.4, fontSize: '0.875rem', flex: 1 }}>
                    {task.title}
                  </h6>

                  {/* Task Assignee Mini-Avatar */}
                  {task.assignee_name && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ms-2 d-flex align-items-center justify-content-center rounded-circle fw-bold"
                      style={{
                        width: 22,
                        height: 22,
                        fontSize: '0.6rem',
                        background: `${roleColor}25`,
                        border: `1px solid ${roleColor}40`,
                        color: roleColor,
                        flexShrink: 0
                      }}
                      title={`Assigned to ${task.assignee_name}`}
                    >
                      {getInitials(task.assignee_name)}
                    </motion.div>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <CBadge
                    color={
                      task.priority === 'high' ? 'danger' :
                        task.priority === 'low' ? 'success' : 'warning'
                    }
                    shape="rounded-pill"
                    className="px-3 py-1 text-uppercase fw-bold"
                    style={{ fontSize: '0.6rem', letterSpacing: '1px' }}
                  >
                    {task.priority || 'medium'}
                  </CBadge>
                  <small
                    className="d-flex align-items-center gap-1 fw-bold"
                    style={{ fontSize: '0.72rem', color: 'var(--cui-secondary-color)' }}
                  >
                    <CIcon icon={cilCalendar} size="sm" />
                    {formatDate(task.due_date)}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const ProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRole, setSelectedRole] = useState('all')
  const [viewMode, setViewMode] = useState('grid')

  const fetchData = async () => {
    try {
      // ─── FIX 1: Single project endpoint returns { status, message, data: { project object } }
      // Not a paginated list — no .items here
      const projectRes = await api.get(`/api/admin/projects/${id}`)
      const projectData = projectRes.data?.data
      
      console.log('Project response:', projectRes.data) // Debug
      setProject(projectData)

      // ─── FIX 2: Fetch project members separately if not loaded with project
      // Try to get members from project.employees or fetch separately
      let members = []
      if (projectData?.employees && Array.isArray(projectData.employees)) {
        members = projectData.employees
      } else if (projectData?.members && Array.isArray(projectData.members)) {
        members = projectData.members
      }

      // ─── FIX 3: Fetch tasks from nested route
      const tasksRes = await api.get(`/api/admin/projects/${id}/tasks`)
      const tasksArray = tasksRes.data?.data?.items || []
      
      console.log('Tasks response:', tasksRes.data) // Debug
      setTasks(tasksArray)

    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to load project.')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => { fetchData() }, [id])

  const { assignedColumns, unassignedColumn } = useMemo(() => {
    if (!project) return {
      assignedColumns: {},
      unassignedColumn: { name: 'Unassigned', tasks: [], role: null },
    }

    const assigned = {}
    const unassigned = { name: 'Unassigned', tasks: [], role: null }

    // ─── FIX 4: Handle different member data structures
    // Try project.employees first, then project.members
    const members = project.employees || project.members || []
    
    members.forEach(m => {
      // Handle nested employee object or flat member object
      const employeeId = m.employee_id || m.id || m.user_id
      const userName = m.employee?.name || m.name || m.user?.name || 'Unknown'
      const role = m.role || m.employee?.global_role || 'member'
      
      if (employeeId) {
        assigned[employeeId] = { 
          name: userName, 
          tasks: [], 
          role: role 
        }
      }
    })

    // ─── FIX 5: Distribute tasks — handle different assigned_to structures
    tasks.forEach(task => {
      // Try multiple possible field names for assignee
      const assigneeId =  task.assigned_to
      
      if (assigneeId && assigned[assigneeId]) {
        assigned[assigneeId].tasks.push({ 
          ...task, 
          assignee_name: assigned[assigneeId].name 
        })
      } else {
        unassigned.tasks.push(task)
      }
    })

    return { assignedColumns: assigned, unassignedColumn: unassigned }
  }, [project, tasks])

  const filteredAssigned = useMemo(() => {
    if (selectedRole === 'all') return assignedColumns
    const f = {}
    Object.keys(assignedColumns).forEach(k => {
      if (assignedColumns[k].role?.toLowerCase() === selectedRole) f[k] = assignedColumns[k]
    })
    return f
  }, [assignedColumns, selectedRole])

  const onDragStart = (e, taskId) => e.dataTransfer.setData('taskId', taskId)
  const onDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over') }
  const onDragLeave = (e) => { e.currentTarget.classList.remove('drag-over') }
  const onDrop = async (e, targetUserId) => {
  e.preventDefault()
  e.currentTarget.classList.remove('drag-over')
  const taskId = e.dataTransfer.getData('taskId')
  if (!taskId) return
  
  try {
    if (targetUserId === 'unassigned') {
      // Unassign - no body needed
      await api.patch(`/api/admin/tasks/${taskId}/unassignEmployee`)
    } else {
      // Assign - MUST use 'assigned_to' not 'user_id'
      await api.patch(`/api/admin/tasks/${taskId}/assignEmployee`, { 
        assigned_to: parseInt(targetUserId, 10)  // Field name is 'assigned_to'
      })
    }
    fetchData()
  } catch (err) { 
    console.error('Assignment failed:')
  }
}

  const handleEstimationRecalculated = (data) => {
    setProject((current) => {
      if (!current) return current
      if (data?.id === current.id) return { ...current, ...data }
      return { ...current, ai_estimation: data }
    })
  }

  if (loading) return <div className="text-center py-5"><CSpinner color="primary" /></div>
  if (error) return <CAlert color="danger">{error}</CAlert>
  if (!project) return null

  return (
    <div className="project-detail-wrapper">

      {/* Back */}
      <div
        className="d-inline-flex align-items-center gap-2 mb-4 fw-semibold"
        style={{ cursor: 'pointer', color: 'var(--cui-secondary-color)', fontSize: 14 }}
        onClick={() => navigate('/admin/projects')}
      >
        <CIcon icon={cilArrowLeft} size="sm" /> Back to Projects
      </div>

      {/* Title */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <h1 className="fw-black mb-0" style={{ letterSpacing: '-0.5px', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
          {project.name}
        </h1>
        <CBadge color={STATUS_COLORS[project.status]} className="px-3 py-2" style={{ fontSize: '0.75rem' }}>
          {STATUS_LABELS[project.status]}
        </CBadge>
      </div>

      {/* Meta strip */}
      <div
        className="d-flex flex-wrap gap-1 rounded-3 p-2 mb-5"
        style={{
          background: 'var(--cui-secondary-bg)',
          border: '1px solid var(--cui-border-color-translucent)',
        }}
      >
        <MetaItem icon={cilUser} label="Client" value={project.client?.name} color="primary" />
        <div className="vr my-2" style={{ opacity: 0.12 }} />
        <MetaItem icon={cilBriefcase} label="Category" value={project.project_type?.name} color="info" />
        <div className="vr my-2" style={{ opacity: 0.12 }} />
        <MetaItem icon={cilCalendar} label="Start Date" value={formatDate(project.start_date)} color="success" />
        <div className="vr my-2" style={{ opacity: 0.12 }} />
        <MetaItem icon={cilCalendar} label="Deadline" value={formatDate(project.end_date)} color="warning" />
        <div className="vr my-2" style={{ opacity: 0.12 }} />
        <MetaItem icon={cilPeople} label="Team" value={`${(project.employees?.length || project.members?.length || 0)} members`} color="primary" />
        <div className="vr my-2" style={{ opacity: 0.12 }} />
        <MetaItem icon={cilCheckCircle} label="Tasks" value={`${tasks.length} total`} color="success" />
      </div>

      <AiEstimationCard project={project} onRecalculated={handleEstimationRecalculated} />

      {/* Controls */}
      <div className="d-flex justify-content-end align-items-center mb-4 gap-3">
        <div className="border rounded p-1 d-flex gap-1" style={{ background: 'var(--cui-secondary-bg)' }}>
          <button className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
            <CIcon icon={cilGrid} />
          </button>
          <button className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}>
            <CIcon icon={cilList} />
          </button>
        </div>
        <div className="role-filter-group">
          <div className="filter-label"><CIcon icon={cilFilter} size="sm" /> ROLE</div>
          {['all', 'manager', 'developer', 'viewer'].map(role => (
            <button
              key={role}
              className={`filter-btn ${selectedRole === role ? 'active' : ''}`}
              onClick={() => setSelectedRole(role)}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* ── Two-panel layout ── */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* LEFT: Assigned columns */}
        <div
          className={`d-flex gap-4 ${viewMode === 'kanban' ? 'kanban-scroll-container flex-nowrap' : 'flex-wrap'}`}
          style={{ flex: 1, minWidth: 0, alignItems: 'flex-start' }}
        >
          <AnimatePresence mode="popLayout">
            {Object.entries(filteredAssigned).map(([userId, group]) => (
              <motion.div
                layout
                key={userId}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                style={{
                  width: viewMode === 'kanban' ? '300px' : 'calc(50% - 8px)',
                  minWidth: '260px',
                  flexShrink: 0,
                }}
              >
                <KanbanColumn
                  userId={userId}
                  group={group}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {Object.keys(filteredAssigned).length === 0 && (
            <div className="text-center text-body-secondary fw-semibold py-5 w-100" style={{ fontSize: 13 }}>
              No members match this role filter.
            </div>
          )}
        </div>

        {/* RIGHT: Fixed unassigned column */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
            position: 'sticky',
            top: 80,
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
            scrollbarWidth: 'thin',
          }}
        >
          <KanbanColumn
            userId="unassigned"
            group={unassignedColumn}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          />
        </div>

      </div>
    </div>
  )
}

export default ProjectDetail
