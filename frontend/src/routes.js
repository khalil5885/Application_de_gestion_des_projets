import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import RoleGuard from './components/RoleGuard'

const Login = React.lazy(() => import('./views/pages/login/Login'))
const SetupPassword = React.lazy(() => import('./views/pages/setup-password/SetupPassword'))
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const NotificationsPage = React.lazy(() => import('./views/shared/NotificationsPage'))
const UserManagement = React.lazy(() => import('./views/admin/UserManagement'))
// const RequestManagement = React.lazy(() => import('./views/admin/RequestManagement'))
const WorkloadOverview = React.lazy(() => import('./views/admin/workload/WorkloadOverview'))
const EmployeeWorkloadDetail = React.lazy(
  () => import('./views/admin/workload/EmployeeWorkloadDetail'),
)
const ProjectManagement = React.lazy(() => import('./views/admin/project/ProjectManagement'))
const ProjectDetail = React.lazy(() => import('./views/admin/project/ProjectDetail'))
const TaskManagement = React.lazy(() => import('./views/admin/project/TaskManagement'))
// const TaskTemplatesPage = React.lazy(() => import('./views/admin/project/TaskTemplatesPage.jsx'))
const ProjectTypesPage = React.lazy(() => import('./views/admin/project/ProjectTypesPage'))
const TasksPage = React.lazy(() => import('./views/admin/TasksOverview'))
const ProjectManagementPage = React.lazy(() => import('./views/employee/project/ProjectManagement'))
const EmployeeTaskDashboard = React.lazy(
  () => import('./views/employee/tasks/EmployeeTaskDashboard'),
)
const EmployeeProjectManagement = React.lazy(
  () => import('./views/employee/project/ProjectManagement'),
)

const ClientProjects = React.lazy(() => import('./views/client/Projects'))
const ClientProjectDetail = React.lazy(() => import('./views/client/ProjectDetail'))
const ClientTimeline = React.lazy(() => import('./views/client/Timeline'))

const Calendar = React.lazy(() => import('./views/workspace/calendar/Calendar'))
const Activity = React.lazy(() => import('./views/workspace/activity/Activity'))

const getStoredRole = () => {
  try {
    const stored = localStorage.getItem('user')
    if (!stored || stored === 'undefined') return null
    const user = JSON.parse(stored)
    return user?.global_role || user?.role || null
  } catch {
    return null
  }
}

const withRoles = (Component, allowedRoles) => {
  const GuardedRoute = () => {
    const { user } = useAuth()
    const role = user?.global_role || user?.role || getStoredRole()

    if (!role) return <Navigate to="/login" replace />

    return (
      <RoleGuard allowedRoles={allowedRoles} userRole={role}>
        <Component />
      </RoleGuard>
    )
  }

  return GuardedRoute
}

const routes = [
  { path: '/', exact: true, name: 'Home' },

  { path: '/login', name: 'Login', element: Login },
  { path: '/setup-password', name: 'Setup Password', element: SetupPassword },

  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  {
    path: '/notifications',
    name: 'Notifications',
    element: withRoles(NotificationsPage, ['admin', 'employee', 'client']),
  },

  { path: '/admin/users', name: 'User Management', element: withRoles(UserManagement, ['admin']) },
  // {
  //   path: '/admin/requests',
  //   name: 'Request Management',
  //   element: withRoles(RequestManagement, ['admin']),
  // },
  {
    path: '/admin/workload',
    name: 'Team Workload',
    element: withRoles(WorkloadOverview, ['admin']),
  },
  {
    path: '/admin/workload/:employeeId',
    name: 'Employee Workload',
    element: withRoles(EmployeeWorkloadDetail, ['admin']),
  },
  {
    path: '/admin/projects',
    name: 'Project Management',
    element: withRoles(ProjectManagement, ['admin']),
  },
  {
    path: '/admin/projects/:id',
    name: 'Project Detail',
    element: withRoles(ProjectDetail, ['admin']),
  },
  {
    path: '/admin/projects/:id/tasks',
    name: 'Task Management',
    element: withRoles(TaskManagement, ['admin']),
  },
  {
    path: '/admin/project-types',
    name: 'Project Types',
    element: withRoles(ProjectTypesPage, ['admin']),
  },
  // {
  //   path: '/admin/task-templates',
  //   name: 'Task Templates',
  //   element: withRoles(TaskTemplatesPage, ['admin']),
  // },
  {
    path: '/admin/tasks',
    name: 'Tasks',
    element: withRoles(TasksPage, ['admin']),
  },
  
  {
    path: '/employee/projects',
    name: 'All Projects',
    element: withRoles(ProjectManagementPage, ['employee']),
  },
  {
    path: '/employee/tasks',
    name: 'My Tasks',
    element: withRoles(EmployeeTaskDashboard, ['employee']),
  },
  {
    path: '/employee/projects',
    name: 'My Projects',
    element: withRoles(EmployeeProjectManagement, ['employee']),
  },
  {
    path: '/client/dashboard',
    name: 'Client Dashboard',
    element: withRoles(Dashboard, ['client']),
  },
  {
    path: '/client/projects',
    name: 'Client Projects',
    element: withRoles(ClientProjects, ['client']),
  },
  {
    path: '/client/projects/:id',
    name: 'Client Project Detail',
    element: withRoles(ClientProjectDetail, ['client']),
  },
  {
    path: '/client/timeline',
    name: 'Client Timeline',
    element: withRoles(ClientTimeline, ['client']),
  },

  { path: '/workspace/calendar', name: 'Calendar', element: withRoles(Calendar, ['employee']) },
  { path: '/workspace/activity', name: 'Activity', element: Activity },
]

export default routes
