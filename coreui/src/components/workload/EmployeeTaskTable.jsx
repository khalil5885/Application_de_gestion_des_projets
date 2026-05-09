import React from 'react'
import PropTypes from 'prop-types'
import {
  CBadge,
  CCard,
  CCardBody,
  CProgress,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTask } from '@coreui/icons'
import {
  formatDate,
  isOverdueTask,
  PRIORITY_COLORS,
  STATUS_COLORS,
  STATUS_LABELS,
} from './workloadUtils'

const EmployeeTaskTable = ({ tasks }) => {
  if (!tasks.length) {
    return (
      <CCard>
        <CCardBody className="text-center py-5">
          <CIcon icon={cilTask} size="xxl" className="text-body-secondary opacity-50 mb-3" />
          <h5 className="mb-1">No assigned tasks</h5>
          <p className="text-body-secondary mb-0">
            This employee has no current assignments to review.
          </p>
        </CCardBody>
      </CCard>
    )
  }

  return (
    <div className="table-responsive rounded-3 border">
      <CTable hover className="mb-0 align-middle">
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Title</CTableHeaderCell>
            <CTableHeaderCell>Project</CTableHeaderCell>
            <CTableHeaderCell>Status</CTableHeaderCell>
            <CTableHeaderCell>Priority</CTableHeaderCell>
            <CTableHeaderCell>Due Date</CTableHeaderCell>
            <CTableHeaderCell style={{ minWidth: 150 }}>Progress</CTableHeaderCell>
            <CTableHeaderCell>Parent Milestone</CTableHeaderCell>
            <CTableHeaderCell>Created</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {tasks.map((task) => {
            const overdue = isOverdueTask(task)
            const ready = task.status === 'ready_for_review'
            return (
              <CTableRow
                key={task.id}
                className={overdue ? 'workload-row-overdue' : ready ? 'workload-row-review' : ''}
              >
                <CTableDataCell>
                  <div className="fw-semibold">{task.title}</div>
                  {overdue && <div className="small text-danger mt-1">Past due</div>}
                </CTableDataCell>
                <CTableDataCell>{task.project?.name || task.project_name || '-'}</CTableDataCell>
                <CTableDataCell>
                  <CBadge color={STATUS_COLORS[task.status] || 'secondary'}>
                    {STATUS_LABELS[task.status] || task.status}
                  </CBadge>
                </CTableDataCell>
                <CTableDataCell>
                  <CBadge color={PRIORITY_COLORS[task.priority] || 'warning'}>
                    {task.priority}
                  </CBadge>
                </CTableDataCell>
                <CTableDataCell>{formatDate(task.due_date)}</CTableDataCell>
                <CTableDataCell>
                  <div className="d-flex align-items-center gap-2">
                    <CProgress
                      value={task.progress}
                      color={
                        task.progress >= 80
                          ? 'success'
                          : task.progress >= 40
                            ? 'warning'
                            : 'primary'
                      }
                      height={6}
                      className="flex-grow-1 rounded-pill"
                    />
                    <span className="small text-body-secondary">{task.progress}%</span>
                  </div>
                </CTableDataCell>
                <CTableDataCell>{task.parent_milestone || '-'}</CTableDataCell>
                <CTableDataCell>{formatDate(task.created_at)}</CTableDataCell>
              </CTableRow>
            )
          })}
        </CTableBody>
      </CTable>
    </div>
  )
}

EmployeeTaskTable.propTypes = {
  tasks: PropTypes.array.isRequired,
}

export default EmployeeTaskTable
