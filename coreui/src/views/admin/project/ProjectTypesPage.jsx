import React, { useState, useEffect, useRef } from 'react'
import {
  CSpinner, CAlert, CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPlus, cilPencil, cilTrash, cilX, cilCheck,
  cilTask, cilGrid, cilDescription,
} from '@coreui/icons'
import api from '../../../api'   // adjust path if needed

// ─── tiny helpers ─────────────────────────────────────────────────────────────
const DIFFICULTY_META = {
  very_easy: { label: 'Very Easy', color: '#22c55e' },
  easy:      { label: 'Easy',      color: '#84cc16' },
  medium:    { label: 'Medium',    color: '#f59e0b' },
  hard:      { label: 'Hard',      color: '#f97316' },
  very_hard: { label: 'Very Hard', color: '#ef4444' },
}

const hsl = (h, s, l) => `hsl(${h},${s}%,${l}%)`

// deterministic accent per project-type id
const accentFor = (id = 0) => {
  const hues = [217, 260, 340, 160, 30, 190, 290]
  return hues[id % hues.length]
}

// ─── TemplateRow ──────────────────────────────────────────────────────────────
const TemplateRow = ({ template, onSave, onDelete }) => {
  const [editing, setEditing]   = useState(false)
  const [form, setForm]         = useState({ ...template })
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(template.id, {
        name:             form.title,
        description:      form.description,
        default_due_days: form.default_due_days,
        order:            form.order,
      })
      setEditing(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await onDelete(template.id) }
    finally { setDeleting(false) }
  }

  if (editing) {
    return (
      <div
        style={{
          background: 'var(--cui-body-bg)',
          border: '1.5px solid var(--cui-primary)',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Template name"
          style={inputStyle}
          autoFocus
        />
        <textarea
          value={form.description || ''}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Description (optional)"
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Due days</label>
            <input
              type="number"
              min={1}
              value={form.default_due_days || ''}
              onChange={e => setForm(f => ({ ...f, default_due_days: e.target.value }))}
              placeholder="e.g. 7"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Order</label>
            <input
              type="number"
              min={0}
              value={form.order ?? ''}
              onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
              placeholder="0"
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => setEditing(false)} style={ghostBtn}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={primaryBtn}>
            {saving ? <CSpinner size="sm" /> : <><CIcon icon={cilCheck} style={{ width: 13 }} /> Save</>}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--cui-secondary-bg)',
        border: '1px solid var(--cui-border-color-translucent)',
        borderRadius: 10,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      {/* Order badge */}
      <div
        style={{
          width: 24, height: 24, borderRadius: 6, flexShrink: 0,
          background: 'var(--cui-primary)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 800, marginTop: 2,
        }}
      >
        {template.order + 1}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{template.title}</div>
        {template.description && (
          <div style={{ fontSize: 11, color: 'var(--cui-secondary-color)', marginBottom: 4, lineHeight: 1.4 }}>
            {template.description}
          </div>
        )}
        {template.default_due_days && (
          <span
            style={{
              fontSize: 10, fontWeight: 700,
              background: 'var(--cui-primary-bg-subtle)',
              color: 'var(--cui-primary)',
              padding: '2px 8px', borderRadius: 20,
            }}
          >
            +{template.default_due_days} days
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button onClick={() => setEditing(true)} style={iconBtn} title="Edit">
          <CIcon icon={cilPencil} style={{ width: 12 }} />
        </button>
        <button onClick={handleDelete} disabled={deleting} style={{ ...iconBtn, color: '#ef4444' }} title="Delete">
          {deleting ? <CSpinner size="sm" /> : <CIcon icon={cilTrash} style={{ width: 12 }} />}
        </button>
      </div>
    </div>
  )
}

// ─── NewTemplateForm ───────────────────────────────────────────────────────────
const NewTemplateForm = ({ projectTypeId, nextOrder, onCreated }) => {
  const [open, setOpen]   = useState(false)
  const [form, setForm]   = useState({ title: '', description: '', default_due_days: '', order: nextOrder })
  const [saving, setSaving] = useState(false)

  useEffect(() => { setForm(f => ({ ...f, order: nextOrder })) }, [nextOrder])

  const handleSubmit = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await api.post(`/api/admin/project-types/${projectTypeId}/task-templates`, {
    title:             form.title.trim(),
    description:      form.description || null,
    default_due_days: form.default_due_days ? parseInt(form.default_due_days) : null,
    order:            parseInt(form.order) || nextOrder,
    project_type_id:  projectTypeId,  
})
      setForm({ title: '', description: '', default_due_days: '', order: nextOrder + 1 })
      setOpen(false)
      onCreated()
    } finally { setSaving(false) }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%', border: '1.5px dashed var(--cui-border-color)',
          borderRadius: 10, padding: '10px 0', background: 'transparent',
          color: 'var(--cui-secondary-color)', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 6, letterSpacing: '0.5px',
          transition: 'all .2s',
        }}
        onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cui-primary)'; e.currentTarget.style.color = 'var(--cui-primary)' }}
        onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cui-border-color)'; e.currentTarget.style.color = 'var(--cui-secondary-color)' }}
      >
        <CIcon icon={cilPlus} style={{ width: 13 }} /> ADD TEMPLATE
      </button>
    )
  }

  return (
    <div
      style={{
        background: 'var(--cui-body-bg)',
        border: '1.5px solid var(--cui-primary)',
        borderRadius: 10, padding: '14px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: 'var(--cui-primary)', marginBottom: 2 }}>
        NEW TEMPLATE
      </div>
      <input
        value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        placeholder="Template title *"
        style={inputStyle}
        autoFocus
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />
      <textarea
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        placeholder="Description (optional)"
        rows={2}
        style={{ ...inputStyle, resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Due days from start</label>
          <input
            type="number" min={1}
            value={form.default_due_days}
            onChange={e => setForm(f => ({ ...f, default_due_days: e.target.value }))}
            placeholder="e.g. 7"
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Order</label>
          <input
            type="number" min={0}
            value={form.order}
            onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
            style={inputStyle}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={() => setOpen(false)} style={ghostBtn}>Cancel</button>
        <button onClick={handleSubmit} disabled={saving || !form.title.trim()} style={primaryBtn}>
          {saving ? <CSpinner size="sm" /> : <><CIcon icon={cilPlus} style={{ width: 13 }} /> Create</>}
        </button>
      </div>
    </div>
  )
}

// ─── Template Drawer ───────────────────────────────────────────────────────────
const TemplateDrawer = ({ projectType, onClose }) => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading]     = useState(false)

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/admin/project-types/${projectType.id}/task-templates`)
      setTemplates(res.data.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { if (projectType) fetchTemplates() }, [projectType?.id])

  const handleUpdate = async (id, data) => {
    await api.put(`/api/admin/task-templates/${id}`, data)
    fetchTemplates()
  }

  const handleDelete = async (id) => {
    await api.delete(`/api/admin/task-templates/${id}`)
    fetchTemplates()
  }

  const accent = accentFor(projectType?.id)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(2px)',
          zIndex: 1040,
          animation: 'fadeIn .2s ease',
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 460,
          background: 'var(--cui-body-bg)',
          borderLeft: `3px solid ${hsl(accent, 70, 55)}`,
          zIndex: 1050,
          display: 'flex', flexDirection: 'column',
          animation: 'slideIn .28s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 18px',
            borderBottom: '1px solid var(--cui-border-color-translucent)',
            background: `linear-gradient(135deg, ${hsl(accent,70,55)}18, transparent)`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div
                style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: '2px',
                  color: hsl(accent, 70, 55), textTransform: 'uppercase', marginBottom: 4,
                }}
              >
                Task Templates
              </div>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.2 }}>
                {projectType.name}
              </h2>
              {projectType.description && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--cui-secondary-color)', lineHeight: 1.4 }}>
                  {projectType.description}
                </p>
              )}
            </div>
            <button onClick={onClose} style={{ ...iconBtn, marginTop: 2 }}>
              <CIcon icon={cilX} style={{ width: 16 }} />
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
            <div
              style={{
                padding: '6px 14px', borderRadius: 20,
                background: `${hsl(accent,70,55)}18`,
                border: `1px solid ${hsl(accent,70,55)}40`,
                fontSize: 11, fontWeight: 700, color: hsl(accent, 70, 55),
              }}
            >
              {templates.length} templates
            </div>
            <div
              style={{
                padding: '6px 14px', borderRadius: 20,
                background: 'var(--cui-secondary-bg)',
                border: '1px solid var(--cui-border-color-translucent)',
                fontSize: 11, fontWeight: 700, color: 'var(--cui-secondary-color)',
              }}
            >
              Auto-assigned on project creation
            </div>
          </div>
        </div>

        {/* Body — scrollable */}
        <div
          style={{
            flex: 1, overflowY: 'auto', padding: '20px 24px',
            display: 'flex', flexDirection: 'column', gap: 10,
            scrollbarWidth: 'thin',
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', paddingTop: 40 }}><CSpinner /></div>
          ) : templates.length === 0 ? (
            <div
              style={{
                textAlign: 'center', paddingTop: 40,
                color: 'var(--cui-secondary-color)', fontSize: 13,
              }}
            >
              <CIcon icon={cilTask} style={{ width: 32, height: 32, opacity: 0.25, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
              No templates yet. Add one below.
            </div>
          ) : (
            templates.map(t => (
              <TemplateRow
                key={t.id}
                template={t}
                onSave={handleUpdate}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Footer — new template form */}
        <div
          style={{
            padding: '16px 24px 20px',
            borderTop: '1px solid var(--cui-border-color-translucent)',
            flexShrink: 0,
          }}
        >
          <NewTemplateForm
            projectTypeId={projectType.id}
            nextOrder={templates.length}
            onCreated={fetchTemplates}
          />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  )
}

// ─── ProjectTypeCard ──────────────────────────────────────────────────────────
const ProjectTypeCard = ({ projectType, onEdit, onDelete, onClick }) => {
  const [deleting, setDeleting] = useState(false)
  const accent = accentFor(projectType.id)

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${projectType.name}"? This will also remove all its templates.`)) return
    setDeleting(true)
    try { await onDelete(projectType.id) }
    finally { setDeleting(false) }
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--cui-secondary-bg)',
        border: '1px solid var(--cui-border-color-translucent)',
        borderTop: `3px solid ${hsl(accent, 70, 55)}`,
        borderRadius: 12,
        padding: '20px',
        cursor: 'pointer',
        transition: 'transform .18s, box-shadow .18s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseOver={e => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = `0 8px 24px ${hsl(accent,70,55)}22`
      }}
      onMouseOut={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Decorative blob */}
      <div
        style={{
          position: 'absolute', top: -20, right: -20,
          width: 80, height: 80, borderRadius: '50%',
          background: `${hsl(accent,70,55)}12`, pointerEvents: 'none',
        }}
      />

      {/* Type icon */}
      <div
        style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${hsl(accent,70,55)}18`,
          border: `1.5px solid ${hsl(accent,70,55)}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <CIcon icon={cilGrid} style={{ width: 18, color: hsl(accent, 70, 55) }} />
      </div>

      <h3 style={{ fontWeight: 800, fontSize: '1rem', margin: '0 0 6px' }}>
        {projectType.name}
      </h3>

      {projectType.description && (
        <p
          style={{
            margin: '0 0 14px', fontSize: 12,
            color: 'var(--cui-secondary-color)', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {projectType.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 10, fontWeight: 700,
            color: hsl(accent, 70, 55), letterSpacing: '0.5px',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <CIcon icon={cilTask} style={{ width: 11 }} />
          {projectType.task_templates_count ?? 0} templates · click to manage
        </span>

        <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
          <button onClick={(e) => { e.stopPropagation(); onEdit(projectType) }} style={iconBtn} title="Edit type">
            <CIcon icon={cilPencil} style={{ width: 12 }} />
          </button>
          <button onClick={handleDelete} disabled={deleting} style={{ ...iconBtn, color: '#ef4444' }} title="Delete type">
            {deleting ? <CSpinner size="sm" /> : <CIcon icon={cilTrash} style={{ width: 12 }} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ProjectTypeForm (create / edit) ──────────────────────────────────────────
const ProjectTypeForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm]   = useState(initial || { name: '', description: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try { await onSave(form) }
    finally { setSaving(false) }
  }

  return (
    <div
      style={{
        background: 'var(--cui-secondary-bg)',
        border: '1.5px solid var(--cui-primary)',
        borderRadius: 12, padding: '20px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', color: 'var(--cui-primary)' }}>
        {initial ? 'EDIT PROJECT TYPE' : 'NEW PROJECT TYPE'}
      </div>
      <input
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        placeholder="Type name *"
        style={inputStyle}
        autoFocus
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />
      <textarea
        value={form.description || ''}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        placeholder="Description (optional)"
        rows={2}
        style={{ ...inputStyle, resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={ghostBtn}>Cancel</button>
        <button onClick={handleSubmit} disabled={saving || !form.name.trim()} style={primaryBtn}>
          {saving
            ? <CSpinner size="sm" />
            : <><CIcon icon={initial ? cilCheck : cilPlus} style={{ width: 13 }} /> {initial ? 'Save Changes' : 'Create Type'}</>
          }
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const ProjectTypesPage = () => {
  const [types, setTypes]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [creating, setCreating]     = useState(false)
  const [editing, setEditing]       = useState(null)       // projectType being edited
  const [activeType, setActiveType] = useState(null)       // drawer target

  const fetchTypes = async () => {
    try {
      const res = await api.get('/api/admin/project-types')
      // withCount so we can show template count on card
      setTypes(res.data.data || [])
    } catch { setError('Failed to load project types.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTypes() }, [])

  const handleCreate = async (form) => {
    await api.post('/api/admin/project-types', form)
    setCreating(false)
    fetchTypes()
  }

  const handleUpdate = async (form) => {
    await api.put(`/api/admin/project-types/${editing.id}`, form)
    setEditing(null)
    fetchTypes()
  }

  const handleDelete = async (id) => {
    await api.delete(`/api/admin/project-types/${id}`)
    fetchTypes()
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div
            style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '2.5px',
              color: 'var(--cui-primary)', textTransform: 'uppercase', marginBottom: 4,
            }}
          >
            Configuration
          </div>
          <h1 style={{ margin: 0, fontWeight: 900, fontSize: 'clamp(1.5rem,3vw,2rem)', letterSpacing: '-0.5px' }}>
            Project Types
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--cui-secondary-color)', fontSize: 13 }}>
            Define project categories and their default task templates.
          </p>
        </div>
        <button
          onClick={() => { setCreating(true); setEditing(null) }}
          style={{
            ...primaryBtn,
            padding: '10px 20px', fontSize: 13,
            display: creating ? 'none' : 'flex',
          }}
        >
          <CIcon icon={cilPlus} style={{ width: 14 }} /> New Type
        </button>
      </div>

      {error && <CAlert color="danger">{error}</CAlert>}

      {/* Create form */}
      {creating && (
        <div style={{ marginBottom: 24 }}>
          <ProjectTypeForm
            onSave={handleCreate}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}><CSpinner /></div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {types.map(pt => (
            editing?.id === pt.id ? (
              <div key={pt.id}>
                <ProjectTypeForm
                  initial={editing}
                  onSave={handleUpdate}
                  onCancel={() => setEditing(null)}
                />
              </div>
            ) : (
              <ProjectTypeCard
                key={pt.id}
                projectType={pt}
                onEdit={setEditing}
                onDelete={handleDelete}
                onClick={() => setActiveType(pt)}
              />
            )
          ))}

          {types.length === 0 && !creating && (
            <div
              style={{
                gridColumn: '1/-1', textAlign: 'center',
                paddingTop: 60, color: 'var(--cui-secondary-color)',
              }}
            >
              <CIcon icon={cilGrid} style={{ width: 40, height: 40, opacity: 0.2, display: 'block', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14 }}>No project types yet. Create one to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* Template drawer */}
      {activeType && (
        <TemplateDrawer
          projectType={activeType}
          onClose={() => setActiveType(null)}
        />
      )}
    </div>
  )
}

export default ProjectTypesPage

// ─── Shared micro-styles ──────────────────────────────────────────────────────
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

const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'var(--cui-primary)', color: '#fff',
  border: 'none', borderRadius: 8,
  padding: '8px 16px', fontSize: 12, fontWeight: 700,
  cursor: 'pointer', letterSpacing: '0.3px',
  transition: 'opacity .15s',
}

const ghostBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'transparent',
  color: 'var(--cui-secondary-color)',
  border: '1px solid var(--cui-border-color)',
  borderRadius: 8, padding: '8px 16px',
  fontSize: 12, fontWeight: 700, cursor: 'pointer',
}

const iconBtn = {
  background: 'transparent', border: 'none',
  borderRadius: 6, padding: '4px 6px',
  cursor: 'pointer', color: 'var(--cui-secondary-color)',
  display: 'inline-flex', alignItems: 'center',
  transition: 'background .15s',
}