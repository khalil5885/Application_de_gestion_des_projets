import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ─────────────────────────────────────────────────────────────
// Change this to your PC's local IP if testing on a real device:
//   e.g.  'http://192.168.1.42'
// On an emulator you can use 'http://10.0.2.2' (Android) or
// 'http://localhost' (iOS simulator).
// ─────────────────────────────────────────────────────────────
export const BASE_URL = 'http://project_manager.test'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Attach Bearer token from AsyncStorage on every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

export default api
