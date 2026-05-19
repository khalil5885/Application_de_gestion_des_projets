import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const storage = {
  get: async (key: string): Promise<string | null> => {
    try {
      if (isWeb) {
        return window.localStorage?.getItem(key) ?? null;
      }
      try {
        const value = await SecureStore.getItemAsync(key);
        if (value !== null) return value;
      } catch (e) {
        // Fallback to AsyncStorage if SecureStore fails
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set: async (key: string, value: string): Promise<void> => {
    try {
      if (isWeb) {
        window.localStorage?.setItem(key, value);
        return;
      }
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (e) {
        // Fallback to AsyncStorage
        await AsyncStorage.setItem(key, value);
      }
    } catch {
      // Ignored
    }
  },

  remove: async (key: string): Promise<void> => {
    try {
      if (isWeb) {
        window.localStorage?.removeItem(key);
        return;
      }
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (e) {
        // Fallback
      }
      await AsyncStorage.removeItem(key);
    } catch {
      // Ignored
    }
  },

  clearAuth: async (): Promise<void> => {
    await storage.remove('pm_auth_token');
  },

  // Legacy aliases for backward compatibility
  getItem: async (key: string) => storage.get(key),
  setItem: async (key: string, value: string) => storage.set(key, value),
  removeItem: async (key: string) => storage.remove(key),
};

// Export appStorage as alias to not break existing imports
export const appStorage = storage;
