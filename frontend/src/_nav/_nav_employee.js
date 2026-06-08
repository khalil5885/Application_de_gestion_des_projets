import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilBell, cilCalendar, cilSpeedometer, cilTask,cilBriefcase } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'My Work',
  },
  {
    component: CNavItem,
    name: 'All Projects',
    to: '/employee/projects',
    icon: <CIcon icon={cilBriefcase} customClassName="nav-icon" />,
    badgeKey: 'projects',
  },
  {
    component: CNavItem,
    name: 'All Tasks',
    to: '/employee/tasks',
    icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
    badgeKey: 'tasks',
  },
  {
    component: CNavItem,
    name: 'Notifications',
    to: '/notifications',
    icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
    badgeKey: 'total',
  },
  {
    component: CNavTitle,
    name: 'Workspace',
  },
  // {
  //   component: CNavItem,
  //   name: 'Calendar',
  //   to: '/workspace/calendar',
  //   icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
  // },
]

export default _nav
