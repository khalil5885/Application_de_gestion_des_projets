import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from './apiConfig';
import { appStorage } from './storage';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = {
  dedupe?: boolean;
  retry?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export const ENDPOINTS = {
  LOGIN: '/login',
  LOGOUT: '/logout',
  USER: '/user',
  SETUP_PASSWORD_VERIFY: '/setup-password/verify',
  SETUP_PASSWORD: '/setup-password',
  NOTIFICATIONS: '/notifications',
  NOTIFICATIONS_UNREAD_COUNT: '/notifications/unread-count',
  NOTIFICATIONS_READ_ALL: '/notifications/read-all',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_DASHBOARD_ACTIVITY: '/admin/dashboard/activity',
  ADMIN_ACTIVITY_LOGS: '/admin/activity-logs',
  ADMIN_WORKLOAD: '/admin/workload',
  ADMIN_REQUESTS: '/admin/requests',
  ADMIN_USERS: '/admin/users',
  ADMIN_PROJECTS: '/admin/projects',
  ADMIN_TASKS: '/admin/tasks',
  ADMIN_TASKS_OVERVIEW: '/admin/tasks-overview',
  ADMIN_PROJECT_TYPES: '/admin/project-types',
  ADMIN_TASK_TEMPLATES: '/admin/task-templates',
  EMPLOYEE_DASHBOARD: '/employee/dashboard',
  EMPLOYEE_WORKSPACE_CALENDAR: '/employee/workspace/calendar',
  EMPLOYEE_WORKSPACE_ACTIVITY: '/employee/workspace/activity',
  EMPLOYEE_WORKSPACE_PRODUCTIVITY: '/employee/workspace/productivity',
  EMPLOYEE_PROJECTS: '/employee/projects',
  EMPLOYEE_REQUESTS: '/employee/requests',
  EMPLOYEE_TASKS: '/employee/tasks',
  CLIENT_ACTIVITY: '/client/activity',
  CLIENT_PROJECTS: '/client/projects',
  CLIENT_DASHBOARD: '/client/dashboard',
} as const;

export const api = axios.create({
  timeout: 10000,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

let _token: string | null = null;

export function setAuthToken(token: string | null) {
  _token = token;
}

// Use _token first, then fall back to storage - SAME storage instance as store
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // CRITICAL FIX: Ensure headers object exists and is mutable
  if (!config.headers) {
    config.headers = new axios.AxiosHeaders();
  }
  
  // Try memory first, then persistent storage using SAME key as store.ts
  const token = _token || await appStorage.getItem('pm_auth_token');
  
  if (token) {
    // CRITICAL FIX: Use set method for proper header normalization
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  
  return config;
});

let _unauthorizedHandler: (() => void) | null = null;
let _serverErrorHandler: ((error: ApiError) => void) | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/login')) {
      // Clear everything
      await appStorage.removeItem('pm_auth_token');
      _token = null;
      
      if (_unauthorizedHandler) {
        _unauthorizedHandler();
      } else {
        // Fallback if no handler registered
        console.warn('Unauthorized - no handler registered');
      }
    }
    
    // Server errors (5xx)
    if (error.response && error.response.status >= 500 && _serverErrorHandler) {
      const apiError = new ApiError(
        'Server error',
        error.response.status,
        error.response.data
      );
      _serverErrorHandler(apiError);
    }
    
    return Promise.reject(error);
  }
);

function unwrapResponse<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const data = (payload as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'data' in data) {
      return (data as { data?: unknown }).data as T;
    }
    return data as T;
  }
  return payload as T;
}

