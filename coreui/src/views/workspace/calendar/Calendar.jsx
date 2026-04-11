import React, { useState, useEffect, useCallback } from 'react'
import { CCard, CCardBody, CBadge, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCalendar, cilClock, cilBriefcase } from '@coreui/icons'
import { motion } from 'motion/react'
import api from '../../../api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS  = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const STATUS_COLORS = {
  pending:     '#f59e0b',
  in_progress: '#3b82f6',
  completed:   '#22c55e',
  on_hold:     '#e55353',
}

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth()    === b.getMonth()    &&
  a.getDate()     === b.getDate()

// ─── Component ────────────────────────────────────────────────────────────────

const Calendar = () => {
  const today = new Date()
  const [current, setCurrent]   = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null) // selected date

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await api.get('/api/admin/projects')
      const data = res.data?.data
      setProjects(Array.isArray(data) ? data : data?.data ?? [])
    } catch {
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  // Build calendar grid
  const firstDay  = new Date(current.year, current.month, 1).getDay()
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate()
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : new Date(current.year, current.month, i - firstDay + 1)
  )

  const prevMonth = () => setCurrent(c => {
    const d = new Date(c.year, c.month - 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const nextMonth = () => setCurrent(c => {
    const d = new Date(c.year, c.month + 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  // Projects that start or end on a given date
  const getProjectsForDate = (date) => {
    if (!date) return []
    return projects.filter(p => {
      const start = p.start_date ? new Date(p.start_date) : null
      const end   = p.end_date   ? new Date(p.end_date)   : null
      return (start && isSameDay(start, date)) || (end && isSameDay(end, date))
    })
  }

  // Projects for selected date panel
  const selectedProjects = selected ? getProjectsForDate(selected) : []

  // Upcoming deadlines — next 7 days
  const upcoming = projects
    .filter(p => {
      if (!p.end_date) return false
      const end  = new Date(p.end_date)
      const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
      return diff >= 0 && diff <= 7
    })
    .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))

  return (
    <div>
      {/* Page header */}
      <div className="d-flex align-items-center gap-3 mb-5">
        <div style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(88,86,214,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CIcon icon={cilCalendar} style={{ color: '#5856d6', fontSize: 20 }} />
        </div>
        <div>
          <h4 className="fw-black mb-0" style={{ letterSpacing: '-0.3px' }}>Calendar</h4>
          <p className="text-body-secondary small mb-0">Project deadlines and timelines at a glance.</p>
        </div>
      </div>

      <div className="d-flex gap-4" style={{ alignItems: 'flex-start' }}>

        {/* ── Calendar Grid ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <CCard className="border-0 shadow-sm">
            <CCardBody className="p-4">

              {/* Month navigation */}
              <div className="d-flex align-items-center justify-content-between mb-4">
                <button
                  onClick={prevMonth}
                  style={{ background: 'var(--cui-secondary-bg)', border: '1px solid var(--cui-border-color-translucent)', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', color: 'var(--cui-body-color)', fontSize: 16 }}
                >
                  ‹
                </button>
                <h5 className="fw-bold mb-0">
                  {MONTHS[current.month]} {current.year}
                </h5>
                <button
                  onClick={nextMonth}
                  style={{ background: 'var(--cui-secondary-bg)', border: '1px solid var(--cui-border-color-translucent)', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', color: 'var(--cui-body-color)', fontSize: 16 }}
                >
                  ›
                </button>
              </div>

              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                {DAYS.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--cui-secondary-color)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 0' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              {loading ? (
                <div className="text-center py-5"><CSpinner color="primary" /></div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {cells.map((date, i) => {
                    if (!date) return <div key={`empty-${i}`} />
                    const dots    = getProjectsForDate(date)
                    const isToday = isSameDay(date, today)
                    const isSel   = selected && isSameDay(date, selected)

                    return (
                      <motion.button
                        key={date.toISOString()}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => setSelected(isSel ? null : date)}
                        style={{
                          aspectRatio: '1',
                          borderRadius: 10,
                          border: isSel
                            ? '2px solid #5856d6'
                            : isToday
                            ? '2px solid rgba(88,86,214,0.35)'
                            : '2px solid transparent',
                          background: isSel
                            ? 'rgba(88,86,214,0.12)'
                            : isToday
                            ? 'rgba(88,86,214,0.06)'
                            : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 3,
                          padding: 4,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{
                          fontSize: 13,
                          fontWeight: isToday || isSel ? 800 : 500,
                          color: isSel ? '#5856d6' : isToday ? '#5856d6' : 'var(--cui-body-color)',
                        }}>
                          {date.getDate()}
                        </span>
                        {/* Event dots */}
                        {dots.length > 0 && (
                          <div style={{ display: 'flex', gap: 2 }}>
                            {dots.slice(0, 3).map((p, di) => (
                              <span
                                key={di}
                                style={{
                                  width: 5, height: 5, borderRadius: '50%',
                                  background: STATUS_COLORS[p.status] || '#8a93a2',
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              )}

              {/* Selected date panel */}
              {selected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--cui-border-color-translucent)' }}
                >
                  <p className="fw-bold small mb-3" style={{ color: '#5856d6' }}>
                    {selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  {selectedProjects.length === 0 ? (
                    <p className="text-body-secondary small mb-0">No project events on this day.</p>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {selectedProjects.map(p => {
                        const isStart = p.start_date && isSameDay(new Date(p.start_date), selected)
                        return (
                          <div
                            key={p.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 12px', borderRadius: 10,
                              background: 'var(--cui-secondary-bg)',
                              border: `1px solid ${STATUS_COLORS[p.status] || '#8a93a2'}30`,
                              borderLeft: `3px solid ${STATUS_COLORS[p.status] || '#8a93a2'}`,
                            }}
                          >
                            <CIcon icon={cilBriefcase} size="sm" style={{ color: STATUS_COLORS[p.status], flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="fw-semibold" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                            </div>
                            <CBadge style={{ background: `${STATUS_COLORS[p.status]}20`, color: STATUS_COLORS[p.status], fontSize: 10 }}>
                              {isStart ? 'Starts' : 'Deadline'}
                            </CBadge>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              )}

            </CCardBody>
          </CCard>
        </div>

        {/* ── Right panel: upcoming deadlines ── */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <CCard className="border-0 shadow-sm">
            <CCardBody className="p-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <CIcon icon={cilClock} size="sm" className="text-warning" />
                <span className="fw-bold small">Upcoming Deadlines</span>
                <CBadge color="warning" className="ms-auto">{upcoming.length}</CBadge>
              </div>

              {loading ? (
                <div className="text-center py-3"><CSpinner size="sm" /></div>
              ) : upcoming.length === 0 ? (
                <p className="text-body-secondary small mb-0">No deadlines in the next 7 days.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {upcoming.map(p => {
                    const end  = new Date(p.end_date)
                    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                          padding: '10px 12px', borderRadius: 10,
                          background: 'var(--cui-secondary-bg)',
                          border: '1px solid var(--cui-border-color-translucent)',
                          borderLeft: `3px solid ${STATUS_COLORS[p.status] || '#8a93a2'}`,
                        }}
                      >
                        <div className="fw-semibold mb-1" style={{ fontSize: 13 }}>{p.name}</div>
                        <div className="d-flex align-items-center justify-content-between">
                          <span style={{ fontSize: 11, color: 'var(--cui-secondary-color)' }}>
                            {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <CBadge
                            color={diff === 0 ? 'danger' : diff <= 2 ? 'warning' : 'secondary'}
                            style={{ fontSize: 10 }}
                          >
                            {diff === 0 ? 'Today' : `${diff}d left`}
                          </CBadge>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CCardBody>
          </CCard>
        </div>
      </div>
    </div>
  )
}

export default Calendar