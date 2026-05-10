import React, { useState } from 'react'
import {
  CButton, CFormFeedback, CFormInput,
  CFormLabel, CSpinner, CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUserPlus, cilShieldAlt, cilUser, cilBriefcase, cilEnvelopeClosed } from '@coreui/icons'
import { motion, AnimatePresence } from 'motion/react'
import api from '../../api'

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = [
  {
    value: 'employee',
    label: 'Employee',
    description: 'Can view and manage assigned tasks',
    icon: cilUser,
    color: '#3b82f6',
  },
  {
    value: 'client',
    label: 'Client',
    description: 'Can view their projects and progress',
    icon: cilBriefcase,
    color: '#22c55e',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access to all features',
    icon: cilShieldAlt,
    color: '#e55353',
  },
]

const initialForm = { name: '', email: '', global_role: '' }

// ─── Role Card ────────────────────────────────────────────────────────────────

const RoleCard = ({ role, selected, onClick }) => {
  const active = selected === role.value
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type="button"
      onClick={() => onClick(role.value)}
      style={{
        flex: 1,
        padding: '12px 10px',
        borderRadius: 12,
        border: active
          ? `2px solid ${role.color}`
          : '2px solid var(--cui-border-color-translucent)',
        background: active ? `${role.color}12` : 'var(--cui-secondary-bg)',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow when active */}
      {active && (
        <motion.div
          layoutId="role-glow"
          style={{
            position: 'absolute', inset: 0,
            background: `${role.color}08`,
            borderRadius: 10,
          }}
        />
      )}
      <div
        style={{
          width: 36, height: 36, borderRadius: 10, margin: '0 auto 8px',
          background: active ? `${role.color}20` : 'var(--cui-tertiary-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
        }}
      >
        <CIcon icon={role.icon} style={{ color: active ? role.color : 'var(--cui-secondary-color)', fontSize: 16 }} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, color: active ? role.color : 'var(--cui-body-color)', marginBottom: 2 }}>
        {role.label}
      </div>
      <div style={{ fontSize: 10, color: 'var(--cui-secondary-color)', lineHeight: 1.3 }}>
        {role.description}
      </div>
    </motion.button>
  )
}

// ─── Input Field ──────────────────────────────────────────────────────────────

const Field = ({ label, error, icon, children }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      {icon && <CIcon icon={icon} size="sm" style={{ color: 'var(--cui-secondary-color)' }} />}
      <CFormLabel
        className="mb-0 fw-semibold"
        style={{ fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--cui-secondary-color)' }}
      >
        {label}
      </CFormLabel>
    </div>
    {children}
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
        >
          <CFormFeedback invalid style={{ display: 'block' }}>{error}</CFormFeedback>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────

const CreateUser = ({ onUserCreated }) => {
  const [form, setForm]           = useState(initialForm)
  const [errors, setErrors]       = useState({})
  const [loading, setLoading]     = useState(false)
  const [globalError, setGlobalError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: null }))
  }

  const setRole = (value) => {
    setForm(p => ({ ...p, global_role: value }))
    if (errors.global_role) setErrors(p => ({ ...p, global_role: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const clientErrors = {}
    if (!form.name || form.name.trim().length < 2) clientErrors.name = 'Name must be at least 2 characters.'
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) clientErrors.email = 'A valid email address is required.'
    if (!form.global_role) clientErrors.global_role = 'Please select a role.'
    if (Object.keys(clientErrors).length > 0) { setErrors(clientErrors); return }

    setLoading(true)
    setErrors({})
    setGlobalError(null)

    try {
      const res = await api.post('/api/admin/users', {
        name: form.name.trim(),
        email: form.email.trim(),
        global_role: form.global_role,
      })
      setForm(initialForm)
      onUserCreated?.(res.data.data || res.data)
    } catch (err) {
      if (err.response?.status === 422) {
        const raw = err.response.data.errors || {}
        const mapped = {}
        Object.keys(raw).forEach(k => { mapped[k] = Array.isArray(raw[k]) ? raw[k][0] : raw[k] })
        setErrors(mapped)
      } else {
        setGlobalError(err.response?.data?.message || 'Something went wrong.')
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = ROLES.find(r => r.value === form.global_role)

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
    >
      <div
        style={{
          background: 'var(--cui-card-bg)',
          border: '1px solid var(--cui-border-color-translucent)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        }}
      >
        {/* Header strip */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--cui-border-color-translucent)',
            background: 'var(--cui-secondary-bg)',
          }}
        >
          <div className="d-flex align-items-center gap-2 mb-1">
            <div
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'rgba(88,86,214,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <CIcon icon={cilUserPlus} style={{ color: '#5856d6' }} />
            </div>
            <span className="fw-bold" style={{ fontSize: 15 }}>New User</span>
          </div>
          <p className="text-body-secondary mb-0" style={{ fontSize: 12 }}>
            Credentials will be auto-generated and emailed.
          </p>
        </div>

        {/* Form body */}
        <div style={{ padding: '20px 24px 24px' }}>
          <AnimatePresence>
            {globalError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <CAlert color="danger" dismissible onClose={() => setGlobalError(null)} className="mb-4" style={{ fontSize: 13 }}>
                  {globalError}
                </CAlert>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} noValidate>

            {/* Name */}
            <Field label="Full Name" error={errors.name} icon={cilUser}>
              <CFormInput
                name="name"
                type="text"
                placeholder="e.g. Jane Smith"
                value={form.name}
                onChange={handleChange}
                invalid={!!errors.name}
                disabled={loading}
                autoComplete="off"
                style={{ borderRadius: 10 }}
              />
            </Field>

            {/* Email */}
            <Field label="Email Address" error={errors.email} icon={cilEnvelopeClosed}>
              <CFormInput
                name="email"
                type="email"
                placeholder="e.g. jane@company.com"
                value={form.email}
                onChange={handleChange}
                invalid={!!errors.email}
                disabled={loading}
                autoComplete="off"
                style={{ borderRadius: 10 }}
              />
            </Field>

            {/* Role selector */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <CFormLabel
                  className="mb-0 fw-semibold"
                  style={{ fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--cui-secondary-color)' }}
                >
                  Role
                </CFormLabel>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {ROLES.map(role => (
                  <RoleCard
                    key={role.value}
                    role={role}
                    selected={form.global_role}
                    onClick={setRole}
                  />
                ))}
              </div>
              <AnimatePresence>
                {errors.global_role && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div style={{ color: '#e55353', fontSize: 12, marginTop: 6 }}>{errors.global_role}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: 12,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: selectedRole
                  ? `linear-gradient(135deg, ${selectedRole.color}cc, ${selectedRole.color})`
                  : 'linear-gradient(135deg, #7c3aed, #5856d6)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: loading ? 0.7 : 1,
                transition: 'background 0.3s ease, opacity 0.2s',
                boxShadow: selectedRole
                  ? `0 4px 16px ${selectedRole.color}40`
                  : '0 4px 16px rgba(88,86,214,0.3)',
              }}
            >
              {loading ? (
                <><CSpinner size="sm" /> Creating User…</>
              ) : (
                <><CIcon icon={cilUserPlus} /> Create User & Send Credentials</>
              )}
            </motion.button>

          </form>
        </div>
      </div>
    </motion.div>
  )
}

export default CreateUser