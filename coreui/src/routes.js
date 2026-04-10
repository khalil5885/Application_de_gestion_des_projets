/**
 * Application Routes Configuration
 *
 * All protected routes. Lazy-loaded for code splitting.
 */

import React from 'react'

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))

// ── Admin ─────────────────────────────────────────────────────────────────────
const UserManagement = React.lazy(() => import('./views/admin/UserManagement'))
const ProjectManagement = React.lazy(() => import('./views/admin/project/ProjectManagement'))
const ProjectDetail = React.lazy(() => import('./views/admin/project/ProjectDetail'))
const TaskManagement = React.lazy(() => import('./views/admin/project/TaskManagement'))

// ── Workspace ─────────────────────────────────────────────────────────────────
const Calendar = React.lazy(() => import('./views/workspace/calendar/Calendar'))
const Activity = React.lazy(() => import('./views/workspace/activity/Activity'))

// ── Settings ──────────────────────────────────────────────────────────────────
const Settings = React.lazy(() => import('./views/settings/Settings'))

const routes = [
  { path: '/', exact: true, name: 'Home' },

  // Dashboard
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },

  // Admin — Users
  { path: '/admin/users', name: 'User Management', element: UserManagement },

  // Admin — Projects
  { path: '/admin/projects', name: 'Project Management', element: ProjectManagement },
  { path: '/admin/projects/:id', name: 'Project Detail', element: ProjectDetail },
  { path: '/admin/projects/:id/tasks', name: 'Task Management', element: TaskManagement },

  // Workspace
  { path: '/workspace/calendar', name: 'Calendar', element: Calendar },
  { path: '/workspace/activity', name: 'Activity', element: Activity },

  // Settings
  { path: '/settings', name: 'Settings', element: Settings },
]

export default routes
