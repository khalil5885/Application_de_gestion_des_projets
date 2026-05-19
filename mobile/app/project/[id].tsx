/**
 * Project Detail Screen
 * Full project info: status, progress, budget, team, task list.
 * Admin/employee can add tasks directly from here.
 * Tasks are tappable → navigate to task detail.
 */

import React, { useRef, useEffect, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { Card } from '../../components/ui/Card';
import { Badge, Avatar, ProgressBar } from '../../components/ui/index';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { Task, Priority, TaskStatus } from '../../types';

const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high'];

export default function ProjectDetailScreen() {
  const { id }         = useLocalSearchParams<{ id: string }>();
  const { colors }     = useTheme();
  const router         = useRouter();
  const currentUser    = useAppStore((s) => s.currentUser);
  const addTask             = useAppStore((s) => s.addTask);
  const addProjectComment   = useAppStore((s) => s.addProjectComment);
  const setSelectedTask = useAppStore((s) => s.setSelectedTask);
  const allTasks       = useAppStore((s) => s.tasks);
  const allProjects    = useAppStore((s) => s.projects);
  const project        = allProjects.find((p) => p.id === Number(id));
  // Laravel: only admin can create tasks (POST /admin/projects/{id}/tasks)
  // Employee has NO task creation endpoint
  const canCreate      = currentUser?.global_role === 'admin';
  // Laravel permission parity:
  // Admin: always can comment (CommentController — no restriction)
  // Employee: must be project member (Employee/CommentController.addProjectComment)
  // Client: must be project client (Client/ProjectController.addComment)
  const isMember       = project?.members.some((m) => m.id === currentUser?.id) ?? false;
  const isProjectClient = project?.client.id === currentUser?.id;
  const canComment     = currentUser?.global_role === 'admin' ||
    (currentUser?.global_role === 'employee' && isMember) ||
    (currentUser?.global_role === 'client' && isProjectClient);

  // Get live tasks from store (includes newly added tasks for this project)
  const projectTasks = allTasks.filter((t) => t.projectId === Number(id));

  const [showModal,    setShowModal]    = useState(false);
  const [commentText,  setCommentText]  = useState('');
  const [newTitle,    setNewTitle]    = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [formError,   setFormError]   = useState('');

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentY      = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(contentY,      { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 160 }),
    ]).start();
  }, []);

  // Laravel access check:
  // Admin: all projects (admin routes)
  // Employee: member projects only (Employee/ProjectController checks membership)
  // Client: own projects only (Client/ProjectController checks client_id)
  const canAccess = !project ? false
    : currentUser?.global_role === 'admin'
    ? true
    : currentUser?.global_role === 'employee'
    ? (project.members.some((m) => m.id === currentUser?.id))
    : currentUser?.global_role === 'client'
    ? project.client.id === currentUser?.id
    : false;

  if (!project || !canAccess) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <View style={[styles.backCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </View>
        </Pressable>
        <View style={styles.centered}>
          <Text style={{ color: colors.textMuted, fontSize: Typography.base }}>
            {!project ? 'Project not found' : 'Access denied'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatBudget = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const resetForm = () => { setNewTitle(''); setNewPriority('medium'); setFormError(''); };

  const handleCreateTask = () => {
    if (!newTitle.trim()) { setFormError('Task title is required.'); return; }
    addTask({
      title: newTitle.trim(),
      status: 'todo',
      priority: newPriority,
      progress: 0,
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      projectId: project.id,
      assignee: currentUser ?? undefined,
    });
    resetForm();
    setShowModal(false);
  };

  const handleAddProjectComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed || !project) return;
    addProjectComment(project.id, trimmed);
    setCommentText('');
  };

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    router.push(`/task/${task.id}`);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Hero header */}
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
        <Badge label={project.status.replace(/_/g, ' ')} variant={project.status} />
        <Text style={[styles.heroTitle, { color: colors.text }]}>{project.name}</Text>
        <Text style={[styles.heroClient, { color: colors.textSecondary }]}>{project.client.name}</Text>
        <Text style={[styles.heroDesc, { color: colors.textMuted }]}>{project.description}</Text>
      </Animated.View>

      {/* Scrollable content */}
      <Animated.View style={[{ flex: 1 }, { transform: [{ translateY: contentY }] }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress card */}
          <Card style={styles.card} padding={Spacing.base}>
            <View style={styles.rowBetween}>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>OVERALL PROGRESS</Text>
              <Text style={[styles.bigNumber, { color: colors.primary }]}>{project.progress}%</Text>
            </View>
            <ProgressBar value={project.progress} height={8} />
            <View style={styles.taskCountRow}>
              <TaskCountPill count={project.taskCount.done}             label="Done"   color={colors.success}  bg={colors.successLight} />
              <TaskCountPill count={project.taskCount.inProgress}       label="Active" color={colors.primary}  bg={colors.primaryLight} />
              <TaskCountPill count={project.taskCount.todo}             label="To Do"  color={colors.textMuted} bg={colors.surfaceContainerHigh} />
              {project.taskCount.readyForReview > 0 && (
                <TaskCountPill count={project.taskCount.readyForReview} label="Review" color={colors.info}     bg={colors.infoLight} />
              )}
              {project.taskCount.onHold > 0 && (
                <TaskCountPill count={project.taskCount.onHold}         label="Hold"   color={colors.warning}  bg={colors.warningLight} />
              )}
            </View>
          </Card>

          {/* Info grid */}
          <View style={styles.infoGrid}>
            <InfoCell icon="calendar-outline" label="Start Date" value={formatDate(project.startDate)} color={colors.primary} bg={colors.primaryLight} />
            <InfoCell icon="flag-outline"     label="End Date"   value={formatDate(project.endDate)}   color={colors.warning} bg={colors.warningLight} />
            <InfoCell icon="cash-outline"     label="Budget"     value={formatBudget(project.budget ?? 0)}  color={colors.success} bg={colors.successLight} />
            <InfoCell icon="pricetag-outline" label="Type"       value={project.projectType?.name ?? 'N/A'}                  color={colors.info}    bg={colors.infoLight} />
          </View>

          {/* AI Insights (when available) */}
          {(project.aiComment || project.riskLevel) && (
            <View style={[styles.aiCard, { backgroundColor: colors.infoLight }]}>
              <View style={styles.aiHeader}>
                <Ionicons name='sparkles-outline' size={16} color={colors.info} />
                <Text style={[styles.aiTitle, { color: colors.info }]}>AI Insights</Text>
                {project.riskLevel && (
                  <View style={[
                    styles.riskBadge,
                    { backgroundColor:
                      project.riskLevel === 'high' ? colors.dangerLight :
                      project.riskLevel === 'medium' ? colors.warningLight : colors.successLight
                    }
                  ]}>
                    <Text style={[
                      styles.riskText,
                      { color:
                        project.riskLevel === 'high' ? colors.danger :
                        project.riskLevel === 'medium' ? colors.warning : colors.success
                      }
                    ]}>
                      {project.riskLevel.toUpperCase()} RISK
                    </Text>
                  </View>
                )}
              </View>
              {project.aiComment && (
                <Text style={[styles.aiComment, { color: colors.info }]}>{project.aiComment}</Text>
              )}
            </View>
          )}

          {/* Team */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Team</Text>
            {project.members.map((member) => (
              <View
                key={member.id}
                style={[styles.memberRow, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}
              >
                <Avatar name={member.name} color={member.color} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                  <Text style={[styles.memberEmail, { color: colors.textMuted }]}>{member.email}</Text>
                </View>
                <View style={[styles.rolePill, { backgroundColor: colors.primaryMuted }]}>
                  <Text style={[styles.roleText, { color: colors.primary }]}>{member.global_role}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Tasks */}
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Tasks <Text style={[styles.taskCount, { color: colors.textMuted }]}>({projectTasks.length})</Text>
              </Text>
              {canCreate && (
                <Pressable
                  style={[styles.addTaskBtn, { backgroundColor: colors.primaryMuted }]}
                  onPress={() => setShowModal(true)}
                  hitSlop={8}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={[styles.addTaskText, { color: colors.primary }]}>Add Task</Text>
                </Pressable>
              )}
            </View>

            {projectTasks.length === 0 ? (
              <View style={[styles.emptyTasks, { backgroundColor: colors.surfaceContainer }]}>
                <Ionicons name="list-outline" size={28} color={colors.textMuted} />
                <Text style={[styles.emptyTasksText, { color: colors.textMuted }]}>No tasks yet</Text>
              </View>
            ) : (
              projectTasks.map((task, index) => (
                <TaskItem key={task.id} task={task} index={index} onPress={handleTaskPress} />
              ))
            )}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Add Task Modal */}
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Task to {project.name}</Text>
              <Pressable onPress={() => { resetForm(); setShowModal(false); }} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={{ gap: Spacing.md }}>
              <View style={{ gap: 6 }}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Title *</Text>
                <TextInput
                  value={newTitle}
                  onChangeText={(t) => { setNewTitle(t); setFormError(''); }}
                  placeholder="e.g. Implement feature X"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.modalInput, { color: colors.text, backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}
                  autoCapitalize="sentences"
                  autoCorrect={false}
                  autoFocus
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Priority</Text>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
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

              {!!formError && (
                <View style={[styles.formError, { backgroundColor: colors.dangerLight }]}>
                  <Text style={[styles.formErrorText, { color: colors.danger }]}>{formError}</Text>
                </View>
              )}

              <Pressable
                style={[styles.submitBtn, { backgroundColor: colors.primary, borderRadius: Radius.md }]}
                onPress={handleCreateTask}
              >
                <Text style={styles.submitText}>Add Task</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TaskCountPill({ count, label, color, bg }: { count: number; label: string; color: string; bg: string }) {
  return (
    <View style={[styles.countPill, { backgroundColor: bg }]}>
      <Text style={[styles.countPillNum, { color }]}>{count}</Text>
      <Text style={[styles.countPillLabel, { color }]}>{label}</Text>
    </View>
  );
}

function InfoCell({ icon, label, value, color, bg }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; value: string; color: string; bg: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.infoCell, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}>
      <View style={[styles.infoCellIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={[styles.infoCellLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoCellValue, { color: colors.text }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function TaskItem({ task, index, onPress }: { task: Task; index: number; onPress: (t: Task) => void }) {
  const { colors } = useTheme();
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 320, delay: index * 60, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, delay: index * 60, useNativeDriver: true, damping: 20 }),
    ]).start();
  }, []);

  const priorityColor =
    task.priority === 'high' ? colors.danger :
    task.priority === 'medium' ? colors.warning : colors.success;

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      <Pressable
        onPress={() => onPress(task)}
        style={[styles.taskItem, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}
      >
        <View style={[styles.taskAccent, { backgroundColor: priorityColor }]} />
        <View style={styles.taskBody}>
          <View style={styles.rowBetween}>
            <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>{task.title}</Text>
            <Badge label={task.status} variant={task.status} size="sm" />
          </View>
          {task.assignee && (
            <View style={styles.taskMeta}>
              <Avatar name={task.assignee.name} color={task.assignee.color} size={18} />
              <Text style={[styles.taskAssignee, { color: colors.textMuted }]}>{task.assignee.name}</Text>
              <Text style={[styles.taskDue, { color: colors.textMuted }]}>
                · {new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
          )}
          {task.status !== 'done' && task.progress > 0 && (
            <ProgressBar value={task.progress} height={3} />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl, overflow: 'hidden', gap: Spacing.sm },
  backBtn: { paddingTop: Spacing.sm, marginBottom: Spacing.sm },
  backCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: Typography['2xl'], fontWeight: Typography.black, lineHeight: 32 },
  heroClient: { fontSize: Typography.base },
  heroDesc: { fontSize: Typography.sm, lineHeight: 20 },

  scrollContent: { paddingHorizontal: Spacing.base, paddingBottom: 48, gap: Spacing.md },

  card: { gap: Spacing.md },
  cardLabel: { fontSize: Typography.xs, fontWeight: Typography.black, letterSpacing: 1, textTransform: 'uppercase' },
  bigNumber: { fontSize: Typography.xl, fontWeight: Typography.black },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  taskCountRow: { flexDirection: 'row', gap: Spacing.sm },
  countPill: { flex: 1, borderRadius: Radius.sm, padding: Spacing.sm, alignItems: 'center', gap: 2 },
  countPillNum: { fontSize: Typography.lg, fontWeight: Typography.black },
  countPillLabel: { fontSize: Typography.xs },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  infoCell: { flexBasis: '47.5%', flexGrow: 1, borderRadius: Radius.lg, padding: Spacing.md, gap: 4 },
  infoCellIcon: { width: 30, height: 30, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  infoCellLabel: { fontSize: Typography.xs, letterSpacing: 0.3 },
  infoCellValue: { fontSize: Typography.sm, fontWeight: Typography.semibold },

  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.lg, fontWeight: Typography.bold },
  taskCount: { fontSize: Typography.sm, fontWeight: Typography.regular },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg },
  memberName: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  memberEmail: { fontSize: Typography.xs },
  rolePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  roleText: { fontSize: Typography.xs, fontWeight: Typography.bold, textTransform: 'capitalize' },

  addTaskBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  addTaskText: { fontSize: Typography.sm, fontWeight: Typography.semibold },

  emptyTasks: { borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  emptyTasksText: { fontSize: Typography.sm },

  // Comment section styles
  commentsHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  commentCount: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  commentCountText: { fontSize: Typography.xs, fontWeight: Typography.bold },
  commentsList: { borderRadius: Radius.lg, overflow: 'hidden' },
  commentRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentAuthor: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  commentText: { fontSize: Typography.sm, lineHeight: 18 },
  emptyComments: { borderRadius: Radius.md, padding: Spacing.base, alignItems: 'center' },
  emptyCommentsText: { fontSize: Typography.sm },
  addCommentRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.lg },
  commentInput: { flex: 1, fontSize: Typography.sm, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 8, maxHeight: 72 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  taskItem: { flexDirection: 'row', borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.sm },
  taskAccent: { width: 4 },
  taskBody: { flex: 1, padding: Spacing.md, gap: 6 },
  taskTitle: { flex: 1, fontSize: Typography.sm, fontWeight: Typography.semibold, lineHeight: 18 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskAssignee: { fontSize: Typography.xs },
  taskDue: { fontSize: Typography.xs },

  aiCard: { borderRadius: Radius.lg, padding: Spacing.base, gap: Spacing.sm },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  aiTitle: { flex: 1, fontSize: Typography.sm, fontWeight: Typography.bold },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  riskText: { fontSize: 10, fontWeight: Typography.black, letterSpacing: 0.5 },
  aiComment: { fontSize: Typography.sm, lineHeight: 18, fontStyle: 'italic' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing.base, gap: Spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { flex: 1, fontSize: Typography.base, fontWeight: Typography.bold, marginRight: Spacing.sm },
  modalLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  modalInput: { borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: Typography.base, borderWidth: 1 },
  selPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5 },
  selPillText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  formError: { padding: Spacing.sm, borderRadius: Radius.sm },
  formErrorText: { fontSize: Typography.sm },
  submitBtn: { paddingVertical: 13, alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontSize: Typography.base, fontWeight: Typography.bold },
});