import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBriefcase,
  cilBell,
  cilHistory,
  cilPeople,
  cilSpeedometer,
  cilTask,
  cilInbox,     // Better for Requests
  cilChartPie,   // Better for Workload
  cilUser       // Specific for Users
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Management',
  },
  {
    component: CNavGroup,
    name: 'Projects',
    icon: <CIcon icon={cilBriefcase} customClassName="nav-icon" />,
    badgeKey: 'projects',
    items: [
      {
        component: CNavItem,
        name: 'All Projects',
        to: '/admin/projects',
      },
      {
        component: CNavItem,
        name: 'Project Types',
        to: '/admin/project-types',
      },
      // {
      //   component: CNavItem,
      //   name: 'Task Templates',
      //   to: '/admin/task-templates',
      // },
    ],
  },
  // {
  //   component: CNavItem,
  //   name: 'Requests',
  //   to: '/admin/requests',
  //   icon: <CIcon icon={cilInbox} customClassName="nav-icon" />, // Changed from Square
  //   badgeKey: 'requests',
  // },
  {
    component: CNavItem,
    name: 'Tasks',
    to: '/admin/tasks',
    icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
    badgeKey: 'tasks',
  },
  {
    component: CNavItem,
    name: 'Workload',
    to: '/admin/workload',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />, // Changed from People
    badgeKey: 'workload',
  },
  {
    component: CNavItem,
    name: 'Users',
    to: '/admin/users',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
    badgeKey: 'tasks',
  },
  {
    component: CNavTitle,
    name: 'Workspace',
  },
  {
    component: CNavItem,
    name: 'Activity Logs',
    to: '/workspace/activity',
    icon: <CIcon icon={cilHistory} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Notifications',
    to: '/notifications',
    icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
    badgeKey: 'total',
  },
]

export default _nav