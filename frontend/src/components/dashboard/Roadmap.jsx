import React from 'react';

export function Roadmap() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-on-surface">Sprint Roadmap</h3>
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-black text-on-surface-variant">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary"></div> In Progress
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-tertiary-container border border-outline-variant/30"></div> Upcoming
          </div>
        </div>
      </div>
      <div className="bg-surface-container-low rounded-xl p-6 inner-border overflow-x-auto custom-scrollbar">
        <div className="min-w-[800px]">
          {/* Timeline Header */}
          <div className="grid grid-cols-12 mb-4 border-b border-outline-variant/10 pb-4">
            <div className="col-span-3 text-[10px] uppercase tracking-widest font-black text-on-surface-variant">Workstream</div>
            <div className="col-span-9 grid grid-cols-4 text-center">
              <div className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant">Week 42</div>
              <div className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant">Week 43</div>
              <div className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant">Week 44</div>
              <div className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant">Week 45</div>
            </div>
          </div>
          {/* Gantt Rows */}
          <div className="space-y-6">
            {/* Row 1 */}
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-3">
                <p className="text-xs font-bold text-on-surface">Infrastructure Alpha</p>
                <p className="text-[10px] text-on-surface-variant">DevOps Team</p>
              </div>
              <div className="col-span-9 relative h-8 flex items-center">
                <div className="absolute inset-0 grid grid-cols-4 h-full pointer-events-none">
                  <div className="border-l border-outline-variant/10 h-full"></div>
                  <div className="border-l border-outline-variant/10 h-full"></div>
                  <div className="border-l border-outline-variant/10 h-full"></div>
                  <div className="border-l border-outline-variant/10 h-full"></div>
                </div>
                <div className="absolute left-0 w-[45%] h-6 bg-primary rounded-md inner-border flex items-center px-3 z-10 shadow-[0_4px_12px_rgba(0,219,233,0.15)] group cursor-pointer transition-transform hover:scale-[1.01]">
                  <span className="text-[9px] font-black uppercase text-on-primary truncate">Security Audit Phase 1</span>
                </div>
                <div className="absolute left-[47%] w-[30%] h-6 bg-tertiary-container border border-outline-variant/30 rounded-md flex items-center px-3 cursor-pointer hover:bg-surface-container-high transition-colors">
                  <span className="text-[9px] font-black uppercase text-on-surface-variant truncate">Cloud Migration</span>
                </div>
              </div>
            </div>
            {/* Row 2 */}
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-3">
                <p className="text-xs font-bold text-on-surface">Customer Portal</p>
                <p className="text-[10px] text-on-surface-variant">UX/Frontend</p>
              </div>
              <div className="col-span-9 relative h-8 flex items-center">
                <div className="absolute inset-0 grid grid-cols-4 h-full pointer-events-none">
                  <div className="border-l border-outline-variant/10 h-full"></div>
                  <div className="border-l border-outline-variant/10 h-full"></div>
                  <div className="border-l border-outline-variant/10 h-full"></div>
                  <div className="border-l border-outline-variant/10 h-full"></div>
                </div>
                <div className="absolute left-[15%] w-[40%] h-6 bg-primary rounded-md inner-border flex items-center px-3 z-10 shadow-[0_4px_12px_rgba(0,219,233,0.15)] cursor-pointer hover:scale-[1.01] transition-transform">
                  <span className="text-[9px] font-black uppercase text-on-primary truncate">Dashboard Refinement</span>
                </div>
                <div className="absolute left-[58%] w-[25%] h-6 bg-tertiary-container border border-outline-variant/30 rounded-md flex items-center px-3 cursor-pointer hover:bg-surface-container-high transition-colors">
                  <span className="text-[9px] font-black uppercase text-on-surface-variant truncate">Bento Layouts</span>
                </div>
              </div>
            </div>
            {/* Row 3 */}
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-3">
                <p className="text-xs font-bold text-on-surface">Data Engine</p>
                <p className="text-[10px] text-on-surface-variant">ML Ops</p>
              </div>
              <div className="col-span-9 relative h-8 flex items-center">
                <div className="absolute inset-0 grid grid-cols-4 h-full pointer-events-none">
                  <div className="border-l border-outline-variant/10 h-full"></div>
                  <div className="border-l border-outline-variant/10 h-full"></div>
                  <div className="border-l border-outline-variant/10 h-full"></div>
                  <div className="border-l border-outline-variant/10 h-full"></div>
                </div>
                <div className="absolute left-[5%] w-[25%] h-6 bg-primary rounded-md inner-border flex items-center px-3 z-10 shadow-[0_4px_12px_rgba(0,219,233,0.15)] cursor-pointer hover:scale-[1.01] transition-transform">
                  <span className="text-[9px] font-black uppercase text-on-primary truncate">LLM Fine-tuning</span>
                </div>
                <div className="absolute left-[33%] w-[55%] h-6 bg-tertiary-container border border-outline-variant/30 rounded-md flex items-center px-3 cursor-pointer hover:bg-surface-container-high transition-colors">
                  <span className="text-[9px] font-black uppercase text-on-surface-variant truncate">vector db implementation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
