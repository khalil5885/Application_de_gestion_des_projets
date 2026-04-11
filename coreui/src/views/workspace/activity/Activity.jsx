import React from 'react'
import { CCard, CCardBody, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilHistory, cilUser, cilBriefcase, cilTask, cilTrash, cilPlus } from '@coreui/icons'
import { motion } from 'motion/react'

// ─── Mock activity data ───────────────────────────────────────────────────────
// Replace with real API data when your activity/audit log endpoint is ready

const MOCK_ACTIVITY = [
  { id: 1,  type: 'project_created', actor: 'khalil admin',  target: 'webdesign',             time: '2 hours ago',  color: '#22c55e', icon: cilPlus },
  { id: 2,  type: 'task_assigned',   actor: 'khalil admin',  target: 'Develop Login Component', time: '3 hours ago', color: '#3b82f6', icon: cilTask },
  { id: 3,  type: 'user_created',    actor: 'khalil admin',  target: 'khalil client',          time: '5 hours ago',  color: '#9333ea', icon: cilUser },
  { id: 4,  type: 'project_created', actor: 'khalil admin',  target: 'kit pro max',            time: 'Yesterday',    color: '#22c55e', icon: cilBriefcase },
  { id: 5,  type: 'task_deleted',    actor: 'khalil admin',  target: 'Fix navbar bug',         time: 'Yesterday',    color: '#e55353', icon: cilTrash },
  { id: 6,  type: 'user_created',    actor: 'khalil admin',  target: 'alil',                   time: '2 days ago',   color: '#9333ea', icon: cilUser },
]

const TYPE_LABELS = {
  project_created: 'created project',
  task_assigned:   'assigned task',
  task_deleted:    'deleted task',
  user_created:    'added user',
}

// ─── Component ────────────────────────────────────────────────────────────────

const Activity = () => (
  <div>
    {/* Header */}
    <div className="d-flex align-items-center gap-3 mb-5">
      <div style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(88,86,214,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CIcon icon={cilHistory} style={{ color: '#5856d6', fontSize: 20 }} />
      </div>
      <div>
        <h4 className="fw-black mb-0" style={{ letterSpacing: '-0.3px' }}>Activity</h4>
        <p className="text-body-secondary small mb-0">Recent actions across the platform.</p>
      </div>
    </div>

    <div style={{ maxWidth: 640 }}>
      <CCard className="border-0 shadow-sm">
        <CCardBody className="p-4">

          <div className="d-flex align-items-center justify-content-between mb-4">
            <span className="fw-bold small">Recent Activity</span>
            <CBadge color="secondary">{MOCK_ACTIVITY.length} events</CBadge>
          </div>

          {/* Timeline */}
          <div style={{ position: 'relative' }}>
            {/* Vertical line */}
            <div style={{
              position: 'absolute', left: 19, top: 0, bottom: 0,
              width: 2, background: 'var(--cui-border-color-translucent)',
            }} />

            <div className="d-flex flex-column gap-4">
              {MOCK_ACTIVITY.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.25 }}
                  style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
                >
                  {/* Icon dot */}
                  <div style={{
                    width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                    background: `${item.color}18`,
                    border: `1.5px solid ${item.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1, position: 'relative',
                  }}>
                    <CIcon icon={item.icon} size="sm" style={{ color: item.color }} />
                  </div>

                  {/* Content */}
                  <div style={{
                    flex: 1, padding: '10px 14px', borderRadius: 12,
                    background: 'var(--cui-secondary-bg)',
                    border: '1px solid var(--cui-border-color-translucent)',
                  }}>
                    <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                      <strong>{item.actor}</strong>
                      {' '}
                      <span style={{ color: 'var(--cui-secondary-color)' }}>{TYPE_LABELS[item.type]}</span>
                      {' '}
                      <span
                        style={{
                          background: `${item.color}15`,
                          color: item.color,
                          borderRadius: 6,
                          padding: '1px 7px',
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        {item.target}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--cui-secondary-color)', marginTop: 4 }}>
                      {item.time}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Coming soon note */}
          <div
            className="text-center mt-5 pt-4"
            style={{ borderTop: '1px solid var(--cui-border-color-translucent)' }}
          >
            <p className="text-body-secondary small mb-0">
              Live activity logging from the API coming soon.
            </p>
          </div>

        </CCardBody>
      </CCard>
    </div>
  </div>
)

export default Activity