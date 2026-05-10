import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CPlaceholder,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilChart, cilPeople, cilTask, cilWarning } from '@coreui/icons'
import api from '../../../api'
import EmployeeWorkloadCard from '../../../components/workload/EmployeeWorkloadCard'
import WorkloadStatsCards from '../../../components/workload/WorkloadStatsCards'
import {
  AssignedEmployeesChart,
  CompletionRankingChart,
  EmployeeStatusDistributionChart,
  TaskStatusOverviewChart,
} from '../../../components/workload/WorkloadCharts'
import { normalizeEmployee } from '../../../components/workload/workloadUtils'

const SkeletonGrid = () => (
  <CRow className="g-3">
    {[1, 2, 3, 4].map((item) => (
      <CCol xs={12} md={6} xl={3} key={item}>
        <CCard>
          <CCardBody>
            <CPlaceholder as="div" animation="glow">
              <CPlaceholder xs={8} className="mb-3" />
              <CPlaceholder xs={12} className="mb-2" />
              <CPlaceholder xs={10} className="mb-4" />
              <CPlaceholder xs={12} />
            </CPlaceholder>
          </CCardBody>
        </CCard>
      </CCol>
    ))}
  </CRow>
)

const WorkloadOverview = () => {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [charts, setCharts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchWorkload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/admin/workload')
      const payload = res.data?.data ?? res.data
      const items = payload?.employees ?? []
      setEmployees(Array.isArray(items) ? items.map(normalizeEmployee) : [])
      setCharts(payload?.charts ?? {})
    } catch (err) {
      console.error('Failed to fetch workload overview:', err)
      setEmployees([])
      setCharts({})
      setError(err.response?.data?.message || 'Failed to load team workload analytics.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(fetchWorkload, 0)
    return () => window.clearTimeout(timer)
  }, [fetchWorkload])

  const topEmployees = useMemo(
    () => [...employees].sort((a, b) => b.activeTasks - a.activeTasks).slice(0, 8),
    [employees],
  )

  const overviewStats = useMemo(
    () => ({
      activeTasks: employees.reduce((sum, employee) => sum + employee.activeTasks, 0),
      completedThisMonth: employees.reduce((sum, employee) => sum + employee.completedThisMonth, 0),
      overdueTasks: employees.reduce((sum, employee) => sum + employee.overdueTasks, 0),
      readyForReview: employees.reduce((sum, employee) => sum + employee.readyForReview, 0),
      averageCompletionRate: employees.length
        ? Math.round(
            employees.reduce(
              (sum, employee) =>
                sum + (employee.averageCompletionRate || employee.productivityScore || 0),
              0,
            ) / employees.length,
          )
        : 0,
    }),
    [employees],
  )

  const overloaded = employees.filter((employee) => employee.workloadLevel === 'overloaded')

  return (
    <div className="workload-page">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            <CIcon icon={cilPeople} className="me-2" />
            Team Workload
          </h4>
          <p className="text-body-secondary mb-0">
            Monitor assignments, productivity, review queues, and overload risk.
          </p>
        </div>
        <CBadge color="primary" className="px-3 py-2">
          {employees.length} employees tracked
        </CBadge>
      </div>

      {error && (
        <CAlert color="danger" className="d-flex flex-wrap align-items-center gap-2">
          <CIcon icon={cilWarning} />
          <span className="me-auto">{error}</span>
          <CButton color="danger" variant="outline" size="sm" onClick={fetchWorkload}>
            Retry
          </CButton>
        </CAlert>
      )}

      {loading ? (
        <>
          <div className="text-center py-4">
            <CSpinner color="primary" />
          </div>
          <SkeletonGrid />
        </>
      ) : (
        <>
          {overloaded.length > 0 && (
            <CAlert color="danger" className="d-flex align-items-center gap-2">
              <CIcon icon={cilWarning} />
              Potential overload detected for{' '}
              {overloaded.map((employee) => employee.name).join(', ')}.
            </CAlert>
          )}

          <WorkloadStatsCards stats={overviewStats} />

          <CRow className="g-3 mb-4">
            <CCol xs={12} lg={6}>
              <AssignedEmployeesChart
                employees={topEmployees}
                chartData={charts.most_assigned_employees}
              />
            </CCol>
            <CCol xs={12} lg={6}>
              <CompletionRankingChart chartData={charts.most_productive_employees} />
            </CCol>
            <CCol xs={12} lg={6}>
              <EmployeeStatusDistributionChart counts={charts.workload_distribution || {}} />
            </CCol>
            <CCol xs={12} lg={6}>
              <TaskStatusOverviewChart counts={charts.task_status_distribution || {}} />
            </CCol>
          </CRow>

          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h5 className="mb-1">
                <CIcon icon={cilTask} className="me-2 text-primary" />
                Employee Assignment Board
              </h5>
              <div className="small text-body-secondary">
                Click an employee to inspect assigned work and performance details.
              </div>
            </div>
            <div className="d-none d-md-flex align-items-center gap-2 text-body-secondary small">
              <CIcon icon={cilChart} />
              Sorted by current workload
            </div>
          </div>

          <CRow className="g-3">
            {topEmployees.length === 0 ? (
              <CCol xs={12}>
                <CCard>
                  <CCardBody className="text-center py-5 text-body-secondary">
                    No employee workload data available.
                  </CCardBody>
                </CCard>
              </CCol>
            ) : (
              topEmployees.map((employee) => (
                <CCol xs={12} md={6} xl={3} key={employee.id}>
                  <EmployeeWorkloadCard
                    employee={employee}
                    onClick={() => navigate(`/admin/workload/${employee.id}`)}
                  />
                </CCol>
              ))
            )}
          </CRow>
        </>
      )}
    </div>
  )
}

export default WorkloadOverview
