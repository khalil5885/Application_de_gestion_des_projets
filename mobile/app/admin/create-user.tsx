/**
 * Admin: Create User Screen
 * Only accessible to Admin role users.
 *
 * Flow (mirrors Laravel invitation system):
 * 1. Admin fills name, email, role
 * 2. App creates the user with a temp password
 * 3. Success screen shows mock "invitation sent" confirmation
 *
 * In production, step 2 calls POST /admin/users
 * and Laravel would send an invitation email.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { UserRole } from '../../types';

const ROLES: { key: UserRole; label: string; desc: string; color: string }[] = [
  { key: 'admin',    label: 'Admin',    desc: 'Full access to all features', color: '#6366F1' },
  { key: 'employee', label: 'Employee', desc: 'Can manage tasks and projects', color: '#34D399' },
  { key: 'client',   label: 'Client',   desc: 'Read-only project visibility', color: '#A78BFA' },
];

const AVATAR_COLORS = ['#6366F1','#34D399','#FFA726','#F87171','#60A5FA','#A78BFA','#FBBF24'];

export default function CreateUserScreen() {
  const { colors } = useTheme();
  const router     = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const addUser     = useAppStore((s) => s.addUser);

  // Guard: only admins
  if (currentUser?.global_role !== 'admin') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Access Denied</Text>
          <Text style={[styles.errorSub, { color: colors.textMuted }]}>
            Only admins can create new users.
          </Text>
          <Pressable style={[styles.backLink]} onPress={() => router.back()}>
            <Text style={[styles.backLinkText, { color: colors.primary }]}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [role,     setRole]     = useState<UserRole>('employee');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [nameErr,  setNameErr]  = useState('');
  const [emailErr, setEmailErr] = useState('');

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideY,  { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 180 }),
    ]).start();
  }, []);

  const validate = () => {
    let valid = true;
    if (!name.trim()) { setNameErr('Full name is required.'); valid = false; }
    else setNameErr('');
    if (!email.trim()) { setEmailErr('Email is required.'); valid = false; }
    else if (!/\S+@\S+\.\S+/.test(email)) { setEmailErr('Enter a valid email.'); valid = false; }
    else setEmailErr('');
    return valid;
  };

  const handleCreate = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      addUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        global_role: role,
        color,
        password: 'Welcome1!', // temp password — user would set via invitation link
      });
      setLoading(false);
      setSuccess(true);
    }, 700);
  };

  if (success) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <View style={[styles.successCircle, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark-circle" size={56} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>User Created!</Text>
          <Text style={[styles.successBody, { color: colors.textSecondary }]}>
            <Text style={{ fontWeight: Typography.bold }}>{name}</Text> has been added.{'\n'}
            An invitation email would be sent to{'\n'}
            <Text style={{ color: colors.primary }}>{email}</Text>.
          </Text>
          <Text style={[styles.tempPwd, { color: colors.textMuted, backgroundColor: colors.surfaceContainer }]}>
            Temp password: <Text style={{ fontWeight: Typography.bold, color: colors.text }}>Welcome1!</Text>
          </Text>
          <Pressable
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <View style={[styles.backCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Ionicons name="close" size={20} color={colors.text} />
            </View>
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Create User</Text>
          <View style={[styles.adminTag, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="shield-checkmark-outline" size={12} color={colors.primary} />
            <Text style={[styles.adminTagText, { color: colors.primary }]}>Admin only</Text>
          </View>
        </View>

        <Animated.View style={{ opacity, transform: [{ translateY: slideY }], gap: Spacing.xl }}>
          {/* Form card */}
          <View style={[styles.card, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}>
            {/* Name */}
            <FormField
              label="Full Name"
              icon="person-outline"
              value={name}
              onChangeText={(t) => { setName(t); setNameErr(''); }}
              placeholder="e.g. John Smith"
              error={nameErr}
            />

            {/* Email */}
            <FormField
              label="Email Address"
              icon="mail-outline"
              value={email}
              onChangeText={(t) => { setEmail(t); setEmailErr(''); }}
              placeholder="john@company.com"
              keyboardType="email-address"
              error={emailErr}
            />
          </View>

          {/* Role selector */}
          <View style={styles.roleSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Assign Role</Text>
            <View style={styles.roleGrid}>
              {ROLES.map((r) => {
                const isSelected = role === r.key;
                return (
                  <Pressable
                    key={r.key}
                    style={[
                      styles.roleCard,
                      {
                        backgroundColor: isSelected ? r.color + '14' : colors.card,
                        borderColor: isSelected ? r.color : colors.border,
                        ...Shadow.sm,
                        shadowColor: colors.shadowColor,
                      },
                    ]}
                    onPress={() => setRole(r.key)}
                  >
                    <View style={[styles.roleCheck, { borderColor: isSelected ? r.color : colors.border, backgroundColor: isSelected ? r.color : 'transparent' }]}>
                      {isSelected && <Ionicons name="checkmark" size={12} color="#FFF" />}
                    </View>
                    <Text style={[styles.roleLabel, { color: isSelected ? r.color : colors.text }]}>
                      {r.label}
                    </Text>
                    <Text style={[styles.roleDesc, { color: colors.textMuted }]} numberOfLines={2}>
                      {r.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Info */}
          <View style={[styles.infoBox, { backgroundColor: colors.infoLight }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.info} />
            <Text style={[styles.infoText, { color: colors.info }]}>
              An invitation email will be sent so the user can set their own password.
            </Text>
          </View>

          {/* Submit */}
          <Pressable
            style={[styles.createBtn, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleCreate}
            disabled={loading}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createGradient}
            >
              <Ionicons name={loading ? 'hourglass-outline' : 'person-add-outline'} size={18} color="#FFF" />
              <Text style={styles.createBtnText}>{loading ? 'Creating…' : 'Create & Send Invite'}</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── FormField helper ─────────────────────────────────────────────────────────

function FormField({
  label, icon, value, onChangeText, placeholder, keyboardType, error,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address';
  error?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.inputRow, { backgroundColor: colors.surfaceContainer, borderColor: error ? colors.danger : colors.border }]}>
        <Ionicons name={icon} size={17} color={colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text }]}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          autoCorrect={false}
        />
      </View>
      {!!error && <Text style={[styles.fieldError, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { padding: Spacing.base, gap: Spacing.xl, paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.lg },

  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  backCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: Typography.xl, fontWeight: Typography.black },
  adminTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  adminTagText: { fontSize: Typography.xs, fontWeight: Typography.bold },

  card: { borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.lg },

  field: { gap: 6 },
  fieldLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    paddingVertical: 13, borderWidth: 1,
  },
  input: { flex: 1, fontSize: Typography.base, paddingVertical: 0 },
  fieldError: { fontSize: Typography.xs },

  sectionLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, marginBottom: Spacing.sm },
  roleSection: { gap: 0 },
  roleGrid: { gap: Spacing.sm },
  roleCard: {
    borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1.5, gap: 6,
  },
  roleCheck: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  roleLabel: { fontSize: Typography.base, fontWeight: Typography.bold },
  roleDesc: { fontSize: Typography.xs, lineHeight: 16 },

  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: Spacing.md, borderRadius: Radius.md },
  infoText: { flex: 1, fontSize: Typography.xs, lineHeight: 16 },

  createBtn: { borderRadius: Radius.md, overflow: 'hidden' },
  createGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  createBtnText: { color: '#FFFFFF', fontSize: Typography.base, fontWeight: Typography.bold },

  // Success state
  successCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: Typography.xl, fontWeight: Typography.black },
  successBody: { textAlign: 'center', fontSize: Typography.sm, lineHeight: 22 },
  tempPwd: { borderRadius: Radius.md, padding: Spacing.md, fontSize: Typography.sm },
  doneBtn: { borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: 12 },
  doneBtnText: { color: '#FFFFFF', fontSize: Typography.base, fontWeight: Typography.bold },

  // Access denied
  errorTitle: { fontSize: Typography.xl, fontWeight: Typography.black },
  errorSub: { fontSize: Typography.sm, textAlign: 'center' },
  backLink: { marginTop: Spacing.sm },
  backLinkText: { fontSize: Typography.base, fontWeight: Typography.semibold },
});
