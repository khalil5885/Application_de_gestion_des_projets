import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

// In-memory fallback for when native modules aren't available
const memoryStore = new Map<string, string>();

async function asyncStorageGet(key: string): Promise<string | null> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (!AsyncStorage) throw new Error('null module');
    return await AsyncStorage.getItem(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

async function asyncStorageSet(key: string, value: string): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (!AsyncStorage) throw new Error('null module');
    await AsyncStorage.setItem(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

async function asyncStorageRemove(key: string): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (!AsyncStorage) throw new Error('null module');
    await AsyncStorage.removeItem(key);
  } catch {
    memoryStore.delete(key);
  }
}

export const storage = {
  get: async (key: string): Promise<string | null> => {
    try {
      if (isWeb) {
        if (typeof window === 'undefined') return memoryStore.get(key) ?? null;
        return window.localStorage?.getItem(key) ?? null;
      }
      try {
        const value = await SecureStore.getItemAsync(key);
        if (value !== null) return value;
      } catch {
        // SecureStore unavailable, fall through
      }
      return await asyncStorageGet(key);
    } catch (e) {
      console.error(`storage.get("${key}") ERROR:`, e);
      return memoryStore.get(key) ?? null;
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
        return;
      } catch {
        // SecureStore unavailable, fall through
      }
      await asyncStorageSet(key, value);
    } catch (e) {
      console.error(`storage.set("${key}") ERROR:`, e);
      memoryStore.set(key, value);
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
      } catch {
        // ignore
      }
      await asyncStorageRemove(key);
    } catch (e) {
      console.error(`storage.remove("${key}") ERROR:`, e);
      memoryStore.delete(key);
    }
  },

  clearAuth: async (): Promise<void> => {
    await storage.remove('pm_auth_token');
  },

  getItem: async (key: string) => storage.get(key),
  setItem: async (key: string, value: string) => storage.set(key, value),
  removeItem: async (key: string) => storage.remove(key),
};

export const appStorage = storage;