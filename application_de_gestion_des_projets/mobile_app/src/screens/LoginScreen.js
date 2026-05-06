import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { colors, spacing, radius, font } from '../theme'

export default function LoginScreen() {
  const { login, error, clearError, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')

  const validate = () => {
    if (!email.trim()) return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email.'
    if (!password) return 'Password is required.'
    return null
  }

  const handleLogin = async () => {
    clearError()
    setLocalError('')
    const validErr = validate()
    if (validErr) { setLocalError(validErr); return }
    try {
      await login(email.trim(), password)
    } catch {
      // error shown via AuthContext
    }
  }

  const displayError = localError || error

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo / brand */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="briefcase" size={32} color={colors.primary} />
          </View>
          <Text style={styles.appName}>WebMedia</Text>
          <Text style={styles.tagline}>Project Management Platform</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

          {/* Error */}
          {!!displayError && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          )}

          {/* Email */}
          <Text style={styles.label}>Email address</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="admin@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          {/* Password */}
          <Text style={[styles.label, { marginTop: spacing.md }]}>Password</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={18} color={colors.white} />
                <Text style={styles.btnText}>Sign In</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>WebMedia © 2026</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoBox: {
    width: 64, height: 64, borderRadius: radius.md,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  appName: { ...font.bold, fontSize: 26, color: colors.textPrimary, letterSpacing: 0.5 },
  tagline: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.lg,
  },
  cardTitle: { ...font.bold, fontSize: 20, color: colors.textPrimary },
  cardSubtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 4, marginBottom: spacing.lg },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2d1215', borderRadius: radius.sm,
    padding: spacing.sm, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.danger,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  label: { color: colors.textSecondary, fontSize: 13, ...font.medium, marginBottom: spacing.xs },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm,
  },
  inputIcon: { marginRight: spacing.xs },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15, paddingVertical: 12 },
  eyeBtn: { padding: 6 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingVertical: 14, marginTop: spacing.lg,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { ...font.semibold, color: colors.white, fontSize: 15 },
  footer: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: spacing.xl },
})
