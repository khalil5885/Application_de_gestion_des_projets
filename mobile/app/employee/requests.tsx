/**
 * Employee: My Requests Screen (modal)
 * Mirrors Laravel Employee/RequestController.
 *
 * Employees can:
 * - View their submitted requests
 * - Create new requests (deadline extension, resource, budget)
 *
 * Admin handles approval/rejection in admin/requests.tsx
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
import { Badge } from '../../components/ui/index';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { RequestType, Request } from '../../types';

// Laravel Employee/RequestController: type is always 'extension' (payload carries the intent)
// We keep 3 UI options for clarity but they all create type='extension' requests
const REQUEST_TYPES: { key: RequestType; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; color: string }[] = [
  { key: 'deadline_extension', label: 'Deadline Extension', icon: 'calendar-outline',     color: '#F87171' },
  { key: 'resource',           label: 'Resource Request',    icon: 'people-outline',        color: '#34D399' },
  { key: 'budget',             label: 'Budget Request',      icon: 'cash-outline',          color: '#FFA726' },
];

function timeAgo(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function EmployeeRequestsScreen() {
  const { colors }    = useTheme();
  const router        = useRouter();
  const currentUser   = useAppStore((s) => s.currentUser);
  const requests      = useAppStore((s) => s.requests);
  const addRequest    = useAppStore((s) => s.addRequest);
  const projects      = useAppStore((s) => s.projects);

  const myRequests    = requests.filter((r) => r.requestedBy.id === currentUser?.id);
  const myProjects    = projects.filter((p) => p.members.some((m) => m.id === currentUser?.id));

  const [showModal,   setShowModal]   = useState(false);
  const [reqType,     setReqType]     = useState<RequestType>('deadline_extension');
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [projectId,   setProjectId]   = useState(myProjects[0]?.id ?? null);
  const [formError,   setFormError]   = useState('');

  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const resetForm = () => {
    setTitle(''); setDescription(''); setFormError('');
    setReqType('deadline_extension');
    setProjectId(myProjects[0]?.id ?? null);
  };

  const handleSubmit = () => {
    if (!title.trim()) { setFormError('Title is required.'); return; }
    if (!projectId) { setFormError('Please select a project.'); return; }
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    addRequest({ type: reqType, title: title.trim(), description: description.trim(), project });
    resetForm();
    setShowModal(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <View style={[styles.backCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Ionicons name="close" size={20} color={colors.text} />
          </View>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>My Requests</Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowModal(true)}
          hitSlop={8}
        >
          <Ionicons name="add" size={20} color="#FFF" />
        </Pressable>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {myRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No requests yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Tap + to submit a new request to your admin.
            </Text>
          </View>
        ) : (
          myRequests.map((req, i) => (
            <RequestRow key={req.id} req={req} index={i} />
          ))
        )}
      </ScrollView>

      {/* Create Request Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => { resetForm(); setShowModal(false); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <Pressable style={styles.overlay} onPress={() => { resetForm(); setShowModal(false); }} />
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>New Request</Text>
              <Pressable onPress={() => { resetForm(); setShowModal(false); }} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md, paddingBottom: Spacing['2xl'] }}>
              {/* Type selector */}
              <View style={{ gap: 8 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Request Type</Text>
                {REQUEST_TYPES.map((rt) => {
                  const isActive = reqType === rt.key;
                  return (
                    <Pressable
                      key={rt.key}
                      onPress={() => setReqType(rt.key)}
                      style={[styles.typeRow, {
                        backgroundColor: isActive ? rt.color + '14' : colors.surfaceContainer,
                        borderColor: isActive ? rt.color : 'transparent',
                      }]}
                    >
                      <View style={[styles.typeIcon, { backgroundColor: rt.color + '20' }]}>
                        <Ionicons name={rt.icon} size={18} color={rt.color} />
                      </View>
                      <Text style={[styles.typeLabel, { color: isActive ? rt.color : colors.text }]}>{rt.label}</Text>
                      {isActive && <Ionicons name="checkmark-circle" size={18} color={rt.color} />}
                    </Pressable>
                  );
                })}
              </View>

              {/* Project selector */}
              <View style={{ gap: 6 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Project</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
                  {myProjects.map((p) => {
                    const isActive = projectId === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => setProjectId(p.id)}
                        style={[styles.pill, { backgroundColor: isActive ? colors.primaryMuted : colors.surfaceContainer, borderColor: isActive ? colors.primary : 'transparent' }]}
                      >
                        <Text style={[styles.pillText, { color: isActive ? colors.primary : colors.textSecondary }]} numberOfLines={1}>{p.name}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Title */}
              <View style={{ gap: 6 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Title *</Text>
                <TextInput
                  value={title}
                  onChangeText={(t) => { setTitle(t); setFormError(''); }}
                  placeholder="Brief summary of your request"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}
                  autoCapitalize="sentences"
                  autoCorrect={false}
                />
              </View>

              {/* Description */}
              <View style={{ gap: 6 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Details</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Explain your request in detail..."
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceContainer, borderColor: colors.border, height: 72, textAlignVertical: 'top' }]}
                  multiline
                  autoCorrect={false}
                />
              </View>

              {!!formError && (
                <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{formError}</Text>
                </View>
              )}

              <Pressable style={[styles.submitBtn, { overflow: 'hidden', borderRadius: Radius.md }]} onPress={handleSubmit}>
                <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGrad}>
                  <Ionicons name="send-outline" size={18} color="#FFF" />
                  <Text style={styles.submitText}>Submit Request</Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function RequestRow({ req, index }: { req: Request; index: number }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }).start();
  }, []);

  const typeInfo = REQUEST_TYPES.find((t) => t.key === req.type);

  return (
    <Animated.View style={[styles.reqCard, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor, opacity }]}>
      <View style={styles.reqTop}>
        <View style={[styles.reqIcon, { backgroundColor: (typeInfo?.color ?? colors.primary) + '18' }]}>
          <Ionicons name={typeInfo?.icon ?? 'document-text-outline'} size={18} color={typeInfo?.color ?? colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.reqTitle, { color: colors.text }]} numberOfLines={1}>{req.title}</Text>
          <Text style={[styles.reqProject, { color: colors.primary }]}>{req.project.name}</Text>
        </View>
        <Badge label={req.status} variant={req.status} size="sm" />
      </View>
      {req.description ? (
        <Text style={[styles.reqDesc, { color: colors.textSecondary }]} numberOfLines={2}>{req.description}</Text>
      ) : null}
      <Text style={[styles.reqTime, { color: colors.textMuted }]}>{timeAgo(req.createdAt)}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  backCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: Typography.xl, fontWeight: Typography.black },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: Spacing.base, paddingBottom: 48, gap: Spacing.md },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.bold },
  emptySubtitle: { fontSize: Typography.sm, textAlign: 'center', lineHeight: 20 },
  reqCard: { borderRadius: Radius.xl, padding: Spacing.base, gap: Spacing.sm },
  reqTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  reqIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  reqTitle: { fontSize: Typography.base, fontWeight: Typography.bold },
  reqProject: { fontSize: Typography.xs, marginTop: 2 },
  reqDesc: { fontSize: Typography.sm, lineHeight: 18 },
  reqTime: { fontSize: Typography.xs },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing.base, maxHeight: '92%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.xl, fontWeight: Typography.black },
  fieldLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1.5 },
  typeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { flex: 1, fontSize: Typography.base, fontWeight: Typography.semibold },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5 },
  pillText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  input: { borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: Typography.base, borderWidth: 1 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: Spacing.sm, borderRadius: Radius.sm },
  errorText: { flex: 1, fontSize: Typography.sm },
  submitBtn: {},
  submitGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  submitText: { color: '#FFF', fontSize: Typography.base, fontWeight: Typography.bold },
});
