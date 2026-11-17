'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/features/auth/services/auth.api';
import {
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<'EMAIL' | 'RESET'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [countdown, setCountdown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Bước 1: Gửi mã OTP khôi phục mật khẩu về Email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFeedback(null);

    const cleanedEmail = email.trim().toLowerCase();
    if (!cleanedEmail) {
      setFeedback({ type: 'error', message: 'Vui lòng nhập địa chỉ email đã đăng ký' });
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword(cleanedEmail);
      setStep('RESET');
      setCountdown(res.data?.expiresInSeconds || 300);
      setDevOtpHint(res.data?.devOtp || null);

      setFeedback({
        type: 'success',
        message: res.data?.mailSent
          ? `Mã OTP khôi phục mật khẩu đã được gửi tới ${cleanedEmail}. Vui lòng kiểm tra hộp thư!`
          : `Đã khởi tạo mã xác thực OTP khôi phục mật khẩu cho ${cleanedEmail}.`,
      });
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message ||
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.error ||
        'Không tìm thấy tài khoản nào được đăng ký với email này!';
      setFeedback({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác thực OTP và đặt mật khẩu mới
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!/^[0-9]{6}$/.test(otp.trim())) {
      setFeedback({ type: 'error', message: 'Mã xác thực OTP phải gồm đúng 6 chữ số' });
      return;
    }

    if (newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'Mật khẩu mới cần tối thiểu 6 ký tự' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    setLoading(true);
    try {
      const msg = await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });

      setFeedback({
        type: 'success',
        message: msg || 'Đặt lại mật khẩu thành công! Đang chuyển về trang đăng nhập...',
      });

      setTimeout(() => {
        router.push('/login');
      }, 700);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message ||
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.error ||
        'Mã OTP không chính xác hoặc đã hết hạn!';
      setFeedback({ type: 'error', message: errorMsg });
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
            {step === 'EMAIL' ? 'Quên Mật Khẩu' : 'Đặt Lại Mật Khẩu Mới'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {step === 'EMAIL'
              ? 'Nhập địa chỉ email của bạn để nhận mã xác thực OTP 6 chữ số'
              : `Nhập mã OTP đã gửi tới ${email} và mật khẩu mới`}
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

        {step === 'EMAIL' ? (
          /* BƯỚC 1: NHẬP EMAIL NHẬN MÃ OTP */
          <form className="mt-6 space-y-4" onSubmit={handleSendOtp}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Địa chỉ Email đã đăng ký *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:border-black focus:bg-white focus:outline-none transition-all placeholder:text-neutral-400"
                  placeholder="tenban@gmail.com"
                  autoComplete="email"
                />
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
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
                    Đang gửi mã xác thực...
                  </span>
                ) : (
                  <>
                    <span>Gửi Mã Xác Thực OTP</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* BƯỚC 2: NHẬP OTP & ĐẶT LẠI MẬT KHẨU */
          <form className="mt-6 space-y-4" onSubmit={handleResetPassword}>
            {devOtpHint && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <p className="font-bold uppercase tracking-wider text-[11px]">
                  Chế độ Demo / Chưa cấu hình SMTP Email:
                </p>
                <p className="mt-1">
                  Mã OTP khôi phục của bạn là:{' '}
                  <strong className="font-mono text-sm tracking-widest bg-white px-2 py-0.5 border border-amber-300">
                    {devOtpHint}
                  </strong>
                </p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Mã xác thực OTP (6 chữ số) *
                </label>
                {countdown > 0 && (
                  <span className="text-xs font-mono font-bold text-neutral-600">
                    Hiệu lực: {formatTimer(countdown)}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 text-center text-base font-mono font-black tracking-[0.5em] focus:border-black focus:bg-white focus:outline-none transition-all"
                  placeholder="000000"
                />
                <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Mật khẩu mới *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:border-black focus:bg-white focus:outline-none transition-all"
                  placeholder="Tối thiểu 6 ký tự"
                  autoComplete="new-password"
                />
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Xác nhận mật khẩu mới *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:border-black focus:bg-white focus:outline-none transition-all"
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                />
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang cập nhật mật khẩu...
                  </span>
                ) : (
                  <>
                    <span>Xác Nhận Đặt Lại Mật Khẩu</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep('EMAIL');
                  setFeedback(null);
                }}
                className="inline-flex items-center gap-1 text-neutral-600 hover:text-black font-semibold cursor-pointer"
              >
                <ArrowLeft size={14} />
                Đổi email khác
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSendOtp()}
                className="inline-flex items-center gap-1 text-black font-bold underline underline-offset-4 hover:opacity-75 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} />
                Gửi lại mã OTP
              </button>
            </div>
          </form>
        )}

        {/* Footer Link back to Login */}
        <div className="mt-6 pt-5 border-t border-neutral-100 text-center text-xs text-neutral-600">
          Đã nhớ mật khẩu?{' '}
          <Link
            href="/login"
            className="font-bold text-black underline underline-offset-4 hover:opacity-75 transition-opacity"
          >
            Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
