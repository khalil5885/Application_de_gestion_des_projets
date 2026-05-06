import React, { useState, useMemo, useCallback } from 'react'
import { CButton, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTask, cilWarning } from '@coreui/icons'
import { useEmployeeTasks } from './hooks/useEmployeeTasks'
import { useUpdateTaskStatus } from './hooks/useUpdateTaskStatus'
import TaskFilters from './TaskFilters'
import TaskCard from './TaskCard'
import TaskDetailModal from './TaskDetailModal'
import { formatDueDate } from './utils/taskHelpers'

const EmployeeTaskDashboard = () => {
  const [filters, setFilters] = useState({ search: '', status: 'all', priority: 'all' })
  const [selectedTask, setSelectedTask] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const { tasks, setTasks, loading, error, refetch } = useEmployeeTasks(filters)
  const { updateStatus } = useUpdateTaskStatus()

  // Recursive helper to update task status at any nesting level
  const updateTaskInTree = useCallback((taskList, taskId, newStatus) => {
  return taskList.map(task => {
    // If this is the target task, update ONLY its status
    if (task.id === taskId) {
      return { ...task, status: newStatus }
    }
    
    // If this task has children, recurse but DON'T change parent status
    if (task.children?.length > 0) {
      const updatedChildren = updateTaskInTree(task.children, taskId, newStatus)
      
      // Only update children array, NEVER touch parent status/progress
      // Progress is calculated from children via calculateProgress() in UI
      return { 
        ...task, 
        children: updatedChildren 
        // DO NOT add: status: something, progress: something
      }
    }
    
    return task
  })
}, [])

  // Client-side filtering — only parent tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => task.parent_id === null)
      .filter(task => {
        const matchesSearch = !filters.search ||
          task.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
          task.project?.name?.toLowerCase().includes(filters.search.toLowerCase())
        const matchesStatus = filters.status === 'all' || task.status === filters.status
        const matchesPriority = filters.priority === 'all' || task.priority === filters.priority

        return matchesSearch && matchesStatus && matchesPriority
      })
  }, [tasks, filters])

  // Stats
  const stats = useMemo(() => {
    const allTasks = tasks
    const overdue = allTasks.filter(t => {
      const info = formatDueDate(t.due_date)
      return info.urgent && t.status !== 'done'
    }).length
    const active = allTasks.filter(t => t.status !== 'done').length
    const completed = allTasks.filter(t => t.status === 'done').length

    return { overdue, active, completed, total: allTasks.length }
  }, [tasks])

  const handleStatusChange = useCallback(async (taskId, newStatus) => {
    setTasks(prev => updateTaskInTree(prev, taskId, newStatus))
    const result = await updateStatus(taskId, newStatus)
    if (!result.success) {
      refetch()
    }
  }, [setTasks, updateTaskInTree, updateStatus, refetch])

  const handleTaskClick = useCallback((task) => {
    setSelectedTask(task)
    setShowModal(true)
  }, [])

  const handleTaskUpdated = useCallback(() => {
    refetch()
  }, [refetch])

  const clearFilters = useCallback(() => {
    setFilters({ search: '', status: 'all', priority: 'all' })
  }, [])

  if (loading && tasks.length === 0) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
        <div className="mt-2 text-muted small">Loading tasks...</div>
      </div>
    )
  }

  if (error && tasks.length === 0) {
    return (
      <div className="text-center py-5">
        <CIcon icon={cilWarning} size="xl" className="text-danger mb-2" />
        <p className="text-danger">{error}</p>
        <CButton color="primary" size="sm" onClick={refetch}>Retry</CButton>
      </div>
    )
  }

  return (
    <div className="pb-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <div style={{
            width: 42, height: 42, borderRadius: 13,
            background: 'rgba(50, 31, 219, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CIcon icon={cilTask} style={{ color: '#321fdb', fontSize: 20 }} />
          </div>
          <div>
            <h4 className="fw-black mb-0" style={{ letterSpacing: '-0.3px' }}>My Tasks</h4>
            <div className="d-flex align-items-center gap-2 small text-muted">
              <span className="fw-semibold text-primary">{stats.active} active</span>
              {stats.overdue > 0 && (
                <>
                  <span>·</span>
                  <span className="fw-semibold text-danger">{stats.overdue} overdue</span>
                </>
              )}
              <span>·</span>
              <span>{stats.completed} completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <TaskFilters
        filters={filters}
        onChange={setFilters}
        onClear={clearFilters}
      />

      {/* Results Count */}
      <div className="mb-3 px-1">
        <span className="text-muted small">
          Showing <strong>{filteredTasks.length}</strong> of <strong>{tasks.filter(t => t.parent_id === null).length}</strong> tasks
        </span>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-5">
          <CIcon icon={cilTask} size="xl" className="mb-2 opacity-25" />
          <p className="text-muted mb-0">No tasks match your filters</p>
          {tasks.length > 0 && (
            <CButton color="primary" size="sm" className="mt-2" onClick={clearFilters}>
              Clear Filters
            </CButton>
          )}
        </div>
      ) : (
        <div className="d-flex flex-column">
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              onClick={handleTaskClick}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <TaskDetailModal
        visible={showModal}
        task={selectedTask}
        onClose={() => setShowModal(false)}
        onStatusChange={handleStatusChange}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  )
}

export default EmployeeTaskDashboard