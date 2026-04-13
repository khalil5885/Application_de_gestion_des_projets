import React from 'react';
import { VelocityCard } from './dashboard/VelocityCard';
import { RiskCard } from './dashboard/RiskCard';
import { TaskMatrix } from './dashboard/TaskMatrix';
import { Roadmap } from './dashboard/Roadmap';

export function Dashboard() {
  return (
    <main className="ml-64 pt-24 px-8 pb-12 min-h-screen bg-surface-container-lowest">
      {/* Dashboard Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-on-surface">System Overview</h2>
          <p className="text-on-surface-variant text-sm mt-1">Real-time performance metrics for active workstreams.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-surface-container-high text-on-surface text-xs font-bold rounded-lg inner-border hover:bg-surface-container-highest transition-colors cursor-pointer">Export Report</button>
          <button className="px-4 py-2 bg-surface-container-high text-on-surface text-xs font-bold rounded-lg inner-border hover:bg-surface-container-highest transition-colors cursor-pointer">Filter View</button>
        </div>
      </div>

      {/* KPI Bento Section */}
      <div className="grid grid-cols-12 gap-6 mb-10">
        <VelocityCard />
        <RiskCard />
      </div>

      <TaskMatrix />
      <Roadmap />
    </main>
  );
}
