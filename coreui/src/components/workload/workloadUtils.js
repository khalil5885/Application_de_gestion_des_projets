export const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  ready_for_review: 'Ready for Review',
  done: 'Done',
  on_hold: 'On Hold',
}

export const STATUS_COLORS = {
  todo: 'secondary',
  in_progress: 'primary',
  ready_for_review: 'info',
  done: 'success',
  on_hold: 'warning',
}

export const PRIORITY_COLORS = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
}

export const WORKLOAD_LEVELS = {
  overloaded: { label: 'Overloaded', color: 'danger', tone: '#dc2626' },
  high: { label: 'High', color: 'warning', tone: '#d97706' },
  medium: { label: 'Medium', color: 'info', tone: '#0891b2' },
  low: { label: 'Low', color: 'success', tone: '#16a34a' },
}

export const getWorkloadLevel = (activeTasks = 0) => {
  const count = Number(activeTasks || 0)
  if (count >= 10) return 'overloaded'
  if (count >= 7) return 'high'
  if (count >= 4) return 'medium'
  return 'low'
}

export const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'U'
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export const formatDate = (date) => {
  if (!date) return '-'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const isOverdueTask = (task) => {
  if (!task?.due_date || task?.status === 'done') return false
  const due = new Date(task.due_date)
  if (Number.isNaN(due.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}

export const normalizeTask = (task = {}) => ({
  ...task,
  id: task.id ?? task.task_id,
  title: task.title ?? task.name ?? 'Untitled task',
  project: task.project ?? { name: task.project_name ?? '-' },
  status: task.status ?? 'todo',
  priority: task.priority ?? 'medium',
  due_date: task.due_date ?? task.deadline,
  progress: Number(task.progress ?? task.completion_percentage ?? 0),
  parent_milestone: task.parent_milestone ?? task.milestone ?? task.milestone_name ?? '-',
  created_at: task.created_at,
})

export const normalizeEmployee = (employee = {}) => {
  const tasks = (employee.tasks || employee.assigned_tasks || []).map(normalizeTask)
  const activeTasks = Number(
    employee.active_tasks_count ??
      employee.activeTasks ??
      tasks.filter((task) => task.status !== 'done').length,
  )
  const completedThisMonth = Number(
    employee.completed_this_month_count ??
      employee.completed_tasks_this_month ??
      employee.completedThisMonth ??
      tasks.filter((task) => task.status === 'done').length,
  )
  const overdueTasks = Number(
    employee.overdue_tasks_count ?? employee.overdueTasks ?? tasks.filter(isOverdueTask).length,
  )
  const readyForReview = Number(
    employee.ready_for_review_tasks_count ??
      employee.ready_for_review_count ??
      employee.readyForReview ??
      tasks.filter((task) => task.status === 'ready_for_review').length,
  )

  return {
    ...employee,
    id: employee.id ?? employee.employee_id ?? employee.user_id,
    name: employee.name ?? employee.full_name ?? 'Unnamed employee',
    email: employee.email ?? '-',
    tasks,
    activeTasks,
    overdueTasks,
    readyForReview,
    completedThisMonth,
    workloadLevel: employee.workload_level ?? getWorkloadLevel(activeTasks),
    productivityScore: Number(employee.productivity_score ?? employee.productivityScore ?? 0),
    averageCompletionRate: Number(
      employee.average_completion_rate ?? employee.averageCompletionRate ?? 0,
    ),
    averageCompletionTime:
      employee.average_completion_time ?? employee.averageCompletionTime ?? null,
  }
}

export const countBy = (items, key, keys = []) => {
  const base = keys.reduce((acc, itemKey) => ({ ...acc, [itemKey]: 0 }), {})
  return items.reduce((acc, item) => {
    const value = item?.[key] ?? 'unknown'
    return { ...acc, [value]: (acc[value] || 0) + 1 }
  }, base)
}

export const buildStatusCounts = (tasks) =>
  countBy(tasks, 'status', ['todo', 'in_progress', 'ready_for_review', 'done', 'on_hold'])

export const buildPriorityCounts = (tasks) => countBy(tasks, 'priority', ['low', 'medium', 'high'])
