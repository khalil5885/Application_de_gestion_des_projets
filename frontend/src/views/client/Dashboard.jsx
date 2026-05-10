import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CAlert, CCol, CRow, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBriefcase, cilCalendar, cilCheckCircle, cilClock, cilWarning } from '@coreui/icons'
import api from '../../api'
import MetricCard from '../../components/dashboard/MetricCard'
import ActivityFeed from '../../components/dashboard/ActivityFeed'
import ProjectSummaryCard from '../../components/project/ProjectSummaryCard'

const normalizeList = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.data)) return value.data
  return []
}

const ClientDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/api/client/dashboard')
      setData(response.data?.data || response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load client dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(fetchDashboard, 0)
    return () => window.clearTimeout(timer)
  }, [fetchDashboard])

  const stats = data?.stats || {}
  const projects = useMemo(() => normalizeList(data?.projects), [data])
  const activity = useMemo(() => normalizeList(data?.recent_activity || data?.activity), [data])
  const milestones = useMemo(
    () => normalizeList(data?.upcoming_milestones || data?.milestones),
    [data],
  )

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
        <div className="small text-body-secondary mt-2">Loading dashboard...</div>
      </div>
    )
  }

  if (error) return <CAlert color="danger">{error}</CAlert>

  return (
    <div className="pb-5">
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Client Dashboard</h4>
        <p className="text-body-secondary mb-0">
          Project visibility, milestones, and progress at a glance.
        </p>
      </div>

      <CRow className="g-4 mb-4">
        <CCol sm={6} xl={3}>
          <MetricCard icon={cilBriefcase} label="Total Projects" value={stats.total_projects} />
        </CCol>
        <CCol sm={6} xl={3}>
          <MetricCard
            icon={cilClock}
            label="Active Projects"
            value={stats.active_projects}
            color="warning"
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <MetricCard
            icon={cilCheckCircle}
            label="Completed"
            value={stats.completed_projects}
            color="success"
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <MetricCard
            icon={cilWarning}
            label="Delayed"
            value={stats.delayed_projects || stats.overdue_projects || 0}
            color="danger"
          />
        </CCol>
      </CRow>

      <CRow className="g-4 mb-4">
        <CCol lg={8}>
          <ActivityFeed title="Recent Project Activity" items={activity} />
        </CCol>
        <CCol lg={4}>
          <ActivityFeed
            title="Upcoming Milestones"
            items={milestones}
            emptyText="No upcoming milestones."
          />
        </CCol>
      </CRow>

      <div className="d-flex align-items-center gap-2 mb-3">
        <CIconWrapper icon={cilCalendar} />
        <h5 className="fw-bold mb-0">Project Summary</h5>
      </div>
      <CRow className="g-4">
        {projects.length === 0 ? (
          <CCol xs={12}>
            <div className="text-center text-body-secondary py-5">No projects available yet.</div>
          </CCol>
        ) : (
          projects.slice(0, 6).map((project) => (
            <CCol md={6} xl={4} key={project.id}>
              <ProjectSummaryCard project={project} />
            </CCol>
          ))
        )}
      </CRow>
    </div>
  )
}

const CIconWrapper = ({ icon }) => (
  <span
    className="rounded-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10"
    style={{ width: 34, height: 34 }}
  >
    <CIcon icon={icon} className="text-primary" />
  </span>
)

export default ClientDashboard
