import React, { useState, useEffect } from 'react'
import { CSpinner, CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTask, cilTrash, cilPencil, cilGrid } from '@coreui/icons'
import api from '../../../api'

const hsl = (h, s, l) => `hsl(${h},${s}%,${l}%)`
const accentFor = (id = 0) => {
  const hues = [217, 260, 340, 160, 30, 190, 290]
  return hues[id % hues.length]
}

const TaskTemplatesPage = () => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const fetchTemplates = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/admin/task-templates/all')
      setTemplates(res.data.data.items || [])
    } catch {
      setError('Failed to load task templates.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTemplates() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template permanently?')) return
    try {
      await api.delete(`/api/admin/task-templates/${id}`)
      fetchTemplates()
    } catch {
      alert('Failed to delete template.')
    }
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2.5px', color: 'var(--cui-primary)', textTransform: 'uppercase', marginBottom: 4 }}>
          Configuration
        </div>
        <h1 style={{ margin: 0, fontWeight: 900, fontSize: 'clamp(1.5rem,3vw,2rem)', letterSpacing: '-0.5px' }}>
          Task Templates
        </h1>
        <p style={{ margin: '6px 0 0', color: 'var(--cui-secondary-color)', fontSize: 13 }}>
          All task templates across project types.
        </p>
      </div>

      {error && <CAlert color="danger">{error}</CAlert>}

      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}><CSpinner /></div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--cui-secondary-color)' }}>
          <CIcon icon={cilTask} style={{ width: 40, height: 40, opacity: 0.2, display: 'block', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14 }}>No task templates yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {templates.map(t => {
            const accent = accentFor(t.project_type_id)
            return (
              <div key={t.id} style={{
                background: 'var(--cui-secondary-bg)',
                border: '1px solid var(--cui-border-color-translucent)',
                borderLeft: `3px solid ${hsl(accent, 70, 55)}`,
                borderRadius: 10, padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                {/* Order */}
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: `${hsl(accent, 70, 55)}18`,
                  border: `1.5px solid ${hsl(accent, 70, 55)}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: hsl(accent, 70, 55),
                }}>
                  {t.order + 1}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{t.name}</div>
                  {t.description && (
                    <div style={{ fontSize: 12, color: 'var(--cui-secondary-color)', marginBottom: 4 }}>{t.description}</div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {/* Project type badge */}
                    {t.project_type && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: `${hsl(accent, 70, 55)}14`,
                        color: hsl(accent, 70, 55),
                        padding: '2px 8px', borderRadius: 20,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <CIcon icon={cilGrid} style={{ width: 9 }} />
                        {t.project_type.name}
                      </span>
                    )}
                    {/* Due days badge */}
                    {t.default_due_days && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: 'var(--cui-primary-bg-subtle)',
                        color: 'var(--cui-primary)',
                        padding: '2px 8px', borderRadius: 20,
                      }}>
                        +{t.default_due_days} days
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(t.id)}
                  title="Delete permanently"
                  style={{
                    background: 'transparent', border: 'none',
                    borderRadius: 6, padding: '4px 6px',
                    cursor: 'pointer', color: '#ef4444',
                    display: 'inline-flex', alignItems: 'center',
                  }}
                >
                  <CIcon icon={cilTrash} style={{ width: 14 }} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TaskTemplatesPage