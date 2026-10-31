'use client';

import { Menu, Bell, ShieldCheck } from 'lucide-react';
import AdminBreadcrumb from './AdminBreadcrumb';

interface AdminHeaderProps {
  onOpenMobileSidebar: () => void;
}

export default function AdminHeader({ onOpenMobileSidebar }: AdminHeaderProps) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/70 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 shadow-xs">
      {/* Left: Mobile hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Mở menu quản trị"
        >
          <Menu className="w-5 h-5" />
        </button>

        <AdminBreadcrumb />
      </div>

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Icon */}
        <button
          type="button"
          aria-label="Thông báo hệ thống"
          className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all hover:scale-105 active:scale-95"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#0099FF] rounded-full ring-2 ring-white" />
        </button>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Admin User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-1.5 py-1 pr-2 rounded-xl hover:bg-slate-100/70 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0099FF] to-[#0077cc] text-white flex items-center justify-center font-black text-xs ring-2 ring-sky-100 shadow-xs">
            AD
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800 leading-tight">Quản trị viên</span>
            <span className="text-[10px] text-[#0099FF] font-bold flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3" /> Full Access
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
