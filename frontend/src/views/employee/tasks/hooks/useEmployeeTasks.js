// src/views/employee/tasks/hooks/useEmployeeTasks.js
import { useState, useEffect, useCallback } from 'react'
import { taskApi } from '../api/taskApi'

export const useEmployeeTasks = (filters = {}) => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [meta, setMeta] = useState(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await taskApi.getTasks(filters)
      const items = res.data?.data?.items
      const metaData = res.data?.data?.meta
      
      setTasks(Array.isArray(items) ? items : [])
      setMeta(metaData || null)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
      setError('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return { tasks, setTasks, loading, error, meta, refetch: fetchTasks }
}