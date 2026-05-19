/**
 * TypeScript Type Definitions
 * Mirrors the Laravel backend EXACTLY.
 *
 * Key alignment notes:
 * - User.global_role matches Laravel User model (not just 'role')
 * - TaskStatus includes 'ready_for_review' and 'on_hold' from Laravel migration
 * - ProjectStatus matches Laravel enum: todo | in_progress | ready_for_review | done | on_hold
 * - Comment is polymorphic (belongs to Task OR Project)
 * - Request.payload matches Laravel's JSON column
 */

// ─── Auth / User ──────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'employee' | 'client';

export interface User {
  id: number;
  name: string;
  email: string;
  /** Laravel field: global_role — DO NOT rename to 'role' */
  global_role: UserRole;
  color: string;          // UI-only: avatar color (not in Laravel, generated client-side)
  phone?: string;
  is_active?: boolean;
  /** Only present in mock auth — never sent to real API */
  password?: string;
}

// ─── Task ─────────────────────────────────────────────────────────────────────
/** Laravel: todo | in_progress | ready_for_review | done | on_hold */
export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'ready_for_review'
  | 'done'
  | 'on_hold';

export type Priority = 'low' | 'medium' | 'high';

export interface Comment {
  id: number;
  author: User;
  /** Laravel: content field */
  text: string;
  /** Laravel: created_at */
  createdAt: string;
  /** Polymorphic target */
  commentableType?: 'task' | 'project';
  commentableId?: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  progress: number;       // 0–100, calculated by Laravel from subtasks
  /** Laravel: due_date (ISO date string) */
  dueDate: string;
  /** Laravel: project_id */
  projectId: number;
  /** Laravel: parent_id — null means root/milestone task */
  parentId?: number | null;
  /** Laravel: assigned_to (User) */
  assignee?: User;
  /** Laravel: children (recursive subtasks) */
  subtasks?: Task[];
  comments?: Comment[];
}

// ─── Project ──────────────────────────────────────────────────────────────────
/** Laravel: todo | in_progress | ready_for_review | done | on_hold */
export type ProjectStatus =
  | 'todo'
  | 'in_progress'
  | 'ready_for_review'
  | 'done'
  | 'on_hold';

export interface ProjectType {
  id: number;
  name: string;
  description?: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  /** Laravel: client relationship (User with global_role=client) */
  client: User;
  /** Laravel: project_type_id → projectType */
  projectType?: ProjectType;
  status: ProjectStatus;
  progress: number;       // 0–100
  /** Laravel: start_date */
  startDate: string;
  /** Laravel: end_date */
  endDate: string;
  /** Optional project budget used by some screens and mock flows */
  budget?: number;
  /** Laravel AI fields */
  estimatedDays?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  aiComment?: string;
  members: User[];
  tasks: Task[];
  /** Project-level comments (admin, employee-member, client-owner can add) */
  comments?: Comment[];
  taskCount: {
    total: number;
    done: number;
    inProgress: number;
    todo: number;
    readyForReview: number;
    onHold: number;
  };
}

// ─── Activity Log ─────────────────────────────────────────────────────────────
export interface ActivityLog {
  id: number;
  user: User;
  action: string;
  target: string;
  targetType: 'project' | 'task' | 'user';
  timestamp: string;
  detail?: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
/** Laravel notification types */
export type NotificationType =
  | 'task_assigned'
  | 'project_created'
  | 'project_updated'
  | 'project_completed'
  | 'comment_added'
  | 'request_created'
  | 'request_approved'
  | 'request_rejected'
  | 'workload_updated'
  | 'workload_overloaded'
  | 'deadline';

export interface Notification {
  id: number;
  type: NotificationType;
  /** Display title (derived from data.title or type) */
  title: string;
  /** Display body (derived from data) */
  body: string;
  /** Laravel: read_at — null means unread */
  read: boolean;
  createdAt: string;
  targetId?: number;
  targetType?: 'project' | 'task';
}

// ─── Request ──────────────────────────────────────────────────────────────────
export type RequestType   = 'deadline_extension' | 'resource' | 'budget';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Request {
  id: number;
  type: RequestType;
  title: string;
  description: string;
  status: RequestStatus;
  requestedBy: User;
  project: Project;
  createdAt: string;
  /** Laravel: handled_by */
  handledBy?: User;
  /** Laravel: handled_at */
  handledAt?: string;
}

// ─── Task Template ────────────────────────────────────────────────────────────
export interface TaskTemplate {
  id: number;
  title: string;
  description?: string;
  priority: Priority;
  estimatedDays?: number;
  projectTypeId?: number;
}

// ─── Workload ─────────────────────────────────────────────────────────────────
export interface EmployeeWorkload {
  user: User;
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  projects: { id: number; name: string; taskCount: number }[];
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface AdminDashboardStats {
  activeProjects: number;
  completedTasks: number;
  pendingTasks: number;
  totalMembers: number;
  totalProjects: number;
  overdueTasksCount: number;
  pendingReviewTasks: number;
  extensionRequests: number;
  completionRate: number;
  highRiskProjects: number;
  mediumRiskProjects: number;
}

export interface EmployeeDashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgress: number;
  todo: number;
  overdueTasks: number;
  readyForReview: number;
  completionRate: number;
}

export interface ClientDashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  avgProgress: number;
  delayedProjects: number;
}
