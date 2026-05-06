import React from 'react'
import {
  CCard,
  CCardBody,
  CProgress,
  CBadge,
} from '@coreui/react'

const projects = [
  {
    name: 'Website Redesign',
    nextTask: 'Homepage Review',
    progress: 65,
    status: 'In Progress',
    statusColor: 'success',
    barColor: 'success',
  },
  {
    name: 'Mobile App Dev',
    nextTask: 'Sprint Planning',
    progress: 10,
    status: 'Planning',
    statusColor: 'primary',
    barColor: 'primary',
  },
]

const MyProjects = () => {
  return (
    <CCard className="border-0 shadow-sm" style={{ borderRadius: '1rem' }}>
      <CCardBody className="p-4">
        <h5 className="fw-bold text-dark mb-4">My Projects</h5>
        <div className="d-flex flex-column gap-4">
          {projects.map((project, index) => (
            <div key={index} className="d-flex align-items-center">
              <div className="flex-grow-1">
                <h6 className="fw-semibold text-dark mb-1">{project.name}</h6>
                <p className="text-muted small mb-0">Next: {project.nextTask}</p>
              </div>
              <div className="d-flex align-items-center gap-3" style={{ width: '50%' }}>
                <div className="flex-grow-1">
                  <CProgress 
                    value={project.progress} 
                    color={project.barColor}
                    className="bg-light"
                    style={{ height: '10px', borderRadius: '5px' }}
                  />
                </div>
                <div className="d-flex align-items-center gap-2" style={{ minWidth: '120px' }}>
                  <CBadge 
                    color={project.statusColor} 
                    className="text-uppercase"
                    style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}
                  >
                    {project.status}
                  </CBadge>
                  <span className="fw-semibold text-secondary small">{project.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CCardBody>
    </CCard>
  )
}

export default MyProjects
