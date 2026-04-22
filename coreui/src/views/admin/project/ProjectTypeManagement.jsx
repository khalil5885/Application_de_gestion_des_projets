import React, { useEffect, useState } from 'react'
import {
  CCard, CCardBody, CButton, CBadge, CSpinner,
  CAlert, CModal, CModalHeader, CModalTitle,
  CModalBody, CModalFooter, CFormInput, CFormLabel,
  CFormTextarea,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLayers, cilPlus, cilPencil, cilTrash, cilTask } from '@coreui/icons'
import { motion, AnimatePresence } from 'motion/react'
import api from '../../../api'

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ onAdd }) => (
  <div className="text-center py-5">
    <div
      style={{
        width: 64, height: 64, borderRadius: 18,
        background: 'rgba(88,86,214,0.08)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 16px',
      }}
    >
      <CIcon icon={cilLayers} style={{ color: '#5856d6', fontSize: 28 }} />
    </div>
    <h6 className="fw-bold mb-1">No project types yet</h6>
    <p className="text-body-secondary small mb-3">
      Project types are templates that define the structure of your projects.
    </p>
    <CButton color="primary" size="sm" onClick={onAdd}>
      <CIcon icon={cilPlus} className="me-1" /> Create First Type
    </CButton>
  </div>
)

// ─── Project Type Card ────────────────────────────────────────────────────────

