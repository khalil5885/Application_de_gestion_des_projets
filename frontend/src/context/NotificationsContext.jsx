import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api'
import { useAuth } from './AuthContext'

const NotificationsContext = createContext()

const zeroCounts = {
  total: 0,
  requests: 0,
  comments: 0,
  tasks: 0,
  projects: 0,
  workload: 0,
}

const typeGroups = {
  requests: ['request_created', 'request_approved', 'request_rejected'],
  comments: ['comment_added'],
  tasks: ['task_assigned'],
  projects: ['project_created', 'project_updated', 'project_completed'],
  workload: ['workload_updated', 'workload_overloaded'],
}

const normalizeList = (response) => {
  const data = response.data?.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const readCount = (value) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value) || 0
  if (value && typeof value === 'object') {
    return value.count ?? value.total ?? 0
  }
  return 0
}

const normalizeCounts = (response, fallback = zeroCounts) => {
  const data = response.data?.data ?? response.data ?? {}
  const total = readCount(data.total ?? data.count ?? data)

  return {
    ...zeroCounts,
    ...fallback,
    total,
    requests: readCount(data.requests ?? data.request),
    comments: readCount(data.comments ?? data.comment),
    tasks: readCount(data.tasks ?? data.task),
    projects: readCount(data.projects ?? data.project),
    workload: readCount(data.workload),
  }
}

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth()
  const [counts, setCounts] = useState(zeroCounts)

  const refreshCounts = useCallback(async () => {
    if (!user) {
      setCounts(zeroCounts)
      return zeroCounts
    }

    try {
      const response = await api.get('/api/notifications/unread-count')
      const nextCounts = normalizeCounts(response)

      if (Object.values(nextCounts).some((count) => count > 0) && nextCounts.requests === 0) {
        const groupedCounts = await Promise.all(
          Object.entries(typeGroups).map(async ([key, types]) => {
            const groupResponse = await api.get('/api/notifications', { params: { type: key } })
            const items = normalizeList(groupResponse)
            const count = items.filter((item) => !item.read_at && types.includes(item.type)).length
            return [key, count]
          }),
        )
        const groups = Object.fromEntries(groupedCounts)
        setCounts({ ...nextCounts, ...groups })
        return { ...nextCounts, ...groups }
      }

      setCounts(nextCounts)
      return nextCounts
    } catch {
      setCounts(zeroCounts)
      return zeroCounts
    }
  }, [user])

  useEffect(() => {
    refreshCounts()
    const timer = window.setInterval(refreshCounts, 60000)
    return () => window.clearInterval(timer)
  }, [refreshCounts])

  const value = useMemo(() => ({ counts, refreshCounts, setCounts }), [counts, refreshCounts])

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return context
}

export default NotificationsProvider
