import { Platform } from 'react-native';
import { storage } from './storage';

const DEVICE_IP = '192.168.1.120';
const API_BASE_URL_KEY = 'pm_api_base_url';

export async function getApiBaseUrl(): Promise<string> {
  const manualUrl = await storage.get(API_BASE_URL_KEY);
  if (manualUrl) {
    let url = manualUrl.replace(/\/+$/, '');
    if (!url.endsWith('/api')) url += '/api';
    return url + '/';  // <-- ADD TRAILING SLASH
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    let url = process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
    if (!url.endsWith('/api')) url += '/api';
    return url + '/';
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/';
  }

  if (Platform.OS === 'ios') {
    return 'http://localhost:8000/api/';
  }

  return `http://${DEVICE_IP}:8000/api/`;
}

export async function getHealthCheckUrl(): Promise<string> {
  const base = await getApiBaseUrl();
  return base.replace(/\/api\/?$/, '') + '/up';
}

export async function setManualApiBaseUrl(url: string) {
  if (!url) {
    await storage.remove(API_BASE_URL_KEY);
    return getApiBaseUrl();
  }
  const cleanUrl = url.replace(/\/+$/, '').replace(/\/api$/, '');
  await storage.set(API_BASE_URL_KEY, cleanUrl);
  return cleanUrl;
}

export async function clearManualApiBaseUrl() {
  await storage.remove(API_BASE_URL_KEY);
}

export function getCachedApiBaseUrl() {
  return process.env.EXPO_PUBLIC_API_URL || `http://${DEVICE_IP}:8000`;
}