'use client';

import { useState } from 'react';
import AdminSidebar from '@/features/admin/components/layout/AdminSidebar';
import AdminHeader from '@/features/admin/components/layout/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Sidebar: Fixed on desktop, Drawer on mobile */}
      <AdminSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Container: Offset by 64 (16rem = 256px) on md+ */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Sticky Header with breadcrumbs and actions */}
        <AdminHeader onOpenMobileSidebar={() => setMobileOpen(true)} />

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