const TypeCard = ({ type, onEdit, onDelete }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2 }}
  >
    <CCard
      className="border-0 shadow-sm h-100"
      style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = ''
      }}
    >
      <CCardBody className="p-4">
        {/* Header */}
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(88,86,214,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CIcon icon={cilLayers} style={{ color: '#5856d6' }} />
          </div>
          <div className="d-flex gap-2">
            <CButton
              color="secondary" variant="ghost" size="sm"
              style={{ padding: '4px 8px', borderRadius: 8 }}
              onClick={() => onEdit(type)}
            >
              <CIcon icon={cilPencil} size="sm" />
            </CButton>
            <CButton
              color="danger" variant="ghost" size="sm"
              style={{ padding: '4px 8px', borderRadius: 8 }}
              onClick={() => onDelete(type)}
              disabled={type.projects_count > 0}
              title={type.projects_count > 0 ? 'Cannot delete — has active projects' : 'Delete'}
            >
              <CIcon icon={cilTrash} size="sm" />
            </CButton>
          </div>
        </div>

        {/* Name */}
        <h6 className="fw-bold mb-1">{type.name}</h6>

        {/* Description */}
        <p className="text-body-secondary small mb-3" style={{ minHeight: 36 }}>
          {type.description || <span className="fst-italic">No description</span>}
        </p>

        {/* Footer badges */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <CBadge
            style={{
              background: 'rgba(88,86,214,0.10)',
              color: '#5856d6',
              fontWeight: 600, fontSize: 11, borderRadius: 6, padding: '3px 8px',
            }}
          >
            {type.projects_count ?? type.projects?.length ?? 0} project{(type.projects_count ?? type.projects?.length ?? 0) !== 1 ? 's' : ''}
          </CBadge>
          <CBadge
            style={{
              background: 'rgba(34,197,94,0.10)',
              color: '#16a34a',
              fontWeight: 600, fontSize: 11, borderRadius: 6, padding: '3px 8px',
            }}
          >
            <CIcon icon={cilTask} size="sm" className="me-1" />
            {type.task_templates_count ?? type.task_templates?.length ?? 0} template{(type.task_templates_count ?? type.task_templates?.length ?? 0) !== 1 ? 's' : ''}
          </CBadge>
        </div>
      </CCardBody>
    </CCard>
  </motion.div>
)

// ─── Form Modal ───────────────────────────────────────────────────────────────

const TypeModal = ({ visible, onClose, onSaved, editing }) => {
  const [form, setForm]       = useState({ name: '', description: '' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      setForm(editing
        ? { name: editing.name, description: editing.description || '' }
        : { name: '', description: '' }
      )
      setErrors({})
    }
  }, [visible, editing])

  const handleSubmit = async () => {
    setErrors({})
    setLoading(true)
    try {
      if (editing) {
        const res = await api.put(`/api/admin/project-types/${editing.id}`, form)
        onSaved(res.data.data, 'updated')
      } else {
        const res = await api.post('/api/admin/project-types', form)
        onSaved(res.data.data, 'created')
      }
      onClose()
    } catch (err) {
      if (err.response?.status === 422) {
        const raw = err.response.data.errors || {}
        const mapped = {}
        Object.keys(raw).forEach(k => { mapped[k] = Array.isArray(raw[k]) ? raw[k][0] : raw[k] })
        setErrors(mapped)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader>
        <CModalTitle>{editing ? 'Edit Project Type' : 'New Project Type'}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div className="mb-3">
          <CFormLabel className="small fw-semibold">Name <span className="text-danger">*</span></CFormLabel>
          <CFormInput
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Web Development"
            invalid={!!errors.name}
          />
          {errors.name && <div className="text-danger small mt-1">{errors.name}</div>}
        </div>
        <div>
          <CFormLabel className="small fw-semibold">Description</CFormLabel>
          <CFormTextarea
            rows={3}
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Optional description..."
          />
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </CButton>
        <CButton color="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <CSpinner size="sm" /> : editing ? 'Save Changes' : 'Create Type'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteModal = ({ visible, onClose, onConfirm, type, loading }) => (
  <CModal visible={visible} onClose={onClose} alignment="center">
    <CModalHeader>
      <CModalTitle>Delete Project Type</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <p className="mb-1">
        Are you sure you want to delete <strong>{type?.name}</strong>?
      </p>
      <p className="text-body-secondary small mb-0">
        This action cannot be undone. Task templates linked to this type will also be affected.
      </p>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="ghost" onClick={onClose} disabled={loading}>
        Cancel
      </CButton>
      <CButton color="danger" onClick={onConfirm} disabled={loading}>
        {loading ? <CSpinner size="sm" /> : 'Delete'}
      </CButton>
    </CModalFooter>
  </CModal>
)

// ─── Main Component ───────────────────────────────────────────────────────────

const ProjectTypeManagement = () => {
  const [types, setTypes]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [toast, setToast]         = useState(null)

  const [modalOpen, setModalOpen]       = useState(false)
  const [deleteOpen, setDeleteOpen]     = useState(false)
  const [editing, setEditing]           = useState(null)
  const [deleting, setDeleting]         = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ── Fetch ──────────────────────────────────────────────
  useEffect(() => {
    api.get('/api/admin/project-types')
      .then(res => setTypes(res.data.data.data ?? res.data.data))
      .catch(() => setError('Failed to load project types.'))
      .finally(() => setLoading(false))
  }, [])

  // ── Toast helper ───────────────────────────────────────
  const showToast = (msg, color = 'success') => {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Handlers ───────────────────────────────────────────
  const handleSaved = (saved, action) => {
    if (action === 'created') {
      setTypes(prev => [saved, ...prev])
      showToast(`"${saved.name}" created successfully.`)
    } else {
      setTypes(prev => prev.map(t => t.id === saved.id ? { ...t, ...saved } : t))
      showToast(`"${saved.name}" updated successfully.`)
    }
  }

  const handleEdit = (type) => {
    setEditing(type)
    setModalOpen(true)
  }

  const handleDeleteClick = (type) => {
    setDeleting(type)
    setDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true)
    try {
      await api.delete(`/api/admin/project-types/${deleting.id}`)
      setTypes(prev => prev.filter(t => t.id !== deleting.id))
      showToast(`"${deleting.name}" deleted.`, 'danger')
      setDeleteOpen(false)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete.', 'danger')
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between gap-3 mb-5">
        <div className="d-flex align-items-center gap-3">
          <div style={{
            width: 42, height: 42, borderRadius: 13,
            background: 'rgba(88,86,214,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CIcon icon={cilLayers} style={{ color: '#5856d6', fontSize: 20 }} />
          </div>
          <div>
            <h4 className="fw-black mb-0" style={{ letterSpacing: '-0.3px' }}>Project Types</h4>
            <p className="text-body-secondary small mb-0">
              Define reusable project structures and templates.
            </p>
          </div>
        </div>
        <CButton
          color="primary"
          className="d-flex align-items-center gap-2"
          onClick={() => { setEditing(null); setModalOpen(true) }}
        >
          <CIcon icon={cilPlus} /> New Type
        </CButton>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, minWidth: 280 }}
          >
            <CAlert color={toast.color} className="shadow mb-0">{toast.msg}</CAlert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* States */}
      {loading && (
        <div className="text-center py-5">
          <CSpinner color="primary" />
        </div>
      )}

      {error && <CAlert color="danger">{error}</CAlert>}

      {/* Empty */}
      {!loading && !error && types.length === 0 && (
        <CCard className="border-0 shadow-sm">
          <CCardBody>
            <EmptyState onAdd={() => { setEditing(null); setModalOpen(true) }} />
          </CCardBody>
        </CCard>
      )}

      {/* Grid */}
      {!loading && !error && types.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          <AnimatePresence>
            {types.map(type => (
              <TypeCard
                key={type.id}
                type={type}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <TypeModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        editing={editing}
      />
      <DeleteModal
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        type={deleting}
        loading={deleteLoading}
      />
    </div>
  )
}

export default ProjectTypeManagement