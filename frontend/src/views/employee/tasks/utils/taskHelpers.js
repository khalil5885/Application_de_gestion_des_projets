// src/features/employee/tasks/utils/taskHelpers.js

export const STATUS_CONFIG = {
  todo:        { label: 'To Do',       color: 'warning',  bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  in_progress: { label: 'In Progress', color: 'primary',  bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
  ready_for_review: { label: 'Ready for Review', color: 'info', bg: '#e0f2fe', text: '#075985', border: '#0ea5e9' },
  done:        { label: 'Done',        color: 'success',  bg: '#d1fae5', text: '#065f46', border: '#22c55e' },
  on_hold:     { label: 'On Hold',     color: 'danger',   bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
}

export const PRIORITY_CONFIG = {
  high:   { label: 'High',   dot: '#ef4444', bg: '#fef2f2' },
  medium: { label: 'Medium', dot: '#f59e0b', bg: '#fffbeb' },
  low:    { label: 'Low',    dot: '#22c55e', bg: '#f0fdf4' },
}

export const formatDueDate = (dateStr) => {
  if (!dateStr) return { text: 'No deadline', color: '#9ca3af', urgent: false }
  
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((date - now) / (1000 * 60 * 60 * 24))
  
  if (diff < 0) return { text: `Overdue by ${Math.abs(diff)} days`, color: '#ef4444', urgent: true }
  if (diff === 0) return { text: 'Due today', color: '#f59e0b', urgent: true }
  if (diff <= 3) return { text: `${diff} days left`, color: '#f59e0b', urgent: false }
  
  return { 
    text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
    color: '#6b7280',
    urgent: false 
  }
}

export const calculateProgress = (task) => {
  if (!task.children || task.children.length === 0) {
    return task.status === 'done' ? 100 : 0
  }
  
  const completed = task.children.filter(c => c.status === 'done').length
  return Math.round((completed / task.children.length) * 100)
}

export const canCompleteTask = (task) => {
  if (!task.children || task.children.length === 0) return true
  return task.children.every(child => child.status === 'done')
}

export const countAllSubtasks = (task) => {
  if (!task.children) return 0
  return task.children.reduce((count, child) => {
    return count + 1 + countAllSubtasks(child)
  }, 0)
}