export async function apiCall<T>(
  method: HttpMethod,
  path: string,
  body?: object,
  options: RequestOptions = {}
): Promise<T> {
  try {
    const baseUrl = await getApiBaseUrl();
    const fullUrl = baseUrl.replace(/\/+$/, '') + path;

    const response = await api.request({
      method,
      url: fullUrl,
      data: body,
      signal: options.signal,
      ...(options.timeoutMs ? { timeout: options.timeoutMs } : {}),
    });

    return unwrapResponse<T>(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 0;
      const payload = error.response?.data || null;

      let message = 'Network Error';
      if (error.code === 'ECONNABORTED') {
        message = 'Connection timeout. Check network and IP address.';
      } else if (payload && typeof payload === 'object') {
        const data = payload as { message?: string; error?: string };
        message = data.message || data.error || error.message;
      } else {
        message = error.message;
      }

      throw new ApiError(message, status, payload);
    }
    throw error;
  }
}

export function onUnauthorized(handler: () => void) { 
  _unauthorizedHandler = handler;
  return () => { _unauthorizedHandler = null; };
}

export function onServerError(handler: (error: ApiError) => void) { 
  _serverErrorHandler = handler;
  return () => { _serverErrorHandler = null; };
}

export function cancelRequest(key: string) { }

export async function verifyBackendReachable(timeoutMs = 2000) { 
  return getApiBaseUrl(); 
}

export const authApi = {
  login: (email: string, password: string) =>
    apiCall<{ token: string; user?: object }>('POST', ENDPOINTS.LOGIN, { email, password }, { dedupe: false, retry: false }),
  logout: () => apiCall<void>('POST', ENDPOINTS.LOGOUT, undefined, { dedupe: false }),
  me: () => apiCall<object>('GET', ENDPOINTS.USER, undefined, { retry: false }),
  setupPasswordVerify: (token: string) =>
    apiCall<{ user: object; token_valid: boolean }>('POST', ENDPOINTS.SETUP_PASSWORD_VERIFY, { token }),
  setupPassword: (token: string, password: string, passwordConfirmation: string) =>
    apiCall<object>('POST', ENDPOINTS.SETUP_PASSWORD, {
      token,
      password,
      password_confirmation: passwordConfirmation,
    }),
};

export const adminDashboardApi = {
  show: () => apiCall<object>('GET', ENDPOINTS.ADMIN_DASHBOARD),
  activity: () => apiCall<object[]>('GET', ENDPOINTS.ADMIN_DASHBOARD_ACTIVITY),
};

export const adminActivityLogApi = {
  list: () => apiCall<object[]>('GET', ENDPOINTS.ADMIN_ACTIVITY_LOGS),
};

export const adminUserApi = {
  list: () => apiCall<object[]>('GET', ENDPOINTS.ADMIN_USERS),
  create: (data: object) => apiCall<object>('POST', ENDPOINTS.ADMIN_USERS, data, { dedupe: false }),
  show: (id: number) => apiCall<object>('GET', `${ENDPOINTS.ADMIN_USERS}/${id}`),
  update: (id: number, data: object) => apiCall<object>('PUT', `${ENDPOINTS.ADMIN_USERS}/${id}`, data, { dedupe: false }),
  destroy: (id: number) => apiCall<void>('DELETE', `${ENDPOINTS.ADMIN_USERS}/${id}`, undefined, { dedupe: false }),
};

export const adminProjectApi = {
  list: () => apiCall<object[]>('GET', ENDPOINTS.ADMIN_PROJECTS),
  create: (data: object) => apiCall<object>('POST', ENDPOINTS.ADMIN_PROJECTS, data, { dedupe: false }),
  show: (id: number) => apiCall<object>('GET', `${ENDPOINTS.ADMIN_PROJECTS}/${id}`),
  update: (id: number, data: object) => apiCall<object>('PUT', `${ENDPOINTS.ADMIN_PROJECTS}/${id}`, data, { dedupe: false }),
  destroy: (id: number) => apiCall<void>('DELETE', `${ENDPOINTS.ADMIN_PROJECTS}/${id}`, undefined, { dedupe: false }),
  estimate: (id: number) => apiCall<object>('POST', `${ENDPOINTS.ADMIN_PROJECTS}/${id}/estimate`, undefined, { dedupe: false }),
  finalizeReview: (id: number) => apiCall<object>('PATCH', `${ENDPOINTS.ADMIN_PROJECTS}/${id}/finalize-review`, undefined, { dedupe: false }),
  assignEmployee: (projectId: number, userId: number) =>
    apiCall<object>('POST', `${ENDPOINTS.ADMIN_PROJECTS}/${projectId}/assignEmployee`, { user_id: userId }, { dedupe: false }),
  removeMember: (projectId: number, userId: number) =>
    apiCall<void>('DELETE', `${ENDPOINTS.ADMIN_PROJECTS}/${projectId}/members`, { user_id: userId }, { dedupe: false }),
  addComment: (projectId: number, content: string) =>
    apiCall<object>('POST', `${ENDPOINTS.ADMIN_PROJECTS}/${projectId}/comments`, { content }, { dedupe: false }),
};

