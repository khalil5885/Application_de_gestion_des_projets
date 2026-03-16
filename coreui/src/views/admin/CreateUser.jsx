import React, { useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CSpinner,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUserPlus } from '@coreui/icons'
import api from '../../api'

const ROLE_OPTIONS = [
  { value: '', label: 'Select a role...' },
  { value: 'admin', label: 'Admin' },
  { value: 'employee', label: 'Employee' },
  { value: 'client', label: 'Client' },
]

const initialForm = { name: '', email: '', global_role: '' }

const CreateUser = ({ onUserCreated }) => {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setGlobalError(null)

    // Basic client-side validation
    const clientErrors = {}
    if (!form.name || form.name.trim().length < 2) {
      clientErrors.name = 'Name must be at least 2 characters.'
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      clientErrors.email = 'A valid email address is required.'
    }
    if (!form.global_role) {
      clientErrors.global_role = 'Please select a role.'
    }
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      setLoading(false)
      return
    }

    try {
      const response = await api.post('/api/admin/users', {
        name: form.name.trim(),
        email: form.email.trim(),
        global_role: form.global_role,
      })
      setForm(initialForm)
      if (onUserCreated) {
        onUserCreated(response.data.data || response.data)
      }
    } catch (err) {
      if (err.response?.status === 422) {
        // Laravel validation errors → field-level messages
        const laravelErrors = err.response.data.errors || {}
        const mapped = {}
        Object.keys(laravelErrors).forEach((key) => {
          mapped[key] = laravelErrors[key][0]
        })
        setErrors(mapped)
      } else {
        setGlobalError(
          err.response?.data?.message || 'Something went wrong. Please try again.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <CCard className="border-0 shadow-sm mb-4">
      <CCardHeader className="bg-transparent border-bottom-0 pt-4 px-4">
        <div className="d-flex align-items-center gap-2">
          <CIcon icon={cilUserPlus} size="lg" className="text-primary" />
          <h5 className="mb-0 fw-semibold">Create New User</h5>
        </div>
        <p className="text-body-secondary small mb-0 mt-1">
          A secure password will be auto-generated and emailed to the user.
        </p>
      </CCardHeader>
      <CCardBody className="px-4 pb-4">
        {globalError && (
          <CAlert color="danger" dismissible onClose={() => setGlobalError(null)}>
            {globalError}
          </CAlert>
        )}
        <CForm onSubmit={handleSubmit} noValidate>
          <CRow className="g-3">
            {/* Name */}
            <CCol md={12}>
              <CFormLabel htmlFor="cu-name" className="fw-medium">
                Full Name <span className="text-danger">*</span>
              </CFormLabel>
              <CFormInput
                id="cu-name"
                name="name"
                type="text"
                placeholder="e.g. Jane Smith"
                value={form.name}
                onChange={handleChange}
                invalid={!!errors.name}
                disabled={loading}
                autoComplete="off"
              />
              {errors.name && <CFormFeedback invalid>{errors.name}</CFormFeedback>}
            </CCol>

            {/* Email */}
            <CCol md={12}>
              <CFormLabel htmlFor="cu-email" className="fw-medium">
                Email Address <span className="text-danger">*</span>
              </CFormLabel>
              <CFormInput
                id="cu-email"
                name="email"
                type="email"
                placeholder="e.g. jane@company.com"
                value={form.email}
                onChange={handleChange}
                invalid={!!errors.email}
                disabled={loading}
                autoComplete="off"
              />
              {errors.email && <CFormFeedback invalid>{errors.email}</CFormFeedback>}
            </CCol>

            {/* Role */}
            <CCol md={12}>
              <CFormLabel htmlFor="cu-role" className="fw-medium">
                Role <span className="text-danger">*</span>
              </CFormLabel>
              <CFormSelect
                id="cu-role"
                name="global_role"
                value={form.global_role}
                onChange={handleChange}
                invalid={!!errors.global_role}
                disabled={loading}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                    {opt.label}
                  </option>
                ))}
              </CFormSelect>
              {errors.global_role && (
                <CFormFeedback invalid>{errors.global_role}</CFormFeedback>
              )}
            </CCol>

            {/* Submit */}
            <CCol md={12} className="mt-2">
              <CButton
                type="submit"
                color="primary"
                disabled={loading}
                className="w-100 fw-medium"
              >
                {loading ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Creating User…
                  </>
                ) : (
                  <>
                    <CIcon icon={cilUserPlus} className="me-2" />
                    Create User & Send Credentials
                  </>
                )}
              </CButton>
            </CCol>
          </CRow>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default CreateUser
