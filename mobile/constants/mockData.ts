/**
 * Mock Data — matches Laravel backend structure exactly.
 *
 * Field names use Laravel conventions:
 * - User.global_role (not 'role')
 * - Task.status includes 'ready_for_review' and 'on_hold'
 * - Project.client is a User object (not a string)
 *
 * DEMO CREDENTIALS:
 *   admin@company.com    / admin123    → Admin
 *   jordan@company.com   / emp123     → Employee
 *   client@company.com   / client123  → Client
 */

import {
  Project,
  Task,
  User,
  ActivityLog,
  Request,
  Notification,
  AdminDashboardStats,
  EmployeeDashboardStats,
  ClientDashboardStats,
  EmployeeWorkload,
  TaskTemplate,
  ProjectType,
} from '../types';

// ─── Users ────────────────────────────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  { id: 1, name: 'Alice Martin',  email: 'admin@company.com',  global_role: 'admin',    color: '#6366F1', password: 'admin123',  is_active: true },
  { id: 2, name: 'Jordan Doe',    email: 'jordan@company.com', global_role: 'employee', color: '#34D399', password: 'emp123',    is_active: true },
  { id: 3, name: 'Maya Lee',      email: 'maya@company.com',   global_role: 'employee', color: '#FFA726', password: 'emp123',    is_active: true },
  { id: 4, name: 'Sam King',      email: 'sam@company.com',    global_role: 'employee', color: '#F87171', password: 'emp123',    is_active: true },
  { id: 5, name: 'Nina Ray',      email: 'nina@company.com',   global_role: 'employee', color: '#60A5FA', password: 'emp123',    is_active: true },
  { id: 6, name: 'Client Corp',   email: 'client@company.com', global_role: 'client',   color: '#A78BFA', password: 'client123', is_active: true },
];

// ─── Project Types ────────────────────────────────────────────────────────────
export const MOCK_PROJECT_TYPES: ProjectType[] = [
  { id: 1, name: 'Web Application',    description: 'Full-stack web projects' },
  { id: 2, name: 'Mobile Application', description: 'iOS and Android apps' },
  { id: 3, name: 'API / Backend',      description: 'REST or GraphQL APIs' },
  { id: 4, name: 'AI / ML',            description: 'Machine learning pipelines' },
  { id: 5, name: 'Security System',    description: 'Cybersecurity solutions' },
];

