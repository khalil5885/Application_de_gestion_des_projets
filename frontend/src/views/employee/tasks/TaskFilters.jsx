import React from 'react'
import { CInputGroup, CInputGroupText, CFormInput } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilXCircle } from '@coreui/icons'

const TaskFilters = ({ filters = { search: '', status: 'all', priority: 'all' }, onChange, onClear }) => {
  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.priority !== 'all'

  const pillGroupStyle = {
    display: 'flex',
    gap: 4,
    background: 'var(--surface-bg)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    padding: '3px',
  }

  const pillBtn = (active) => ({
    border: 'none',
    borderRadius: 'calc(var(--radius-sm) - 2px)',
    padding: '4px 12px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all var(--t-base)',
    whiteSpace: 'nowrap',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? 'var(--accent-text)' : 'var(--text-low)',
  })

  return (
    <div className="d-flex flex-wrap align-items-center gap-3 mb-4">

      {/* Search */}
      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        maxWidth: 280,
      }}>
        <CInputGroup>
          <CInputGroupText style={{ background: 'transparent', border: 'none', color: 'var(--text-low)' }}>
            <CIcon icon={cilSearch} size="sm" />
          </CInputGroupText>
          <CFormInput
            placeholder="Search tasks..."
            value={filters.search}
            onChange={e => onChange({ ...filters, search: e.target.value })}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-high)',
              boxShadow: 'none',
              fontSize: '0.85rem',
            }}
          />
        </CInputGroup>
      </div>

      {/* Status Pills — active tasks only */}
      <div style={pillGroupStyle}>
        {[
          { value: 'all',              label: 'All'        },
          { value: 'todo',             label: 'To Do'      },
          { value: 'in_progress',      label: 'In Progress'},
          { value: 'ready_for_review', label: 'Review'     },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange({ ...filters, status: opt.value })}
            style={pillBtn(filters.status === opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Priority Pills */}
      <div style={pillGroupStyle}>
        {[
          { value: 'all',    label: 'All',    color: 'var(--text-low)' },
          { value: 'urgent', label: 'Urgent', color: 'var(--danger)'  },
          { value: 'high',   label: 'High',   color: 'var(--danger)'  },
          { value: 'medium', label: 'Medium', color: 'var(--warning)' },
          { value: 'low',    label: 'Low',    color: 'var(--success)' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange({ ...filters, priority: opt.value })}
            style={{
              ...pillBtn(filters.priority === opt.value),
              color: filters.priority === opt.value ? 'var(--accent-text)' : opt.color,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={onClear}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 12px',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <CIcon icon={cilXCircle} size="sm" />
          Clear
        </button>
      )}
    </div>
  )
}

export default TaskFilters