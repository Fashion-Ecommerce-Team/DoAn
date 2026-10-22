import React from 'react';

type BadgeType = 'order' | 'payment' | 'coupon' | 'active' | 'generic';

interface AdminStatusBadgeProps {
  status: string;
  type?: BadgeType;
  label?: string;
}

export default function AdminStatusBadge({
  status,
  type = 'generic',
  label,
}: AdminStatusBadgeProps) {
  const normalized = (status || '').toUpperCase();
  const baseClass = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm whitespace-nowrap transition-colors';

  // 1. Order Statuses
  if (type === 'order') {
    switch (normalized) {
      case 'PENDING':
        return <span className={`${baseClass} bg-amber-100 text-amber-800 border border-amber-300`}>Chờ xử lý</span>;
      case 'CONFIRMED':
        return <span className={`${baseClass} bg-indigo-100 text-indigo-800 border border-indigo-300`}>Đã xác nhận</span>;
      case 'SHIPPED':
      case 'DELIVERING':
        return <span className={`${baseClass} bg-blue-100 text-blue-800 border border-blue-300`}>Đang giao</span>;
      case 'COMPLETED':
      case 'DELIVERED':
        return <span className={`${baseClass} bg-emerald-100 text-emerald-800 border border-emerald-300`}>Hoàn thành</span>;
      case 'CANCELLED':
        return <span className={`${baseClass} bg-rose-100 text-rose-800 border border-rose-300`}>Đã hủy</span>;
      default:
        break;
    }
  }

  // 2. Payment Statuses
  if (type === 'payment') {
    switch (normalized) {
      case 'SUCCESS':
      case 'PAID':
      case 'COMPLETED':
        return <span className={`${baseClass} bg-emerald-100 text-emerald-800 border border-emerald-300`}>Thành công</span>;
      case 'PENDING':
        return <span className={`${baseClass} bg-amber-100 text-amber-800 border border-amber-300`}>Chờ thanh toán</span>;
      case 'FAILED':
        return <span className={`${baseClass} bg-rose-100 text-rose-800 border border-rose-300`}>Thất bại</span>;
      case 'REFUNDED':
        return <span className={`${baseClass} bg-purple-100 text-purple-800 border border-purple-300`}>Đã hoàn tiền</span>;
      default:
        break;
    }
  }

  // 3. Entity Active / Inactive
  if (type === 'active' || normalized === 'ACTIVE' || normalized === 'INACTIVE') {
    if (normalized === 'ACTIVE' || status === 'true') {
      return <span className={`${baseClass} bg-emerald-100 text-emerald-800 border border-emerald-300`}>Hoạt động</span>;
    }
    return <span className={`${baseClass} bg-slate-100 text-slate-700 border border-slate-300`}>Tạm ẩn</span>;
  }

  // Fallback
  return (
    <span className={`${baseClass} bg-slate-100 text-slate-800 border border-slate-200`}>
      {label || status || '---'}
    </span>
  );
}
