import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilCalendar, cilClock, cilSettings, cilSpeedometer, cilTask } from '@coreui/icons'
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
    name: 'My Tasks',
    to: '/employee/tasks',
    icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Notifications',
    to: '/employee/notifications',
    icon: <CIcon icon={cilClock} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Workspace',
  },
  {
    component: CNavItem,
    name: 'Calendar',
    to: '/workspace/calendar',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
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
