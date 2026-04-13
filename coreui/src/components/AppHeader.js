import React, { useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
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
  CNavLink,
  CNavItem,
  useColorModes,
  CFormInput,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilContrast,
  cilMenu,
  cilMoon,
  cilSun,
  cilSearch,
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
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)

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
        {/* Sidebar toggler */}
        <CHeaderToggler
          onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
          style={{ marginInlineStart: '-14px' }}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>

        {/* Search Bar */}
        <div className="d-none d-md-flex align-items-center ms-3 me-auto" style={{ maxWidth: 280 }}>
          <div className="position-relative w-100">
            <CIcon
              icon={cilSearch}
              className="position-absolute text-body-secondary"
              style={{ top: '50%', left: 10, transform: 'translateY(-50%)', pointerEvents: 'none' }}
              size="sm"
            />
            <CFormInput
              placeholder="Search projects, tasks..."
              className="ps-4 rounded-4"
              style={{ fontSize: 13 }}
            />
          </div>
        </div>

        {/* Right side nav */}
        <CHeaderNav className="ms-auto ms-md-0">
          {/* Notifications */}
          <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle caret={false} className="position-relative py-1 px-2">
              <CIcon icon={cilBell} size="lg" />
              <CBadge
                color="danger"
                shape="rounded-pill"
                className="position-absolute top-0 end-0"
                style={{ fontSize: 9, padding: '2px 5px' }}
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
                    <div className="small">{n.text}</div>
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
        </CHeaderNav>

        <CHeaderNav>
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>
          {/* Theme switcher */}
          <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle caret={false} className="d-flex align-items-center mt-1">
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
                type="button"
                onClick={() => setColorMode('light')}
              >
                <CIcon className="me-2" icon={cilSun} size="lg" /> Light
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'dark'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('dark')}
              >
                <CIcon className="me-2" icon={cilMoon} size="lg" /> Dark
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'auto'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('auto')}
              >
                <CIcon className="me-2" icon={cilContrast} size="lg" /> Auto
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>
          {/* User avatar dropdown */}
          <AppHeaderDropdown />
        </CHeaderNav>
      </CContainer>
      <CContainer className="px-4" fluid>
        <AppBreadcrumb />
      </CContainer>
    </CHeader>
  )
}

export default AppHeader
