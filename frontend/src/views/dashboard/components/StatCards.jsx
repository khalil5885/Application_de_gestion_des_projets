import React from 'react'
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowTop } from '@coreui/icons'

const stats = [
  {
    label: 'Total Projects',
    value: '24',
    trend: '15%',
    weekly: '+5%',
    color: 'success',
  },
  {
    label: 'Active',
    value: '15',
    trend: '12%',
    weekly: '+2%',
    color: 'success',
  },
  {
    label: 'Completed',
    value: '9',
    trend: '18%',
    weekly: '+8%',
    color: 'success',
  },
  {
    label: 'Avg. Progress',
    value: '78%',
    trend: '73%',
    weekly: '+3%',
    color: 'success',
  },
]

const StatCards = () => {
  return (
    <CRow className="g-4">
      {stats.map((stat, index) => (
        <CCol sm={6} lg={3} key={index}>
          <CCard className="h-100 border-0 shadow-sm" style={{ borderRadius: '1rem' }}>
            <CCardBody className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <p className="text-muted mb-1 small fw-medium">{stat.label}</p>
                  <h3 className="fw-bold text-dark mb-0" style={{ fontSize: '2rem' }}>
                    {stat.value}
                  </h3>
                </div>
                <div className={`bg-${stat.color}-subtle text-${stat.color} px-2 py-1 rounded d-flex align-items-center small fw-semibold`}>
                  <CIcon icon={cilArrowTop} size="sm" className="me-1" />
                  {stat.trend}
                </div>
              </div>
              <p className="text-muted small mb-0">
                <span className={`text-${stat.color} fw-medium`}>{stat.weekly}</span> this week
              </p>
            </CCardBody>
          </CCard>
        </CCol>
      ))}
    </CRow>
  )
}

export default StatCards