export const adminTaskApi = {
  list: () => apiCall<object[]>('GET', ENDPOINTS.ADMIN_TASKS),
  createStandalone: (data: object) => apiCall<object>('POST', ENDPOINTS.ADMIN_TASKS, data, { dedupe: false }),
  show: (taskId: number) => apiCall<object>('GET', `${ENDPOINTS.ADMIN_TASKS}/${taskId}`),
  update: (taskId: number, data: object) => apiCall<object>('PUT', `${ENDPOINTS.ADMIN_TASKS}/${taskId}`, data, { dedupe: false }),
  destroy: (taskId: number) => apiCall<void>('DELETE', `${ENDPOINTS.ADMIN_TASKS}/${taskId}`, undefined, { dedupe: false }),
  listByProject: (projectId: number) => apiCall<object[]>('GET', `${ENDPOINTS.ADMIN_PROJECTS}/${projectId}/tasks`),
  create: (projectId: number, data: object) =>
    apiCall<object>('POST', `${ENDPOINTS.ADMIN_PROJECTS}/${projectId}/tasks`, data, { dedupe: false }),
  updateInProject: (projectId: number, taskId: number, data: object) =>
    apiCall<object>('PUT', `${ENDPOINTS.ADMIN_PROJECTS}/${projectId}/tasks/${taskId}`, data, { dedupe: false }),
  finalizeReview: (taskId: number) => apiCall<object>('PATCH', `${ENDPOINTS.ADMIN_TASKS}/${taskId}/finalize-review`, undefined, { dedupe: false }),
  approve: (taskId: number) => apiCall<object>('PATCH', `${ENDPOINTS.ADMIN_TASKS}/${taskId}/approve`, undefined, { dedupe: false }),
  reject: (taskId: number, reason?: string) =>
    apiCall<object>('PATCH', `${ENDPOINTS.ADMIN_TASKS}/${taskId}/reject`, reason ? { reason } : {}, { dedupe: false }),
  overview: () => apiCall<object[]>('GET', ENDPOINTS.ADMIN_TASKS_OVERVIEW),
  assignEmployee: (taskId: number, userId: number) =>
    apiCall<object>('PATCH', `${ENDPOINTS.ADMIN_TASKS}/${taskId}/assignEmployee`, { user_id: userId }, { dedupe: false }),
  unassignEmployee: (taskId: number) =>
    apiCall<object>('PATCH', `${ENDPOINTS.ADMIN_TASKS}/${taskId}/unassignEmployee`, undefined, { dedupe: false }),
  addComment: (taskId: number, content: string) =>
    apiCall<object>('POST', `${ENDPOINTS.ADMIN_TASKS}/${taskId}/comments`, { content }, { dedupe: false }),
};

export const adminProjectTypeApi = {
  list: () => apiCall<object[]>('GET', ENDPOINTS.ADMIN_PROJECT_TYPES),
  create: (data: object) => apiCall<object>('POST', ENDPOINTS.ADMIN_PROJECT_TYPES, data, { dedupe: false }),
  show: (id: number) => apiCall<object>('GET', `${ENDPOINTS.ADMIN_PROJECT_TYPES}/${id}`),
  update: (id: number, data: object) => apiCall<object>('PUT', `${ENDPOINTS.ADMIN_PROJECT_TYPES}/${id}`, data, { dedupe: false }),
  destroy: (id: number) => apiCall<void>('DELETE', `${ENDPOINTS.ADMIN_PROJECT_TYPES}/${id}`, undefined, { dedupe: false }),
};

