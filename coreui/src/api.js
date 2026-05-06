import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://application_de_gestion_des_projets.test').trim(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Safe storage wrapper with fallback
const storage = {
  get: (key) => {
    try {
      return localStorage.getItem(key)
    } catch (e) {
      console.warn('localStorage.getItem failed:', e.message)
      return null
    }
  },
  set: (key, val) => {
    try {
      localStorage.setItem(key, val)
      return true
    } catch (e) {
      console.error('localStorage.setItem failed:', e.message)
      // Fallback: try sessionStorage
      try {
        sessionStorage.setItem(key, val)
        console.warn('Fell back to sessionStorage')
        return true
      } catch (e2) {
        console.error('sessionStorage also failed:', e2.message)
        return false
      }
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      console.warn('localStorage.removeItem failed:', e.message)
    }
    try {
      sessionStorage.removeItem(key)
    } catch (e) {
      // ignore
    }
  },
  clearAuth: () => {
    storage.remove('token')
    storage.remove('user')
  }
}

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = storage.get('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.config) {
      return Promise.reject(error)
    }

    const isLoginRequest = error.config.url?.includes('/login')

    if (error.response?.status === 401 && !isLoginRequest) {
      storage.clearAuth()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api