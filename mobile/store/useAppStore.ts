import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

import {
  adminDashboardApi,
  adminProjectApi,
  adminRequestApi,
  adminTaskApi,
  adminUserApi,
  adminWorkloadApi,
  authApi,
  clientApi,
  employeeApi,
  notificationApi,
  onUnauthorized,
  onServerError,
  setAuthToken,
  verifyBackendReachable,
  api,
} from '../services/api';
import { getApiBaseUrl } from '../services/apiConfig';
import { appStorage } from '../services/storage';
import {
  AdminDashboardStats,
  ClientDashboardStats,
  Comment,
  EmployeeDashboardStats,
  EmployeeWorkload,
  Notification,
  Priority,
  Project,
  ProjectStatus,
  Request,
  RequestType,
  Task,
  TaskStatus,
  User,
  UserRole,
} from '../types';

const TOKEN_KEY = 'pm_auth_token';

type FiltersState = {
  projectFilters: Record<string, string>;
  taskFilters: Record<string, string>;
  userFilters: Record<string, string>;
};

type PaginationState = {
  currentPage: number;
  totalPages: number;
  perPage: number;
};

type UiState = {
  sidebarOpen: boolean;
  activeModal: string | null;
  toastQueue: { id: number; type: 'success' | 'error' | 'info'; message: string }[];
};

type DashboardState = {
  admin: { stats?: AdminDashboardStats; recentActivity: object[]; upcomingDeadlines: object[] } | null;
  employee: { stats?: EmployeeDashboardStats; myProjects: object[]; upcomingTasks: object[] } | null;
  client: { stats?: ClientDashboardStats; projects: object[] } | null;
};

interface AppStore {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (enabled: boolean) => void;

  isHydratingAuth: boolean;
  isLoggedIn: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hydrateAuth: () => Promise<void>;
  forceLogout: (message?: string) => Promise<void>;

  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
  setLoading: (key: string, value: boolean) => void;
  setError: (key: string, value: string | null) => void;

  ui: UiState;
  filters: FiltersState;
  pagination: PaginationState;
  realtime: { socketConnection: null; lastEvent: object | null };
  search: { query: string; results: object[]; recentSearches: string[] };
  dashboard: DashboardState;
  updateFilters: (scope: keyof FiltersState, filters: Record<string, string>) => void;
  setSearchQuery: (query: string) => void;
  pushToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: number) => void;

  projects: Project[];
  fetchProjects: () => Promise<void>;
  fetchProject: (id: number) => Promise<Project | null>;
  addProject: (project: Partial<Project> & Record<string, unknown>) => Promise<void>;
  updateProjectStatus: (id: number, status: ProjectStatus) => Promise<void>;
  updateProject: (id: number, data: Partial<Project> & Record<string, unknown>) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;

  tasks: Task[];
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  fetchTasks: () => Promise<void>;
  fetchTask: (id: number) => Promise<Task | null>;
  addTask: (task: Partial<Task> & Record<string, unknown>) => Promise<void>;
  updateTaskStatus: (taskId: number, status: TaskStatus) => Promise<void>;
  markTaskReadyForReview: (taskId: number) => Promise<void>;
  approveTask: (taskId: number) => Promise<void>;
  rejectTask: (taskId: number) => Promise<void>;
  toggleSubtask: (taskId: number, subtaskId: number) => Promise<void>;
  addSubtask: (taskId: number, title: string, dueDate: string, priority: Priority) => Promise<void>;
  addComment: (taskId: number, text: string) => Promise<void>;
  addProjectComment: (projectId: number, text: string) => Promise<void>;

  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  requests: Request[];
  fetchRequests: () => Promise<void>;
  addRequest: (request: Partial<Request> & { type: RequestType; title: string; description?: string; project?: Project }) => Promise<void>;
  approveRequest: (id: number) => Promise<void>;
  rejectRequest: (id: number) => Promise<void>;

  users: User[];
  fetchUsers: () => Promise<void>;
  addUser: (user: Partial<User> & Record<string, unknown>) => Promise<void>;
  updateUser: (id: number, user: Partial<User> & Record<string, unknown>) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;

  workload: EmployeeWorkload[];
  fetchWorkload: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  bootstrapRoleData: () => Promise<void>;
}

