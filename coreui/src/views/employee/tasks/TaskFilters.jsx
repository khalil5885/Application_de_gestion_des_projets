import React from 'react'
import { CFormSelect, CInputGroup, CInputGroupText, CFormInput, CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilXCircle } from '@coreui/icons'

const TaskFilters = ({ filters, onChange, onClear }) => {
  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.priority !== 'all'

  return (
    <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
      {/* Search */}
      <CInputGroup style={{ maxWidth: '280px' }}>
        <CInputGroupText className="bg-transparent border-end-0">
          <CIcon icon={cilSearch} size="sm" />
        </CInputGroupText>
        <CFormInput 
          className="border-start-0 shadow-none"
          placeholder="Search tasks..." 
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </CInputGroup>

      {/* Status Filter */}
      <CFormSelect
        size="sm"
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        style={{ width: 'auto', minWidth: 130 }}
        className="shadow-none"
      >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="ready_for_review">Ready for Review</option>
        <option value="done">Completed</option>
        <option value="on_hold">On Hold</option>
      </CFormSelect>

      {/* Priority Filter */}
      <CFormSelect
        size="sm"
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value })}
        style={{ width: 'auto', minWidth: 130 }}
        className="shadow-none"
      >
        <option value="all">All Priority</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </CFormSelect>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <CButton 
          color="light" 
          size="sm" 
          variant="outline"
          onClick={onClear}
          className="d-flex align-items-center gap-1"
        >
          <CIcon icon={cilXCircle} size="sm" />
          Clear
        </CButton>
      )}
    </div>
  )
}

export default TaskFilters