export const adminTaskTemplateApi = {
  list: () => apiCall<object[]>('GET', ENDPOINTS.ADMIN_TASK_TEMPLATES),
  all: () => apiCall<object[]>('GET', `${ENDPOINTS.ADMIN_TASK_TEMPLATES}/all`),
  create: (data: object) => apiCall<object>('POST', ENDPOINTS.ADMIN_TASK_TEMPLATES, data, { dedupe: false }),
  show: (id: number) => apiCall<object>('GET', `${ENDPOINTS.ADMIN_TASK_TEMPLATES}/${id}`),
  update: (id: number, data: object) => apiCall<object>('PUT', `${ENDPOINTS.ADMIN_TASK_TEMPLATES}/${id}`, data, { dedupe: false }),
  destroy: (id: number) => apiCall<void>('DELETE', `${ENDPOINTS.ADMIN_TASK_TEMPLATES}/${id}`, undefined, { dedupe: false }),
  listForProjectType: (projectTypeId: number) =>
    apiCall<object[]>('GET', `${ENDPOINTS.ADMIN_PROJECT_TYPES}/${projectTypeId}/task-templates`),
  createForProjectType: (projectTypeId: number, data: object) =>
    apiCall<object>('POST', `${ENDPOINTS.ADMIN_PROJECT_TYPES}/${projectTypeId}/task-templates`, data, { dedupe: false }),
  showForProjectType: (projectTypeId: number, taskTemplateId: number) =>
    apiCall<object>('GET', `${ENDPOINTS.ADMIN_PROJECT_TYPES}/${projectTypeId}/task-templates/${taskTemplateId}`),
  updateForProjectType: (projectTypeId: number, taskTemplateId: number, data: object) =>
    apiCall<object>('PUT', `${ENDPOINTS.ADMIN_PROJECT_TYPES}/${projectTypeId}/task-templates/${taskTemplateId}`, data, { dedupe: false }),
  destroyForProjectType: (projectTypeId: number, taskTemplateId: number) =>
    apiCall<void>('DELETE', `${ENDPOINTS.ADMIN_PROJECT_TYPES}/${projectTypeId}/task-templates/${taskTemplateId}`, undefined, { dedupe: false }),
  unassign: (projectTypeId: number, taskTemplateId: number) =>
    apiCall<object>('PATCH', `${ENDPOINTS.ADMIN_PROJECT_TYPES}/${projectTypeId}/task-templates/${taskTemplateId}/unassign`, undefined, { dedupe: false }),
  reassign: (projectTypeId: number, taskTemplateId: number) =>
    apiCall<object>('PATCH', `${ENDPOINTS.ADMIN_PROJECT_TYPES}/${projectTypeId}/task-templates/${taskTemplateId}/reassign`, undefined, { dedupe: false }),
};

export const commentApi = {
  destroyAsAdmin: (commentId: number) => apiCall<void>('DELETE', `/admin/comments/${commentId}`, undefined, { dedupe: false }),
  destroyAsEmployee: (commentId: number) => apiCall<void>('DELETE', `/employee/comments/${commentId}`, undefined, { dedupe: false }),
};

export const adminRequestApi = {
  list: () => apiCall<object[]>('GET', ENDPOINTS.ADMIN_REQUESTS),
  approve: (id: number) => apiCall<object>('PATCH', `${ENDPOINTS.ADMIN_REQUESTS}/${id}/approve`, undefined, { dedupe: false }),
  reject: (id: number) => apiCall<object>('PATCH', `${ENDPOINTS.ADMIN_REQUESTS}/${id}/reject`, undefined, { dedupe: false }),
};

