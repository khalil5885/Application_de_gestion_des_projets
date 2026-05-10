import React from 'react'
import {
  CCard,
  CCardBody,
  CButton,
} from '@coreui/react'

const actions = [
  {
    title: 'Review Design Drafts',
    description: 'Review the customizing design and baft drafts',
  },
  {
    title: 'Approve Budget',
    description: 'Review your #Approve budget',
  },
  {
    title: 'Project Budget',
    description: 'Review your project budget',
  },
]

const ActionRequired = () => {
  return (
    <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '1rem' }}>
      <CCardBody className="p-4">
        <h5 className="fw-bold text-dark mb-4">Action Required</h5>
        <div className="d-flex flex-column">
          {actions.map((action, index) => (
            <div 
              key={index} 
              className="d-flex align-items-center justify-content-between py-3"
              style={{ 
                borderBottom: index < actions.length - 1 ? '1px solid #f8f9fa' : 'none' 
              }}
            >
              <div style={{ maxWidth: '70%' }}>
                <h6 className="fw-semibold text-dark mb-1">{action.title}</h6>
                <p className="text-muted small mb-0">{action.description}</p>
              </div>
              <CButton 
                color="light" 
                variant="outline"
                className="fw-bold small shadow-sm"
                style={{ borderRadius: '0.5rem' }}
              >
                Review Now
              </CButton>
            </div>
          ))}
        </div>
      </CCardBody>
    </CCard>
  )
}

export default ActionRequired
