/**
 * Projects Screen
 * Filterable, searchable list of all projects.
 * FAB opens a Create Project modal (admin only).
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  Animated,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { ProjectCard } from '../../components/project/ProjectCard';
import { DatePickerModal } from '../../components/ui/Datepickermodal';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { Project, ProjectStatus, Priority } from '../../types';

type FilterTab = 'all' | ProjectStatus;

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',         label: 'All'       },
  { key: 'in_progress', label: 'Active'    },
  { key: 'todo',        label: 'Pending'   },
  { key: 'done',        label: 'Completed' },
  { key: 'on_hold',     label: 'On Hold'   },
];

const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high'];
const STATUS_OPTIONS: ProjectStatus[] = ['todo', 'in_progress', 'on_hold'];

function getProjectCount(projects: Project[], tab: FilterTab): number {
  return tab === 'all' ? projects.length : projects.filter((p) => p.status === tab).length;
}

export default function ProjectsScreen() {
  const { colors } = useTheme();
  const router      = useRouter();
  const allProjects = useAppStore((s) => s.projects);
  const addProject  = useAppStore((s) => s.addProject);
  const currentUser = useAppStore((s) => s.currentUser);
  const isAdmin     = currentUser?.global_role === 'admin';

  // Laravel permission parity:
  // Admin: sees all projects (GET /admin/projects)
  // Employee: sees only member projects (GET /employee/projects)  
  // Client: sees only own projects (client_id === user.id)
  const projects = currentUser?.global_role === 'admin'
    ? allProjects
    : currentUser?.global_role === 'employee'
    ? allProjects.filter((p) => p.members.some((m) => m.id === currentUser?.id))
    : allProjects.filter((p) => p.client.id === currentUser?.id);

  const [search,      setSearch]      = useState('');
  const [activeTab,   setActiveTab]   = useState<FilterTab>('all');
  const [showModal,   setShowModal]   = useState(false);
  const [newName,     setNewName]     = useState('');
  const [newClient,   setNewClient]   = useState('');
  const [newDesc,     setNewDesc]     = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newStatus,   setNewStatus]   = useState<ProjectStatus>('todo');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate,   setNewEndDate]   = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker,   setShowEndPicker]   = useState(false);
  const [formError,   setFormError]   = useState('');

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY       = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(headerY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
    ]).start();
  }, []);

  const filtered = projects.filter((p) => {
    const matchesTab    = activeTab === 'all' || p.status === activeTab;
    const q             = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || p.client.name.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const resetForm = () => {
    setNewName(''); setNewClient(''); setNewDesc('');
    setNewPriority('medium'); setNewStatus('todo');
    setNewStartDate(''); setNewEndDate('');
    setFormError('');
  };

  const handleCreate = () => {
    if (!newName.trim())   { setFormError('Project name is required.'); return; }
    if (!newClient.trim()) { setFormError('Client name is required.'); return; }
    if (!newStartDate)     { setFormError('Start date is required.'); return; }
    if (!newEndDate)       { setFormError('End date is required.'); return; }
    addProject({
      name: newName.trim(),
      client: {
        id: Date.now(),
        name: newClient.trim(),
        email: `${newClient.trim().toLowerCase().replace(/\s+/g, '.')}@client.local`,
        global_role: 'client',
        color: '#A78BFA',
      },
      description: newDesc.trim() || 'No description provided.',
      status: newStatus,
      progress: 0,
      startDate: newStartDate,
      endDate: newEndDate,
      budget: 0,
      projectType: { id: 0, name: 'Web Application' },
      members: currentUser ? [currentUser] : [],
      estimatedDays: Math.ceil((new Date(newEndDate).getTime() - new Date(newStartDate).getTime()) / 86400000),
    });
    resetForm();
    setShowModal(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>Projects</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.primaryMuted }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>{projects.length}</Text>
          </View>
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search projects..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count    = getProjectCount(projects, tab.key);
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, { backgroundColor: isActive ? colors.primary : colors.surfaceContainer }]}
              >
                <Text style={[styles.tabLabel, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>
                  {tab.label}
                </Text>
                <View style={[styles.tabCount, { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : colors.surfaceContainerHigh }]}>
                  <Text style={[styles.tabCountText, { color: isActive ? '#FFFFFF' : colors.textMuted }]}>{count}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item, index }) => (
            <AnimatedProjectCard
              project={item}
              index={index}
              onPress={(p) => router.push(`/project/${p.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB - admin only */}
      {isAdmin && (
        <Pressable
          style={[styles.fab, { backgroundColor: colors.primary, ...Shadow.lg, shadowColor: colors.primary }]}
          onPress={() => setShowModal(true)}
          hitSlop={8}
        >
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </Pressable>
      )}

      {/* Create Project Modal */}
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Project</Text>
              <Pressable onPress={() => { resetForm(); setShowModal(false); }} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: Spacing.md, paddingBottom: Spacing['2xl'] }}
            >
              <ModalField
                label="Project Name *"
                value={newName}
                onChangeText={(t) => { setNewName(t); setFormError(''); }}
                placeholder="e.g. Atlas Platform"
              />
              <ModalField
                label="Client *"
                value={newClient}
                onChangeText={(t) => { setNewClient(t); setFormError(''); }}
                placeholder="e.g. TechCorp Inc."
              />
              <ModalField
                label="Description"
                value={newDesc}
                onChangeText={setNewDesc}
                placeholder="Brief project description..."
                multiline
              />

              {/* Start Date */}
              <View style={styles.modalFieldWrap}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Start Date *</Text>
                <Pressable
                  onPress={() => setShowStartPicker(true)}
                  style={[styles.modalInput, { borderColor: colors.border, backgroundColor: colors.surfaceContainer, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                >
                  <Text style={{ color: newStartDate ? colors.text : colors.textMuted, fontSize: Typography.base }}>
                    {newStartDate ? new Date(newStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Select start date...'}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
                </Pressable>
              </View>

              {/* End Date */}
              <View style={styles.modalFieldWrap}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>End Date *</Text>
                <Pressable
                  onPress={() => setShowEndPicker(true)}
                  style={[styles.modalInput, { borderColor: colors.border, backgroundColor: colors.surfaceContainer, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                >
                  <Text style={{ color: newEndDate ? colors.text : colors.textMuted, fontSize: Typography.base }}>
                    {newEndDate ? new Date(newEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Select end date...'}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
                </Pressable>
              </View>

              <View style={styles.modalFieldWrap}>
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

              <View style={styles.modalFieldWrap}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Initial Status</Text>
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
                  <Text style={styles.submitText}>Create Project</Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <DatePickerModal
        visible={showStartPicker}
        value={newStartDate}
        onConfirm={(iso) => { setNewStartDate(iso); setFormError(''); }}
        onClose={() => setShowStartPicker(false)}
      />
      <DatePickerModal
        visible={showEndPicker}
        value={newEndDate}
        onConfirm={(iso) => { setNewEndDate(iso); setFormError(''); }}
        onClose={() => setShowEndPicker(false)}
        minDate={newStartDate ? new Date(newStartDate) : new Date()}
      />
    </SafeAreaView>
  );
}

function ModalField({
  label, value, onChangeText, placeholder, multiline,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; multiline?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.modalFieldWrap}>
      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.modalInput,
          {
            color: colors.text,
            backgroundColor: colors.surfaceContainer,
            borderColor: colors.border,
            height: multiline ? 72 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
        multiline={multiline}
        autoCapitalize="words"
        autoCorrect={false}
      />
    </View>
  );
}

function AnimatedProjectCard({
  project, index, onPress,
}: {
  project: Project; index: number; onPress: (p: Project) => void;
}) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 380, delay: index * 70, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay: index * 70, useNativeDriver: true, damping: 20, stiffness: 180 }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <ProjectCard project={project} onPress={onPress} />
    </Animated.View>
  );
}

function EmptyState({ search }: { search: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyState}>
      <Ionicons name="folder-open-outline" size={56} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No projects found</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        {search ? `No results for "${search}"` : 'Create your first project.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm, gap: Spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: Typography.xl, fontWeight: Typography.black },
  countBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  countText: { fontSize: Typography.sm, fontWeight: Typography.bold },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: Typography.base, paddingVertical: 0 },
  tabsRow: { gap: Spacing.sm, paddingRight: Spacing.base },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
  tabLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  tabCount: { minWidth: 20, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabCountText: { fontSize: 10, fontWeight: Typography.bold },
  listContent: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: 100 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: 40 },
  emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.bold },
  emptySubtitle: { fontSize: Typography.sm, textAlign: 'center', lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing.base, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: Typography.xl, fontWeight: Typography.black },
  modalFieldWrap: { gap: 6 },
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