import React from 'react'
import PropTypes from 'prop-types'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'
import { CChartBar, CChartDoughnut, CChartLine, CChartPie } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'

const chartOptions = {
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: getStyle('--cui-body-color'),
        boxWidth: 10,
        usePointStyle: true,
      },
    },
  },
  scales: {
    x: {
      grid: { color: getStyle('--cui-border-color-translucent'), drawOnChartArea: false },
      ticks: { color: getStyle('--cui-body-color') },
    },
    y: {
      beginAtZero: true,
      grid: { color: getStyle('--cui-border-color-translucent') },
      ticks: { color: getStyle('--cui-body-color'), precision: 0 },
    },
  },
}

const doughnutOptions = {
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: getStyle('--cui-body-color'),
        boxWidth: 10,
        usePointStyle: true,
      },
    },
  },
}

const ChartFrame = ({ title, subtitle, children }) => (
  <CCard className="h-100">
    <CCardHeader>
      <div className="fw-semibold">{title}</div>
      {subtitle && <div className="small text-body-secondary fw-normal mt-1">{subtitle}</div>}
    </CCardHeader>
    <CCardBody>
      <div style={{ height: 280 }}>{children}</div>
    </CCardBody>
  </CCard>
)

ChartFrame.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
}

export const AssignedEmployeesChart = ({ employees = [], chartData }) => (
  <ChartFrame title="Most Assigned Employees" subtitle="Current active assignment load">
    <CChartBar
      data={{
        labels: chartData?.labels || employees.map((employee) => employee.name),
        datasets: [
          {
            label: 'Assigned tasks',
            backgroundColor: getStyle('--cui-primary'),
            borderRadius: 6,
            data: chartData?.data || employees.map((employee) => employee.activeTasks),
          },
        ],
      }}
      options={chartOptions}
    />
  </ChartFrame>
)

export const CompletionRankingChart = ({ employees = [], chartData }) => (
  <ChartFrame title="Task Completion Ranking" subtitle="Completed tasks this month">
    <CChartBar
      data={{
        labels: chartData?.labels || employees.map((employee) => employee.name),
        datasets: [
          {
            label: 'Completed',
            backgroundColor: getStyle('--cui-success'),
            borderRadius: 6,
            data: chartData?.data || employees.map((employee) => employee.completedThisMonth),
          },
        ],
      }}
      options={chartOptions}
    />
  </ChartFrame>
)

export const EmployeeStatusDistributionChart = ({ counts }) => (
  <ChartFrame title="Employee Status Distribution" subtitle="Workload level balance">
    <CChartDoughnut
      data={{
        labels: ['Overloaded', 'High', 'Medium', 'Low'],
        datasets: [
          {
            data: [counts.overloaded || 0, counts.high || 0, counts.medium || 0, counts.low || 0],
            backgroundColor: ['#dc2626', '#d97706', '#0891b2', '#16a34a'],
          },
        ],
      }}
      options={doughnutOptions}
    />
  </ChartFrame>
)

export const TaskStatusOverviewChart = ({ counts }) => (
  <ChartFrame title="Task Status Overview" subtitle="All assigned team tasks">
    <CChartPie
      data={{
        labels: ['To Do', 'In Progress', 'Ready for Review', 'Done', 'On Hold'],
        datasets: [
          {
            data: [
              counts.todo || 0,
              counts.in_progress || 0,
              counts.ready_for_review || 0,
              counts.done || 0,
              counts.on_hold || 0,
            ],
            backgroundColor: ['#64748b', '#0891b2', '#06b6d4', '#16a34a', '#d97706'],
          },
        ],
      }}
      options={doughnutOptions}
    />
  </ChartFrame>
)

export const MonthlyAssignmentChart = ({ activity }) => (
  <ChartFrame title="Monthly Assignment Activity" subtitle="Tasks assigned over time">
    <CChartLine
      data={{
        labels: activity.map((item) => item.label),
        datasets: [
          {
            label: 'Assigned tasks',
            data: activity.map((item) => item.count),
            borderColor: getStyle('--cui-primary'),
            backgroundColor: 'rgba(8, 145, 178, 0.12)',
            fill: true,
            tension: 0.35,
          },
        ],
      }}
      options={chartOptions}
    />
  </ChartFrame>
)

export const TaskStatusBreakdownChart = ({ counts }) => (
  <ChartFrame title="Task Status Breakdown" subtitle="Current assignment state">
    <CChartPie
      data={{
        labels: ['To Do', 'In Progress', 'Ready for Review', 'Done'],
        datasets: [
          {
            data: [
              counts.todo || 0,
              counts.in_progress || 0,
              counts.ready_for_review || 0,
              counts.done || 0,
            ],
            backgroundColor: ['#64748b', '#0891b2', '#06b6d4', '#16a34a'],
          },
        ],
      }}
      options={doughnutOptions}
    />
  </ChartFrame>
)

export const PriorityDistributionChart = ({ counts }) => (
  <ChartFrame title="Priority Distribution" subtitle="Risk pressure by task priority">
    <CChartDoughnut
      data={{
        labels: ['Low', 'Medium', 'High'],
        datasets: [
          {
            data: [counts.low || 0, counts.medium || 0, counts.high || 0],
            backgroundColor: ['#16a34a', '#d97706', '#dc2626'],
          },
        ],
      }}
      options={doughnutOptions}
    />
  </ChartFrame>
)

AssignedEmployeesChart.propTypes = { employees: PropTypes.array, chartData: PropTypes.object }
CompletionRankingChart.propTypes = { employees: PropTypes.array, chartData: PropTypes.object }
EmployeeStatusDistributionChart.propTypes = { counts: PropTypes.object.isRequired }
TaskStatusOverviewChart.propTypes = { counts: PropTypes.object.isRequired }
MonthlyAssignmentChart.propTypes = { activity: PropTypes.array.isRequired }
TaskStatusBreakdownChart.propTypes = { counts: PropTypes.object.isRequired }
PriorityDistributionChart.propTypes = { counts: PropTypes.object.isRequired }
