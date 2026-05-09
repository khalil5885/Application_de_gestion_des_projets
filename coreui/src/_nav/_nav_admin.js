import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBriefcase,
  cilHistory,
  cilPeople,
  cilSettings,
  cilSpeedometer,
  cilTask,
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
    to: '/admin/projects',
    icon: <CIcon icon={cilBriefcase} customClassName="nav-icon" />,
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
      {
        component: CNavItem,
        name: 'Task Templates',
        to: '/admin/task-templates',
      },
    ],
  },
  {
    component: CNavItem,
    name: 'Requests',
    to: '/admin/requests',
    icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Team Workload',
    to: '/admin/workload',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Users',
    to: '/admin/users',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
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
    component: CNavTitle,
    name: 'Account',
  },
  {
    component: CNavItem,
    name: 'Settings',
    to: '/settings',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
  },
]

export default _nav
