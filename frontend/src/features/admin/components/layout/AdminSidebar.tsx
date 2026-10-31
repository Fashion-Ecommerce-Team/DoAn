'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, LogOut, X, Sparkles } from 'lucide-react';
import { ADMIN_NAVIGATION } from '../../constants/adminNavigation';
import { cn } from '@/utils';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function AdminSidebar({ mobileOpen = false, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-700 border-r border-slate-200/80 shadow-[2px_0_12px_rgba(0,0,0,0.02)] select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between bg-white">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0099FF] via-[#0088e6] to-[#0077cc] flex items-center justify-center font-black text-white shadow-md shadow-[#0099FF]/25 ring-2 ring-sky-100 group-hover:scale-105 transition-all duration-200">
            <span className="text-base tracking-wider">S</span>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-[15px] tracking-tight">
                SEEME
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-[#0077cc] border border-sky-200 shadow-xs">
                PRO
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Trung tâm quản trị</span>
          </div>
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List Grouped */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        {ADMIN_NAVIGATION.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1.5">
            <div className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>{group.groupTitle}</span>
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isDashboard = item.href === '/admin';
                const isActive = isDashboard
                  ? pathname === '/admin'
                  : pathname === item.href || pathname?.startsWith(`${item.href}/`);

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={onCloseMobile}
                      className={cn(
                        'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group relative',
                        isActive
                          ? 'bg-gradient-to-r from-[#0099FF] via-[#0088e6] to-[#0077cc] text-white shadow-md shadow-[#0099FF]/25 border border-[#0099FF]/30'
                          : 'text-slate-600 hover:text-[#0099FF] hover:bg-sky-50/70'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'w-4 h-4 transition-transform group-hover:scale-110 flex-shrink-0',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#0099FF]'
                        )}
                      />
                      <span className="truncate flex-1">{item.name}</span>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Admin Profile Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0099FF] to-[#0077cc] flex items-center justify-center text-white font-bold text-xs ring-2 ring-sky-100 shadow-xs flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-slate-900 truncate">Administrator</p>
              <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0" />
            </div>
            <p className="text-[10px] text-slate-400 truncate">admin@system.local</p>
          </div>
          <Link
            href="/"
            title="Quay lại Shop"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 hidden md:flex md:flex-col fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
