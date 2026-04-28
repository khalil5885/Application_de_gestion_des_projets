import React from 'react'
import { CButton, CCard, CCardBody } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTrash, cilCalendar } from '@coreui/icons'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import ProgressBar from './ProgressBar'
import TaskBreakdown from './TaskBreakdown'

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

const ProjectCard = ({ project, onDelete, onClick }) => {
  const isInProgress = project.status === 'in_progress'
  const isCompleted = project.status === 'completed'

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
    data: { project }
  })

  // ProjectCard.jsx

const style = {
  // Use translate3d for better performance and add the rotation
  transform: transform 
    ? `${CSS.Translate.toString(transform)} rotate(${isDragging ? '-3deg' : '0deg'})` 
    : undefined,
  
  // Visual feedback
  opacity: isDragging ? 0.8 : 1,
  zIndex: isDragging ? 9999 : 1,
  
  // Smooth the transition so it doesn't "snap" instantly
  transition: isDragging 
    ? 'transform 0.05s ease-out' 
    : 'transform 0.2s ease, box-shadow 0.2s ease',
    
  // Ensure the card looks like it's "lifting" off the page
  boxShadow: isDragging 
    ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
    : 'none',
    
  cursor: isDragging ? 'grabbing' : 'pointer',
  position: 'relative'
};

  return (
    <CCard 
      ref={setNodeRef} 
      style={style} 
      className={`mb-3 border-0 shadow-sm project-card-hover ${isDragging ? 'shadow-lg' : ''}`}
    >
      <CCardBody className="p-3">
        {/* Top row: 9-Dot Handle & Delete */}
       <div className="d-flex justify-content-between align-items-start mb-2">
  {/* Drag Handle Container */}
          <div 
    {...listeners} 
    {...attributes} 
    className="p-1 rounded-1" 
    style={{ 
      cursor: 'grab', 
      display: 'grid', 
      gridTemplateColumns: 'repeat(3, 4px)', // Increased dot size slightly
      gap: '3px',
      padding: '4px' 
    }}
  >
    {[...Array(9)].map((_, i) => (
      <div 
        key={i} 
        style={{ 
          width: 4, 
          height: 4, 
          borderRadius: '50%', 
          backgroundColor: isDragging ? '#321fdb' : '#8a93a2' // Primary blue if dragging, muted gray if not
        }} 
      />
    ))}
  </div>

  <CButton
    size="sm"
    color="danger"
    variant="ghost"
    className="p-0 shadow-none"
    onClick={(e) => {
      e.stopPropagation();
      onDelete(project.id);
    }}
  >
    <CIcon icon={cilTrash} size="sm" />
  </CButton>
</div>

        {/* Title & Client */}
        <h6
          className="fw-bold mb-1"
          style={{
            textDecoration: isCompleted ? 'line-through' : 'none',
            opacity: isCompleted ? 0.55 : 1,
          }}
        >
          {project.name}
        </h6>
        <p className="small text-body-secondary mb-2">{project.client?.name || '—'}</p>

        {/* Progress bar */}
        {isInProgress && (
          <div className="mb-3">
            <div
              className="rounded-pill overflow-hidden"
              style={{ height: 4, background: 'var(--cui-border-color)' }}
            >
              <div className="bg-primary rounded-pill" style={{ height: '100%', width: '60%' }} />
            </div>
          </div>
        )
        ? <ProgressBar value={project.progress} />
    : <TaskBreakdown tasks={project.tasks} />
    }

        {/* Footer: Date & Avatar Stack */}
        <div
          className="d-flex align-items-center justify-content-between pt-2 mb-2"
          style={{ borderTop: '1px solid var(--cui-border-color-translucent)' }}
        >
          <div className="d-flex align-items-center gap-1 text-body-secondary">
            <CIcon icon={cilCalendar} size="sm" />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
              {isCompleted ? formatDate(project.end_date) : formatDate(project.start_date)}
            </span>
          </div>

          {/* User Avatar Stack (Max 5) */}
          <div className="d-flex align-items-center">
            {project.employees?.slice(0, 5).map((emp, index) => (
              <div
                key={emp.id}
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center border border-1 border-white"
                style={{ 
                  width: 22, 
                  height: 22, 
                  fontSize: 9, 
                  marginLeft: index === 0 ? 0 : -8, 
                  zIndex: 10 - index 
                }}
                title={emp.name}
              >
                {emp.name?.charAt(0).toUpperCase()}
              </div>
            ))}
            {project.employees?.length > 5 && (
              <div
                className="rounded-circle bg-light text-dark d-flex align-items-center justify-content-center border border-1 border-white"
                style={{ width: 22, height: 22, fontSize: 8, marginLeft: -8, zIndex: 0 }}
              >
                +{project.employees.length - 5}
              </div>
            )}
          </div>
        </div>

        {/* Details Button - Opens Drawer */}
        <CButton 
          color="primary" 
          variant="outline" 
          size="sm" 
          className="w-100 py-1" 
          style={{ fontSize: '0.75rem' }}
          onClick={() => onClick(project)}
        >
          View Details
        </CButton>
      </CCardBody>
    </CCard>
  )
}

export default ProjectCard