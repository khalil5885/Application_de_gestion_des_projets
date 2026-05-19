/**
 * Tasks Screen
 * Tasks grouped by status. Priority filters. Collapsible sections.
 * FAB opens Create Task modal (admin + employee).
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { Card } from '../../components/ui/Card';
import { Badge, Avatar, ProgressBar } from '../../components/ui/index';
import { DatePickerModal } from '../../components/ui/Datepickermodal';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { Task, Priority, TaskStatus } from '../../types';

type PriorityFilter = 'all' | Priority;

const PRIORITY_FILTERS: { key: PriorityFilter; label: string }[] = [
  { key: 'all',    label: 'All'       },
  { key: 'high',   label: '\uD83D\uDD34 High'   },
  { key: 'medium', label: '\uD83D\uDFE1 Medium' },
  { key: 'low',    label: '\uD83D\uDFE2 Low'    },
];

const STATUS_SECTIONS: {
  key: TaskStatus;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { key: 'in_progress',      label: 'In Progress',    icon: 'time-outline'              },
  { key: 'ready_for_review', label: 'Ready for Review',icon: 'hourglass-outline'         },
  { key: 'todo',             label: 'To Do',           icon: 'ellipse-outline'           },
  { key: 'on_hold',          label: 'On Hold',         icon: 'pause-circle-outline'      },
  { key: 'done',             label: 'Done',            icon: 'checkmark-circle-outline'  },
];

const PRIORITY_OPTIONS: Priority[]    = ['low', 'medium', 'high'];
const STATUS_OPTIONS:   TaskStatus[]  = ['todo', 'in_progress'];

export default function TasksScreen() {
  const { colors }          = useTheme();
  const router              = useRouter();
  const allTasks            = useAppStore((s) => s.tasks);
  const addTask             = useAppStore((s) => s.addTask);
  const addSubtask          = useAppStore((s) => s.addSubtask);
  const setSelectedTask     = useAppStore((s) => s.setSelectedTask);
  const currentUser         = useAppStore((s) => s.currentUser);
  const projects            = useAppStore((s) => s.projects);
  const isAdmin             = currentUser?.global_role === 'admin';
  // Laravel: only admin can POST /admin/tasks — employee has NO task creation endpoint
  const canCreate           = isAdmin;

  // Laravel permission parity:
  // Admin: sees all tasks (TasksOverviewController)
  // Employee: sees only assigned tasks (Employee/TaskController.index)
  // Client: no task board access
  const tasks = currentUser?.global_role === 'admin'
    ? allTasks.filter((t) => !t.parentId)
    : currentUser?.global_role === 'employee'
    ? allTasks.filter((t) => !t.parentId && t.assignee?.id === currentUser?.id)
    : [];

  const [priorityFilter,    setPriorityFilter]    = useState<PriorityFilter>('all');
  const [collapsedSections, setCollapsedSections] = useState<Set<TaskStatus>>(new Set(['done', 'on_hold']));
  const [showModal,         setShowModal]          = useState(false);
  const [subtaskTargetId,   setSubtaskTargetId]    = useState<number | null>(null);
  const [showSubtaskModal,  setShowSubtaskModal]   = useState(false);
  const [stTitle,  setStTitle]  = useState('');
  const [stDue,    setStDue]    = useState('');
  const [stPrio,   setStPrio]   = useState<Priority>('medium');
  const [showStDatePicker, setShowStDatePicker] = useState(false);

  // Create form
  const [newTitle,    setNewTitle]    = useState('');
  const [newDesc,     setNewDesc]     = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newStatus,   setNewStatus]   = useState<TaskStatus>('todo');
  const [newProject,  setNewProject]  = useState(projects[0]?.id ?? 0);
  const [formError,   setFormError]   = useState('');

  const headerOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (!newProject && projects[0]?.id) setNewProject(projects[0].id);
  }, [newProject, projects]);

  const filtered = tasks.filter(
    (t) => priorityFilter === 'all' || t.priority === priorityFilter
  );

  const toggleSection = (status: TaskStatus) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  };

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    router.push(`/task/${task.id}`);
  };

  const resetForm = () => {
    setNewTitle(''); setNewDesc('');
    setNewPriority('medium'); setNewStatus('todo');
    setNewProject(projects[0]?.id ?? 0); setFormError('');
  };

  const handleCreate = () => {
    if (!newTitle.trim()) { setFormError('Task title is required.'); return; }
    addTask({
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      status: newStatus,
      priority: newPriority,
      progress: 0,
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      projectId: newProject,
      assignee: currentUser ?? undefined,
    });
    resetForm();
    setShowModal(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <Text style={[styles.title, { color: colors.text }]}>Tasks</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {currentUser?.global_role === 'client'
              ? 'View your project progress in Projects tab'
              : `${filtered.length} tasks · ${filtered.filter((t) => t.status === 'in_progress').length} active`}
          </Text>
        </Animated.View>

        {/* Priority Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {PRIORITY_FILTERS.map((f) => {
            const isActive = priorityFilter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setPriorityFilter(f.key)}
                style={[styles.filterPill, { backgroundColor: isActive ? colors.primary : colors.surfaceContainer }]}
              >
                <Text style={[styles.filterLabel, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Task Sections */}
        {STATUS_SECTIONS.map((section) => {
          const sectionTasks = filtered.filter((t) => t.status === section.key);
          const isCollapsed  = collapsedSections.has(section.key);
          const sectionColor =
            section.key === 'in_progress'      ? colors.primary :
            section.key === 'ready_for_review'  ? colors.info    :
            section.key === 'done'              ? colors.success :
            section.key === 'on_hold'           ? colors.warning : colors.textMuted;

          return (
            <View key={section.key} style={styles.section}>
              <Pressable style={styles.sectionHeader} onPress={() => toggleSection(section.key)}>
                <View style={styles.sectionLeft}>
                  <Ionicons name={section.icon} size={18} color={sectionColor} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.label}</Text>
                  <View style={[styles.sectionCount, { backgroundColor: colors.surfaceContainer }]}>
                    <Text style={[styles.sectionCountText, { color: sectionColor }]}>{sectionTasks.length}</Text>
                  </View>
                </View>
                <Ionicons
                  name={isCollapsed ? 'chevron-down-outline' : 'chevron-up-outline'}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>

              {!isCollapsed && sectionTasks.map((task, index) => (
                <AnimatedTaskRow
                  key={task.id}
                  task={task}
                  index={index}
                  projectName={projects.find((p) => p.id === task.projectId)?.name ?? ''}
                  onPress={handleTaskPress}
                  isAdmin={isAdmin}
                  onAddSubtask={(taskId) => { setSubtaskTargetId(taskId); setShowSubtaskModal(true); }}
                />
              ))}

              {!isCollapsed && sectionTasks.length === 0 && (
                <View style={[styles.emptySection, { backgroundColor: colors.surfaceContainer }]}>
                  <Text style={[styles.emptySectionText, { color: colors.textMuted }]}>No tasks here</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* FAB - admin + employee */}
      {canCreate && (
        <Pressable
          style={[styles.fab, { backgroundColor: colors.primary, ...Shadow.lg, shadowColor: colors.primary }]}
          onPress={() => setShowModal(true)}
          hitSlop={8}
        >
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </Pressable>
      )}

      {/* Create Task Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => { resetForm(); setShowModal(false); }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <Pressable style={styles.modalOverlay} onPress={() => { resetForm(); setShowModal(false); }} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Task</Text>
              <Pressable onPress={() => { resetForm(); setShowModal(false); }} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: Spacing.md, paddingBottom: Spacing['2xl'] }}
            >
              {/* Title */}
              <View style={{ gap: 6 }}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Title *</Text>
                <TextInput
                  value={newTitle}
                  onChangeText={(t) => { setNewTitle(t); setFormError(''); }}
                  placeholder="e.g. Implement authentication"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.modalInput, { color: colors.text, backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}
                  autoCapitalize="sentences"
                  autoCorrect={false}
                />
              </View>

              {/* Description */}
              <View style={{ gap: 6 }}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Description</Text>
                <TextInput
                  value={newDesc}
                  onChangeText={setNewDesc}
                  placeholder="Task details..."
                  placeholderTextColor={colors.textMuted}
                  style={[styles.modalInput, { color: colors.text, backgroundColor: colors.surfaceContainer, borderColor: colors.border, height: 60, textAlignVertical: 'top' }]}
                  multiline
                  autoCorrect={false}
                />
              </View>

              {/* Project selector */}
              <View style={{ gap: 6 }}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Project</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
                  {projects.map((p) => {
                    const isActive = newProject === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => setNewProject(p.id)}
                        style={[styles.selPill, { backgroundColor: isActive ? colors.primaryMuted : colors.surfaceContainer, borderColor: isActive ? colors.primary : 'transparent' }]}
                      >
                        <Text style={[styles.selPillText, { color: isActive ? colors.primary : colors.textSecondary }]} numberOfLines={1}>
                          {p.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Priority */}
              <View style={{ gap: 6 }}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Priority</Text>
                <View style={styles.pillRow}>
                  {PRIORITY_OPTIONS.map((p) => {
                    const isActive = newPriority === p;
                    const pColor   = p === 'high' ? colors.danger : p === 'medium' ? colors.warning : colors.success;
                    return (
                      <Pressable
                        key={p}
                        onPress={() => setNewPriority(p)}
                        style={[styles.selPill, { backgroundColor: isActive ? pColor + '20' : colors.surfaceContainer, borderColor: isActive ? pColor : 'transparent' }]}
                      >
                        <Text style={[styles.selPillText, { color: isActive ? pColor : colors.textSecondary }]}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Status */}
              <View style={{ gap: 6 }}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Status</Text>
                <View style={styles.pillRow}>
                  {STATUS_OPTIONS.map((s) => {
                    const isActive = newStatus === s;
                    const label    = s.replace(/_/g, ' ');
                    return (
                      <Pressable
                        key={s}
                        onPress={() => setNewStatus(s)}
                        style={[styles.selPill, { backgroundColor: isActive ? colors.primaryMuted : colors.surfaceContainer, borderColor: isActive ? colors.primary : 'transparent' }]}
                      >
                        <Text style={[styles.selPillText, { color: isActive ? colors.primary : colors.textSecondary }]}>
                          {label.charAt(0).toUpperCase() + label.slice(1)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {!!formError && (
                <View style={[styles.formError, { backgroundColor: colors.dangerLight }]}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
                  <Text style={[styles.formErrorText, { color: colors.danger }]}>{formError}</Text>
                </View>
              )}

              <Pressable style={[styles.submitBtn, { overflow: 'hidden', borderRadius: Radius.md }]} onPress={handleCreate}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#FFF" />
                  <Text style={styles.submitText}>Create Task</Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Add Subtask Modal */}
      <Modal
        visible={showSubtaskModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubtaskModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSubtaskModal(false)} />
        <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Subtask</Text>
            <Pressable onPress={() => setShowSubtaskModal(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: Spacing.md, paddingBottom: Spacing['2xl'] }}>
            <View style={{ gap: 6 }}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Title *</Text>
              <TextInput
                value={stTitle}
                onChangeText={setStTitle}
                placeholder="Subtask title..."
                placeholderTextColor={colors.textMuted}
                style={[styles.modalInput, { color: colors.text, backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}
                autoFocus
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Due Date *</Text>
              <Pressable
                onPress={() => setShowStDatePicker(true)}
                style={[styles.modalInput, { borderColor: colors.border, backgroundColor: colors.surfaceContainer, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              >
                <Text style={{ color: stDue ? colors.text : colors.textMuted, fontSize: Typography.base }}>
                  {stDue ? new Date(stDue).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Select due date...'}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={{ gap: 6 }}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Priority</Text>
              <View style={styles.pillRow}>
                {PRIORITY_OPTIONS.map((p) => {
                  const isActive = stPrio === p;
                  const pColor   = p === 'high' ? colors.danger : p === 'medium' ? colors.warning : colors.success;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setStPrio(p)}
                      style={[styles.selPill, { backgroundColor: isActive ? pColor + '20' : colors.surfaceContainer, borderColor: isActive ? pColor : 'transparent' }]}
                    >
                      <Text style={[styles.selPillText, { color: isActive ? pColor : colors.textSecondary }]}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Pressable
              style={[styles.submitBtn, { overflow: 'hidden', borderRadius: Radius.md }]}
              onPress={() => {
                if (!stTitle.trim() || !stDue) return;
                addSubtask(subtaskTargetId!, stTitle.trim(), stDue, stPrio);
                setStTitle(''); setStDue(''); setStPrio('medium');
                setShowSubtaskModal(false);
              }}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFF" />
                <Text style={styles.submitText}>Add Subtask</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
      <DatePickerModal
        visible={showStDatePicker}
        value={stDue}
        onConfirm={(iso) => setStDue(iso)}
        onClose={() => setShowStDatePicker(false)}
        minDate={new Date()}
      />
    </SafeAreaView>
  );
}

// ─── Animated Task Row ────────────────────────────────────────────────────────

function AnimatedTaskRow({
  task, index, projectName, onPress, isAdmin, onAddSubtask,
}: {
  task: Task; index: number; projectName: string; onPress: (task: Task) => void;
  isAdmin: boolean; onAddSubtask: (taskId: number) => void;
}) {
  const { colors } = useTheme();
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, delay: index * 60, useNativeDriver: true, damping: 20, stiffness: 200 }),
    ]).start();
  }, []);

  const priorityColor =
    task.priority === 'high'   ? colors.danger :
    task.priority === 'medium' ? colors.warning : colors.success;
  const isDone = task.status === 'done';

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      <Card onPress={() => onPress(task)} style={styles.taskCard} padding={Spacing.md}>
        <View style={styles.taskCardInner}>
          <View
            style={[
              styles.completionCircle,
              { borderColor: isDone ? colors.success : colors.border, backgroundColor: isDone ? colors.successLight : 'transparent' },
            ]}
          >
            {isDone && <Ionicons name="checkmark" size={12} color={colors.success} />}
          </View>
          <View style={styles.taskContent}>
            <Text
              style={[
                styles.taskTitle,
                { color: colors.text, textDecorationLine: isDone ? 'line-through' : 'none', opacity: isDone ? 0.5 : 1 },
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            <View style={styles.taskMeta}>
              <View style={[styles.projectTag, { backgroundColor: colors.primaryMuted }]}>
                <Text style={[styles.projectTagText, { color: colors.primary }]} numberOfLines={1}>{projectName}</Text>
              </View>
              <View style={styles.dueDateRow}>
                <Ionicons name="calendar-outline" size={10} color={colors.textMuted} />
                <Text style={[styles.dueDate, { color: colors.textMuted }]}>
                  {new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </Text>
              </View>
              {task.subtasks && task.subtasks.length > 0 && (
                <View style={styles.subtaskRow}>
                  <Ionicons name="list-outline" size={10} color={colors.textMuted} />
                  <Text style={[styles.subtaskCount, { color: colors.textMuted }]}>
                    {task.subtasks.filter((s) => s.status === 'done').length}/{task.subtasks.length}
                  </Text>
                </View>
              )}
              {task.comments && task.comments.length > 0 && (
                <View style={styles.subtaskRow}>
                  <Ionicons name="chatbubble-outline" size={10} color={colors.textMuted} />
                  <Text style={[styles.subtaskCount, { color: colors.textMuted }]}>{task.comments.length}</Text>
                </View>
              )}
            </View>
            {!isDone && task.progress > 0 && <ProgressBar value={task.progress} height={3} />}
          </View>
          <View style={styles.taskRight}>
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            {task.assignee && <Avatar name={task.assignee.name} color={task.assignee.color} size={28} />}
          </View>
        </View>
      </Card>
      {isAdmin && (
        <Pressable
          onPress={() => onAddSubtask(task.id)}
          style={[styles.addSubBtn, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}
          hitSlop={6}
        >
          <Ionicons name="add" size={13} color={colors.primary} />
          <Text style={[styles.addSubBtnText, { color: colors.primary }]}>Add Subtask</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm, gap: 4 },
  title: { fontSize: Typography.xl, fontWeight: Typography.black },
  subtitle: { fontSize: Typography.sm },
  filtersRow: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.md, gap: Spacing.sm, alignItems: 'center', height: 52 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, height: 36, justifyContent: 'center' },
  filterLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  section: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm, paddingVertical: 4 },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.base, fontWeight: Typography.semibold },
  sectionCount: { minWidth: 22, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  sectionCountText: { fontSize: Typography.xs, fontWeight: Typography.bold },
  taskCard: { marginBottom: Spacing.sm },
  taskCardInner: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  completionCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  taskContent: { flex: 1, gap: 6 },
  taskTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, lineHeight: 18 },
  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  projectTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm, maxWidth: 110 },
  projectTagText: { fontSize: 10, fontWeight: Typography.semibold },
  dueDateRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dueDate: { fontSize: 10 },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  subtaskCount: { fontSize: 10 },
  taskRight: { alignItems: 'center', gap: Spacing.sm },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  addSubBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, marginTop: -4, marginBottom: Spacing.sm, marginLeft: Spacing.sm },
  addSubBtnText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  emptySection: { borderRadius: Radius.md, padding: Spacing.base, alignItems: 'center' },
  emptySectionText: { fontSize: Typography.sm },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing.base, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: Typography.xl, fontWeight: Typography.black },
  modalLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  modalInput: { borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: Typography.base, borderWidth: 1 },
  pillRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  selPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5 },
  selPillText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  formError: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: Spacing.sm, borderRadius: Radius.sm },
  formErrorText: { flex: 1, fontSize: Typography.sm },
  submitBtn: { marginTop: Spacing.sm },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  submitText: { color: '#FFFFFF', fontSize: Typography.base, fontWeight: Typography.bold },
});
