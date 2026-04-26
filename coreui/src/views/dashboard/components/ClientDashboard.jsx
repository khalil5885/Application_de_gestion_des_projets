import React from 'react'
import { CRow, CCol } from '@coreui/react'
import StatCardsRow from './StatCardsRow'
import ClientProjectsList from './ClientProjectsList'
import {
  cilBriefcase,
  cilClock,
  cilCheckCircle,
  cilTask,
} from '@coreui/icons'

const ClientDashboard = ({ data }) => {
  const stats = [
    {
      icon: cilBriefcase,
      label: 'My Projects',
      value: data.stats.total_projects,
      color: 'primary',
    },
    {
      icon: cilClock,
      label: 'Active',
      value: data.stats.active_projects,
      color: 'warning',
    },
    {
      icon: cilCheckCircle,
      label: 'Completed',
      value: data.stats.completed_projects,
      color: 'success',
    },
    {
      icon: cilTask,
      label: 'Avg. Progress',
      value: `${data.stats.avg_progress}%`,
      color: 'info',
    },
  ]

  return (
    <>
      <StatCardsRow stats={stats} />
      <CRow className="g-4">
        <CCol xs={12}>
          <ClientProjectsList projects={data.projects} />
        </CCol>
      </CRow>
    </>
  )
}

export default ClientDashboard
