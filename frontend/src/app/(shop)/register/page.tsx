'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/features/auth/services/auth.api';
import { Eye, EyeOff, ArrowRight, User, Mail, Phone, Lock, CheckCircle2, AlertCircle, X } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // 1. Validate Full Name
    if (!formData.fullName.trim()) {
      setFeedback({ type: 'error', message: 'Vui lòng nhập họ và tên của bạn' });
      return;
    }

    // 2. Validate Email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email.trim())) {
      setFeedback({ type: 'error', message: 'Email không hợp lệ (ví dụ: user@example.com)' });
      return;
    }

    // 3. Validate Phone Number (Spring Boot requires ^0[0-9]{9}$)
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      setFeedback({ type: 'error', message: 'Số điện thoại phải bắt đầu bằng số 0 và bao gồm đúng 10 chữ số' });
      return;
    }

    // 4. Validate Password Length
    if (formData.password.length < 6) {
      setFeedback({ type: 'error', message: 'Mật khẩu cần tối thiểu 6 ký tự' });
      return;
    }

    // 5. Validate Password Match
    if (formData.password !== formData.confirmPassword) {
      setFeedback({ type: 'error', message: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    if (!agreeTerms) {
      setFeedback({ type: 'error', message: 'Vui lòng đồng ý với điều khoản sử dụng của SEEME' });
      return;
    }

    setLoading(true);
    try {
      const message = await authApi.register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
      });

      setFeedback({
        type: 'success',
        message: message || 'Đăng ký tài khoản thành công! Đang chuyển sang trang đăng nhập...',
      });
      
      setTimeout(() => {
        router.push(`/login${redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`);
      }, 600);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message ||
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.error ||
        'Đăng ký không thành công. Email hoặc số điện thoại có thể đã được đăng ký.';
      setFeedback({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-neutral-50/50">
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
            Tạo Tài Khoản Mới
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Đăng ký để nhận thông báo sớm các bộ sưu tập giới hạn
          </p>
        </div>

        {/* Inline Status Banner */}
        {feedback && (
          <div
            role="status"
            className={`mt-5 p-3 rounded-xs border text-xs font-medium flex items-start justify-between gap-2.5 animate-in fade-in duration-150 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <div className="flex items-start gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-current opacity-60 hover:opacity-100 transition-opacity shrink-0"
              aria-label="Đóng thông báo"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Register Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              Họ và tên *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:border-black focus:bg-white focus:outline-none transition-all placeholder:text-neutral-400"
                placeholder="Nguyễn Văn A"
              />
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          {/* Email */}
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
                placeholder="example@gmail.com"
                autoComplete="email"
              />
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              Số điện thoại *
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:border-black focus:bg-white focus:outline-none transition-all placeholder:text-neutral-400"
                placeholder="0912345678"
                maxLength={10}
              />
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">Định dạng: 10 chữ số bắt đầu bằng số 0</p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              Mật khẩu *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-9 pr-10 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:border-black focus:bg-white focus:outline-none transition-all placeholder:text-neutral-400"
                placeholder="Ít nhất 6 ký tự"
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              Xác nhận mật khẩu *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-9 pr-10 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:border-black focus:bg-white focus:outline-none transition-all placeholder:text-neutral-400"
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
              />
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors"
                title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 h-3.5 w-3.5 accent-black rounded-xs border-neutral-300 cursor-pointer"
            />
            <label htmlFor="agreeTerms" className="text-xs text-neutral-600 leading-snug cursor-pointer select-none">
              Tôi đồng ý với các <span className="text-black font-semibold underline">Điều khoản dịch vụ</span> và{' '}
              <span className="text-black font-semibold underline">Chính sách bảo mật</span> của SEEME®.
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang tạo tài khoản...
                </span>
              ) : (
                <>
                  <span>Đăng Ký Tài Khoản</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Link to Login */}
        <div className="mt-6 pt-5 border-t border-neutral-100 text-center text-xs text-neutral-600">
          Đã có tài khoản SEEME?{' '}
          <Link
            href={`/login${redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
            className="font-bold text-black underline underline-offset-4 hover:opacity-75 transition-opacity"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[85vh] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
