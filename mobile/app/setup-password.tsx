/**
 * Setup Password Screen
 * Mirrors Laravel SetupPasswordController flow:
 *   1. GET ?token=xxx → POST /setup-password/verify → validate token
 *   2. User enters new password → POST /setup-password → password saved
 *   3. User redirected to login
 *
 * In mobile: token arrives via deep link: projectmanager://setup-password?token=xxx
 * For PFE demo: user can enter token manually.
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTheme } from '../hooks/useTheme';
import { Typography, Spacing, Radius, Shadow } from '../constants/theme';

export default function SetupPasswordScreen() {
  const { colors } = useTheme();
  const router     = useRouter();
  // Token comes from deep link: ?token=xxx
  const { token: urlToken } = useLocalSearchParams<{ token?: string }>();

  const [token,    setToken]    = useState(urlToken ?? '');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [step,     setStep]     = useState<'enter' | 'success'>('enter');
  const [error,    setError]    = useState('');

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideY,  { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 180 }),
    ]).start();
  }, []);

  const validate = () => {
    if (!token.trim()) { setError('Please enter the invitation token.'); return false; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return false; }
    if (password !== confirm) { setError('Passwords do not match.'); return false; }
    return true;
  };

  const handleSetup = () => {
    setError('');
    if (!validate()) return;
    setLoading(true);

    /**
     * In production: call authApi.setupPassword(token, password, confirm)
     * For mock: simulate success after short delay
     */
    setTimeout(() => {
      setLoading(false);
      setStep('success');
    }, 800);
  };

  if (step === 'success') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <LinearGradient colors={[colors.heroGradientTop, colors.background]} style={StyleSheet.absoluteFill} />
          <View style={[styles.successCircle, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Password Set!</Text>
          <Text style={[styles.successBody, { color: colors.textSecondary }]}>
            Your account is ready. Sign in with your new password.
          </Text>
          <Pressable
            style={[styles.doneBtn, { overflow: 'hidden', borderRadius: Radius.md }]}
            onPress={() => router.replace('/login')}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.doneBtnGrad}
            >
              <Text style={styles.doneBtnText}>Go to Sign In</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.heroGradientTop, colors.background]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <Animated.View style={[styles.brand, { opacity }]}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="key-outline" size={34} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Set Your Password</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            You were invited to ProjectManager. Create your password to get started.
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.card, ...Shadow.md, shadowColor: colors.shadowColor },
            { opacity, transform: [{ translateY: slideY }] },
          ]}
        >
          {/* Token field (hidden if came from deep link) */}
          {!urlToken && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Invitation Token</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
                <Ionicons name="ticket-outline" size={17} color={colors.textMuted} />
                <TextInput
                  value={token}
                  onChangeText={(t) => { setToken(t); setError(''); }}
                  placeholder="Paste your invitation token"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.text }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          )}

          {/* Password */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>New Password</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={17} color={colors.textMuted} />
              <TextInput
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                placeholder="At least 8 characters"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text }]}
                secureTextEntry={!showPwd}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable onPress={() => setShowPwd((v) => !v)} hitSlop={8}>
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={17} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          {/* Confirm */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Password</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={17} color={colors.textMuted} />
              <TextInput
                value={confirm}
                onChangeText={(t) => { setConfirm(t); setError(''); }}
                placeholder="Repeat your password"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text }]}
                secureTextEntry={!showPwd}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSetup}
              />
            </View>
          </View>

          {/* Error */}
          {!!error && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}

          {/* Submit */}
          <Pressable
            style={[styles.submitBtn, { opacity: loading ? 0.7 : 1, overflow: 'hidden', borderRadius: Radius.md }]}
            onPress={handleSetup}
            disabled={loading}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.submitGrad}
            >
              <Ionicons name={loading ? 'hourglass-outline' : 'checkmark-circle-outline'} size={18} color="#FFF" />
              <Text style={styles.submitText}>{loading ? 'Setting up…' : 'Set Password'}</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => router.replace('/login')} style={{ alignSelf: 'center', marginTop: 4 }}>
            <Text style={[styles.backLink, { color: colors.textMuted }]}>← Back to Sign In</Text>
          </Pressable>
        </Animated.View>

        {/* Info box */}
        <View style={[styles.infoBox, { backgroundColor: colors.infoLight }]}>
          <Ionicons name="information-circle-outline" size={14} color={colors.info} />
          <Text style={[styles.infoText, { color: colors.info }]}>
            Your invitation token was sent by email. It expires in 7 days.
          </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing.base, gap: Spacing.xl, justifyContent: 'center', paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.lg },

  brand: { alignItems: 'center', gap: Spacing.sm },
  logoCircle: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.xl, fontWeight: Typography.black, textAlign: 'center' },
  subtitle: { fontSize: Typography.sm, textAlign: 'center', lineHeight: 20 },

  card: { borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.lg },
  field: { gap: 6 },
  label: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 13, borderWidth: 1,
  },
  input: { flex: 1, fontSize: Typography.base, paddingVertical: 0 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: Spacing.sm, borderRadius: Radius.sm },
  errorText: { flex: 1, fontSize: Typography.sm },
  submitBtn: {},
  submitGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  submitText: { color: '#FFFFFF', fontSize: Typography.base, fontWeight: Typography.bold },
  backLink: { fontSize: Typography.sm },

  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, padding: Spacing.md, borderRadius: Radius.md },
  infoText: { flex: 1, fontSize: Typography.xs, lineHeight: 16 },

  successCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: Typography.xl, fontWeight: Typography.black },
  successBody: { textAlign: 'center', fontSize: Typography.sm, lineHeight: 22 },
  doneBtn: {},
  doneBtnGrad: { paddingHorizontal: Spacing['2xl'], paddingVertical: 13, alignItems: 'center' },
  doneBtnText: { color: '#FFFFFF', fontSize: Typography.base, fontWeight: Typography.bold },
});
