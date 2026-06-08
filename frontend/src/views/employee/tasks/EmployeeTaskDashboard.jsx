  import React, { useState, useMemo, useCallback } from 'react';
  import {
    CButton, CSpinner, CCard, CCardBody, CFormInput, CFormSelect,
    CRow, CCol, CBadge, CAlert,
  } from '@coreui/react';
  import CIcon from '@coreui/icons-react';
  import { cilTask, cilWarning, cilFilter } from '@coreui/icons';
  import { useEmployeeTasks } from './hooks/useEmployeeTasks';
  import TaskCard from './TaskCard';
  import TaskDetailModal from './TaskDetailModal';
  import { formatDueDate } from './utils/taskHelpers';

  const EmployeeTaskDashboard = () => {
    const [filters, setFilters] = useState({ search: '', status: 'all', priority: 'all' });
    const [selectedTask, setSelectedTask] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const { tasks, loading, error, refetch } = useEmployeeTasks(filters);

    // Filter only parent tasks for the list
    const filteredTasks = useMemo(() => {
      return tasks
        .filter(task => !task.parent_id)
        .filter(task => {
          const matchSearch =
            !filters.search ||
            task.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
            task.project?.name?.toLowerCase().includes(filters.search.toLowerCase());
          const matchStatus = filters.status === 'all' || task.status === filters.status;
          const matchPriority = filters.priority === 'all' || task.priority === filters.priority;
          return matchSearch && matchStatus && matchPriority;
        });
    }, [tasks, filters]);

    const stats = useMemo(() => {
      const all = tasks.filter(t => !t.parent_id);
      const overdue = all.filter(t => {
        const info = formatDueDate(t.due_date);
        return info.urgent && t.status !== 'done';
      }).length;
      const active = all.filter(t => t.status !== 'done').length;
      const completed = all.filter(t => t.status === 'done').length;
      return { overdue, active, completed, total: all.length };
    }, [tasks]);

    const clearFilters = useCallback(() => {
      setFilters({ search: '', status: 'all', priority: 'all' });
    }, []);

    if (loading && !tasks.length) {
      return (
        <div className="text-center py-5">
          <CSpinner color="primary" />
          <div className="mt-2 text-muted">Loading your tasks…</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-5">
          <CIcon icon={cilWarning} size="xl" className="text-danger mb-2" />
          <p className="text-danger">{error}</p>
          <CButton color="primary" size="sm" onClick={refetch}>Try Again</CButton>
        </div>
      );
    }

    return (
      <div className="pb-4">
        {/* Header with stats */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h3 className="fw-bold mb-1">My Tasks</h3>
            <div className="d-flex gap-3 text-muted small">
              <span><strong className="text-primary">{stats.active}</strong> active</span>
              {stats.overdue > 0 && (
                <span><strong className="text-danger">{stats.overdue}</strong> overdue</span>
              )}
              <span><strong>{stats.completed}</strong> completed</span>
            </div>
          </div>
          <div className="text-muted small bg-light px-3 py-2 rounded">
            {filteredTasks.length} of {stats.total} tasks shown
          </div>
        </div>

        {/* Filters - simple row */}
        <CCard className="border-0 shadow-sm mb-4">
          <CCardBody className="p-3">
            <CRow className="g-2 align-items-end">
              <CCol xs={12} md={5}>
                <CFormInput
                  type="text"
                  placeholder="🔍 Search by title or project..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  size="sm"
                />
              </CCol>
              <CCol xs={6} md={3}>
                <CFormSelect
                  size="sm"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="all">All statuses</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="ready_for_review">Ready for Review</option>
                  <option value="done">Done</option>
                </CFormSelect>
              </CCol>
              <CCol xs={6} md={3}>
                <CFormSelect
                  size="sm"
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                >
                  <option value="all">All priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </CFormSelect>
              </CCol>
              <CCol xs={12} md={1}>
                <CButton color="secondary" size="sm" variant="outline" onClick={clearFilters} className="w-100">
                  Clear
                </CButton>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <CCard className="border-0 bg-light text-center py-5">
            <CCardBody>
              <CIcon icon={cilTask} size="3xl" className="text-muted opacity-25 mb-2" />
              <p className="mb-0">No tasks match your filters.</p>
              <CButton color="primary" size="sm" className="mt-2" onClick={clearFilters}>
                Reset filters
              </CButton>
            </CCardBody>
          </CCard>
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onTaskClick={(t) => {
                  setSelectedTask(t);
                  setModalVisible(true);
                }}
                onStatusChange={refetch}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        <TaskDetailModal
          visible={modalVisible}
          task={selectedTask}
          onClose={() => setModalVisible(false)}
          onTaskUpdated={refetch}
        />
      </div>
    );
  };

  export default EmployeeTaskDashboard;