// ─── Task Templates ───────────────────────────────────────────────────────────
export const MOCK_TASK_TEMPLATES: TaskTemplate[] = [
  { id: 1, title: 'Requirements Analysis', priority: 'high',   estimatedDays: 3, projectTypeId: 1 },
  { id: 2, title: 'UI/UX Design',          priority: 'medium', estimatedDays: 5, projectTypeId: 1 },
  { id: 3, title: 'API Integration',       priority: 'high',   estimatedDays: 4, projectTypeId: 1 },
  { id: 4, title: 'Unit Testing',          priority: 'medium', estimatedDays: 3, projectTypeId: 2 },
  { id: 5, title: 'Security Audit',        priority: 'high',   estimatedDays: 2, projectTypeId: 5 },
];

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const MOCK_TASKS: Task[] = [
  {
    id: 1,
    title: 'Core API Rate Limiter',
    description: 'Implement per-user rate limiting on all public API endpoints using Redis middleware.',
    status: 'in_progress',
    priority: 'high',
    progress: 75,
    dueDate: '2025-06-15',
    projectId: 1,
    parentId: null,
    assignee: MOCK_USERS[1],
    comments: [
      { id: 101, author: MOCK_USERS[0], text: 'Make sure to handle burst limits too.', createdAt: '2025-05-07T10:00:00Z', commentableType: 'task', commentableId: 1 },
      { id: 102, author: MOCK_USERS[1], text: 'Already on it, PR ready tomorrow.',     createdAt: '2025-05-07T11:30:00Z', commentableType: 'task', commentableId: 1 },
    ],
    subtasks: [
      { id: 11, title: 'Design rate limit schema',  status: 'done',        priority: 'high',   progress: 100, dueDate: '2025-06-01', projectId: 1, parentId: 1 },
      { id: 12, title: 'Implement Redis middleware', status: 'in_progress', priority: 'high',   progress: 60,  dueDate: '2025-06-10', projectId: 1, parentId: 1 },
      { id: 13, title: 'Write unit tests',           status: 'todo',        priority: 'medium', progress: 0,   dueDate: '2025-06-14', projectId: 1, parentId: 1 },
    ],
  },
  {
    id: 2,
    title: 'User Onboarding Refactor',
    description: 'Redesign the onboarding flow with progressive disclosure.',
    status: 'in_progress',
    priority: 'medium',
    progress: 32,
    dueDate: '2025-06-20',
    projectId: 1,
    parentId: null,
    assignee: MOCK_USERS[2],
    comments: [],
    subtasks: [
      { id: 21, title: 'Design new onboarding screens', status: 'done', priority: 'medium', progress: 100, dueDate: '2025-06-05', projectId: 1, parentId: 2 },
      { id: 22, title: 'Implement step-by-step flow',   status: 'todo', priority: 'high',   progress: 0,   dueDate: '2025-06-18', projectId: 1, parentId: 2 },
    ],
  },
  {
    id: 3,
    title: 'Compliance Documentation',
    description: 'Update all GDPR compliance docs for Q3 audit.',
    status: 'todo',
    priority: 'low',
    progress: 0,
    dueDate: '2025-07-02',
    projectId: 2,
    parentId: null,
    assignee: MOCK_USERS[3],
    comments: [],
  },
  {
    id: 4,
    title: 'Mobile Push Notifications',
    description: 'Integrate FCM for real-time push notifications.',
    status: 'ready_for_review',
    priority: 'high',
    progress: 90,
    dueDate: '2025-06-25',
    projectId: 2,
    parentId: null,
    assignee: MOCK_USERS[4],
    comments: [],
  },
  {
    id: 5,
    title: 'Dashboard Analytics v2',
    description: 'Rebuild the analytics dashboard with chart.js v4.',
    status: 'done',
    priority: 'medium',
    progress: 100,
    dueDate: '2025-05-30',
    projectId: 3,
    parentId: null,
    assignee: MOCK_USERS[1],
    comments: [
      { id: 501, author: MOCK_USERS[0], text: 'Great work, charts look amazing!', createdAt: '2025-05-30T09:00:00Z', commentableType: 'task', commentableId: 5 },
    ],
  },
  {
    id: 6,
    title: 'Security Penetration Testing',
    description: 'Complete penetration testing and fix all critical vulnerabilities.',
    status: 'in_progress',
    priority: 'high',
    progress: 55,
    dueDate: '2025-06-18',
    projectId: 3,
    parentId: null,
    assignee: MOCK_USERS[0],
    comments: [],
    subtasks: [
      { id: 61, title: 'Pen testing Phase 1', status: 'done',        priority: 'high', progress: 100, dueDate: '2025-06-05', projectId: 3, parentId: 6 },
      { id: 62, title: 'Pen testing Phase 2', status: 'in_progress', priority: 'high', progress: 40,  dueDate: '2025-06-15', projectId: 3, parentId: 6 },
      { id: 63, title: 'Fix critical issues',  status: 'todo',        priority: 'high', progress: 0,   dueDate: '2025-06-17', projectId: 3, parentId: 6 },
    ],
  },
  {
    id: 7,
    title: 'Employee Leave Module',
    description: 'HR module for leave requests and approvals.',
    status: 'on_hold',
    priority: 'low',
    progress: 15,
    dueDate: '2025-08-01',
    projectId: 4,
    parentId: null,
    assignee: MOCK_USERS[2],
    comments: [],
  },
];