const secureStorage: StateStorage = {
  getItem: (name) => appStorage.getItem(name),
  setItem: (name, value) => appStorage.setItem(name, value),
  removeItem: (name) => appStorage.removeItem(name),
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function listFrom(value: unknown, keys: string[] = []): unknown[] {
  if (Array.isArray(value)) return value;
  const obj = asRecord(value);
  for (const key of ['data', 'items', 'users', 'projects', 'tasks', 'requests', 'employees', ...keys]) {
    const next = obj[key];
    if (Array.isArray(next)) return next;
    if (next && typeof next === 'object') {
      const nested = listFrom(next);
      if (nested.length) return nested;
    }
  }
  return [];
}

function objectList(value: unknown, keys: string[] = []): object[] {
  return listFrom(value, keys).filter((item): item is object => Boolean(item) && typeof item === 'object');
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  const next = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function avatarColor(seed: unknown) {
  const text = String(seed || 'user');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash + text.charCodeAt(i) * (i + 1)) % 360;
  return `hsl(${hash}, 68%, 56%)`;
}

function normalizeUser(value: unknown): User {
  const item = asRecord(value);
  const id = numberValue(item.id);
  const name = stringValue(item.name, item.email ? String(item.email) : 'Unknown user');
  const role = stringValue(item.global_role ?? item.role, 'employee') as UserRole;
  return {
    id,
    name,
    email: stringValue(item.email),
    global_role: role || 'employee',
    color: stringValue(item.color, avatarColor(name || id)),
    phone: stringValue(item.phone) || undefined,
    is_active: typeof item.is_active === 'boolean' ? item.is_active : true,
  };
}

function normalizeComment(value: unknown, type?: 'task' | 'project', targetId?: number): Comment {
  const item = asRecord(value);
  return {
    id: numberValue(item.id, Date.now()),
    author: normalizeUser(item.user || item.author),
    text: stringValue(item.content ?? item.text),
    createdAt: stringValue(item.created_at ?? item.createdAt, new Date().toISOString()),
    commentableType: type,
    commentableId: targetId,
  };
}

function normalizeTask(value: unknown): Task {
  const item = asRecord(value);
  const id = numberValue(item.id, Date.now());
  const children = listFrom(item.children ?? item.subtasks).map(normalizeTask);
  return {
    id,
    title: stringValue(item.title ?? item.name, 'Untitled task'),
    description: stringValue(item.description) || undefined,
    status: (stringValue(item.status, 'todo') as TaskStatus) || 'todo',
    priority: (stringValue(item.priority, 'medium') as Priority) || 'medium',
    progress: numberValue(item.progress, item.status === 'done' ? 100 : 0),
    dueDate: stringValue(item.due_date ?? item.dueDate),
    projectId: numberValue(item.project_id ?? item.projectId ?? asRecord(item.project).id),
    parentId: item.parent_id == null ? null : numberValue(item.parent_id ?? item.parentId),
    assignee: item.assignee || item.assigned_employee ? normalizeUser(item.assignee || item.assigned_employee) : undefined,
    subtasks: children,
    comments: listFrom(item.comments).map((comment) => normalizeComment(comment, 'task', id)),
  };
}

function taskCounts(tasks: Task[]) {
  const flat = flattenTasks(tasks);
  return {
    total: flat.length,
    done: flat.filter((task) => task.status === 'done').length,
    inProgress: flat.filter((task) => task.status === 'in_progress').length,
    todo: flat.filter((task) => task.status === 'todo').length,
    readyForReview: flat.filter((task) => task.status === 'ready_for_review').length,
    onHold: flat.filter((task) => task.status === 'on_hold').length,
  };
}

function normalizeProject(value: unknown): Project {
  const item = asRecord(value);
  const id = numberValue(item.id, Date.now());
  const tasks = listFrom(item.tasks ?? item.root_tasks).map(normalizeTask);
  const client = item.client ? normalizeUser(item.client) : normalizeUser({ id: item.client_id, name: 'Client', global_role: 'client' });
  return {
    id,
    name: stringValue(item.name ?? item.title, 'Untitled project'),
    description: stringValue(item.description),
    client,
    projectType: item.project_type
      ? { id: numberValue(asRecord(item.project_type).id), name: stringValue(asRecord(item.project_type).name) }
      : undefined,
    status: (stringValue(item.status, 'todo') as ProjectStatus) || 'todo',
    progress: numberValue(item.progress ?? item.progress_percentage),
    startDate: stringValue(item.start_date ?? item.startDate),
    endDate: stringValue(item.end_date ?? item.endDate ?? item.deadline),
    budget: item.budget == null ? undefined : numberValue(item.budget),
    estimatedDays: item.estimated_days == null ? undefined : numberValue(item.estimated_days),
    riskLevel: stringValue(item.risk_level) as Project['riskLevel'],
    aiComment: stringValue(item.ai_comment) || undefined,
    members: listFrom(item.members ?? item.employees).map((member) => normalizeUser(asRecord(member).employee || member)),
    tasks,
    comments: listFrom(item.comments).map((comment) => normalizeComment(comment, 'project', id)),
    taskCount: taskCounts(tasks),
  };
}

function normalizeNotification(value: unknown): Notification {
  const item = asRecord(value);
  const data = asRecord(item.data);
  const type = stringValue(item.type, 'deadline') as Notification['type'];
  const title = stringValue(data.title ?? item.title, type.replaceAll('_', ' '));
  const body = stringValue(data.body ?? data.message ?? item.body ?? item.message, '');
  const projectId = numberValue(data.project_id);
  const taskId = numberValue(data.task_id);

  return {
    id: numberValue(item.id, Date.now()),
    type,
    title,
    body,
    read: Boolean(item.read ?? item.read_at),
    createdAt: stringValue(item.created_at ?? item.createdAt, new Date().toISOString()),
    targetId: taskId || projectId || undefined,
    targetType: taskId ? 'task' : projectId ? 'project' : undefined,
  };
}

function emptyProject(project?: Project): Project {
  return project || {
    id: 0,
    name: 'Unassigned project',
    description: '',
    client: normalizeUser({ id: 0, name: 'Client', global_role: 'client' }),
    status: 'todo',
    progress: 0,
    startDate: '',
    endDate: '',
    members: [],
    tasks: [],
    taskCount: { total: 0, done: 0, inProgress: 0, todo: 0, readyForReview: 0, onHold: 0 },
  };
}

function normalizeRequest(value: unknown, currentUser?: User | null, projects: Project[] = []): Request {
  const item = asRecord(value);
  const payload = asRecord(item.payload);
  const projectId = numberValue(item.project_id ?? item.requestable_id ?? payload.project_id);
  const project = item.project ? normalizeProject(item.project) : emptyProject(projects.find((p) => p.id === projectId));
  const type = stringValue(item.type ?? payload.type, 'deadline_extension') as RequestType;

  return {
    id: numberValue(item.id, Date.now()),
    type,
    title: stringValue(payload.title ?? item.title, type.replaceAll('_', ' ')),
    description: stringValue(payload.description ?? payload.reason ?? item.description),
    status: stringValue(item.status, 'pending') as Request['status'],
    requestedBy: item.user ? normalizeUser(item.user) : currentUser || normalizeUser({ id: item.user_id, name: 'Requester' }),
    project,
    createdAt: stringValue(item.created_at ?? item.createdAt, new Date().toISOString()),
    handledBy: item.handler ? normalizeUser(item.handler) : undefined,
    handledAt: stringValue(item.handled_at) || undefined,
  };
}

function normalizeWorkload(value: unknown): EmployeeWorkload {
  const item = asRecord(value);
  const user = normalizeUser(item.user || item.employee || item);
  return {
    user,
    totalTasks: numberValue(item.totalTasks ?? item.total_tasks ?? item.tasks_count ?? item.active_tasks_count),
    doneTasks: numberValue(item.doneTasks ?? item.done_tasks ?? item.completed_tasks_count ?? item.completed_this_month),
    inProgressTasks: numberValue(item.inProgressTasks ?? item.in_progress_tasks ?? item.active_tasks_count),
    overdueTasks: numberValue(item.overdueTasks ?? item.overdue_tasks_count ?? item.overdue_tasks),
    completionRate: numberValue(item.completionRate ?? item.completion_rate ?? item.average_completion_rate),
    projects: listFrom(item.projects).map((project) => ({
      id: numberValue(asRecord(project).id),
      name: stringValue(asRecord(project).name),
      taskCount: numberValue(asRecord(project).taskCount ?? asRecord(project).tasks_count),
    })),
  };
}

function flattenTasks(tasks: Task[]): Task[] {
  return tasks.flatMap((task) => [task, ...flattenTasks(task.subtasks ?? [])]);
}

function replaceTask(tasks: Task[], taskId: number, updater: (task: Task) => Task): Task[] {
  return tasks.map((task) => {
    if (task.id === taskId) return updater(task);
    return { ...task, subtasks: task.subtasks ? replaceTask(task.subtasks, taskId, updater) : [] };
  });
}

function appendTask(tasks: Task[], parentId: number, child: Task): Task[] {
  return tasks.map((task) => {
    if (task.id === parentId) return { ...task, subtasks: [child, ...(task.subtasks ?? [])] };
    return { ...task, subtasks: task.subtasks ? appendTask(task.subtasks, parentId, child) : [] };
  });
}

function taskPayload(task: Partial<Task> & Record<string, unknown>) {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate ?? task.due_date,
    parent_id: task.parentId ?? task.parent_id,
    assigned_to: task.assignee?.id ?? task.assigned_to,
  };
}

