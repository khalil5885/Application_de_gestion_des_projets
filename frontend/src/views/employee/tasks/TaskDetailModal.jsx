import React, { useState, useEffect, useRef } from 'react';
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CNav, CNavItem, CNavLink, CTabContent, CTabPane,
  CFormTextarea, CSpinner, CBadge, CAlert,
  CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CAvatar,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilInfo, cilList, cilCommentSquare, cilCalendar, cilCheck,
  cilMediaPlay, cilX, cilCloudUpload, cilPaperclip, cilArrowLeft,
  cilTask,
} from '@coreui/icons';
import { formatDueDate, calculateProgress, countAllSubtasks } from './utils/taskHelpers';
import { useUpdateTaskStatus } from './hooks/useUpdateTaskStatus';
import RecursiveSubtaskTree from './RecursiveSubtaskTree';
import ProgressBar from './ProgressBar';
import PriorityDot from './PriorityDot';
import TaskStatusBadge from './TaskStatusBadge';
import api from '../../../api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const updateSubtaskStatusInTree = (children, taskId, newStatus) =>
  children.map(child => {
    if (child.id === taskId) return { ...child, status: newStatus };
    if (child.children?.length)
      return { ...child, children: updateSubtaskStatusInTree(child.children, taskId, newStatus) };
    return child;
  });

const findSubtaskInTree = (children, taskId) => {
  for (const child of children) {
    if (child.id === taskId) return child;
    if (child.children?.length) {
      const found = findSubtaskInTree(child.children, taskId);
      if (found) return found;
    }
  }
  return null;
};

const fetchAncestorChain = async (task) => {
  const ancestors = [];
  let current = task;
  const seen = new Set();

  while (current?.parent_id && !seen.has(current.parent_id)) {
    seen.add(current.parent_id);
    if (current.parent) {
      ancestors.unshift(current.parent);
      current = current.parent;
    } else {
      try {
        const res = await api.get(`/api/employee/tasks/${current.parent_id}`);
        const parent = res.data?.data || res.data;
        ancestors.unshift(parent);
        current = parent;
      } catch { break; }
    }
  }
  return ancestors;
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const isOverdue = (d, status) => d && status !== 'done' && new Date(d) < new Date();

// ─── Small UI pieces ──────────────────────────────────────────────────────────

const Breadcrumb = ({ ancestors, currentTitle, onNavigateToAncestor }) => {
  if (!ancestors.length) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', marginBottom: 12, flexWrap: 'wrap' }}>
      {ancestors.map(ancestor => (
        <React.Fragment key={ancestor.id}>
          <button
            onClick={() => onNavigateToAncestor(ancestor)}
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--cui-primary)', fontWeight: 500, cursor: 'pointer', fontSize: '0.75rem' }}
          >
            {ancestor.title}
          </button>
          <span style={{ color: 'var(--cui-border-color)' }}>/</span>
        </React.Fragment>
      ))}
      <span style={{ fontWeight: 700, color: 'var(--cui-body-color)', fontSize: '0.75rem' }}>{currentTitle}</span>
    </div>
  );
};

const ParentTaskCard = ({ parent, onNavigate }) => {
  if (!parent) return null;
  return (
    <div
      onClick={onNavigate}
      style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.25)', marginBottom: '1.25rem', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0ea5e9', marginBottom: 4 }}>Parent Task</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--cui-body-color)' }}>{parent.title}</div>
      {parent.description && (
        <div style={{ fontSize: '0.75rem', color: 'var(--cui-secondary-color)', marginTop: 4, lineHeight: 1.4 }}>
          {parent.description.length > 80 ? parent.description.slice(0, 80) + '...' : parent.description}
        </div>
      )}
    </div>
  );
};

