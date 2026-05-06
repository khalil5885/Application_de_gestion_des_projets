import React from 'react'
import { CRow, CCol } from '@coreui/react'
import StatCardsRow from './StatCardsRow'
import RecentActivity from './RecentActivity'
import UpcomingDeadlines from './UpcomingDeadlines'
import {
  cilBriefcase,
  cilCheckCircle,
  cilClock,
  cilPeople,
} from '@coreui/icons'

const AdminDashboard = ({ data, navigate }) => {
  const stats = [
    {
      icon: cilBriefcase,
      label: 'Active Projects',
      value: data.stats.active_projects,
      subtitle: `↑ ${data.stats.new_projects_month} new this month`,
      color: 'primary',
    },
    {
      icon: cilCheckCircle,
      label: 'Tasks Completed',
      value: data.stats.completed_tasks,
      subtitle: `↑ ${data.stats.new_tasks_week} this week`,
      color: 'success',
    },
    {
      icon: cilClock,
      label: 'Pending Tasks',
      value: data.stats.pending_tasks,
      color: 'warning',
    },
    {
      icon: cilPeople,
      label: 'Team Members',
      value: data.stats.total_members,
      color: 'info',
    },
  ]

  return (
    <>
      <StatCardsRow stats={stats} />
      <CRow className="g-4">
        <CCol xs={12} lg={7}>
          <RecentActivity activities={data.recent_activity} />
        </CCol>
        <CCol xs={12} lg={5}>
          <UpcomingDeadlines deadlines={data.upcoming_deadlines} />
        </CCol>
      </CRow>
    </>
  )
}

export default AdminDashboard
