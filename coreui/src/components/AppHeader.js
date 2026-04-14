import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  CContainer,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CBadge,
  useColorModes,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilContrast,
  cilMenu,
  cilMoon,
  cilSun,
  cilCheckCircle,
  cilWarning,
  cilTask,
} from '@coreui/icons'

import { AppBreadcrumb } from './index'
import { AppHeaderDropdown } from './header/index'

// ── Mock Notifications ───────────────────────────────────────────────────────
const notifications = [
  { id: 1, type: 'success', icon: cilCheckCircle, text: 'Task "API Integration" completed', time: '2m ago' },
  { id: 2, type: 'warning', icon: cilWarning, text: 'Deadline approaching: Website Redesign', time: '1h ago' },
  { id: 3, type: 'info', icon: cilTask, text: 'You were assigned to CRM Dashboard', time: '3h ago' },
]

const typeColors = { success: 'success', warning: 'warning', info: 'info' }

const AppHeader = () => {
  const headerRef = useRef()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')

  useEffect(() => {
    const handleScroll = () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
    }
    document.addEventListener('scroll', handleScroll)
    return () => document.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <CHeader position="sticky" className="mb-4 p-0" ref={headerRef}>
      <CContainer className="border-bottom px-4" fluid>
        {/* Left Side: Sidebar Toggler */}
        <CHeaderToggler
          onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
          style={{ marginInlineStart: '-14px' }}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>

        {/* SPACER: This replaces the search bar and pushes 
          everything after it to the right side.
        */}
        <div className="me-auto"></div>

        {/* Right Side Navigation Group */}
        <CHeaderNav className="d-flex align-items-center">
          
          {/* 1. Notifications Dropdown */}
          <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle caret={false} className="position-relative py-1 px-2">
              <CIcon icon={cilBell} size="lg" />
              <CBadge
                color="danger"
                shape="rounded-pill"
                className="position-absolute top--2 start-10 translate-middle"
                style={{ fontSize: 10, padding: '2px 5px' }}
              >
                {notifications.length}
              </CBadge>
            </CDropdownToggle>
            <CDropdownMenu style={{ minWidth: 300 }}>
              <div className="px-3 py-2 border-bottom">
                <strong className="small">Notifications</strong>
              </div>
              {notifications.map((n) => (
                <CDropdownItem key={n.id} className="d-flex align-items-start gap-2 py-2">
                  <CIcon icon={n.icon} className={`text-${typeColors[n.type]} mt-1 flex-shrink-0`} size="sm" />
                  <div className="flex-grow-1">
                    <div className="small text-wrap">{n.text}</div>
                    <div className="text-body-secondary" style={{ fontSize: 11 }}>{n.time}</div>
                  </div>
                </CDropdownItem>
              ))}
              <div className="px-3 py-2 border-top text-center">
                <span
                  className="small text-primary"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/workspace/activity')}
                >
                  View all activity
                </span>
              </div>
            </CDropdownMenu>
          </CDropdown>

          {/* Vertical Divider */}
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>

          {/* 2. Theme Switcher */}
          <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle caret={false} className="d-flex align-items-center">
              {colorMode === 'dark' ? (
                <CIcon icon={cilMoon} size="lg" />
              ) : colorMode === 'auto' ? (
                <CIcon icon={cilContrast} size="lg" />
              ) : (
                <CIcon icon={cilSun} size="lg" />
              )}
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem
                active={colorMode === 'light'}
                className="d-flex align-items-center"
                as="button"
                onClick={() => setColorMode('light')}
              >
                <CIcon className="me-2" icon={cilSun} size="lg" /> Light
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'dark'}
                className="d-flex align-items-center"
                as="button"
                onClick={() => setColorMode('dark')}
              >
                <CIcon className="me-2" icon={cilMoon} size="lg" /> Dark
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'auto'}
                className="d-flex align-items-center"
                as="button"
                onClick={() => setColorMode('auto')}
              >
                <CIcon className="me-2" icon={cilContrast} size="lg" /> Auto
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>

          {/* Vertical Divider */}
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>

          {/* 3. User Avatar */}
          <AppHeaderDropdown />
          
        </CHeaderNav>
      </CContainer>

      {/* Breadcrumb Section */}
      <CContainer className="px-4" fluid>
        <AppBreadcrumb />
      </CContainer>
    </CHeader>
  )
}

export default AppHeader