const PendingFileChips = ({ files, onRemove }) => {
  if (!files.length) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--cui-secondary-color)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Ready to upload
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {files.map((file, idx) => (
          <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 8, background: 'var(--cui-secondary-bg)', border: '1px solid var(--cui-border-color)', fontSize: '0.75rem' }}>
            <CIcon icon={cilPaperclip} size="sm" />
            <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
            <span style={{ color: 'var(--cui-secondary-color)', flexShrink: 0 }}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
            <button onClick={() => onRemove(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cui-danger)', padding: 0, display: 'flex', alignItems: 'center' }}>
              <CIcon icon={cilX} size="sm" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const CommentBubble = ({ comment }) => {
  const isSystem = !comment.user;
  return (
    <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--cui-secondary-bg)', border: '1px solid var(--cui-border-color)', marginBottom: 8 }}>
      <div className="d-flex justify-content-between align-items-start mb-1">
        <div className="d-flex align-items-center gap-2">
          <CAvatar size="sm" color={isSystem ? 'secondary' : 'primary'} textColor="white">
            {isSystem ? 'S' : comment.user?.name?.charAt(0) || 'U'}
          </CAvatar>
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{comment.user?.name || 'System'}</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--cui-secondary-color)' }}>
          {new Date(comment.created_at).toLocaleString()}
        </span>
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--cui-body-color)', lineHeight: 1.5, marginLeft: 34 }}>
        {comment.content}
      </div>
      {comment.attachments?.length > 0 && (
        <div style={{ fontSize: '0.75rem', color: 'var(--cui-secondary-color)', marginTop: 6, marginLeft: 34 }}>
          <CIcon icon={cilPaperclip} size="sm" className="me-1" />
          {comment.attachments.length} attachment(s)
        </div>
      )}
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

const TaskDetailModal = ({ visible, task, onClose, onTaskUpdated }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [posting, setPosting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [localTask, setLocalTask] = useState(task);
  const [updating, setUpdating] = useState(false);
  const [ancestors, setAncestors] = useState([]);
  const [ancestorsLoading, setAncestorsLoading] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState(null);
  const [subtaskModalVisible, setSubtaskModalVisible] = useState(false);
  const [incompleteWarning, setIncompleteWarning] = useState({ show: false, taskId: null, taskTitle: '', incompleteSubtasks: [] });
  const [markingAllDone, setMarkingAllDone] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const fileInputRef = useRef();

  const { updateStatus } = useUpdateTaskStatus();

  useEffect(() => {
    setLocalTask(task);
    setActiveTab('details');
    setComment('');
    setAttachments([]);
    setFeedback(null);
    setAncestors([]);
    setSelectedSubtask(null);
    setSubtaskModalVisible(false);
    setExpandedIds(new Set());

    if (task?.parent_id) {
      setAncestorsLoading(true);
      fetchAncestorChain(task).then(setAncestors).finally(() => setAncestorsLoading(false));
    }
  }, [task]);

  if (!localTask) return null;

  const hasChildren = localTask.children?.length > 0;
  const progress = hasChildren ? calculateProgress(localTask) : null;
  const subtaskCount = hasChildren ? countAllSubtasks(localTask) : 0;
  const completedSubtasks = hasChildren ? localTask.children.filter(c => c.status === 'done').length : 0;
  const isSubtask = !!localTask.parent_id;
  const directParent = ancestors.length ? ancestors[ancestors.length - 1] : null;
  const overdue = isOverdue(localTask.due_date, localTask.status);

  const isTodo = localTask.status === 'todo';
  const isInProgress = localTask.status === 'in_progress';
  const isReady = localTask.status === 'ready_for_review';
  const isDone = localTask.status === 'done';

  // ── Expand/Collapse ─────────────────────────────────────────────────────

  const handleToggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Status handlers ─────────────────────────────────────────────────────

  const handleStatusChange = async (taskId, newStatus) => {
    if (newStatus === 'done' && taskId === localTask.id && localTask.children?.length > 0) {
      const incomplete = localTask.children.filter(c => c.status !== 'done');
      if (incomplete.length > 0) {
        setIncompleteWarning({ show: true, taskId, taskTitle: localTask.title, incompleteSubtasks: incomplete });
        return;
      }
    }

    setUpdating(true);
    const result = await updateStatus(taskId, newStatus);

    if (result.success) {
      if (taskId === localTask.id) {
        setLocalTask(prev => ({ ...prev, status: newStatus }));
      } else {
        setLocalTask(prev => ({
          ...prev,
          children: updateSubtaskStatusInTree(prev.children || [], taskId, newStatus),
        }));
      }
      onTaskUpdated?.();
      setFeedback({ type: 'success', message: `Task marked as ${newStatus.replace(/_/g, ' ')}` });
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: 'danger', message: result.error || 'Update failed' });
    }
    setUpdating(false);
  };

  const handleMarkAllDone = async () => {
    const { taskId, incompleteSubtasks } = incompleteWarning;
    setMarkingAllDone(true);
    setIncompleteWarning(prev => ({ ...prev, show: false }));

    try {
      for (const subtask of incompleteSubtasks) {
        await updateStatus(subtask.id, 'done');
      }
      await updateStatus(taskId, 'done');
      setLocalTask(prev => ({
        ...prev,
        status: 'done',
        children: prev.children.map(c => ({ ...c, status: 'done' })),
      }));
      onTaskUpdated?.();
      setFeedback({ type: 'success', message: 'All subtasks and parent task marked as done.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ type: 'danger', message: 'Failed to mark all done.' });
    } finally {
      setMarkingAllDone(false);
    }
  };

  const handleSubtaskStatusChange = async (subtaskId, newStatus) => {
    setUpdating(true);
    const result = await updateStatus(subtaskId, newStatus);
    if (result.success) {
      setLocalTask(prev => ({
        ...prev,
        children: updateSubtaskStatusInTree(prev.children || [], subtaskId, newStatus),
      }));
      onTaskUpdated?.();
    } else {
      setFeedback({ type: 'danger', message: 'Could not update subtask' });
    }
    setUpdating(false);
  };

  // ── Subtask navigation ──────────────────────────────────────────────────

  const handleSubtaskClick = (subtask) => {
    const fresh = findSubtaskInTree(localTask.children || [], subtask.id) || subtask;
    setSelectedSubtask(fresh);
    setSubtaskModalVisible(true);
  };

  const handleNavigateToAncestor = (ancestor) => {
    onClose();
    setTimeout(() => {
      setSelectedSubtask(ancestor);
      setSubtaskModalVisible(true);
    }, 150);
  };

  // ── Comments ────────────────────────────────────────────────────────────

  const handleAddComment = async () => {
    if (!comment.trim() && attachments.length === 0) return;
    setPosting(true);
    const formData = new FormData();
    formData.append('content', comment);
    formData.append('visibility', 'internal');
    attachments.forEach(file => formData.append('attachments[]', file));

    try {
      const res = await api.post(`/api/employee/tasks/${localTask.id}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newComment = res.data?.data || res.data;
      setLocalTask(prev => ({ ...prev, comments: [...(prev.comments || []), newComment] }));
      setComment('');
      setAttachments([]);
      setFeedback({ type: 'success', message: 'Comment added' });
      setTimeout(() => setFeedback(null), 2000);
    } catch (err) {
      setFeedback({ type: 'danger', message: err.response?.data?.message || 'Failed to post comment' });
    } finally {
      setPosting(false);
    }
  };

  // ── File handling ───────────────────────────────────────────────────────

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const valid = files.filter(f => f.size <= 10 * 1024 * 1024 && !f.type.startsWith('video/'));
    if (valid.length !== files.length)
      setFeedback({ type: 'warning', message: 'Some files exceed 10MB or are videos — skipped' });
    setAttachments(prev => [...prev, ...valid]);
  };

  const removeFile = (index) => setAttachments(prev => prev.filter((_, i) => i !== index));

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.length) {
      const valid = Array.from(e.dataTransfer.files).filter(f => f.size <= 10 * 1024 * 1024 && !f.type.startsWith('video/'));
      setAttachments(prev => [...prev, ...valid]);
    }
  };

  return (
    <>
      <CModal visible={visible} onClose={onClose} size="lg" scrollable backdrop={isSubtask ? true : 'static'}>
        <CModalHeader className="border-bottom-0 pb-0" style={{ alignItems: 'center' }}>
          <div className="d-flex align-items-center gap-2 flex-grow-1">
            {isSubtask && (
              <button
                onClick={onClose}
                title="Back to parent task"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--cui-primary)', borderRadius: 6, padding: '4px 6px', display: 'flex', alignItems: 'center' }}
              >
                <CIcon icon={cilArrowLeft} />
              </button>
            )}
            <CIcon icon={cilTask} style={{ color: 'var(--cui-primary)', flexShrink: 0 }} />
            <CModalTitle className="fs-5 fw-bold mb-0">
              {isSubtask ? 'Subtask Details' : 'Task Details'}
            </CModalTitle>
          </div>
        </CModalHeader>

        <CModalBody className="pt-2">
          {feedback && (
            <CAlert color={feedback.type} dismissible onClose={() => setFeedback(null)} className="py-2 small">
              {feedback.message}
            </CAlert>
          )}

          {ancestorsLoading && (
            <div className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: '0.75rem', color: 'var(--cui-secondary-color)' }}>
              <CSpinner size="sm" /> Loading ancestry…
            </div>
          )}

          {!ancestorsLoading && ancestors.length > 0 && (
            <Breadcrumb ancestors={ancestors} currentTitle={localTask.title} onNavigateToAncestor={handleNavigateToAncestor} />
          )}

          {!ancestorsLoading && directParent && (
            <ParentTaskCard parent={directParent} onNavigate={onClose} />
          )}

          {/* Title & status */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h5 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--cui-body-color)', lineHeight: 1.3, marginBottom: 8, wordBreak: 'break-word' }}>
              {localTask.title}
            </h5>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <TaskStatusBadge status={localTask.status} />
              <PriorityDot priority={localTask.priority} showLabel />
              {overdue && <CBadge color="danger" style={{ fontSize: '0.7rem' }}>Overdue</CBadge>}
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.25rem' }}>
            <div style={{ padding: '10px 12px', borderRadius: 8, background: overdue ? 'rgba(239,68,68,0.08)' : 'var(--cui-secondary-bg)', border: `1px solid ${overdue ? 'rgba(239,68,68,0.3)' : 'var(--cui-border-color)'}` }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--cui-secondary-color)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Due Date</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: overdue ? '#ef4444' : 'var(--cui-body-color)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CIcon icon={cilCalendar} size="sm" style={{ color: overdue ? '#ef4444' : 'var(--cui-primary)' }} />
                {formatDate(localTask.due_date)}
              </div>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--cui-secondary-bg)', border: '1px solid var(--cui-border-color)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--cui-secondary-color)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Created</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cui-body-color)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CIcon icon={cilCalendar} size="sm" style={{ color: 'var(--cui-primary)' }} />
                {formatDate(localTask.created_at)}
              </div>
            </div>
          </div>

          {/* Assignee */}
          {localTask.assignee && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--cui-secondary-color)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Assignee</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--cui-secondary-bg)', border: '1px solid var(--cui-border-color)' }}>
                <CAvatar size="sm" color="primary" textColor="white" style={{ fontWeight: 700 }}>
                  {localTask.assignee.name?.charAt(0)}
                </CAvatar>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{localTask.assignee.name}</div>
                  {localTask.assignee.email && <div style={{ fontSize: '0.72rem', color: 'var(--cui-secondary-color)' }}>{localTask.assignee.email}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <CNav variant="tabs" className="mb-3">
            <CNavItem>
              <CNavLink active={activeTab === 'details'} onClick={() => setActiveTab('details')}>
                <CIcon icon={cilInfo} className="me-1" /> Details
              </CNavLink>
            </CNavItem>
            {hasChildren && (
              <CNavItem>
                <CNavLink active={activeTab === 'subtasks'} onClick={() => setActiveTab('subtasks')}>
                  <CIcon icon={cilList} className="me-1" /> Subtasks
                  <CBadge color="secondary" size="sm" className="ms-1">{subtaskCount}</CBadge>
                </CNavLink>
              </CNavItem>
            )}
            <CNavItem>
              <CNavLink active={activeTab === 'comments'} onClick={() => setActiveTab('comments')}>
                <CIcon icon={cilCommentSquare} className="me-1" /> Comments
                {localTask.comments?.length > 0 && (
                  <CBadge color="primary" size="sm" className="ms-1">{localTask.comments.length}</CBadge>
                )}
              </CNavLink>
            </CNavItem>
          </CNav>

          <CTabContent>
            {/* DETAILS TAB */}
            <CTabPane visible={activeTab === 'details'}>
              {localTask.description && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--cui-secondary-color)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Description</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--cui-secondary-color)', lineHeight: 1.6, padding: '12px', borderRadius: 8, background: 'var(--cui-secondary-bg)', border: '1px solid var(--cui-border-color)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {localTask.description}
                  </div>
                </div>
              )}

              {hasChildren && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div style={{ fontSize: '0.65rem', color: 'var(--cui-secondary-color)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                      Subtasks Progress
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--cui-secondary-color)' }}>
                      {completedSubtasks}/{subtaskCount} completed
                    </span>
                  </div>
                  <ProgressBar progress={progress ?? 0} height={6} className="mb-3" />
                  <RecursiveSubtaskTree
                    tasks={localTask.children}
                    level={0}
                    onStatusChange={handleSubtaskStatusChange}
                    onSubtaskClick={handleSubtaskClick}
                    expandedIds={expandedIds}
                    onToggleExpand={handleToggleExpand}
                  />
                </div>
              )}
            </CTabPane>

            {/* SUBTASKS TAB */}
            {hasChildren && (
              <CTabPane visible={activeTab === 'subtasks'}>
                <CTable small bordered>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: '40px' }}>Done</CTableHeaderCell>
                      <CTableHeaderCell>Subtask</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: '140px' }}>Status</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {localTask.children.map(sub => (
                      <CTableRow key={sub.id} style={{ cursor: 'pointer' }} onClick={() => handleSubtaskClick(sub)}>
                        <CTableDataCell className="text-center" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={sub.status === 'done'}
                            onChange={() => handleSubtaskStatusChange(sub.id, sub.status === 'done' ? 'todo' : 'done')}
                            disabled={updating}
                          />
                        </CTableDataCell>
                        <CTableDataCell className={sub.status === 'done' ? 'text-decoration-line-through text-muted' : ''}>
                          <div className="d-flex align-items-center gap-2">
                            <PriorityDot priority={sub.priority} size={6} />
                            {sub.title}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <TaskStatusBadge status={sub.status} />
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </CTabPane>
            )}

            {/* COMMENTS TAB */}
            <CTabPane visible={activeTab === 'comments'}>
              <div className="mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {(!localTask.comments || localTask.comments.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--cui-secondary-color)', fontSize: '0.85rem' }}>
                    No comments yet. Be the first to comment.
                  </div>
                ) : (
                  (localTask.comments || []).filter(Boolean).map((com, idx) => (
                    <CommentBubble key={com.id || idx} comment={com} />
                  ))
                )}
              </div>

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragActive ? 'var(--cui-primary)' : 'var(--cui-border-color)'}`,
                  borderRadius: 8,
                  transition: 'border-color 0.2s',
                  marginBottom: 8,
                  background: 'var(--cui-tertiary-bg)',
                }}
              >
                <CFormTextarea
                  placeholder="Write a comment… or drag files here."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={2}
                  className="shadow-none border-0"
                  style={{ fontSize: '0.85rem', background: 'var(--cui-tertiary-bg)', resize: 'vertical' }}
                />
                <div className="d-flex justify-content-between align-items-center p-2 border-top">
                  <CButton color="secondary" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <CIcon icon={cilCloudUpload} className="me-1" /> Attach
                  </CButton>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,.zip,.rar"
                  />
                  <CButton
                    color="primary"
                    size="sm"
                    onClick={handleAddComment}
                    disabled={posting || (!comment.trim() && attachments.length === 0)}
                  >
                    {posting ? <CSpinner size="sm" /> : 'Post Comment'}
                  </CButton>
                </div>
              </div>

              <PendingFileChips files={attachments} onRemove={removeFile} />
            </CTabPane>
          </CTabContent>
        </CModalBody>

        <CModalFooter className="d-flex justify-content-between">
          <CButton color="secondary" variant="outline" onClick={onClose}>Close</CButton>

          <div className="d-flex gap-2">
            {!isDone && (
              <>
                {isTodo && (
                  <CButton color="primary" onClick={() => handleStatusChange(localTask.id, 'in_progress')} disabled={updating}>
                    <CIcon icon={cilMediaPlay} className="me-1" /> Start Task
                  </CButton>
                )}
                {isInProgress && (
                  <CButton color="info" onClick={() => handleStatusChange(localTask.id, 'ready_for_review')} disabled={updating}>
                    <CIcon icon={cilCheck} className="me-1" /> Submit for Review
                  </CButton>
                )}
                {isReady && (
                  <CButton color="warning" onClick={() => handleStatusChange(localTask.id, 'in_progress')} disabled={updating}>
                    <CIcon icon={cilX} className="me-1" /> Cancel Review
                  </CButton>
                )}
              </>
            )}
            {!isDone && hasChildren && (
              <CButton
                color="success"
                onClick={() => handleStatusChange(localTask.id, 'done')}
                disabled={updating || completedSubtasks !== localTask.children.length}
                title={completedSubtasks !== localTask.children.length ? 'Complete all subtasks first' : ''}
              >
                <CIcon icon={cilCheck} className="me-1" /> Mark Done
              </CButton>
            )}
            {isDone && <CBadge color="success" className="py-2 px-3">✓ Completed</CBadge>}
          </div>
        </CModalFooter>
      </CModal>

      {/* Incomplete subtasks warning */}
      <CModal visible={incompleteWarning.show} onClose={() => setIncompleteWarning(prev => ({ ...prev, show: false }))} size="sm">
        <CModalHeader><CModalTitle>⚠️ Incomplete Subtasks</CModalTitle></CModalHeader>
        <CModalBody>
          <p>Task <strong>"{incompleteWarning.taskTitle}"</strong> has {incompleteWarning.incompleteSubtasks.length} subtask(s) that aren't done yet.</p>
          <ul style={{ marginBottom: 0, paddingLeft: '1.5rem' }}>
            {incompleteWarning.incompleteSubtasks.map(sub => (
              <li key={sub.id} style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <PriorityDot priority={sub.priority} size={6} />
                <span>{sub.title}</span>
                <TaskStatusBadge status={sub.status} />
              </li>
            ))}
          </ul>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setIncompleteWarning(prev => ({ ...prev, show: false }))}>Cancel</CButton>
          <CButton color="danger" onClick={handleMarkAllDone} disabled={markingAllDone}>
            {markingAllDone ? <CSpinner size="sm" /> : 'Mark All Done'}
          </CButton>
          <CButton color="primary" onClick={() => setIncompleteWarning(prev => ({ ...prev, show: false }))}>Finish Subtasks First</CButton>
        </CModalFooter>
      </CModal>

      {/* Nested subtask modal */}
      {selectedSubtask && (
        <TaskDetailModal
          visible={subtaskModalVisible}
          task={selectedSubtask}
          onClose={() => { setSubtaskModalVisible(false); setSelectedSubtask(null); }}
          onTaskUpdated={onTaskUpdated}
        />
      )}
    </>
  );
};

export default TaskDetailModal;