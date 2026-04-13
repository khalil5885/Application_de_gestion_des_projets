import React from 'react';
import { Package, LayoutDashboard, Briefcase, Calendar, Users, BarChart2, Settings, Plus, HelpCircle, LogOut } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col bg-[#191c22] shadow-[4px_0_24px_-4px_rgba(11,14,20,0.6)] z-50">
      <div className="flex flex-col h-full py-6">
        {/* Brand Anchor */}
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-on-primary-container flex items-center justify-center inner-border">
            <Package className="text-on-primary-fixed w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-[#00dbe9]">Midnight Exec</h1>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Precision PM</p>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 px-3 space-y-1">
          <a className="flex items-center gap-3 px-3 py-2.5 font-sans tracking-tight text-sm font-medium rounded-md transition-all duration-200 bg-[#272a31] text-[#00dbe9] border-r-2 border-[#00dbe9]" href="#">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 font-sans tracking-tight text-sm font-medium rounded-md transition-all duration-200 text-[#c6c6cd] hover:bg-[#272a31] hover:text-white" href="#">
            <Briefcase className="w-5 h-5" />
            Projects
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 font-sans tracking-tight text-sm font-medium rounded-md transition-all duration-200 text-[#c6c6cd] hover:bg-[#272a31] hover:text-white" href="#">
            <Calendar className="w-5 h-5" />
            Timeline
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 font-sans tracking-tight text-sm font-medium rounded-md transition-all duration-200 text-[#c6c6cd] hover:bg-[#272a31] hover:text-white" href="#">
            <Users className="w-5 h-5" />
            Team
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 font-sans tracking-tight text-sm font-medium rounded-md transition-all duration-200 text-[#c6c6cd] hover:bg-[#272a31] hover:text-white" href="#">
            <BarChart2 className="w-5 h-5" />
            Resources
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 font-sans tracking-tight text-sm font-medium rounded-md transition-all duration-200 text-[#c6c6cd] hover:bg-[#272a31] hover:text-white" href="#">
            <Settings className="w-5 h-5" />
            Settings
          </a>
        </nav>

        {/* CTA */}
        <div className="px-4 mt-6">
          <button className="w-full py-2.5 bg-primary text-on-primary font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all inner-border shadow-lg shadow-primary/10">
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Footer Nav */}
        <div className="mt-auto px-3 pt-6 space-y-1">
          <a className="flex items-center gap-3 px-3 py-2 text-[#c6c6cd] font-sans text-sm hover:text-white transition-colors" href="#">
            <HelpCircle className="w-5 h-5" />
            Support
          </a>
          <div className="px-3 pt-4 flex items-center gap-3">
            <img alt="Executive Profile" className="w-8 h-8 rounded-full bg-surface-container-highest inner-border" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDm-m8d-LNuBVSbg95dwanr-k58pHZSSHR-wo7hZhAoWsuXr3Je7C_0OIHqUcMx3d6U4kzm2Lk9lgUrIDqlpu2BTz0_JW_jGWMBF3esvvgm-3fLwQp4JUSRSNi6ApCoZ4qzz4bpjWbNyXgliD0_dYUskoIAj6K3W4UeWtQvVexODHelHZjanskEAGgzbGbLMpv9kPwPWYfKa1LtRWF3ekq8GJuiEbYehnpTyfa5e98rRbhtMYkzBHveDerPJxqqizmbdz9KhZ3qarU" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">Alex Sterling</p>
              <p className="text-[10px] text-on-surface-variant truncate">alex@midnight.io</p>
            </div>
            <button className="text-[#c6c6cd] hover:text-error transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
