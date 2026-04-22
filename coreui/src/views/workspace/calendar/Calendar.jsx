import React, { useState, useMemo, memo } from 'react'
import { CCard, CCardBody, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCalendar, cilArrowLeft, cilArrowRight } from '@coreui/icons'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const STATUS_COLORS = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#22c55e',
  on_hold: '#6b7280',
}

const ProjectCalendar = memo(({ projects = [] }) => {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState(null)

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const days = []
    
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    
    return days
  }, [currentMonth, currentYear])

  const getProjectsForDay = (day) => {
    if (!day) return []
    const date = new Date(currentYear, currentMonth, day)
    return projects.filter(p => {
      const start = p.start_date ? new Date(p.start_date) : null
      const end = p.end_date ? new Date(p.end_date) : null
      return (start && isSameDay(start, date)) || (end && isSameDay(end, date))
    })
  }

  const isSameDay = (a, b) => 
    a.getDate() === b.getDate() && 
    a.getMonth() === b.getMonth() && 
    a.getFullYear() === b.getFullYear()

  const navigate = (dir) => {
    if (dir === -1) {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(y => y - 1)
      } else {
        setCurrentMonth(m => m - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(y => y + 1)
      } else {
        setCurrentMonth(m => m + 1)
      }
    }
  }

  const isToday = (day) => {
    if (!day) return false
    return isSameDay(new Date(currentYear, currentMonth, day), today)
  }

  const isSelected = (day) => {
    if (!day || !selectedDate) return false
    return isSameDay(new Date(currentYear, currentMonth, day), selectedDate)
  }

  return (
    <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
      <CCardBody className="p-4">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-2">
            <div 
              className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-3"
              style={{ width: 40, height: 40 }}
            >
              <CIcon icon={cilCalendar} className="text-primary" />
            </div>
            <h5 className="fw-bold mb-0" style={{ fontSize: '1.1rem' }}>
              {MONTHS[currentMonth]} {currentYear}
            </h5>
          </div>
          <div className="d-flex gap-1">
            <button 
              className="btn btn-light btn-sm" 
              onClick={() => navigate(-1)}
              style={{ borderRadius: 8, width: 32, height: 32, padding: 0 }}
            >
              <CIcon icon={cilArrowLeft} size="sm" />
            </button>
            <button 
              className="btn btn-light btn-sm" 
              onClick={() => navigate(1)}
              style={{ borderRadius: 8, width: 32, height: 32, padding: 0 }}
            >
              <CIcon icon={cilArrowRight} size="sm" />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="d-grid mb-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {DAYS.map(d => (
            <div key={d} className="text-center small fw-bold text-muted" style={{ fontSize: 11 }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />
            
            const dayProjects = getProjectsForDay(day)
            const hasEvents = dayProjects.length > 0
            
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                className="position-relative"
                style={{
                  aspectRatio: '1',
                  borderRadius: 10,
                  border: 'none',
                  background: isSelected(day) 
                    ? 'linear-gradient(135deg, #5856d6, #7c3aed)'
                    : isToday(day)
                      ? '#dbeafe'
                      : hasEvents
                        ? '#f8fafc'
                        : 'transparent',
                  color: isSelected(day) ? '#fff' : isToday(day) ? '#1d4ed8' : '#374151',
                  fontWeight: isToday(day) || isSelected(day) ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!isSelected(day)) e.currentTarget.style.background = '#f3f4f6'
                }}
                onMouseLeave={e => {
                  if (!isSelected(day)) {
                    e.currentTarget.style.background = isToday(day) ? '#dbeafe' : hasEvents ? '#f8fafc' : 'transparent'
                  }
                }}
              >
                {day}
                {hasEvents && (
                  <div 
                    className="position-absolute d-flex gap-1 justify-content-center"
                    style={{ bottom: 4, left: 0, right: 0 }}
                  >
                    {dayProjects.slice(0, 3).map((p, i) => (
                      <span 
                        key={i}
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: STATUS_COLORS[p.status] || '#9ca3af',
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected Day Events */}
        {selectedDate && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #e5e7eb' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="fw-semibold small">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
              <button 
                className="btn btn-link btn-sm p-0 text-decoration-none"
                onClick={() => setSelectedDate(null)}
              >
                Clear
              </button>
            </div>
            <div className="d-flex flex-column gap-2">
              {getProjectsForDay(selectedDate.getDate()).length === 0 ? (
                <span className="text-muted small">No events</span>
              ) : (
                getProjectsForDay(selectedDate.getDate()).map(p => (
                  <div 
                    key={p.id}
                    className="d-flex align-items-center gap-2 p-2 rounded-2"
                    style={{ background: '#f9fafb', fontSize: 12 }}
                  >
                    <span 
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: STATUS_COLORS[p.status],
                        flexShrink: 0,
                      }}
                    />
                    <span className="fw-medium text-truncate">{p.name}</span>
                    <CBadge 
                      color={p.status === 'completed' ? 'success' : p.status === 'in_progress' ? 'primary' : 'warning'}
                      style={{ fontSize: 9, marginLeft: 'auto' }}
                    >
                      {p.progress}%
                    </CBadge>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CCardBody>
    </CCard>
  )
})

export default ProjectCalendar