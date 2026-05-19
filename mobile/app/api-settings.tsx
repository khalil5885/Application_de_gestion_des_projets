import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Button } from '../components/ui/Button';
import { Spacing, Typography, Radius } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import {
  clearManualApiBaseUrl,
  getApiBaseUrl,
  getHealthCheckUrl,
  setManualApiBaseUrl,
} from '../services/apiConfig';
import axios from 'axios';

export default function ApiSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getApiBaseUrl().then(setUrl);
  }, []);

  const saveAndTest = async () => {
    setSaving(true);
    setStatus('');

    try {
      const savedUrl = await setManualApiBaseUrl(url);
      const healthUrl = await getHealthCheckUrl();

      console.log('Testing health URL:', healthUrl);
      await axios.get(healthUrl, { timeout: 3000 });

      setUrl(savedUrl);
      setStatus(`Connected to ${savedUrl}`);
    } catch (e: any) {
      console.error('Health check failed:', e.message, e.code);
      if (e.code === 'ECONNABORTED') {
        setStatus('Connection timeout. Check that Laravel is running.');
      } else if (e.code === 'ECONNREFUSED') {
        setStatus('Connection refused. Is the server running on this IP?');
      } else {
        setStatus(`Backend unreachable. Error: ${e.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const resetDefault = async () => {
    await clearManualApiBaseUrl();
    const defaultUrl = await getApiBaseUrl();
    setUrl(defaultUrl);
    setStatus(`Reset to ${defaultUrl}`);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <View style={[styles.iconButton, { backgroundColor: colors.surfaceContainer }]}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </View>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>API Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Backend URL</Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://192.168.1.120:8000"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />
        </View>

        {!!status && (
          <View style={[styles.status, { backgroundColor: colors.surfaceContainer }]}>
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>{status}</Text>
          </View>
        )}

        <Button label={saving ? 'Testing...' : 'Save and Test'} onPress={saveAndTest} disabled={saving} />
        <Pressable onPress={resetDefault} style={styles.resetButton}>
          <Text style={[styles.resetText, { color: colors.textMuted }]}>Reset to platform default</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: Typography.xl, fontWeight: Typography.black },
  content: { padding: Spacing.base, gap: Spacing.lg },
  field: { gap: 8 },
  label: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: Typography.base,
  },
  status: { borderRadius: Radius.md, padding: Spacing.md },
  statusText: { fontSize: Typography.sm, lineHeight: 20 },
  resetButton: { alignItems: 'center', paddingVertical: Spacing.sm },
  resetText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
});
