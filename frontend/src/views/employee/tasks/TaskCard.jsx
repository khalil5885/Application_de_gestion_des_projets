import React, { useState } from 'react';
import {
  CCard, CCardBody, CBadge, CButton, CCollapse,
  CSpinner, CProgress,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilChevronBottom, cilChevronRight, cilCalendar, cilCheck,
  cilMediaPlay, cilX, cilOptions,
} from '@coreui/icons';
import { formatDueDate, calculateProgress, countAllSubtasks } from './utils/taskHelpers';
import { useUpdateTaskStatus } from './hooks/useUpdateTaskStatus';
import RecursiveSubtaskTree from './RecursiveSubtaskTree';

const TaskCard = ({ task, onTaskClick, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const { updateStatus } = useUpdateTaskStatus();

  const dueInfo = formatDueDate(task.due_date);
  const hasChildren = task.children && task.children.length > 0;
  const progress = hasChildren ? calculateProgress(task) : null;
  const subtaskCount = hasChildren ? countAllSubtasks(task) : 0;
  const completedSubtasks = hasChildren
    ? task.children.filter(c => c.status === 'done').length
    : 0;

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    const result = await updateStatus(task.id, newStatus);
    if (result.success) onStatusChange?.();
    setUpdatingStatus(false);
  };

  const handleSubtaskStatusChange = async (subtaskId, newStatus) => {
    const result = await updateStatus(subtaskId, newStatus);
    if (result.success) onStatusChange?.();
  };

  const handleToggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isDone = task.status === 'done';
  const isReady = task.status === 'ready_for_review';
  const isInProgress = task.status === 'in_progress';
  const isTodo = task.status === 'todo';

  return (
    <CCard
      className={`border-0 shadow-sm ${dueInfo.urgent ? 'border-start border-start-3 border-danger' : ''}`}
    >
      <CCardBody className="p-3 p-md-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <div className="flex-grow-1">
            <h5
              className={`fw-bold mb-1 ${isDone ? 'text-decoration-line-through text-muted' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => onTaskClick(task)}
            >
              {task.title}
            </h5>
            {task.project && (
              <CBadge color="info" className="me-2" style={{ fontSize: '0.65rem' }}>
                {task.project.name}
              </CBadge>
            )}
          </div>
          <div className="d-flex gap-2 align-items-center flex-shrink-0">
            {updatingStatus ? (
              <CSpinner size="sm" />
            ) : (
              <CButton
                color="transparent"
                size="sm"
                className="p-1"
                onClick={() => onTaskClick(task)}
                title="View details"
              >
                <CIcon icon={cilOptions} />
              </CButton>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="d-flex flex-wrap gap-3 mb-3 small">
          <div className="d-flex align-items-center gap-1">
            <CIcon icon={cilCalendar} size="sm" />
            <span style={{ color: dueInfo.color, fontWeight: dueInfo.urgent ? 600 : 400 }}>
              {dueInfo.text}
            </span>
          </div>
          <CBadge
            color={
              task.priority === 'urgent' ? 'danger'
              : task.priority === 'high' ? 'warning'
              : 'secondary'
            }
            className="px-2"
          >
            {task.priority || 'medium'} priority
          </CBadge>
        </div>

        {/* Description preview */}
        {task.description && (
          <p className="text-muted small mb-3" style={{ lineHeight: 1.4 }}>
            {task.description.length > 120
              ? task.description.slice(0, 120) + '…'
              : task.description}
          </p>
        )}

        {/* Progress bar */}
        {hasChildren && progress !== null && (
          <div className="mb-3">
            <div className="d-flex justify-content-between small mb-1">
              <span>Subtasks progress</span>
              <span>{completedSubtasks}/{subtaskCount}</span>
            </div>
            <CProgress height={4} value={progress} color="success" />
          </div>
        )}

        {/* Primary action button */}
        <div className="mb-3">
          {!isDone && (
            <CButton
              color={isReady ? 'secondary' : isInProgress ? 'info' : 'primary'}
              size="sm"
              onClick={
                isReady
                  ? () => handleStatusChange('in_progress')
                  : isInProgress
                  ? () => handleStatusChange('ready_for_review')
                  : () => handleStatusChange('in_progress')
              }
              disabled={updatingStatus}
            >
              <CIcon
                icon={isReady ? cilX : isInProgress ? cilCheck : cilMediaPlay}
                size="sm"
                className="me-1"
              />
              {isReady
                ? 'Cancel Review'
                : isInProgress
                ? 'Submit for Review'
                : 'Start Task'}
            </CButton>
          )}
          {isTodo && !isInProgress && !isReady && !isDone && null /* already handled above */}
          {isDone && (
            <CBadge color="success" className="py-2 px-3">
              ✓ Completed
            </CBadge>
          )}
        </div>

        {/* Subtasks toggle */}
        {hasChildren && (
          <div>
            <CButton
              color="link"
              className="p-0 text-decoration-none"
              onClick={() => setExpanded(!expanded)}
            >
              <CIcon icon={expanded ? cilChevronBottom : cilChevronRight} className="me-1" />
              {subtaskCount} subtask{subtaskCount !== 1 ? 's' : ''}
              {!expanded && completedSubtasks > 0 && ` (${completedSubtasks} done)`}
            </CButton>

            <CCollapse visible={expanded}>
              <div className="mt-3 pt-2 border-top">
                <RecursiveSubtaskTree
                  tasks={task.children}
                  level={0}
                  onStatusChange={handleSubtaskStatusChange}
                  onSubtaskClick={(subtask) => onTaskClick(subtask)}
                  expandedIds={expandedIds}
                  onToggleExpand={handleToggleExpand}
                />
              </div>
            </CCollapse>
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default TaskCard;