import React from 'react'
import { CRow, CCol } from '@coreui/react'
import StatCard from './StatCard'

const StatCardsRow = ({ stats }) => (
  <CRow className="g-4 mb-4">
    {stats.map((stat, index) => (
      <CCol xs={12} sm={6} xl={3} key={index}>
        <StatCard
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          subtitle={stat.subtitle}
          color={stat.color}
        />
      </CCol>
    ))}
  </CRow>
)

export default StatCardsRow