export const adminWorkloadApi = {
  list: () => apiCall<object>('GET', ENDPOINTS.ADMIN_WORKLOAD),
  show: (userId: number) => apiCall<object>('GET', `${ENDPOINTS.ADMIN_WORKLOAD}/${userId}`),
};

export const employeeApi = {
  dashboard: () => apiCall<object>('GET', ENDPOINTS.EMPLOYEE_DASHBOARD),
  calendar: () => apiCall<object>('GET', ENDPOINTS.EMPLOYEE_WORKSPACE_CALENDAR),
  activity: () => apiCall<object>('GET', ENDPOINTS.EMPLOYEE_WORKSPACE_ACTIVITY),
  productivity: () => apiCall<object>('GET', ENDPOINTS.EMPLOYEE_WORKSPACE_PRODUCTIVITY),
  projects: () => apiCall<object[]>('GET', ENDPOINTS.EMPLOYEE_PROJECTS),
  project: (id: number) => apiCall<object>('GET', `${ENDPOINTS.EMPLOYEE_PROJECTS}/${id}`),
  tasks: () => apiCall<object[]>('GET', ENDPOINTS.EMPLOYEE_TASKS),
  updateTaskStatus: (taskId: number, status: string) =>
    apiCall<object>('PATCH', `${ENDPOINTS.EMPLOYEE_TASKS}/${taskId}/status`, { status }, { dedupe: false }),
  markReady: (taskId: number) =>
    apiCall<object>('PATCH', `${ENDPOINTS.EMPLOYEE_TASKS}/${taskId}/mark-ready`, undefined, { dedupe: false }),
  addTaskComment: (taskId: number, content: string) =>
    apiCall<object>('POST', `${ENDPOINTS.EMPLOYEE_TASKS}/${taskId}/comments`, { content }, { dedupe: false }),
  addProjectComment: (projectId: number, content: string) =>
    apiCall<object>('POST', `${ENDPOINTS.EMPLOYEE_PROJECTS}/${projectId}/comments`, { content }, { dedupe: false }),
  createRequest: (data: object) => apiCall<object>('POST', ENDPOINTS.EMPLOYEE_REQUESTS, data, { dedupe: false }),
  suggestTaskOrder: (taskIds: number[]) =>
    apiCall<object>('POST', `${ENDPOINTS.EMPLOYEE_TASKS}/suggest-order`, { task_ids: taskIds }, { dedupe: false }),
};

export const clientApi = {
  dashboard: () => apiCall<object>('GET', ENDPOINTS.CLIENT_DASHBOARD),
  activity: () => apiCall<object[]>('GET', ENDPOINTS.CLIENT_ACTIVITY),
  projects: () => apiCall<object[]>('GET', ENDPOINTS.CLIENT_PROJECTS),
  project: (id: number) => apiCall<object>('GET', `${ENDPOINTS.CLIENT_PROJECTS}/${id}`),
  addProjectComment: (projectId: number, content: string) =>
    apiCall<object>('POST', `${ENDPOINTS.CLIENT_PROJECTS}/${projectId}/comments`, { content }, { dedupe: false }),
};

export const notificationApi = {
  list: () => apiCall<object[]>('GET', ENDPOINTS.NOTIFICATIONS),
  unreadCount: () => apiCall<object>('GET', ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT),
  markRead: (id: number) => apiCall<object>('PATCH', `${ENDPOINTS.NOTIFICATIONS}/${id}/read`, undefined, { dedupe: false }),
  markAllRead: () => apiCall<object>('PATCH', ENDPOINTS.NOTIFICATIONS_READ_ALL, undefined, { dedupe: false }),
  clearAll: () => apiCall<void>('DELETE', ENDPOINTS.NOTIFICATIONS, undefined, { dedupe: false }),
  destroy: (id: number) => apiCall<void>('DELETE', `${ENDPOINTS.NOTIFICATIONS}/${id}`, undefined, { dedupe: false }),
};