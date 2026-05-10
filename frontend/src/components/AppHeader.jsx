import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  CBadge,
  CButton,
  CContainer,
  CDropdown,
  CDropdownDivider,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  useColorModes,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBell, cilContrast, cilMenu, cilMoon, cilSun } from '@coreui/icons'

import { AppBreadcrumb } from './index'
import { AppHeaderDropdown } from './header/index'
import api from '../api'
import { useNotifications } from '../context/NotificationsContext'

const typeMeta = {
  request_approved: { label: 'Request approved', color: 'success' },
  request_rejected: { label: 'Request rejected', color: 'danger' },
  request_created: { label: 'Request created', color: 'info' },
  task_assigned: { label: 'Task assigned', color: 'primary' },
  comment_added: { label: 'Comment added', color: 'secondary' },
}

const normalizeList = (response) => {
  const data = response.data?.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const prettify = (value) =>
  String(value || 'Notification')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const describeNotification = (notification) => {
  const data = notification.data || {}
  return (
    data.message ||
    data.title ||
    data.task_title ||
    data.project_name ||
    data.comment ||
    data.feedback ||
    data.reason ||
    prettify(notification.type)
  )
}

const AppHeader = () => {
  const headerRef = useRef()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const { counts, refreshCounts } = useNotifications()
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const handleScroll = () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
    }
    document.addEventListener('scroll', handleScroll)
    return () => document.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get('/api/notifications', { params: { per_page: 5 } })
      setNotifications(normalizeList(response).slice(0, 5))
      refreshCounts()
    } catch {
      setNotifications([])
    }
  }, [refreshCounts])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAllRead = async () => {
    await api.patch('/api/notifications/read-all')
    setNotifications((items) =>
      items.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })),
    )
    refreshCounts()
  }

  const unreadCount = useMemo(() => counts.total || 0, [counts.total])

  return (
    <CHeader position="sticky" className="mb-4 p-0" ref={headerRef}>
      <CContainer className="border-bottom px-4" fluid>
        <CHeaderToggler
          onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
          style={{ marginInlineStart: '-14px' }}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>

        <div className="me-auto"></div>

        <CHeaderNav className="d-flex align-items-center">
          <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle caret={false} className="position-relative py-1 px-2">
              <CIcon icon={cilBell} size="lg" />
              {unreadCount > 0 && (
                <CBadge
                  color="danger"
                  shape="rounded-pill"
                  className="position-absolute top-0 start-100 translate-middle"
                  style={{ fontSize: 10, padding: '2px 5px' }}
                >
                  {unreadCount}
                </CBadge>
              )}
            </CDropdownToggle>
            <CDropdownMenu style={{ minWidth: 320 }}>
              <div className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between gap-2">
                <strong className="small">Notifications</strong>
                <CButton
                  color="primary"
                  variant="ghost"
                  size="sm"
                  className="py-0 px-1"
                  disabled={unreadCount === 0}
                  onClick={markAllRead}
                >
                  Mark all read
                </CButton>
              </div>
              {notifications.length === 0 ? (
                <div className="px-3 py-3 small text-body-secondary">No notifications.</div>
              ) : (
                notifications.map((notification) => {
                  const meta = typeMeta[notification.type] || {
                    label: prettify(notification.type),
                    color: 'secondary',
                  }
                  const unread = !notification.read_at
                  return (
                    <CDropdownItem
                      key={notification.id}
                      className="d-flex align-items-start gap-2 py-2"
                      onClick={() => navigate('/notifications')}
                    >
                      <span
                        className="rounded-circle mt-2 flex-shrink-0"
                        style={{
                          width: 8,
                          height: 8,
                          background: unread ? '#0d6efd' : 'transparent',
                        }}
                      />
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <CBadge color={meta.color}>{meta.label}</CBadge>
                        </div>
                        <div className={`small text-wrap ${unread ? 'fw-semibold' : ''}`}>
                          {describeNotification(notification)}
                        </div>
                      </div>
                    </CDropdownItem>
                  )
                })
              )}
              <CDropdownDivider className="my-0" />
              <CDropdownItem className="text-center small text-primary" onClick={() => navigate('/notifications')}>
                View all
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>

          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>

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

          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>

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
