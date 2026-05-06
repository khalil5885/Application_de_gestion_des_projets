import React, { useState, useRef, useEffect } from 'react'
import CIcon from '@coreui/icons-react'
import { cilX, cilPlus, cilCheck } from '@coreui/icons'
import { CSpinner } from '@coreui/react'

// ─── Shared micro-styles (same tokens as parent page) ─────────────────────────

const inputStyle = {
  width: '100%',
  border: '1px solid var(--cui-border-color)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  background: 'var(--cui-secondary-bg)',
  color: 'var(--cui-body-color)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color .15s',
}

const labelStyle = {
  display: 'block',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.8px',
  color: 'var(--cui-secondary-color)',
  textTransform: 'uppercase',
  marginBottom: 4,
}

// ─── Category chips (mirrors the role-chip pattern from the screenshots) ───────

const CATEGORIES = [
  { label: 'Development', color: '#0891b2' },
  { label: 'Design',      color: '#7c3aed' },
  { label: 'Marketing',   color: '#059669' },
  { label: 'Operations',  color: '#d97706' },
  { label: 'Research',    color: '#db2777' },
  { label: 'Other',       color: '#6b7280' },
]

const CategoryChip = ({ label, color, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
      cursor: 'pointer', transition: 'all .15s',
      border: `1.5px solid ${selected ? color : 'var(--cui-border-color)'}`,
      background: selected ? color : 'transparent',
      color: selected ? '#fff' : 'var(--cui-secondary-color)',
    }}
  >
    {selected && <CIcon icon={cilCheck} style={{ width: 10 }} />}
    {label}
  </button>
)

// ─── CreateProjectTypeModal ───────────────────────────────────────────────────

/**
 * Props:
 *   onSave(form)   – async, called with { name, description, category }
 *   onCancel()     – close without saving
 */
const CreateProjectTypeModal = ({ onSave, onCancel }) => {
  const [form, setForm]         = useState({ name: '', description: '', category: '' })
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)
  const [nameFocused, setNameFocused] = useState(false)
  const nameRef = useRef(null)

  // Auto-focus the name field on mount
  useEffect(() => { nameRef.current?.focus() }, [])

  const isValid = form.name.trim().length > 0

  const handleSave = async () => {
    if (!isValid) return
    setSaving(true)
    setError(null)
    try {
      await onSave({
        name:        form.name.trim(),
        description: form.description.trim() || null,
        category:    form.category || null,
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project type.')
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') onCancel()
  }

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.18)',
          backdropFilter: 'blur(2px)',
          zIndex: 1040,
          animation: 'ptFadeIn .18s ease',
        }}
      />

      {/* ── Panel (centred, like the screenshots' popup card) ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New project type"
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(440px, calc(100vw - 32px))',
          background: 'var(--cui-body-bg)',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
          zIndex: 1050,
          display: 'flex', flexDirection: 'column',
          animation: 'ptSlideUp .22s cubic-bezier(0.34,1.56,0.64,1)',
          overflow: 'hidden',
        }}
      >
        {/* ── Header bar (mirrors the teal Cancel bar in the screenshots) ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'var(--cui-primary)',
          color: '#fff',
        }}>
          <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            New Project Type
          </span>
          <button
            onClick={onCancel}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none',
              borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
              color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
              transition: 'background .15s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            <CIcon icon={cilX} style={{ width: 11 }} /> CANCEL
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {error && (
            <div style={{
              fontSize: 12, color: '#ef4444',
              padding: '8px 12px', background: '#fef2f2',
              borderRadius: 8, border: '1px solid #fecaca',
            }}>
              {error}
            </div>
          )}

          {/* Name field */}
          <div>
            <label style={labelStyle}>Type name *</label>
            <input
              ref={nameRef}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Web Development"
              style={{
                ...inputStyle,
                borderColor: nameFocused ? 'var(--cui-primary)' : 'var(--cui-border-color)',
                boxShadow: nameFocused ? '0 0 0 3px var(--cui-primary-bg-subtle)' : 'none',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              onKeyDown={e => e.key === 'Escape' && onCancel()}
              placeholder="Short description (optional)"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {/* Category chips — mirrors role-chip row from screenshots */}
          <div>
            <label style={labelStyle}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
              {CATEGORIES.map(cat => (
                <CategoryChip
                  key={cat.label}
                  label={cat.label}
                  color={cat.color}
                  selected={form.category === cat.label}
                  onClick={() => setForm(f => ({
                    ...f,
                    category: f.category === cat.label ? '' : cat.label,
                  }))}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer action (mirrors "+ Add as developer" button) ── */}
        <div style={{ padding: '16px 20px 20px' }}>
          <button
            onClick={handleSave}
            disabled={saving || !isValid}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 0', borderRadius: 10,
              border: 'none', cursor: isValid ? 'pointer' : 'not-allowed',
              background: isValid ? 'var(--cui-primary)' : 'var(--cui-secondary-bg)',
              color: isValid ? '#fff' : 'var(--cui-secondary-color)',
              fontSize: 13, fontWeight: 800, letterSpacing: '0.3px',
              transition: 'all .15s',
              opacity: saving ? 0.8 : 1,
            }}
            onMouseOver={e => { if (isValid && !saving) e.currentTarget.style.filter = 'brightness(1.08)' }}
            onMouseOut={e => { e.currentTarget.style.filter = 'none' }}
          >
            {saving
              ? <CSpinner size="sm" />
              : <><CIcon icon={cilPlus} style={{ width: 14 }} /> Create project type</>
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ptFadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ptSlideUp {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)) scale(0.97) }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1) }
        }
      `}</style>
    </>
  )
}

export default CreateProjectTypeModal