function projectPayload(project: Partial<Project> & Record<string, unknown>) {
  return {
    name: project.name,
    description: project.description,
    status: project.status,
    client_id: project.client?.id ?? project.client_id,
    project_type_id: project.projectType?.id ?? project.project_type_id,
    start_date: project.startDate ?? project.start_date,
    end_date: project.endDate ?? project.end_date,
    budget: project.budget,
  };
}

async function withStoreError<T>(
  set: (partial: Partial<AppStore> | ((state: AppStore) => Partial<AppStore>)) => void,
  get: () => AppStore,
  key: string,
  fn: () => Promise<T>
) {
  get().setLoading(key, true);
  get().setError(key, null);
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong.';
    get().setError(key, message);
    get().pushToast(message, 'error');
    throw error;
  } finally {
    set((state) => ({ loading: { ...state.loading, [key]: false } }));
  }
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      isDarkMode: true,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setTheme: (enabled) => set({ isDarkMode: enabled }),

      isHydratingAuth: true,
      isLoggedIn: false,
      currentUser: null,

      loading: {},
      errors: {},
      setLoading: (key, value) => set((state) => ({ loading: { ...state.loading, [key]: value } })),
      setError: (key, value) => set((state) => ({ errors: { ...state.errors, [key]: value } })),

      ui: { sidebarOpen: false, activeModal: null, toastQueue: [] },
      filters: { projectFilters: {}, taskFilters: {}, userFilters: {} },
      pagination: { currentPage: 1, totalPages: 1, perPage: 20 },
      realtime: { socketConnection: null, lastEvent: null },
      search: { query: '', results: [], recentSearches: [] },
      dashboard: { admin: null, employee: null, client: null },

      projects: [],
      tasks: [],
      selectedTask: null,
      notifications: [],
      requests: [],
      users: [],
      workload: [],

      updateFilters: (scope, filters) =>
        set((state) => ({ filters: { ...state.filters, [scope]: { ...state.filters[scope], ...filters } } })),
      setSearchQuery: (query) =>
        set((state) => ({
          search: {
            ...state.search,
            query,
            recentSearches: query.trim()
              ? [query.trim(), ...state.search.recentSearches.filter((item) => item !== query.trim())].slice(0, 8)
              : state.search.recentSearches,
          },
        })),
      pushToast: (message, type = 'info') =>
        set((state) => ({
          ui: { ...state.ui, toastQueue: [...state.ui.toastQueue, { id: Date.now(), type, message }] },
        })),
      dismissToast: (id) =>
        set((state) => ({ ui: { ...state.ui, toastQueue: state.ui.toastQueue.filter((toast) => toast.id !== id) } })),

      login: async (email, password) => {
        try {
          const user = await withStoreError(set, get, 'auth.login', async () => {
            await verifyBackendReachable();
            const response = await authApi.login(email, password);
            if (!response.token) throw new Error('Login succeeded but no auth token was returned.');

            // Set in memory first
            setAuthToken(response.token);
            console.log('[login] setAuthToken called with:', response.token.substring(0, 20));

            // Write to storage (best effort, don't await before me())
            appStorage.setItem(TOKEN_KEY, response.token).catch(console.error);

            // Small yield to let the event loop settle on native
            await new Promise(resolve => setTimeout(resolve, 50));

            // DEBUG: hit user-debug instead of /api/user
           
            try {
              // Now call me() — _token is already set so interceptor uses it synchronously
              return normalizeUser(await authApi.me());
            } catch (error) {
              // Rollback on failure
              await appStorage.removeItem(TOKEN_KEY);
              setAuthToken(null);
              throw error;
            }
          });

          set({ isLoggedIn: true, currentUser: user });
          await get().bootstrapRoleData();
          return true;
        } catch {
          return false;
        }
      },

      hydrateAuth: async () => {
        if (!get().isHydratingAuth) set({ isHydratingAuth: true });
        try {
          const token = await appStorage.getItem(TOKEN_KEY);
          if (!token) {
            set({ isHydratingAuth: false, isLoggedIn: false, currentUser: null });
            return;
          }

          // CRITICAL FIX: Set token BEFORE authApi.me() so the interceptor can use it
          setAuthToken(token);
          const user = normalizeUser(await authApi.me());
          set({ isLoggedIn: true, currentUser: user, isHydratingAuth: false });
          await get().bootstrapRoleData();
        } catch {
          await appStorage.removeItem(TOKEN_KEY);
          setAuthToken(null);
          set({ isHydratingAuth: false, isLoggedIn: false, currentUser: null });
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Local logout should still complete if the token was already invalid.
        }
        await get().forceLogout();
      },

      forceLogout: async (message) => {
        await appStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
        set({
          isLoggedIn: false,
          currentUser: null,
          projects: [],
          tasks: [],
          requests: [],
          notifications: [],
          users: [],
          workload: [],
          selectedTask: null,
        });
        if (message) get().pushToast(message, 'error');
      },

      fetchDashboard: async () => {
        const role = get().currentUser?.global_role;
        if (!role) return;
        await withStoreError(set, get, 'dashboard', async () => {
          if (role === 'admin') {
            const raw = asRecord(await adminDashboardApi.show());
            set((state) => ({
              dashboard: {
                ...state.dashboard,
                admin: {
                  stats: asRecord(raw.stats) as unknown as AdminDashboardStats,
                  recentActivity: objectList(raw.recent_activity),
                  upcomingDeadlines: objectList(raw.upcoming_deadlines),
                },
              },
            }));
          } else if (role === 'employee') {
            const raw = asRecord(await employeeApi.dashboard());
            set((state) => ({
              dashboard: {
                ...state.dashboard,
                employee: {
                  stats: asRecord(raw.stats) as unknown as EmployeeDashboardStats,
                  myProjects: objectList(raw.my_projects),
                  upcomingTasks: objectList(raw.upcoming_tasks),
                },
              },
            }));
          } else {
            const raw = asRecord(await clientApi.dashboard());
            set((state) => ({
              dashboard: {
                ...state.dashboard,
                client: {
                  stats: asRecord(raw.stats) as unknown as ClientDashboardStats,
                  projects: objectList(raw.projects),
                },
              },
            }));
          }
        });
      },

      bootstrapRoleData: async () => {
        const role = get().currentUser?.global_role;
        if (!role) return;

        await Promise.allSettled([
          get().fetchDashboard(),
          get().fetchNotifications(),
          role === 'admin' ? get().fetchUsers() : Promise.resolve(),
          role === 'admin' ? get().fetchRequests() : Promise.resolve(),
          role === 'admin' ? get().fetchWorkload() : Promise.resolve(),
          get().fetchProjects(),
          get().fetchTasks(),
        ]);
      },

      fetchProjects: async () => {
        await withStoreError(set, get, 'projects', async () => {
          const role = get().currentUser?.global_role;
          const raw =
            role === 'admin' ? await adminProjectApi.list() :
              role === 'employee' ? await employeeApi.projects() :
                await clientApi.projects();
          const projects = listFrom(raw).map(normalizeProject);
          set({ projects });
        });
      },

      fetchProject: async (id) => {
        return withStoreError(set, get, `project.${id}`, async () => {
          const role = get().currentUser?.global_role;
          const raw =
            role === 'admin' ? await adminProjectApi.show(id) :
              role === 'employee' ? await employeeApi.project(id) :
                await clientApi.project(id);
          const project = normalizeProject(raw);
          set((state) => ({ projects: [project, ...state.projects.filter((item) => item.id !== id)] }));
          return project;
        });
      },

      addProject: async (project) => {
        const optimistic = normalizeProject({ ...project, id: Date.now(), tasks: [], members: [] });
        set((state) => ({ projects: [optimistic, ...state.projects] }));
        try {
          const created = normalizeProject(await adminProjectApi.create(projectPayload(project)));
          set((state) => ({ projects: [created, ...state.projects.filter((item) => item.id !== optimistic.id)] }));
        } catch (error) {
          set((state) => ({ projects: state.projects.filter((item) => item.id !== optimistic.id) }));
          get().pushToast(error instanceof Error ? error.message : 'Project creation failed.', 'error');
        }
      },

      updateProjectStatus: async (id, status) => get().updateProject(id, { status }),

      updateProject: async (id, data) => {
        const previous = get().projects;
        set((state) => ({ projects: state.projects.map((project) => project.id === id ? { ...project, ...data } : project) }));
        try {
          const updated = normalizeProject(await adminProjectApi.update(id, projectPayload(data)));
          set((state) => ({ projects: state.projects.map((project) => project.id === id ? updated : project) }));
        } catch (error) {
          set({ projects: previous });
          get().pushToast(error instanceof Error ? error.message : 'Project update failed.', 'error');
        }
      },

      deleteProject: async (id) => {
        const previous = get().projects;
        set((state) => ({ projects: state.projects.filter((project) => project.id !== id) }));
        try {
          await adminProjectApi.destroy(id);
        } catch (error) {
          set({ projects: previous });
          get().pushToast(error instanceof Error ? error.message : 'Project deletion failed.', 'error');
        }
      },

      setSelectedTask: (task) => set({ selectedTask: task }),

      fetchTasks: async () => {
        await withStoreError(set, get, 'tasks', async () => {
          const role = get().currentUser?.global_role;
          if (role === 'client') {
            set({ tasks: flattenTasks(get().projects.flatMap((project) => project.tasks)) });
            return;
          }
          const raw = role === 'admin' ? await adminTaskApi.overview() : await employeeApi.tasks();
          const tasks = listFrom(raw).map(normalizeTask);
          set({ tasks });
        });
      },

      fetchTask: async (id) => {
        const task = flattenTasks(get().tasks).find((item) => item.id === id);
        if (task) return task;
        if (get().currentUser?.global_role !== 'admin') return null;
        return withStoreError(set, get, `task.${id}`, async () => {
          const loaded = normalizeTask(await adminTaskApi.show(id));
          set((state) => ({ tasks: [loaded, ...state.tasks.filter((item) => item.id !== id)] }));
          return loaded;
        });
      },

      addTask: async (task) => {
        const projectId = numberValue(task.projectId ?? task.project_id);
        const optimistic = normalizeTask({ ...task, id: Date.now(), project_id: projectId });
        set((state) => ({ tasks: [optimistic, ...state.tasks] }));
        try {
          const created = normalizeTask(await adminTaskApi.create(projectId, taskPayload(task)));
          set((state) => ({ tasks: [created, ...state.tasks.filter((item) => item.id !== optimistic.id)] }));
        } catch (error) {
          set((state) => ({ tasks: state.tasks.filter((item) => item.id !== optimistic.id) }));
          get().pushToast(error instanceof Error ? error.message : 'Task creation failed.', 'error');
        }
      },

      updateTaskStatus: async (taskId, status) => {
        const previous = get().tasks;
        set((state) => ({ tasks: replaceTask(state.tasks, taskId, (task) => ({ ...task, status })) }));
        try {
          const role = get().currentUser?.global_role;
          if (role === 'admin') await adminTaskApi.update(taskId, { status });
          else await employeeApi.updateTaskStatus(taskId, status);
        } catch (error) {
          set({ tasks: previous });
          get().pushToast(error instanceof Error ? error.message : 'Status update failed.', 'error');
        }
      },

      markTaskReadyForReview: async (taskId) => {
        const previous = get().tasks;
        set((state) => ({ tasks: replaceTask(state.tasks, taskId, (task) => ({ ...task, status: 'ready_for_review' })) }));
        try {
          await employeeApi.markReady(taskId);
        } catch (error) {
          set({ tasks: previous });
          get().pushToast(error instanceof Error ? error.message : 'Could not submit task for review.', 'error');
        }
      },

      approveTask: async (taskId) => {
        const previous = get().tasks;
        set((state) => ({ tasks: replaceTask(state.tasks, taskId, (task) => ({ ...task, status: 'done', progress: 100 })) }));
        try {
          await adminTaskApi.approve(taskId);
        } catch (error) {
          set({ tasks: previous });
          get().pushToast(error instanceof Error ? error.message : 'Approval failed.', 'error');
        }
      },

      rejectTask: async (taskId) => {
        const previous = get().tasks;
        set((state) => ({ tasks: replaceTask(state.tasks, taskId, (task) => ({ ...task, status: 'in_progress' })) }));
        try {
          await adminTaskApi.reject(taskId);
        } catch (error) {
          set({ tasks: previous });
          get().pushToast(error instanceof Error ? error.message : 'Rejection failed.', 'error');
        }
      },

      toggleSubtask: async (taskId, subtaskId) => {
        const previous = get().tasks;
        set((state) => ({
          tasks: replaceTask(state.tasks, subtaskId, (task) => ({
            ...task,
            status: task.status === 'done' ? 'todo' : 'done',
            progress: task.status === 'done' ? 0 : 100,
          })),
        }));
        try {
          await employeeApi.updateTaskStatus(subtaskId, flattenTasks(get().tasks).find((task) => task.id === subtaskId)?.status ?? 'done');
        } catch (error) {
          set({ tasks: previous });
          get().pushToast(error instanceof Error ? error.message : 'Subtask update failed.', 'error');
        }
      },

      addSubtask: async (taskId, title, dueDate, priority) => {
        const parent = flattenTasks(get().tasks).find((task) => task.id === taskId);
        const projectId = parent?.projectId ?? 0;
        const child = normalizeTask({ id: Date.now(), title, due_date: dueDate, priority, status: 'todo', project_id: projectId, parent_id: taskId });
        set((state) => ({ tasks: appendTask(state.tasks, taskId, child) }));
        try {
          const created = normalizeTask(await adminTaskApi.create(projectId, taskPayload({ ...child })));
          set((state) => ({ tasks: replaceTask(state.tasks, child.id, () => created) }));
        } catch (error) {
          set((state) => ({ tasks: replaceTask(state.tasks, taskId, (task) => ({ ...task, subtasks: (task.subtasks ?? []).filter((item) => item.id !== child.id) })) }));
          get().pushToast(error instanceof Error ? error.message : 'Subtask creation failed.', 'error');
        }
      },

      addComment: async (taskId, text) => {
        const currentUser = get().currentUser;
        if (!currentUser || !text.trim()) return;
        const comment: Comment = {
          id: Date.now(),
          author: currentUser,
          text: text.trim(),
          createdAt: new Date().toISOString(),
          commentableType: 'task',
          commentableId: taskId,
        };
        set((state) => ({ tasks: replaceTask(state.tasks, taskId, (task) => ({ ...task, comments: [...(task.comments ?? []), comment] })) }));
        try {
          const role = get().currentUser?.global_role;
          await (role === 'admin' ? adminTaskApi.addComment(taskId, text.trim()) : employeeApi.addTaskComment(taskId, text.trim()));
        } catch (error) {
          set((state) => ({ tasks: replaceTask(state.tasks, taskId, (task) => ({ ...task, comments: (task.comments ?? []).filter((item) => item.id !== comment.id) })) }));
          get().pushToast(error instanceof Error ? error.message : 'Comment failed.', 'error');
        }
      },

      addProjectComment: async (projectId, text) => {
        const currentUser = get().currentUser;
        if (!currentUser || !text.trim()) return;
        const comment: Comment = {
          id: Date.now(),
          author: currentUser,
          text: text.trim(),
          createdAt: new Date().toISOString(),
          commentableType: 'project',
          commentableId: projectId,
        };
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? { ...project, comments: [...(project.comments ?? []), comment] } : project
          ),
        }));
        try {
          const role = get().currentUser?.global_role;
          if (role === 'admin') await adminProjectApi.addComment(projectId, text.trim());
          else if (role === 'employee') await employeeApi.addProjectComment(projectId, text.trim());
          else await clientApi.addProjectComment(projectId, text.trim());
        } catch (error) {
          set((state) => ({
            projects: state.projects.map((project) =>
              project.id === projectId ? { ...project, comments: (project.comments ?? []).filter((item) => item.id !== comment.id) } : project
            ),
          }));
          get().pushToast(error instanceof Error ? error.message : 'Comment failed.', 'error');
        }
      },

      fetchNotifications: async () => {
        await withStoreError(set, get, 'notifications', async () => {
          const notifications = listFrom(await notificationApi.list()).map(normalizeNotification);
          set({ notifications });
        });
      },

      markNotificationRead: async (id) => {
        set((state) => ({ notifications: state.notifications.map((item) => item.id === id ? { ...item, read: true } : item) }));
        try {
          await notificationApi.markRead(id);
        } catch (error) {
          get().pushToast(error instanceof Error ? error.message : 'Could not mark notification as read.', 'error');
        }
      },

      markAllNotificationsRead: async () => {
        const previous = get().notifications;
        set((state) => ({ notifications: state.notifications.map((item) => ({ ...item, read: true })) }));
        try {
          await notificationApi.markAllRead();
        } catch (error) {
          set({ notifications: previous });
          get().pushToast(error instanceof Error ? error.message : 'Could not mark notifications as read.', 'error');
        }
      },

      fetchRequests: async () => {
        if (get().currentUser?.global_role !== 'admin') return;
        await withStoreError(set, get, 'requests', async () => {
          const requests = listFrom(await adminRequestApi.list()).map((item) => normalizeRequest(item, get().currentUser, get().projects));
          set({ requests });
        });
      },

      addRequest: async (request) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        const optimistic = normalizeRequest({ ...request, id: Date.now(), status: 'pending' }, currentUser, get().projects);
        set((state) => ({ requests: [optimistic, ...state.requests] }));
        try {
          const created = normalizeRequest(await employeeApi.createRequest({
            type: request.type === 'deadline_extension' ? 'extension' : request.type,
            requestable_id: request.project?.id,
            requestable_type: 'project',
            payload: {
              title: request.title,
              description: request.description,
              requested_deadline: request.project?.endDate,
            },
          }), currentUser, get().projects);
          set((state) => ({ requests: [created, ...state.requests.filter((item) => item.id !== optimistic.id)] }));
        } catch (error) {
          set((state) => ({ requests: state.requests.filter((item) => item.id !== optimistic.id) }));
          get().pushToast(error instanceof Error ? error.message : 'Request creation failed.', 'error');
        }
      },

      approveRequest: async (id) => {
        const previous = get().requests;
        set((state) => ({ requests: state.requests.map((item) => item.id === id ? { ...item, status: 'approved' } : item) }));
        try {
          await adminRequestApi.approve(id);
        } catch (error) {
          set({ requests: previous });
          get().pushToast(error instanceof Error ? error.message : 'Request approval failed.', 'error');
        }
      },

      rejectRequest: async (id) => {
        const previous = get().requests;
        set((state) => ({ requests: state.requests.map((item) => item.id === id ? { ...item, status: 'rejected' } : item) }));
        try {
          await adminRequestApi.reject(id);
        } catch (error) {
          set({ requests: previous });
          get().pushToast(error instanceof Error ? error.message : 'Request rejection failed.', 'error');
        }
      },

      fetchUsers: async () => {
        await withStoreError(set, get, 'users', async () => {
          set({ users: listFrom(await adminUserApi.list()).map(normalizeUser) });
        });
      },

      addUser: async (user) => {
        const optimistic = normalizeUser({ ...user, id: Date.now() });
        set((state) => ({ users: [optimistic, ...state.users] }));
        try {
          const created = normalizeUser(await adminUserApi.create(user));
          set((state) => ({ users: [created, ...state.users.filter((item) => item.id !== optimistic.id)] }));
        } catch (error) {
          set((state) => ({ users: state.users.filter((item) => item.id !== optimistic.id) }));
          get().pushToast(error instanceof Error ? error.message : 'User creation failed.', 'error');
        }
      },

      updateUser: async (id, user) => {
        const previous = get().users;
        set((state) => ({ users: state.users.map((item) => item.id === id ? { ...item, ...user } as User : item) }));
        try {
          const updated = normalizeUser(await adminUserApi.update(id, user));
          set((state) => ({ users: state.users.map((item) => item.id === id ? updated : item) }));
        } catch (error) {
          set({ users: previous });
          get().pushToast(error instanceof Error ? error.message : 'User update failed.', 'error');
        }
      },

      deleteUser: async (id) => {
        const previous = get().users;
        set((state) => ({ users: state.users.filter((user) => user.id !== id) }));
        try {
          await adminUserApi.destroy(id);
        } catch (error) {
          set({ users: previous });
          get().pushToast(error instanceof Error ? error.message : 'User deletion failed.', 'error');
        }
      },

      fetchWorkload: async () => {
        await withStoreError(set, get, 'workload', async () => {
          const raw = await adminWorkloadApi.list();
          set({ workload: listFrom(raw, ['employees']).map(normalizeWorkload) });
        });
      },
    }),
    {
      name: 'pm-mobile-ui',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        filters: state.filters,
        pagination: state.pagination,
        search: { ...state.search, results: [] },
      }),
    }
  )
);

// CRITICAL FIX: Register handlers AFTER store creation so they can call store methods
onUnauthorized(() => {
  void useAppStore.getState().forceLogout('Your session expired. Please sign in again.');
});

onServerError((error: any) => {
  useAppStore.getState().pushToast(error?.message || 'Server error. Please try again.', 'error');
});