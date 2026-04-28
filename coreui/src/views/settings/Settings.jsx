import React, { useState } from 'react'
import { CCard, CCardBody, CButton, CFormInput, CFormLabel, CFormSelect, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSettings, cilUser, cilLockLocked, cilBell, cilColorPalette } from '@coreui/icons'
import { motion } from 'motion/react'
import { useAuth } from '../../context/AuthContext'

// ─── Section wrapper ──────────────────────────────────────────────────────────

const Section = ({ icon, title, badge, children }) => (
  <CCard className="border-0 shadow-sm mb-4">
    <CCardBody className="p-4">
      <div className="d-flex align-items-center gap-2 mb-4" style={{ paddingBottom: 16, borderBottom: '1px solid var(--cui-border-color-translucent)' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(88,86,214,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CIcon icon={icon} style={{ color: '#5856d6', fontSize: 16 }} />
        </div>
        <span className="fw-bold">{title}</span>
        {badge && <CBadge color="secondary" className="ms-2" style={{ fontSize: 10 }}>{badge}</CBadge>}
      </div>
      {children}
    </CCardBody>
  </CCard>
)

const Field = ({ label, children }) => (
  <div className="mb-3">
    <CFormLabel className="fw-semibold small text-uppercase mb-1" style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--cui-secondary-color)' }}>
      {label}
    </CFormLabel>
    {children}
  </div>
)

// ─── Component ────────────────────────────────────────────────────────────────

const Settings = () => {
  const { user }        = useAuth()
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-5">
        <div style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(88,86,214,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CIcon icon={cilSettings} style={{ color: '#5856d6', fontSize: 20 }} />
        </div>
        <div>
          <h4 className="fw-black mb-0" style={{ letterSpacing: '-0.3px' }}>Settings</h4>
          <p className="text-body-secondary small mb-0">Manage your account and preferences.</p>
        </div>
      </div>

      <div style={{ maxWidth: 600 }}>

        {/* Profile */}
        <Section icon={cilUser} title="Profile">
          <Field label="Full Name">
            <CFormInput defaultValue={user?.name} style={{ borderRadius: 10 }} />
          </Field>
          <Field label="Email Address">
            <CFormInput defaultValue={user?.email} disabled style={{ borderRadius: 10 }} />
          </Field>
          <Field label="Role">
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                background: 'var(--cui-secondary-bg)',
                border: '1px solid var(--cui-border-color-translucent)',
                fontSize: 13, fontWeight: 600,
              }}
            >
              <span
                style={{ width: 8, height: 8, borderRadius: '50%', background: user?.global_role === 'admin' ? '#e55353' : '#3b82f6', display: 'inline-block' }}
              />
              {user?.global_role}
            </div>
          </Field>
          <CButton
            color="primary"
            style={{ borderRadius: 10, paddingLeft: 20, paddingRight: 20 }}
            onClick={handleSave}
          >
            {saved ? '✓ Saved' : 'Save Changes'}
          </CButton>
        </Section>

        {/* Password */}
        <Section icon={cilLockLocked} title="Password" badge="Coming soon">
          <Field label="Current Password">
            <CFormInput type="password" disabled placeholder="••••••••" style={{ borderRadius: 10 }} />
          </Field>
          <Field label="New Password">
            <CFormInput type="password" disabled placeholder="••••••••" style={{ borderRadius: 10 }} />
          </Field>
          <CButton color="secondary" disabled style={{ borderRadius: 10 }}>
            Update Password
          </CButton>
        </Section>

        {/* Notifications */}
        <Section icon={cilBell} title="Notifications" badge="Coming soon">
          {['Email notifications', 'Task assignment alerts', 'Project deadline reminders'].map(label => (
            <div
              key={label}
              className="d-flex align-items-center justify-content-between py-2"
              style={{ borderBottom: '1px solid var(--cui-border-color-translucent)' }}
            >
              <span className="small fw-semibold">{label}</span>
              <div
                style={{
                  width: 38, height: 22, borderRadius: 50,
                  background: 'var(--cui-secondary-bg)',
                  border: '1px solid var(--cui-border-color)',
                  opacity: 0.5,
                }}
              />
            </div>
          ))}
          <p className="text-body-secondary small mt-3 mb-0">Notification preferences will be configurable in a future update.</p>
        </Section>

        {/* Theme */}
        <Section icon={cilColorPalette} title="Appearance">
          <Field label="Theme">
            <CFormSelect
              style={{ borderRadius: 10, maxWidth: 200 }}
              onChange={e => {
                document.documentElement.setAttribute('data-coreui-theme', e.target.value)
              }}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto (System)</option>
            </CFormSelect>
          </Field>
          <p className="text-body-secondary small mb-0">You can also toggle the theme from the header bar.</p>
        </Section>

      </div>
    </div>
  )
}

export default Settings