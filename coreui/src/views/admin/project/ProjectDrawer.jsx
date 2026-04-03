import React from 'react'
import { COffcanvas, COffcanvasHeader, COffcanvasTitle, COffcanvasBody,CButton, CFormLabel, CFormInput, CFormSelect } from '@coreui/react'
import api from '../../../api'
import { useNavigate } from 'react-router-dom'


const ProjectDrawer = ({ visible, project, onClose, onUpdate }) => {
  const navigate = useNavigate()
  if (!project) return null;

  const handleUpdate = async (field, value) => {
    try {
      await api.patch(`/api/admin/projects/${project.id}`, { [field]: value });
      onUpdate(); // Refresh the main list
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  return (
    <COffcanvas placement="end" visible={visible} onHide={onClose} scroll={true}>
      <COffcanvasHeader>
        <COffcanvasTitle className="fw-bold">{project.name}</COffcanvasTitle>
      </COffcanvasHeader>
      <COffcanvasBody>
        <div className="mb-4">
          <CFormLabel className="small text-body-secondary">Client</CFormLabel>
          <div className="fw-semibold">{project.client?.name || 'N/A'}</div>
        </div>

        <div className="mb-4">
          <CFormLabel>Start Date</CFormLabel>
          <CFormInput 
            type="date" 
            defaultValue={project.start_date?.split('T')[0]} 
            onBlur={(e) => handleUpdate('start_date', e.target.value)}
          />
        </div>

        <div className="mb-4">
          <CFormLabel>End Date</CFormLabel>
          <CFormInput 
            type="date" 
            defaultValue={project.end_date?.split('T')[0]} 
            onBlur={(e) => handleUpdate('end_date', e.target.value)}
          />
        </div>

        {/* Inside ProjectDrawer.jsx Body */}
<div className="mb-4">
  <div className="d-flex justify-content-between align-items-center mb-2">
    <CFormLabel className="mb-0 fw-bold">Team Members</CFormLabel>
    <CButton size="sm" color="link" className="p-0 text-decoration-none" onClick={() => {/* logic to open full edit */}}>
      Manage Team
    </CButton>
  </div>
  
  <div className="d-flex flex-wrap gap-2">
    {project.employees?.slice(0, 5).map(emp => (
      <div 
        key={emp.id} 
        className="d-flex align-items-center gap-2 bg-body-tertiary px-2 py-1 rounded-pill border"
      >
        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 20, height: 20, fontSize: 9 }}>
          {emp.name?.charAt(0)}
        </div>
        <span style={{ fontSize: 12 }}>{emp.name}</span>
      </div>
    ))}
    
    {project.employees?.length > 5 && (
      <div className="small text-body-secondary pt-1">
        + {project.employees.length - 5} more
      </div>
    )}
    
    {project.employees?.length === 0 && (
      <div className="text-body-secondary small italic">No employees assigned</div>
    )}
  </div>
</div>

<hr />

<CButton color="primary" variant="outline" className="w-100" onClick={() => navigate(`/admin/projects/${project.id}`)}>
  View Full Details & Tasks
</CButton>
      </COffcanvasBody>
    </COffcanvas>
  )
}

export default ProjectDrawer