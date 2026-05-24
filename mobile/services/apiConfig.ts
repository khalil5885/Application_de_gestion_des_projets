import { Platform } from 'react-native';
import { appStorage } from './storage';

const NGROK_URL = 'https://gift-crisping-eagle.ngrok-free.dev';
const LOCAL_URL = 'http://192.168.1.120'; // your laptop's local IP

export async function getApiBaseUrl(): Promise<string> {
  const manualUrl = await appStorage.getItem(API_BASE_URL_KEY);
  if (manualUrl) {
    let url = manualUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    return url + '/api/';
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    let url = process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
    if (!url.endsWith('/api')) url += '/api';
    return url + '/';
  }

  return `${NGROK_URL}/api/`;
}

export async function getHealthCheckUrl(): Promise<string> {
  const base = await getApiBaseUrl();
  return base.replace(/\/api\/?$/, '') + '/up';
}

export async function setManualApiBaseUrl(url: string) {
  if (!url) {
    await appStorage.removeItem(API_BASE_URL_KEY);
    return getApiBaseUrl();
  }
  const cleanUrl = url.replace(/\/+$/, '').replace(/\/api$/, '');
  await appStorage.setItem(API_BASE_URL_KEY, cleanUrl);
  return cleanUrl;
}

export async function clearManualApiBaseUrl() {
  await appStorage.removeItem(API_BASE_URL_KEY);
}

export function getCachedApiBaseUrl() {
  return process.env.EXPO_PUBLIC_API_URL || NGROK_URL;
}