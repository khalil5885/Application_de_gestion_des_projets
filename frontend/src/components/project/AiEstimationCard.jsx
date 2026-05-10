import React, { useMemo, useState } from 'react'
import { CBadge, CButton, CCard, CCardBody, CCol, CRow, CSpinner } from '@coreui/react'
import api from '../../api'

const RISK_COLORS = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
}

const getEstimation = (project) =>
  project?.ai_estimation ||
  project?.estimation ||
  project?.aiEstimation || {
    estimated_days: project?.estimated_days,
    risk_level: project?.risk_level,
    ai_comment: project?.ai_comment,
  }

const AiEstimationCard = ({ project, onRecalculated, showRecalculate = true }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const estimation = useMemo(() => getEstimation(project), [project])

  const riskLevel = (estimation?.risk_level || 'low').toLowerCase()
  const estimatedDays = estimation?.estimated_days ?? estimation?.days ?? null
  const comment = estimation?.ai_comment || estimation?.comment || estimation?.summary
  const confidence =
    estimation?.confidence ?? estimation?.confidence_level ?? project?.ai_confidence ?? null

  const handleRecalculate = async () => {
    if (!project?.id) return

    setLoading(true)
    setError(null)
    try {
      const response = await api.post(`/api/admin/projects/${project.id}/estimate`)
      onRecalculated?.(response.data?.data || response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to recalculate estimation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CCard className="border-0 shadow-sm mb-4">
      <CCardBody>
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
          <div>
            <h5 className="fw-bold mb-1">AI Estimation</h5>
            <div className="small text-body-secondary">Projected effort and delivery risk</div>
          </div>
          {showRecalculate && (
            <CButton
              color="primary"
              variant="outline"
              size="sm"
              onClick={handleRecalculate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Recalculating...
                </>
              ) : (
                'Recalculate'
              )}
            </CButton>
          )}
        </div>

        {error && <div className="text-danger small mb-3">{error}</div>}

        <CRow className="g-3">
          <CCol md={3}>
            <div className="rounded-3 p-3 h-100" style={{ background: 'var(--cui-secondary-bg)' }}>
              <div className="small text-body-secondary mb-1">Estimated days</div>
              <div className="fs-4 fw-bold">{estimatedDays ?? '-'}</div>
            </div>
          </CCol>
          <CCol md={3}>
            <div className="rounded-3 p-3 h-100" style={{ background: 'var(--cui-secondary-bg)' }}>
              <div className="small text-body-secondary mb-2">Risk level</div>
              <CBadge color={RISK_COLORS[riskLevel] || 'secondary'} className="px-3 py-2">
                {riskLevel}
              </CBadge>
            </div>
          </CCol>
          <CCol md={3}>
            <div className="rounded-3 p-3 h-100" style={{ background: 'var(--cui-secondary-bg)' }}>
              <div className="small text-body-secondary mb-1">Confidence</div>
              <div className="fs-4 fw-bold">{confidence !== null ? `${confidence}%` : '-'}</div>
            </div>
          </CCol>
          <CCol md={3}>
            <div className="rounded-3 p-3 h-100" style={{ background: 'var(--cui-secondary-bg)' }}>
              <div className="small text-body-secondary mb-1">AI reasoning</div>
              <p className="small mb-0" style={{ lineHeight: 1.6 }}>
                {comment || 'No estimation comment available yet.'}
              </p>
            </div>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>
  )
}

export default AiEstimationCard
