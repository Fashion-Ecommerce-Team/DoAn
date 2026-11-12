'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setCredentials, isAdminRole, AuthUser } from '@/features/auth/authSlice';
import { toast } from 'sonner';
import AdminSidebar from '@/features/admin/components/layout/AdminSidebar';
import AdminHeader from '@/features/admin/components/layout/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      toast.error('Vui lòng đăng nhập bằng tài khoản Quản trị viên để tiếp tục');
      router.replace('/login?redirect=/admin');
      return;
    }

    try {
      const user: AuthUser = JSON.parse(userStr);
      dispatch(setCredentials({ user, token }));

      if (!isAdminRole(user.role)) {
        toast.error('Tài khoản của bạn không có quyền truy cập trang Quản trị!');
        router.replace('/');
        return;
      }

      setAuthorized(true);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.replace('/login?redirect=/admin');
    }
  }, [dispatch, router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-600">
        <span className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-wider">Đang kiểm tra quyền truy cập Quản trị viên...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
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