// ─── Projects ─────────────────────────────────────────────────────────────────
export const MOCK_PROJECTS: Project[] = [
  {
    id: 1,
    name: 'Atlas Platform',
    description: 'Enterprise SaaS platform for data analytics and reporting.',
    client: MOCK_USERS[5],
    projectType: MOCK_PROJECT_TYPES[0],
    status: 'in_progress',
    progress: 62,
    startDate: '2025-03-01',
    endDate: '2025-08-31',
    riskLevel: 'medium',
    estimatedDays: 180,
    aiComment: 'On track. Consider allocating more resources to API rate limiter milestone.',
    members: [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[2]],
    tasks: MOCK_TASKS.filter((t) => t.projectId === 1 && t.parentId === null),
    comments: [
      { id: 901, author: MOCK_USERS[5], text: 'Looking forward to the Q3 demo!', createdAt: '2025-05-06T10:00:00Z', commentableType: 'project', commentableId: 1 },
      { id: 902, author: MOCK_USERS[0], text: 'We are on track for the deadline.', createdAt: '2025-05-07T09:30:00Z', commentableType: 'project', commentableId: 1 },
    ],
    taskCount: { total: 18, done: 9, inProgress: 5, todo: 3, readyForReview: 1, onHold: 0 },
  },
  {
    id: 2,
    name: 'Nexus Mobile',
    description: 'Cross-platform mobile app for field operations management.',
    client: MOCK_USERS[5],
    projectType: MOCK_PROJECT_TYPES[1],
    status: 'in_progress',
    progress: 38,
    startDate: '2025-04-15',
    endDate: '2025-09-30',
    riskLevel: 'high',
    estimatedDays: 168,
    members: [MOCK_USERS[3], MOCK_USERS[4]],
    tasks: MOCK_TASKS.filter((t) => t.projectId === 2 && t.parentId === null),
    taskCount: { total: 24, done: 7, inProgress: 8, todo: 8, readyForReview: 1, onHold: 0 },
  },
  {
    id: 3,
    name: 'Sentinel Security',
    description: 'Cybersecurity monitoring and threat detection system.',
    client: MOCK_USERS[5],
    projectType: MOCK_PROJECT_TYPES[4],
    status: 'done',
    progress: 100,
    startDate: '2025-01-10',
    endDate: '2025-05-31',
    riskLevel: 'low',
    estimatedDays: 140,
    members: [MOCK_USERS[0], MOCK_USERS[1]],
    tasks: MOCK_TASKS.filter((t) => t.projectId === 3 && t.parentId === null),
    taskCount: { total: 31, done: 31, inProgress: 0, todo: 0, readyForReview: 0, onHold: 0 },
  },
  {
    id: 4,
    name: 'Orbit CRM',
    description: 'Custom CRM solution with AI-powered lead scoring.',
    client: MOCK_USERS[5],
    projectType: MOCK_PROJECT_TYPES[0],
    status: 'todo',
    progress: 0,
    startDate: '2025-07-01',
    endDate: '2025-12-31',
    riskLevel: 'low',
    estimatedDays: 183,
    members: [MOCK_USERS[2], MOCK_USERS[3]],
    tasks: MOCK_TASKS.filter((t) => t.projectId === 4 && t.parentId === null),
    taskCount: { total: 1, done: 0, inProgress: 0, todo: 0, readyForReview: 0, onHold: 1 },
  },
  {
    id: 5,
    name: 'Vega AI Engine',
    description: 'Machine learning pipeline for predictive analytics.',
    client: MOCK_USERS[5],
    projectType: MOCK_PROJECT_TYPES[3],
    status: 'on_hold',
    progress: 22,
    startDate: '2025-02-20',
    endDate: '2025-11-15',
    riskLevel: 'high',
    estimatedDays: 267,
    members: [MOCK_USERS[1], MOCK_USERS[4]],
    tasks: [],
    taskCount: { total: 15, done: 3, inProgress: 2, todo: 10, readyForReview: 0, onHold: 0 },
  },
];

// ─── Notifications ────────────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: 'task_assigned',
    title: 'New task assigned',
    body: 'You have been assigned "Core API Rate Limiter" in Atlas Platform.',
    read: false,
    createdAt: '2025-05-08T09:30:00Z',
    targetId: 1,
    targetType: 'task',
  },
  {
    id: 2,
    type: 'deadline',
    title: 'Deadline approaching',
    body: 'Security Penetration Testing is due in 10 days. Progress: 55%.',
    read: false,
    createdAt: '2025-05-08T08:00:00Z',
    targetId: 6,
    targetType: 'task',
  },
  {
    id: 3,
    type: 'comment_added',
    title: 'Comment on your task',
    body: 'Alice Martin commented on "Core API Rate Limiter".',
    read: false,
    createdAt: '2025-05-07T10:00:00Z',
    targetId: 1,
    targetType: 'task',
  },
  {
    id: 4,
    type: 'project_updated',
    title: 'Project status update',
    body: 'Sentinel Security has been marked as Done.',
    read: true,
    createdAt: '2025-05-07T14:00:00Z',
    targetId: 3,
    targetType: 'project',
  },
  {
    id: 5,
    type: 'request_approved',
    title: 'Request approved',
    body: 'Your resource request for Nexus Mobile has been approved.',
    read: true,
    createdAt: '2025-05-06T11:00:00Z',
  },
  {
    id: 6,
    type: 'project_updated',
    title: 'New team member',
    body: 'Nina Ray has joined the Nexus Mobile project.',
    read: true,
    createdAt: '2025-05-05T09:15:00Z',
    targetId: 2,
    targetType: 'project',
  },
  {
    id: 7,
    type: 'request_created',
    title: 'New extension request',
    body: 'Jordan Doe requested a deadline extension for Atlas Platform.',
    read: false,
    createdAt: '2025-05-08T07:00:00Z',
    targetId: 1,
    targetType: 'project',
  },
];

