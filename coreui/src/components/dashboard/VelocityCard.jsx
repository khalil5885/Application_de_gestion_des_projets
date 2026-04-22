import React from 'react';
import { TrendingUp } from 'lucide-react';

export function VelocityCard() {
  return (
    <div className="col-span-12 lg:col-span-7 bg-surface-container-low rounded-xl p-6 inner-border relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant mb-1">Development Velocity</p>
          <h3 className="text-4xl font-black text-primary tracking-tighter">84.2<span className="text-lg font-medium ml-1">pts/wk</span></h3>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded">
          <TrendingUp className="w-4 h-4" />
          12%
        </div>
      </div>
      {/* Sparkline Mockup */}
      <div className="h-24 w-full flex items-end gap-1.5 mt-4">
        <div className="flex-1 bg-primary/10 rounded-t h-[40%]"></div>
        <div className="flex-1 bg-primary/10 rounded-t h-[60%]"></div>
        <div className="flex-1 bg-primary/15 rounded-t h-[45%]"></div>
        <div className="flex-1 bg-primary/20 rounded-t h-[70%]"></div>
        <div className="flex-1 bg-primary/25 rounded-t h-[55%]"></div>
        <div className="flex-1 bg-primary/40 rounded-t h-[85%]"></div>
        <div className="flex-1 bg-primary rounded-t h-[100%] shadow-[0_0_15px_rgba(0,219,233,0.3)]"></div>
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
    </div>
  );
}
