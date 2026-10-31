'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/features/auth/authSlice';
import { authApi } from '@/features/auth/services/auth.api';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Vui lòng điền đầy đủ email và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      dispatch(setCredentials(data));
      toast.success(`Chào mừng ${data.user.fullName || 'bạn'} đã quay trở lại!`);
      
      setTimeout(() => {
        router.push(redirectUrl);
      }, 300);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message ||
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.error ||
        'Email hoặc mật khẩu không chính xác!';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-neutral-50/50">
      <div className="max-w-md w-full bg-white border border-neutral-200 p-8 sm:p-10 shadow-xs relative">
        {/* Brand Header */}
        <div className="text-center pb-6 border-b border-neutral-100">
          <Link href="/" className="inline-block group mb-2">
            <span className="text-2xl font-black font-sans uppercase tracking-tight text-neutral-950">
              SEEME®
            </span>
            <span className="block text-[9px] font-mono tracking-widest text-neutral-500 lowercase -mt-1">
              madeinvietnam
            </span>
          </Link>
          <h1 className="text-lg font-bold uppercase tracking-wider text-neutral-900 mt-2">
            Đăng Nhập Tài Khoản
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Truy cập tài khoản để theo dõi đơn hàng và danh sách yêu thích
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              Email *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:border-black focus:bg-white focus:outline-none transition-all placeholder:text-neutral-400"
                placeholder="tenban@gmail.com"
                autoComplete="email"
              />
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                Mật Khẩu *
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-9 pr-10 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:border-black focus:bg-white focus:outline-none transition-all placeholder:text-neutral-400"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang đăng nhập...
                </span>
              ) : (
                <>
                  <span>Đăng Nhập</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Assurance badges */}
        <div className="mt-6 pt-5 border-t border-neutral-100 flex items-center justify-center gap-2 text-[11px] text-neutral-400">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Bảo mật thông tin & thanh toán an toàn SEEME®</span>
        </div>

        {/* Footer Link to Register */}
        <div className="mt-6 text-center text-xs text-neutral-600">
          Chưa có tài khoản SEEME?{' '}
          <Link
            href={`/register${redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
            className="font-bold text-black underline underline-offset-4 hover:opacity-75 transition-opacity"
          >
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
