import { Platform } from 'react-native';
import { appStorage } from './storage';

const API_BASE_URL_KEY = 'pm_api_base_url';

// Change this to your PC's local IP
const LOCAL_URL = 'http://192.168.1.15:8000';

export async function getApiBaseUrl(): Promise<string> {
  const manualUrl = await appStorage.getItem(API_BASE_URL_KEY);
  if (manualUrl) {
    // Strip everything after the host:port — no /api, no trailing slash
    return manualUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }

  return LOCAL_URL;
}

export async function getHealthCheckUrl(): Promise<string> {
  const base = await getApiBaseUrl();
  return `${base}/up`;   // ← single slash, always clean
}

export async function setManualApiBaseUrl(url: string): Promise<string> {
  if (!url) {
    await appStorage.removeItem(API_BASE_URL_KEY);
    return getApiBaseUrl();
  }
  // Store clean base: "http://192.168.1.120:8000"
  const cleanUrl = url.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  await appStorage.setItem(API_BASE_URL_KEY, cleanUrl);
  return cleanUrl;
}

export async function clearManualApiBaseUrl(): Promise<void> {
  await appStorage.removeItem(API_BASE_URL_KEY);
}

export function getCachedApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') ?? LOCAL_URL;
}