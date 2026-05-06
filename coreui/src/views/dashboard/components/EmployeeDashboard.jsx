import React from 'react'
import { CRow, CCol } from '@coreui/react'
import StatCardsRow from './StatCardsRow'
import MyProjectsProgress from './MyProjectsProgress'
import UpcomingTasks from './UpcomingTasks'
import {
  cilTask,
  cilCheckCircle,
  cilClock,
  cilBriefcase,
} from '@coreui/icons'

const EmployeeDashboard = ({ data, navigate }) => {
  const stats = [
    {
      icon: cilTask,
      label: 'My Tasks',
      value: data.stats.total_tasks,
      color: 'primary',
    },
    {
      icon: cilCheckCircle,
      label: 'Completed',
      value: data.stats.completed_tasks,
      color: 'success',
    },
    {
      icon: cilClock,
      label: 'In Progress',
      value: data.stats.in_progress,
      color: 'warning',
    },
    {
      icon: cilBriefcase,
      label: 'To Do',
      value: data.stats.todo,
      color: 'info',
    },
  ]

  return (
    <>
      <StatCardsRow stats={stats} />
      <CRow className="g-4">
        <CCol xs={12} lg={7}>
          <MyProjectsProgress projects={data.my_projects} />
        </CCol>
        <CCol xs={12} lg={5}>
          <UpcomingTasks tasks={data.upcoming_tasks} />
        </CCol>
      </CRow>
    </>
  )
}

export default EmployeeDashboard
