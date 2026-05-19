/**
 * Task Detail Screen
 *
 * Shows full task info: priority, status, due date, progress, assignee.
 * Subtasks: interactive toggles wired to Zustand store (persist across navigation).
 * Comments: live list + add comment form (admin + employee).
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { Card } from '../../components/ui/Card';
import { Badge, Avatar, ProgressBar } from '../../components/ui/index';
import { DatePickerModal } from '../../components/ui/Datepickermodal';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { Task, Comment } from '../../types';

export default function TaskDetailScreen() {
  const { id }          = useLocalSearchParams<{ id: string }>();
  const { colors }      = useTheme();
  const router          = useRouter();

  // Read live task from store so subtask/comment changes show immediately
  const tasks                = useAppStore((s) => s.tasks);
  const toggleSubtask        = useAppStore((s) => s.toggleSubtask);
  const addSubtask           = useAppStore((s) => s.addSubtask);
  const addComment           = useAppStore((s) => s.addComment);
  const markReadyForReview   = useAppStore((s) => s.markTaskReadyForReview);
  const approveTask          = useAppStore((s) => s.approveTask);
  const rejectTask           = useAppStore((s) => s.rejectTask);
  const updateTaskStatus     = useAppStore((s) => s.updateTaskStatus);
  const currentUser          = useAppStore((s) => s.currentUser);
  const projects             = useAppStore((s) => s.projects);
  const task                 = findTask(tasks, Number(id));
  const project              = task ? projects.find((p) => p.id === task.projectId) : null;
  const isAdmin              = currentUser?.global_role === 'admin';
  const isEmployee           = currentUser?.global_role === 'employee';
  const isAssignee           = task?.assignee?.id === currentUser?.id;
  // Laravel: employee comment requires assignee check (abort_unless task.assigned_to === user.id)
  // Admin has no restriction.
  const canComment           = isAdmin || (isEmployee && isAssignee);

  const [commentText, setCommentText] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [subtaskParentId, setSubtaskParentId] = useState<number | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle]   = useState('');
  const [newSubtaskDue,   setNewSubtaskDue]     = useState('');
  const [newSubtaskPrio,  setNewSubtaskPrio]    = useState<'low'|'medium'|'high'>('medium');
  const [showSubtaskDatePicker, setShowSubtaskDatePicker] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentY      = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(contentY,      { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 160 }),
    ]).start();
  }, []);

  if (!task) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <View style={[styles.backCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </View>
        </Pressable>
        <View style={styles.centered}>
          <Text style={{ color: colors.textMuted }}>Task not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const priorityColor =
    task.priority === 'high' ? colors.danger :
    task.priority === 'medium' ? colors.warning : colors.success;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  const daysLeft = Math.ceil(
    (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const handleAddComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    addComment(task.id, trimmed);
    setCommentText('');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* ── Hero header ── */}
      <Animated.View style={[styles.hero, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={[colors.heroGradientTop, colors.background]}
          style={StyleSheet.absoluteFill}
        />
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <View style={[styles.backCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </View>
        </Pressable>

        <View style={styles.priorityRow}>
          <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />
          <Text style={[styles.priorityLabel, { color: priorityColor }]}>
            {task.priority.toUpperCase()} PRIORITY
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{task.title}</Text>
        {task.description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>{task.description}</Text>
        )}

        <View style={styles.metaRow}>
          <Badge label={task.status} variant={task.status} />
          {project && (
            <View style={[styles.projectPill, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="folder-outline" size={11} color={colors.primary} />
              <Text style={[styles.projectPillText, { color: colors.primary }]} numberOfLines={1}>
                {project.name}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* ── Scrollable content ── */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Animated.View style={[{ flex: 1 }, { transform: [{ translateY: contentY }] }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Date + Days Left */}
            <View style={styles.statRow}>
              <StatCard
                icon="calendar-outline"
                label="Due Date"
                value={formatDate(task.dueDate)}
                color={daysLeft < 3 ? colors.danger : colors.primary}
                bg={daysLeft < 3 ? colors.dangerLight : colors.primaryLight}
              />
              <StatCard
                icon="time-outline"
                label="Days Left"
                value={daysLeft < 0 ? 'Overdue' : `${daysLeft}d`}
                color={daysLeft < 0 ? colors.danger : daysLeft < 3 ? colors.warning : colors.success}
                bg={daysLeft < 0 ? colors.dangerLight : daysLeft < 3 ? colors.warningLight : colors.successLight}
              />
            </View>

            {/* Progress */}
            <Card style={styles.card} padding={Spacing.base}>
              <View style={styles.rowBetween}>
                <Text style={[styles.cardLabel, { color: colors.textMuted }]}>COMPLETION</Text>
                <Text style={[styles.bigNumber, { color: colors.primary }]}>{task.progress}%</Text>
              </View>
              <ProgressBar value={task.progress} height={8} />
            </Card>

            {/* Assignee */}
            {task.assignee && (
              <Card style={styles.card} padding={Spacing.base}>
                <Text style={[styles.cardLabel, { color: colors.textMuted }]}>ASSIGNED TO</Text>
                <View style={styles.assigneeRow}>
                  <Avatar name={task.assignee.name} color={task.assignee.color} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.assigneeName, { color: colors.text }]}>{task.assignee.name}</Text>
                    <Text style={[styles.assigneeEmail, { color: colors.textMuted }]}>{task.assignee.email}</Text>
                    <View style={[styles.assigneeRolePill, { backgroundColor: colors.primaryMuted }]}>
                      <Text style={[styles.assigneeRoleText, { color: colors.primary }]}>
                        {task.assignee.global_role}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            )}

            {/* Subtasks — wired to store toggleSubtask */}
            {((task.subtasks && task.subtasks.length > 0) || isAdmin) && (
              <View style={styles.subtasksSection}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Subtasks</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.subtasksCount, { color: colors.textMuted }]}>
                      {task.subtasks?.filter((s) => s.status === 'done').length ?? 0} / {task.subtasks?.length ?? 0}
                    </Text>
                    {isAdmin && (
                      <Pressable
                        onPress={() => setShowAddSubtask(true)}
                        style={[styles.addSubtaskBtn, { backgroundColor: colors.primaryMuted }]}
                        hitSlop={8}
                      >
                        <Ionicons name="add" size={16} color={colors.primary} />
                      </Pressable>
                    )}
                  </View>
                </View>
                {task.subtasks && task.subtasks.length > 0 && (
                  <View style={[styles.subtasksList, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}>
                    {task.subtasks.map((subtask, index) => (
                      <RecursiveSubtaskRow
                        key={subtask.id}
                        subtask={subtask}
                        rootTaskId={task.id}
                        depth={0}
                        index={index}
                        isLast={index === (task.subtasks?.length ?? 0) - 1}
                        toggleSubtask={toggleSubtask}
                        isAdmin={isAdmin}
                        onAddSubtask={(parentId) => {
                          setSubtaskParentId(parentId);
                          setShowAddSubtask(true);
                        }}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Task Action Buttons — role-based, matches Laravel permissions */}
            {task && (
              <View style={[styles.actionSection, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>

                {/* Employee: mark as in_progress or ready_for_review */}
                {isEmployee && isAssignee && task.status === 'in_progress' && (
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: colors.infoLight }]}
                    onPress={() => markReadyForReview(task.id)}
                  >
                    <Ionicons name="checkmark-done-outline" size={18} color={colors.info} />
                    <Text style={[styles.actionBtnText, { color: colors.info }]}>Mark Ready for Review</Text>
                  </Pressable>
                )}

                {/* Employee: start working on a todo task */}
                {isEmployee && isAssignee && task.status === 'todo' && (
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: colors.primaryMuted }]}
                    onPress={() => updateTaskStatus(task.id, 'in_progress')}
                  >
                    <Ionicons name="play-outline" size={18} color={colors.primary} />
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>Start Working</Text>
                  </Pressable>
                )}

                {/* Admin: approve or reject a ready_for_review task */}
                {isAdmin && task.status === 'ready_for_review' && (
                  <View style={styles.adminActions}>
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: colors.successLight, flex: 1 }]}
                      onPress={() => approveTask(task.id)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
                      <Text style={[styles.actionBtnText, { color: colors.success }]}>Approve</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: colors.dangerLight, flex: 1 }]}
                      onPress={() => rejectTask(task.id)}
                    >
                      <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                      <Text style={[styles.actionBtnText, { color: colors.danger }]}>Reject</Text>
                    </Pressable>
                  </View>
                )}

                {(task.status === 'done') && (
                  <View style={[styles.doneNote, { backgroundColor: colors.successLight }]}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={[styles.doneNoteText, { color: colors.success }]}>Task completed</Text>
                  </View>
                )}
              </View>
            )}

            {/* Comments */}
            <View style={styles.commentsSection}>
              <View style={styles.rowBetween}>
                <View style={styles.commentsHeader}>
                  <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Comments
                  </Text>
                  {task.comments && task.comments.length > 0 && (
                    <View style={[styles.commentCount, { backgroundColor: colors.surfaceContainerHigh }]}>
                      <Text style={[styles.commentCountText, { color: colors.textSecondary }]}>
                        {task.comments.length}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Comment list */}
              {task.comments && task.comments.length > 0 ? (
                <View style={[styles.commentsList, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}>
                  {task.comments.map((comment, index) => (
                    <CommentRow
                      key={comment.id}
                      comment={comment}
                      isLast={index === (task.comments?.length ?? 0) - 1}
                    />
                  ))}
                </View>
              ) : (
                <View style={[styles.commentsEmpty, { backgroundColor: colors.surfaceContainer }]}>
                  <Ionicons name="chatbubbles-outline" size={28} color={colors.textMuted} />
                  <Text style={[styles.commentsEmptyText, { color: colors.textMuted }]}>
                    No comments yet
                  </Text>
                </View>
              )}

              {/* Add comment — admin + employee only */}
              {canComment && (
                <View style={[styles.addCommentRow, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}>
                  <Avatar
                    name={currentUser?.name ?? 'User'}
                    color={currentUser?.color ?? colors.primary}
                    size={32}
                  />
                  <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="Add a comment..."
                    placeholderTextColor={colors.textMuted}
                    style={[styles.commentInput, { color: colors.text, backgroundColor: colors.surfaceContainer }]}
                    multiline
                    autoCorrect={false}
                    returnKeyType="default"
                  />
                  <Pressable
                    onPress={handleAddComment}
                    disabled={!commentText.trim()}
                    style={[
                      styles.sendBtn,
                      { backgroundColor: commentText.trim() ? colors.primary : colors.surfaceContainerHigh },
                    ]}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="send"
                      size={16}
                      color={commentText.trim() ? '#FFFFFF' : colors.textMuted}
                    />
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* ── Add Subtask Modal (admin only) ── */}
      <Modal
        visible={showAddSubtask}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddSubtask(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddSubtask(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.card }]} onPress={() => {}}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {subtaskParentId && subtaskParentId !== task.id ? 'Add Nested Subtask' : 'Add Subtask'}
            </Text>

            {/* Title */}
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Title *</Text>
            <TextInput
              value={newSubtaskTitle}
              onChangeText={setNewSubtaskTitle}
              placeholder="Subtask title..."
              placeholderTextColor={colors.textMuted}
              style={[styles.modalInput, { color: colors.text, backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}
              autoFocus
            />

            {/* Due Date */}
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Due Date *</Text>
            <Pressable
              onPress={() => setShowSubtaskDatePicker(true)}
              style={[styles.modalInput, { borderColor: colors.border, backgroundColor: colors.surfaceContainer, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            >
              <Text style={{ color: newSubtaskDue ? colors.text : colors.textMuted, fontSize: Typography.sm }}>
                {newSubtaskDue ? new Date(newSubtaskDue).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Select due date...'}
              </Text>
              <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
            </Pressable>

            {/* Priority */}
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Priority</Text>
            <View style={styles.prioRow}>
              {(['low','medium','high'] as const).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setNewSubtaskPrio(p)}
                  style={[
                    styles.prioPill,
                    {
                      backgroundColor: newSubtaskPrio === p
                        ? (p === 'high' ? colors.danger : p === 'medium' ? colors.warning : colors.success)
                        : colors.surfaceContainerHigh,
                    }
                  ]}
                >
                  <Text style={[styles.prioPillText, { color: newSubtaskPrio === p ? '#FFF' : colors.textSecondary }]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Buttons */}
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.surfaceContainerHigh, flex: 1 }]}
                onPress={() => { setShowAddSubtask(false); setNewSubtaskTitle(''); setNewSubtaskDue(''); }}
              >
                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={() => {
                  if (!newSubtaskTitle.trim() || !newSubtaskDue) {
                    Alert.alert('Missing fields', 'Please fill in title and due date.');
                    return;
                  }
                  addSubtask(subtaskParentId ?? task.id, newSubtaskTitle.trim(), newSubtaskDue, newSubtaskPrio);
                  setShowAddSubtask(false);
                  setNewSubtaskTitle('');
                  setNewSubtaskDue('');
                  setNewSubtaskPrio('medium');
                  setSubtaskParentId(null);
                }}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Add</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <DatePickerModal
        visible={showSubtaskDatePicker}
        value={newSubtaskDue}
        onConfirm={(iso) => setNewSubtaskDue(iso)}
        onClose={() => setShowSubtaskDatePicker(false)}
        minDate={new Date()}
      />
    </SafeAreaView>
  );
}

function findTask(tasks: Task[], taskId: number): Task | undefined {
  for (const task of tasks) {
    if (task.id === taskId) return task;
    const child = findTask(task.subtasks ?? [], taskId);
    if (child) return child;
  }
  return undefined;
}

// ─── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, color, bg,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; value: string; color: string; bg: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}>
      <View style={[styles.statCardIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={[styles.statCardLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.statCardValue, { color }]}>{value}</Text>
    </View>
  );
}

// ─── RecursiveSubtaskRow ───────────────────────────────────────────────────────

function RecursiveSubtaskRow({
  subtask, rootTaskId, depth, index, isLast, toggleSubtask, isAdmin, onAddSubtask,
}: {
  subtask: Task;
  rootTaskId: number;
  depth: number;
  index: number;
  isLast: boolean;
  toggleSubtask: (rootId: number, subtaskId: number) => void;
  isAdmin: boolean;
  onAddSubtask: (parentId: number) => void;
}) {
  const { colors } = useTheme();
  const isDone = subtask.status === 'done';
  const hasChildren = subtask.subtasks && subtask.subtasks.length > 0;
  const [expanded, setExpanded] = useState(true);

  const checkScale = useRef(new Animated.Value(isDone ? 1 : 0)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 280, delay: index * 40, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Animated.spring(checkScale, { toValue: isDone ? 1 : 0, damping: 12, stiffness: 260, useNativeDriver: true }).start();
  }, [isDone]);

  const indentLeft = depth * 20;
  const priorityColor = subtask.priority === 'high' ? colors.danger : subtask.priority === 'medium' ? colors.warning : colors.success;

  return (
    <Animated.View style={{ opacity }}>
      {/* Row */}
      <View style={[
        styles.subtaskRow,
        !isLast && !hasChildren && { borderBottomWidth: 1, borderBottomColor: colors.border },
        { paddingLeft: Spacing.md + indentLeft },
      ]}>
        {/* Indent line */}
        {depth > 0 && (
          <View style={[styles.indentLine, { left: indentLeft - 2, backgroundColor: colors.border }]} />
        )}

        {/* Checkbox */}
        <Pressable
          onPress={() => toggleSubtask(rootTaskId, subtask.id)}
          style={[styles.checkbox, {
            borderColor: isDone ? colors.success : colors.border,
            backgroundColor: isDone ? colors.successLight : 'transparent',
          }]}
          hitSlop={6}
        >
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <Ionicons name="checkmark" size={11} color={colors.success} />
          </Animated.View>
        </Pressable>

        {/* Title + due */}
        <Pressable style={{ flex: 1, gap: 2 }} onPress={() => hasChildren && setExpanded(e => !e)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.subtaskTitle, {
              color: colors.text, flex: 1,
              opacity: isDone ? 0.45 : 1,
              textDecorationLine: isDone ? 'line-through' : 'none',
            }]} numberOfLines={2}>
              {subtask.title}
            </Text>
            {hasChildren && (
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={13} color={colors.textMuted}
              />
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.subtaskDue, { color: colors.textMuted }]}>
              {new Date(subtask.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </Text>
            {hasChildren && (
              <Text style={[styles.subtaskDue, { color: colors.textMuted }]}>
                · {subtask.subtasks!.filter(s => s.status === 'done').length}/{subtask.subtasks!.length} done
              </Text>
            )}
          </View>
        </Pressable>

        {/* Priority dot */}
        <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />

        {/* Add child subtask button */}
        {isAdmin && (
          <Pressable
            onPress={() => onAddSubtask(subtask.id)}
            style={[styles.addChildBtn, { backgroundColor: colors.primaryMuted }]}
            hitSlop={6}
          >
            <Ionicons name="add" size={12} color={colors.primary} />
          </Pressable>
        )}
      </View>

      {/* Children */}
      {hasChildren && expanded && subtask.subtasks!.map((child, i) => (
        <RecursiveSubtaskRow
          key={child.id}
          subtask={child}
          rootTaskId={rootTaskId}
          depth={depth + 1}
          index={i}
          isLast={i === subtask.subtasks!.length - 1}
          toggleSubtask={toggleSubtask}
          isAdmin={isAdmin}
          onAddSubtask={onAddSubtask}
        />
      ))}
    </Animated.View>
  );
}

// ─── CommentRow ────────────────────────────────────────────────────────────────

function CommentRow({ comment, isLast }: { comment: Comment; isLast: boolean }) {
  const { colors } = useTheme();

  const timeAgo = (iso: string) => {
    const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
    if (h < 1)  return 'Just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <View style={[styles.commentRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Avatar name={comment.author.name} color={comment.author.color} size={32} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.commentMeta}>
          <Text style={[styles.commentAuthor, { color: colors.text }]}>{comment.author.name}</Text>
          <Text style={[styles.commentTime, { color: colors.textMuted }]}>{timeAgo(comment.createdAt)}</Text>
        </View>
        <Text style={[styles.commentText, { color: colors.textSecondary }]}>{comment.text}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
    overflow: 'hidden',
    gap: Spacing.sm,
  },
  backBtn: { paddingTop: Spacing.sm, marginBottom: Spacing.sm },
  backCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  priorityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  priorityBar: { width: 3, height: 14, borderRadius: 2 },
  priorityLabel: { fontSize: Typography.xs, fontWeight: Typography.black, letterSpacing: 1 },
  title: { fontSize: Typography.xl, fontWeight: Typography.black, lineHeight: 28 },
  description: { fontSize: Typography.sm, lineHeight: 20 },
  metaRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', alignItems: 'center' },
  projectPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full,
  },
  projectPillText: { fontSize: Typography.xs, fontWeight: Typography.semibold },

  scrollContent: { paddingHorizontal: Spacing.base, paddingBottom: 48, gap: Spacing.md },

  statRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, borderRadius: Radius.lg, padding: Spacing.md, gap: 4 },
  statCardIcon: { width: 30, height: 30, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statCardLabel: { fontSize: Typography.xs },
  statCardValue: { fontSize: Typography.base, fontWeight: Typography.bold },

  card: { gap: Spacing.md },
  cardLabel: { fontSize: Typography.xs, fontWeight: Typography.black, letterSpacing: 1, textTransform: 'uppercase' },
  bigNumber: { fontSize: Typography.xl, fontWeight: Typography.black },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  assigneeRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  assigneeName: { fontSize: Typography.base, fontWeight: Typography.semibold },
  assigneeEmail: { fontSize: Typography.xs },
  assigneeRolePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start', marginTop: 4 },
  assigneeRoleText: { fontSize: Typography.xs, fontWeight: Typography.bold, textTransform: 'capitalize' },

  subtasksSection: { gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.base, fontWeight: Typography.bold },
  subtasksCount: { fontSize: Typography.sm },
  subtasksList: { borderRadius: Radius.lg, overflow: 'hidden' },
  subtaskRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, paddingVertical: 10, paddingHorizontal: Spacing.md,
  },
  indentLine: { position: 'absolute', top: 0, bottom: 0, width: 1.5, left: 0 },
  checkbox: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  subtaskTitle: { fontSize: Typography.sm, lineHeight: 18 },
  subtaskDue: { fontSize: Typography.xs },
  priorityDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  addChildBtn: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  commentsSection: { gap: Spacing.sm },
  commentsHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  commentCount: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  commentCountText: { fontSize: Typography.xs, fontWeight: Typography.bold },
  commentsList: { borderRadius: Radius.lg, overflow: 'hidden' },
  commentRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
  commentMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commentAuthor: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  commentTime: { fontSize: Typography.xs },
  commentText: { fontSize: Typography.sm, lineHeight: 18 },
  commentsEmpty: { borderRadius: Radius.md, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  commentsEmptyText: { fontSize: Typography.sm },
  addCommentRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.lg,
  },
  commentInput: {
    flex: 1, fontSize: Typography.sm, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 8, maxHeight: 80,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  actionSection: { borderRadius: Radius.lg, padding: Spacing.base, gap: Spacing.sm, marginBottom: 0 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md, borderRadius: Radius.md },
  actionBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  adminActions: { flexDirection: 'row', gap: Spacing.sm },
  doneNote: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md, borderRadius: Radius.md },
  doneNoteText: { fontSize: Typography.sm, fontWeight: Typography.semibold },

  addSubtaskBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing.base, paddingBottom: 40, gap: Spacing.md },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  modalTitle: { fontSize: Typography.lg, fontWeight: Typography.black },
  modalLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: -6 },
  modalInput: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: Typography.sm },
  prioRow: { flexDirection: 'row', gap: Spacing.sm },
  prioPill: { flex: 1, paddingVertical: 8, borderRadius: Radius.md, alignItems: 'center' },
  prioPillText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  modalBtn: { paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center' },
  modalBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold },
});
