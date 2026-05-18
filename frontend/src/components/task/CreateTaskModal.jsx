// src/components/task/CreateTaskModal.jsx
import React, { useState, useEffect } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody,
  CForm, CFormLabel, CFormInput, CFormSelect,
  CFormTextarea, CFormFeedback, CRow, CCol,
  CButton, CSpinner, CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus } from '@coreui/icons'
import api from '../../api'

const TASK_COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#8a93a2' },
  { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { key: 'on_hold', label: 'On Hold', color: '#f59e0b' },
  { key: 'ready_for_review', label: 'Ready for Review', color: '#0ea5e9' },
  { key: 'done', label: 'Done', color: '#22c55e' },
]

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent']

const initialForm = {
  title: '',
  description: '',
  priority: 'medium',
  status: 'todo',
  due_date: '',
  assigned_to: '',
  parent_id: null,
}

const CreateTaskModal = ({ 
  visible, 
  onClose, 
  onCreated, 
  projectId, 
  members, 
  parentTask = null,
  isAdmin = false,
}) => {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState(null)

  // Reset form when modal opens or parentTask changes
  useEffect(() => {
    if (!visible) return
    setForm({
      ...initialForm,
      parent_id: parentTask?.id || null,
      assigned_to: parentTask?.assigned_to || '',
      priority: parentTask?.priority || 'medium',
    })
    setErrors({})
  }, [visible, parentTask])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setGlobalError(null)

    try {
      const prefix = isAdmin ? 'admin' : 'employee'
      await api.post(`/api/${prefix}/tasks`, {
        ...form,
        project_id: projectId,
        assigned_to: form.assigned_to || null,
        parent_id: form.parent_id || null,
      })
      onCreated()
      onClose()
    } catch (err) {
      if (err.response?.status === 422) {
        const raw = err.response.data.errors || {}
        const mapped = {}
        Object.keys(raw).forEach(k => { 
          mapped[k] = Array.isArray(raw[k]) ? raw[k][0] : raw[k] 
        })
        setErrors(mapped)
      } else {
        setGlobalError(err.response?.data?.message || 'Failed to create task.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader>
        <CModalTitle className="fw-bold">
          <CIcon icon={cilPlus} className="me-2 text-primary" />
          {parentTask ? 'New Subtask' : 'New Task'}
          {parentTask && (
            <div className="small text-body-secondary mt-1" style={{ fontWeight: 400 }}>
              Parent: {parentTask.title}
            </div>
          )}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {globalError && (
          <CAlert color="danger" dismissible onClose={() => setGlobalError(null)}>
            {globalError}
          </CAlert>
        )}
        <CForm onSubmit={handleSubmit} noValidate>
          <CRow className="g-3">
            {/* Title */}
            <CCol md={12}>
              <CFormLabel className="fw-medium small">Title *</CFormLabel>
              <CFormInput
                name="title"
                value={form.title}
                onChange={handleChange}
                invalid={!!errors.title}
                placeholder="e.g. Design login screen"
              />
              {errors.title && <CFormFeedback invalid>{errors.title}</CFormFeedback>}
            </CCol>

            {/* Priority & Status */}
            <CCol md={6}>
              <CFormLabel className="fw-medium small">Priority</CFormLabel>
              <CFormSelect name="priority" value={form.priority} onChange={handleChange}>
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel className="fw-medium small">Status</CFormLabel>
              <CFormSelect name="status" value={form.status} onChange={handleChange}>
                {TASK_COLUMNS.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </CFormSelect>
            </CCol>

            {/* Due Date */}
            <CCol md={parentTask ? 12 : 6}>
              <CFormLabel className="fw-medium small">Due Date</CFormLabel>
              <CFormInput
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
                invalid={!!errors.due_date}
              />
              {errors.due_date && <CFormFeedback invalid>{errors.due_date}</CFormFeedback>}
            </CCol>

            {/* Assign To - Hidden for subtasks, shown for regular tasks */}
            {!parentTask && (
              <CCol md={6}>
                <CFormLabel className="fw-medium small">Assign To</CFormLabel>
                <CFormSelect
                  name="assigned_to"
                  value={form.assigned_to}
                  onChange={handleChange}
                >
                  <option value="">Unassigned</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
            )}

            {/* Description */}
            <CCol md={12}>
              <CFormLabel className="fw-medium small">Description</CFormLabel>
              <CFormTextarea
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                placeholder="Task details..."
              />
            </CCol>

            {/* Submit */}
            <CCol md={12}>
              <CButton
                type="submit"
                color="primary"
                disabled={loading}
                className="w-100 fw-semibold"
              >
                {loading ? (
                  <><CSpinner size="sm" className="me-2" />Creating...</>
                ) : (
                  <><CIcon icon={cilPlus} className="me-2" />
                    {parentTask ? 'Create Subtask' : 'Create Task'}
                  </>
                )}
              </CButton>
            </CCol>
          </CRow>
        </CForm>
      </CModalBody>
    </CModal>
  )
}

export default CreateTaskModal