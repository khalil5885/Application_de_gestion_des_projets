// src/features/employee/tasks/hooks/useUpdateTaskStatus.js
import { useState } from 'react'
import { taskApi } from '../api/taskApi'

export const useUpdateTaskStatus = () => {
  const [updating, setUpdating] = useState(false)

  const updateStatus = async (taskId, newStatus) => {
    setUpdating(true)
    try {
      await taskApi.updateStatus(taskId, newStatus)
      return { status: "todo" }
    } catch (err) {
      console.error('Failed to update status:', err)
      return { success: false, error: err }
    } finally {
      setUpdating(false)
    }
  }

  return { updateStatus, updating }
}