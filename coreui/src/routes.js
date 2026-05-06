/**
 * Application Routes Configuration
 *
 * Mix of public and protected routes. Lazy-loaded for code splitting.
 */

import React from 'react'

// ── Public / Auth ─────────────────────────────────────────────────────────────
const Login = React.lazy(() => import('./views/pages/login/Login'))
const SetupPassword = React.lazy(() => import('./views/pages/setup-password/SetupPassword'))

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))

// ── Admin ─────────────────────────────────────────────────────────────────────
const UserManagement = React.lazy(() => import('./views/admin/UserManagement'))
const RequestManagement = React.lazy(() => import('./views/admin/RequestManagement'))
const ProjectManagement = React.lazy(() => import('./views/admin/project/ProjectManagement'))
const ProjectDetail = React.lazy(() => import('./views/admin/project/ProjectDetail'))
const TaskManagement = React.lazy(() => import('./views/admin/project/TaskManagement'))
const TaskTemplatesPage = React.lazy(() => import('./views/admin/project/TaskTemplatesPage.jsx'))
const ProjectTypesPage = React.lazy(() => import('./views/admin/project/ProjectTypesPage'))
// ── Employee ─────────────────────────────────────────────────────────────────────
const EmployeeTaskDashboard = React.lazy(() => import('./views/employee/tasks/EmployeeTaskDashboard'))
// ── Workspace ─────────────────────────────────────────────────────────────────
const Calendar = React.lazy(() => import('./views/workspace/calendar/Calendar'))
const Activity = React.lazy(() => import('./views/workspace/activity/Activity'))

// ── Settings ──────────────────────────────────────────────────────────────────
const Settings = React.lazy(() => import('./views/settings/Settings'))

const routes = [
  { path: '/', exact: true, name: 'Home' },

  // Public / Auth (NO lazy loading needed for login — or keep it, your choice)
  { path: '/login', name: 'Login', element: Login },
  { path: '/setup-password', name: 'Setup Password', element: SetupPassword },

  // Dashboard
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },

  // Admin — Users
  { path: '/admin/users', name: 'User Management', element: UserManagement },
  { path: '/admin/requests', name: 'Request Management', element: RequestManagement },

  // Admin — Projects
  { path: '/admin/projects', name: 'Project Management', element: ProjectManagement },
  { path: '/admin/projects/:id', name: 'Project Detail', element: ProjectDetail },
  { path: '/admin/projects/:id/tasks', name: 'Task Management', element: TaskManagement },
  { path: '/admin/project-types', name: 'Project Types', element: ProjectTypesPage },
  { path: '/admin/task-templates', name: 'Task Templates', element: TaskTemplatesPage },
   // Employee — Tasks
  { path: '/employee/tasks', name: 'My Tasks', element: EmployeeTaskDashboard },
  // Workspace
  { path: '/workspace/calendar', name: 'Calendar', element: Calendar },
  { path: '/workspace/activity', name: 'Activity', element: Activity },

  // Settings
  { path: '/settings', name: 'Settings', element: Settings },
]

export default routes
