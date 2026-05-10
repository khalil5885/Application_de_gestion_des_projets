import React from 'react';

export function RiskCard() {
  return (
    <div className="col-span-12 lg:col-span-5 bg-surface-container-low rounded-xl p-6 inner-border flex items-center gap-8">
      <div className="relative w-32 h-32 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path className="stroke-surface-container-highest" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3"></path>
          <path className="stroke-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="24, 100" strokeLinecap="round" strokeWidth="3"></path>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-secondary">24%</span>
          <span className="text-[8px] uppercase tracking-widest text-on-surface-variant font-bold">Risk</span>
        </div>
      </div>
      <div className="flex-1">
        <p className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant mb-2">Risk Mitigation</p>
        <h4 className="text-lg font-bold text-on-surface leading-tight mb-3">Resource Bottlenecks identified in Sprint 14</h4>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Backend Latency
          </li>
          <li className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span> QA Backlog (3 Pending)
          </li>
        </ul>
      </div>
    </div>
  );
}
