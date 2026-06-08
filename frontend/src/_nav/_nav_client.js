import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilBriefcase,
  cilCalendar,
  cilSpeedometer,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/client/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Client Workspace',
  },
  {
    component: CNavItem,
    name: 'Projects',
    to: '/client/projects',
    icon: <CIcon icon={cilBriefcase} customClassName="nav-icon" />,
    badgeKey: 'projects',
  },
  {
    component: CNavItem,
    name: 'Notifications',
    to: '/notifications',
    icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
    badgeKey: 'total',
  },
  // {
  //   component: CNavItem,
  //   name: 'Timeline',
  //   to: '/client/timeline',
  //   icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
  // },
]

export default _nav
