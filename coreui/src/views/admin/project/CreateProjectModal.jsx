import React, { useState, useEffect } from 'react'
import {
  CAlert,
  CButton,
  CCol,
  CForm,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus } from '@coreui/icons'
import api from '../../../api'

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',  label: 'Completed' },
  { value: 'on_hold',    label: 'On Hold' },
]

const initialForm = {
  name: '', description: '', status: 'pending',
  client_id: '', project_type_id: '', start_date: '', end_date: '',
}

const CreateProjectModal = ({ visible, onClose, onCreated }) => {
  const [users, setUsers]             = useState([])
  const [projectTypes, setProjectTypes] = useState([])
  const [form, setForm]               = useState(initialForm)
  const [errors, setErrors]           = useState({})
  const [loading, setLoading]         = useState(false)
  const [globalError, setGlobalError] = useState(null)

  // Load dropdown data when modal opens
  useEffect(() => {
    if (!visible) return
    const load = async () => {
      try {
        const [uRes, tRes] = await Promise.all([
          api.get('/api/admin/users'),
          api.get('/api/admin/project-types'),
        ])
        const uData = uRes.data?.data
        const tData = tRes.data?.data
        setUsers((Array.isArray(uData) ? uData : uData?.data ?? []).filter(u => u.global_role === 'client'))
        setProjectTypes(Array.isArray(tData) ? tData : tData?.data ?? [])
      } catch {
        // silently fail — fields will just be empty
      }
    }
    load()
  }, [visible])

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
      await api.post('/api/admin/projects', form)
      setForm(initialForm)
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
        setGlobalError(err.response?.data?.message || 'Submission failed.')
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
          New Project
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
            <CCol md={12}>
              <CFormLabel className="fw-medium small">Project Name *</CFormLabel>
              <CFormInput
                name="name"
                value={form.name}
                onChange={handleChange}
                invalid={!!errors.name}
                placeholder="e.g. Brand Redesign"
              />
              {errors.name && <CFormFeedback invalid>{errors.name}</CFormFeedback>}
            </CCol>

            <CCol md={6}>
              <CFormLabel className="fw-medium small">Client *</CFormLabel>
              <CFormSelect name="client_id" value={form.client_id} onChange={handleChange} invalid={!!errors.client_id}>
                <option value="">Select client...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </CFormSelect>
              {errors.client_id && <CFormFeedback invalid>{errors.client_id}</CFormFeedback>}
            </CCol>

            <CCol md={6}>
              <CFormLabel className="fw-medium small">Project Type *</CFormLabel>
              <CFormSelect name="project_type_id" value={form.project_type_id} onChange={handleChange} invalid={!!errors.project_type_id}>
                <option value="">Select type...</option>
                {projectTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </CFormSelect>
              {errors.project_type_id && <CFormFeedback invalid>{errors.project_type_id}</CFormFeedback>}
            </CCol>

            <CCol md={6}>
              <CFormLabel className="fw-medium small">Start Date *</CFormLabel>
              <CFormInput type="date" name="start_date" value={form.start_date} onChange={handleChange} invalid={!!errors.start_date} />
              {errors.start_date && <CFormFeedback invalid>{errors.start_date}</CFormFeedback>}
            </CCol>

            <CCol md={6}>
              <CFormLabel className="fw-medium small">End Date *</CFormLabel>
              <CFormInput type="date" name="end_date" value={form.end_date} onChange={handleChange} invalid={!!errors.end_date} />
              {errors.end_date && <CFormFeedback invalid>{errors.end_date}</CFormFeedback>}
            </CCol>

            <CCol md={12}>
              <CFormLabel className="fw-medium small">Status</CFormLabel>
              <CFormSelect name="status" value={form.status} onChange={handleChange}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </CFormSelect>
            </CCol>

            <CCol md={12}>
              <CFormLabel className="fw-medium small">Description</CFormLabel>
              <CFormTextarea name="description" rows={3} value={form.description} onChange={handleChange} placeholder="Brief project description..." />
            </CCol>

            <CCol md={12}>
              <CButton type="submit" color="primary" disabled={loading} className="w-100 fw-semibold">
                {loading
                  ? <><CSpinner size="sm" className="me-2" />Creating...</>
                  : <><CIcon icon={cilPlus} className="me-2" />Create Project</>
                }
              </CButton>
            </CCol>
          </CRow>
        </CForm>
      </CModalBody>
    </CModal>
  )
}

export default CreateProjectModal