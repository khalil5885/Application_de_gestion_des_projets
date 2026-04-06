import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  COffcanvas,
  COffcanvasHeader,
  COffcanvasTitle,
  COffcanvasBody,
  CButton,
  CFormLabel,
  CFormInput,
  CBadge,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTask, cilPeople, cilArrowRight } from '@coreui/icons'
import api from '../../../api'

const PRIORITY_COLORS = {
  low: 'success', medium: 'warning', high: 'danger',
}
const TASK_STATUS_COLORS = {
  todo: 'secondary', in_progress: 'primary', done: 'success', review: 'info',
}

const formatDate = (iso) => iso?.split('T')[0] || ''

const ProjectDrawer = ({ visible, project, onClose, onUpdate }) => {
  const navigate = useNavigate()
  const [showTasks, setShowTasks]         = useState(false)
  const [detail, setDetail]               = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    if (!visible || !project?.id) return
    setShowTasks(false)
    setDetail(null)
    const fetch = async () => {
      setLoadingDetail(true)
      try {
        const res = await api.get(`/api/admin/projects/${project.id}`)
        setDetail(res.data.data)
      } catch {}
      finally { setLoadingDetail(false) }
    }
    fetch()
  }, [visible, project?.id])

  const handleUpdate = async (field, value) => {
    try {
      await api.patch(`/api/admin/projects/${project.id}`, { [field]: value })
      onUpdate()
    } catch (err) { console.error('Update failed', err) }
  }

  if (!project) return null

  const members = detail?.members || project.members || []
  const tasks   = detail?.tasks   || []

  return (
    <COffcanvas placement="end" visible={visible} onHide={onClose} scroll style={{ width: 380 }}>
      <COffcanvasHeader className="border-bottom">
        <COffcanvasTitle className="fw-bold fs-5">{project.name}</COffcanvasTitle>
      </COffcanvasHeader>

      <COffcanvasBody className="d-flex flex-column gap-4 pt-4">

        {/* Client */}
        <div>
          <CFormLabel className="small text-body-secondary text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.05em', fontSize: 10 }}>Client</CFormLabel>
          <div className="fw-semibold">{project.client?.name || '—'}</div>
        </div>

        {/* Dates */}
        <div>
          <CFormLabel className="small text-body-secondary text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.05em', fontSize: 10 }}>Start Date</CFormLabel>
          <CFormInput type="date" defaultValue={formatDate(project.start_date)} onBlur={(e) => handleUpdate('start_date', e.target.value)} />
        </div>
        <div>
          <CFormLabel className="small text-body-secondary text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.05em', fontSize: 10 }}>End Date</CFormLabel>
          <CFormInput type="date" defaultValue={formatDate(project.end_date)} onBlur={(e) => handleUpdate('end_date', e.target.value)} />
        </div>

        {/* Team Members — no task button here */}
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <CIcon icon={cilPeople} size="sm" className="text-primary" />
            <CFormLabel className="mb-0 fw-bold">Team Members</CFormLabel>
            <CBadge color="secondary">{members.length}</CBadge>
          </div>
          {loadingDetail ? (
            <div className="text-center py-2"><CSpinner size="sm" /></div>
          ) : members.length === 0 ? (
            <p className="text-body-secondary small fst-italic mb-0">No members assigned yet.</p>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              {members.slice(0, 6).map(m => (
                <div key={m.id} className="d-flex align-items-center gap-2 bg-body-tertiary px-2 py-1 rounded-pill border" title={m.pivot?.project_role}>
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: 22, height: 22, fontSize: 9, flexShrink: 0 }}>
                    {m.name?.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12 }}>{m.name}</span>
                </div>
              ))}
              {members.length > 6 && <div className="small text-body-secondary pt-1">+{members.length - 6} more</div>}
            </div>
          )}
        </div>

        {/* Tasks section — clearly separated */}
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={cilTask} size="sm" className="text-primary" />
              <CFormLabel className="mb-0 fw-bold">Tasks</CFormLabel>
              <CBadge color="secondary">{tasks.length}</CBadge>
            </div>
            <CButton
              size="sm"
              color={showTasks ? 'secondary' : 'primary'}
              variant="ghost"
              className="fw-semibold"
              style={{ fontSize: 12 }}
              onClick={() => setShowTasks(s => !s)}
            >
              {showTasks ? 'Hide' : 'Show Tasks'}
            </CButton>
          </div>

          {showTasks && (
            <div className="rounded-3 p-3" style={{ background: 'var(--cui-secondary-bg)', border: '1px solid var(--cui-border-color-translucent)' }}>
              {loadingDetail ? (
                <div className="text-center py-2"><CSpinner size="sm" /></div>
              ) : tasks.length === 0 ? (
                <p className="text-body-secondary small fst-italic mb-0">No tasks yet.</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {tasks.map(task => (
                    <div key={task.id} className="rounded-2 p-2" style={{ background: 'var(--cui-body-bg)', border: '1px solid var(--cui-border-color-translucent)' }}>
                      <div className="fw-semibold mb-1" style={{ fontSize: 13 }}>{task.title}</div>
                      <div className="d-flex gap-2">
                        <CBadge color={TASK_STATUS_COLORS[task.status] || 'secondary'} style={{ fontSize: 10 }}>{task.status?.replace('_', ' ')}</CBadge>
                        <CBadge color={PRIORITY_COLORS[task.priority] || 'warning'} style={{ fontSize: 10 }}>{task.priority}</CBadge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-grow-1" />
        <hr className="my-0" />

        {/* Action buttons */}
        <div className="d-flex flex-column gap-2 pb-2">
          <CButton color="primary" className="w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
            onClick={() => { onClose(); navigate(`/admin/projects/${project.id}/tasks`) }}>
            <CIcon icon={cilTask} /> Manage Tasks
          </CButton>
          <CButton color="primary" variant="outline" className="w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
            onClick={() => { onClose(); navigate(`/admin/projects/${project.id}`) }}>
            <CIcon icon={cilArrowRight} /> View Team & Tasks
          </CButton>
        </div>

      </COffcanvasBody>
    </COffcanvas>
  )
}

export default ProjectDrawer