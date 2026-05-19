/**
 * Login Screen
 *
 * Entry point for authentication.
 * Only way to access the app — no public routes.
 *
 * Mock credentials (shown on screen for PFE demo):
 *   admin@company.com  / admin123  → Admin role
 *   jordan@company.com / emp123    → Employee role
 *   client@company.com / client123 → Client role
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/useAppStore';
import { Typography, Spacing, Radius, Shadow } from '../constants/theme';

// Quick-fill credentials for demo
const DEMO_CREDS = [
  { label: 'Admin',    email: 'admin@company.com',  password: 'admin123',  color: '#6366F1' },
  { label: 'Employee', email: 'jordan@company.com', password: 'emp123',    color: '#34D399' },
  { label: 'Client',   email: 'client@company.com', password: 'client123', color: '#A78BFA' },
];

function dashboardRouteForRole(role?: string) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'client') return '/client/dashboard';
  return '/employee/dashboard';
}

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const login = useAppStore((s) => s.login);

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Entrance animations
  const logoY   = useRef(new Animated.Value(-40)).current;
  const formY   = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(logoY,   { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 160 }),
      Animated.spring(formY,   { toValue: 0, delay: 120, useNativeDriver: true, damping: 18, stiffness: 160 }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const ok = await login(email.trim(), password);
      if (ok) {
        router.replace(dashboardRouteForRole(useAppStore.getState().currentUser?.global_role) as never);
      } else {
        setError(useAppStore.getState().errors['auth.login'] || 'Invalid email or password, or the Laravel API is unreachable.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect to the Laravel API.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (cred: (typeof DEMO_CREDS)[number]) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError('');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.heroGradientTop, colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo / Brand ── */}
          <Animated.View style={[styles.brand, { opacity, transform: [{ translateY: logoY }] }]}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="briefcase" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>ProjectManager</Text>
            <Text style={[styles.tagline, { color: colors.textMuted }]}>
              Sign in to your workspace
            </Text>
          </Animated.View>

          {/* ── Form ── */}
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: colors.card, ...Shadow.md, shadowColor: colors.shadowColor },
              { opacity, transform: [{ translateY: formY }] },
            ]}
          >
            {/* Email */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
                <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                <TextInput
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
                  placeholder="you@company.com"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.text }]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                <TextInput
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(''); }}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.text }]}
                  secureTextEntry={!showPwd}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <Pressable onPress={() => setShowPwd((v) => !v)} hitSlop={8}>
                  <Ionicons
                    name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            {/* Error message */}
            {error.length > 0 && (
              <View style={[styles.errorPanel, { backgroundColor: colors.dangerLight }]}>
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
                <View style={styles.errorActions}>
                  <Pressable onPress={handleLogin} disabled={loading} style={[styles.retryBtn, { borderColor: colors.danger }]}>
                    <Ionicons name="refresh" size={14} color={colors.danger} />
                    <Text style={[styles.retryText, { color: colors.danger }]}>Retry</Text>
                  </Pressable>
                  <Pressable onPress={() => router.push('/api-settings' as never)} style={styles.settingsBtn}>
                    <Ionicons name="settings-outline" size={14} color={colors.danger} />
                    <Text style={[styles.retryText, { color: colors.danger }]}>API Settings</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Sign In button */}
            <Pressable
              style={[
                styles.signInBtn,
                { opacity: loading ? 0.7 : 1 },
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signInGradient}
              >
                {loading ? (
                  <Text style={styles.signInText}>Signing in…</Text>
                ) : (
                  <>
                    <Text style={styles.signInText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ── Demo Credentials ── */}
          <Animated.View style={[styles.demoSection, { opacity }]}>
            <Text style={[styles.demoTitle, { color: colors.textMuted }]}>
              — Demo accounts —
            </Text>
            <View style={styles.demoRow}>
              {DEMO_CREDS.map((cred) => (
                <Pressable
                  key={cred.label}
                  style={[styles.demoBtn, { backgroundColor: cred.color + '18', borderColor: cred.color + '40' }]}
                  onPress={() => fillDemo(cred)}
                >
                  <Text style={[styles.demoBtnLabel, { color: cred.color }]}>{cred.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.demoHint, { color: colors.textMuted }]}>
              Tap to auto-fill credentials
            </Text>
          </Animated.View>

          {/* Admin-only note */}
          <View style={[styles.adminNote, { backgroundColor: colors.infoLight }]}>
            <Ionicons name="information-circle-outline" size={14} color={colors.info} />
            <Text style={[styles.adminNoteText, { color: colors.info }]}>
              New accounts are created by an Admin. Check your email for an invitation link.
            </Text>
          </View>

          {/* Invitation flow link — mirrors Laravel setup-password route */}
          <Pressable onPress={() => router.push('/setup-password')} hitSlop={8}>
            <Text style={[styles.setupLink, { color: colors.textMuted }]}>
              Received an invitation? → Set up your password
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push('/api-settings' as never)} hitSlop={8}>
            <Text style={[styles.setupLink, { color: colors.textMuted }]}>
              API connection settings
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.base, gap: Spacing.xl, paddingBottom: 48 },

  brand: { alignItems: 'center', gap: Spacing.sm },
  logoCircle: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  appName: { fontSize: Typography['2xl'], fontWeight: Typography.black },
  tagline: { fontSize: Typography.sm },

  card: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },

  field: { gap: 6 },
  label: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: Typography.base, paddingVertical: 0 },

  errorPanel: {
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: { flex: 1, fontSize: Typography.sm },
  errorActions: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  retryText: { fontSize: Typography.xs, fontWeight: Typography.bold },

  signInBtn: { borderRadius: Radius.md, overflow: 'hidden' },
  signInGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
  },
  signInText: { color: '#FFFFFF', fontSize: Typography.base, fontWeight: Typography.bold },

  demoSection: { alignItems: 'center', gap: Spacing.sm },
  demoTitle: { fontSize: Typography.xs },
  demoRow: { flexDirection: 'row', gap: Spacing.sm },
  demoBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  demoBtnLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  demoHint: { fontSize: Typography.xs },

  adminNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  adminNoteText: { flex: 1, fontSize: Typography.xs },
  setupLink: { textAlign: 'center', fontSize: Typography.xs },
});