// ─── Requests ─────────────────────────────────────────────────────────────────
export const MOCK_REQUESTS: Request[] = [
  {
    id: 1,
    type: 'deadline_extension',
    title: 'Extend Atlas deadline by 2 weeks',
    description: 'Need more time due to API rate limiter complexity. Estimated 2 extra weeks.',
    status: 'pending',
    requestedBy: MOCK_USERS[1],
    project: MOCK_PROJECTS[0],
    createdAt: '2025-05-08T07:00:00Z',
  },
  {
    id: 2,
    type: 'resource',
    title: 'Additional developer for Nexus Mobile',
    description: 'Requesting one more mobile developer for the push notification feature.',
    status: 'approved',
    requestedBy: MOCK_USERS[3],
    project: MOCK_PROJECTS[1],
    createdAt: '2025-05-03T14:30:00Z',
  },
  {
    id: 3,
    type: 'budget',
    title: 'Budget increase for Vega AI Engine',
    description: 'Cloud compute costs exceeded original forecast by 35%.',
    status: 'rejected',
    requestedBy: MOCK_USERS[4],
    project: MOCK_PROJECTS[4],
    createdAt: '2025-04-28T09:15:00Z',
  },
];

// ─── Activity Logs ────────────────────────────────────────────────────────────
export const MOCK_ACTIVITY: ActivityLog[] = [
  { id: 1, user: MOCK_USERS[0], action: 'user_created',   target: 'Atlas Platform',           targetType: 'project', timestamp: '2025-05-08T09:15:00Z' },
  { id: 2, user: MOCK_USERS[1], action: 'task_updated',   target: 'Core API Rate Limiter',    targetType: 'task',    timestamp: '2025-05-08T08:42:00Z', detail: 'Status changed to In Progress' },
  { id: 3, user: MOCK_USERS[2], action: 'comment_added',  target: 'User Onboarding Refactor', targetType: 'task',    timestamp: '2025-05-07T16:30:00Z', detail: 'Added design mockups' },
  { id: 4, user: MOCK_USERS[3], action: 'task_completed', target: 'Sentinel Security',         targetType: 'project', timestamp: '2025-05-07T14:00:00Z' },
  { id: 5, user: MOCK_USERS[4], action: 'task_assigned',  target: 'Mobile Push Notifications', targetType: 'task',    timestamp: '2025-05-06T11:20:00Z', detail: 'Assigned to Nina Ray' },
  { id: 6, user: MOCK_USERS[0], action: 'project_created',target: 'Orbit CRM',                targetType: 'project', timestamp: '2025-05-06T10:00:00Z' },
];

// ─── Workload ─────────────────────────────────────────────────────────────────
export const MOCK_WORKLOAD: EmployeeWorkload[] = [
  {
    user: MOCK_USERS[1],
    totalTasks: 8, doneTasks: 5, inProgressTasks: 2, overdueTasks: 0,
    completionRate: 62,
    projects: [{ id: 1, name: 'Atlas Platform', taskCount: 5 }, { id: 3, name: 'Sentinel Security', taskCount: 3 }],
  },
  {
    user: MOCK_USERS[2],
    totalTasks: 5, doneTasks: 2, inProgressTasks: 2, overdueTasks: 1,
    completionRate: 40,
    projects: [{ id: 1, name: 'Atlas Platform', taskCount: 3 }, { id: 4, name: 'Orbit CRM', taskCount: 2 }],
  },
  {
    user: MOCK_USERS[3],
    totalTasks: 6, doneTasks: 3, inProgressTasks: 1, overdueTasks: 0,
    completionRate: 50,
    projects: [{ id: 2, name: 'Nexus Mobile', taskCount: 4 }, { id: 4, name: 'Orbit CRM', taskCount: 2 }],
  },
  {
    user: MOCK_USERS[4],
    totalTasks: 4, doneTasks: 1, inProgressTasks: 2, overdueTasks: 0,
    completionRate: 25,
    projects: [{ id: 2, name: 'Nexus Mobile', taskCount: 4 }],
  },
];

// ─── Dashboard stats per role ─────────────────────────────────────────────────
export const MOCK_ADMIN_STATS: AdminDashboardStats = {
  activeProjects: 2,
  completedTasks: 50,
  pendingTasks: 23,
  totalMembers: 5,
  totalProjects: 5,
  overdueTasksCount: 1,
  pendingReviewTasks: 2,
  extensionRequests: 1,
  completionRate: 57,
  highRiskProjects: 2,
  mediumRiskProjects: 1,
};

export const MOCK_EMPLOYEE_STATS: EmployeeDashboardStats = {
  totalTasks: 8,
  completedTasks: 5,
  inProgress: 2,
  todo: 1,
  overdueTasks: 0,
  readyForReview: 1,
  completionRate: 62,
};

export const MOCK_CLIENT_STATS: ClientDashboardStats = {
  totalProjects: 5,
  activeProjects: 2,
  completedProjects: 1,
  avgProgress: 44,
  delayedProjects: 0,
};
