import React from 'react';
import { Search, Bell, MessageSquare, ChevronDown } from 'lucide-react';

export function TopBar() {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 z-40 bg-[#272a31]/70 backdrop-blur-xl flex items-center justify-between px-8 shadow-sm">
      <div className="flex items-center gap-8 flex-1">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4 group-focus-within:text-primary transition-colors" />
          <input className="w-full bg-surface-container-lowest border-none rounded-lg pl-10 pr-4 py-2 text-xs font-medium focus:ring-2 focus:ring-[#00dbe9]/30 transition-all placeholder:text-on-surface-variant/50 outline-none text-on-surface" placeholder="Search projects or command (Ctrl+K)" type="text" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-container-highest text-[10px] font-mono">⌘</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-surface-container-highest text-[10px] font-mono">K</kbd>
          </div>
        </div>
        <nav className="hidden lg:flex items-center gap-6">
          <a className="font-sans text-xs uppercase tracking-widest font-bold text-[#00dbe9] border-b-2 border-[#00dbe9] pb-1" href="#">Overview</a>
          <a className="font-sans text-xs uppercase tracking-widest font-bold text-[#c6c6cd] hover:text-white transition-colors" href="#">Analytics</a>
          <a className="font-sans text-xs uppercase tracking-widest font-bold text-[#c6c6cd] hover:text-white transition-colors" href="#">Activity</a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-surface-container-high"></span>
        </button>
        <button className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors">
          <MessageSquare className="w-5 h-5" />
        </button>
        <div className="h-8 w-px bg-outline-variant/30 mx-2"></div>
        <button className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden inner-border">
            <img alt="Account" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYob0dkKI39wd6fyD6E61PINS02x-_ZaXcVSTcAT9PgsfmjE5KorB-D1eq9n7RcA01Aqo7HnL7tsekk0yXkIIk5AuU0RVuETyKNRODcxI6F-TVtNAj7Y0fgVpLxVMzLEGzEgA4Va9SKXLPu-a4UN45Jt4IVUt8BtpJPK_MWqpBqXfkd1gVrYLkXRj9KwTthmUv3p92Ek7pakqWvFdrDUp7qJtlFTK8DSM_hE03clRn9NkdjapDPJwQPQL1UXpeMLLfZ_XyDapY6gw" />
          </div>
          <ChevronDown className="w-5 h-5 text-on-surface-variant group-hover:text-white transition-colors" />
        </button>
      </div>
    </header>
  );
}
