import React, { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { 
  CBadge, 
  CButton, 
  CFormInput, 
  CInputGroup, 
  CInputGroupText, 
  CSpinner 
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilSearch, cilFolder } from '@coreui/icons'

// DND Kit Imports
import { 
  DndContext, 
  closestCorners, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay 
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'

import { useAuth } from '../../../context/AuthContext'
import api from '../../../api'
import ProjectCard from './ProjectCard'
import CreateProjectModal from './CreateProjectModal'
import ProjectDrawer from './ProjectDrawer'

const STATUS_COLUMNS = [
  { key: 'pending',     label: 'Pending',    color: 'warning' },
  { key: 'in_progress', label: 'In Progress', color: 'primary' },
  { key: 'completed',   label: 'Completed',   color: 'success' },
  { key: 'on_hold',     label: 'On Hold',     color: 'danger'  },
]

const KanbanColumn = ({ col, projects, onDelete, onCardClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });

  const columnStyle = {
    flexShrink: 0,
    width: 300,
    minHeight: '600px',
    borderRadius: '12px',
    transition: 'all 0.25s ease',
    backgroundColor: isOver ? 'rgba(50, 31, 219, 0.08)' : 'rgba(0,0,0,0.02)',
    outline: isOver ? '2px dashed #321fdb' : '2px dashed transparent',
    outlineOffset: '2px',
    padding: '12px'
  };

  return (
    <div ref={setNodeRef} style={columnStyle}>
      <div className="d-flex align-items-center justify-content-between mb-3 px-1">
        <div className="d-flex align-items-center gap-2">
          <CBadge color={col.color} shape="rounded-pill" style={{ width: 8, height: 8, padding: 0 }} />
          <span className={`fw-bold small ${isOver ? 'text-primary' : ''}`}>{col.label}</span>
        </div>
        <CBadge color={col.color} variant="outline" shape="rounded-pill">{projects.length}</CBadge>
      </div>

      <div className="d-flex flex-column gap-3">
        {projects.map(p => (
          <ProjectCard key={p.id} project={p} onDelete={onDelete} onClick={onCardClick} />
        ))}
        {isOver && projects.length === 0 && (
          <div className="py-5 text-center text-primary small fw-bold border rounded-3 border-dashed">
            Drop Here
          </div>
        )}
      </div>
    </div>
  );
};

const ProjectManagement = () => {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState(null)
  
  const [selectedProject, setSelectedProject] = useState(null)
  const [showDrawer, setShowDrawer] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { 
    activationConstraint: { distance: 8 } 
  }))

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/projects')
      const data = res.data?.data?.data || res.data?.data || res.data;
      setProjects(Array.isArray(data) ? data : []);
    } catch { setProjects([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const projectId = active.id;
    const newStatus = over.id;

    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
    try {
      await api.patch(`/api/admin/projects/${projectId}`, { status: newStatus });
    } catch { fetchProjects() }
  };

  if (user && user.global_role !== 'admin') return <Navigate to="/dashboard" replace />

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0"><CIcon icon={cilFolder} className="me-2" />Project Management</h4>
        <CButton color="primary" onClick={() => setShowCreate(true)}>
          <CIcon icon={cilPlus} className="me-1" /> New Project
        </CButton>
      </div>

      <div className="mb-4" style={{ maxWidth: '400px' }}>
        <CInputGroup>
          <CInputGroupText className="bg-transparent border-end-0">
            <CIcon icon={cilSearch} />
          </CInputGroupText>
          <CFormInput 
            className="border-start-0 shadow-none"
            placeholder="Search projects or clients..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CInputGroup>
      </div>

      {loading ? (
        <div className="text-center py-5"><CSpinner color="primary" /></div>
      ) : (
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCorners} 
          onDragStart={handleDragStart} 
          onDragEnd={handleDragEnd}
        >
          <div className="d-flex gap-3 pb-4" style={{ overflowX: 'auto', minHeight: 'calc(100vh - 250px)' }}>
            {STATUS_COLUMNS.map(col => {
              const colProjects = projects.filter(p => 
                p.status === col.key && 
                (!search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.client?.name?.toLowerCase().includes(search.toLowerCase()))
              );
              return (
                <KanbanColumn 
                  key={col.key} 
                  col={col} 
                  projects={colProjects} 
                  onDelete={fetchProjects}
                  onCardClick={(p) => { setSelectedProject(p); setShowDrawer(true); }}
                />
              )
            })}
          </div>

          <DragOverlay>
            {activeId ? (
              <div style={{ transform: 'rotate(-4deg)', cursor: 'grabbing', width: '280px' }}>
                <ProjectCard 
                  project={projects.find(p => p.id === activeId)} 
                  onDelete={() => {}} 
                  onClick={() => {}} 
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <CreateProjectModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={fetchProjects} />
      <ProjectDrawer visible={showDrawer} project={selectedProject} onClose={() => setShowDrawer(false)} onUpdate={fetchProjects} />
    </>
  )
}

export default ProjectManagement