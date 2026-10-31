'use client';

import React from 'react';

export type BadgeType =
  | 'order'
  | 'payment'
  | 'coupon'
  | 'active'
  | 'review'
  | 'product'
  | 'user'
  | 'role'
  | 'generic';

interface AdminStatusBadgeProps {
  status: string | number | boolean;
  type?: BadgeType;
  label?: string;
  className?: string;
}

interface BadgeConfig {
  label: string;
  dotColor: string;
  badgeClass: string;
}

export default function AdminStatusBadge({
  status,
  type = 'generic',
  label,
  className = '',
}: AdminStatusBadgeProps) {
  const normalized = String(status ?? '').trim().toUpperCase();

  const getConfig = (): BadgeConfig => {
    // 1. Order Statuses
    if (type === 'order') {
      switch (normalized) {
        case 'PENDING':
          return {
            label: 'Chờ xử lý',
            dotColor: '#f59e0b',
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
          };
        case 'CONFIRMED':
          return {
            label: 'Đã xác nhận',
            dotColor: '#0099FF',
            badgeClass: 'bg-sky-50 text-[#0077cc] border-sky-200/80',
          };
        case 'SHIPPED':
        case 'DELIVERING':
          return {
            label: 'Đang giao hàng',
            dotColor: '#0284c7',
            badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
          };
        case 'COMPLETED':
        case 'DELIVERED':
          return {
            label: 'Hoàn thành',
            dotColor: '#10b981',
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          };
        case 'CANCELLED':
          return {
            label: 'Đã hủy',
            dotColor: '#f43f5e',
            badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          };
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
          return {
            label: 'Thành công',
            dotColor: '#10b981',
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          };
        case 'PENDING':
          return {
            label: 'Chờ thanh toán',
            dotColor: '#f59e0b',
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
          };
        case 'FAILED':
          return {
            label: 'Thất bại',
            dotColor: '#f43f5e',
            badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          };
        case 'REFUNDED':
          return {
            label: 'Đã hoàn tiền',
            dotColor: '#0099FF',
            badgeClass: 'bg-sky-50 text-[#0077cc] border-sky-200/80',
          };
        default:
          break;
      }
    }

    // 3. Coupon Statuses
    if (type === 'coupon') {
      switch (normalized) {
        case 'ACTIVE':
          return {
            label: 'Hoạt động',
            dotColor: '#10b981',
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          };
        case 'INACTIVE':
          return {
            label: 'Tạm dừng',
            dotColor: '#f59e0b',
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
          };
        case 'EXPIRED':
          return {
            label: 'Hết hạn',
            dotColor: '#64748b',
            badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
          };
        case 'DELETED':
          return {
            label: 'Đã xóa',
            dotColor: '#f43f5e',
            badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          };
        default:
          break;
      }
    }

    // 4. Product Statuses
    if (type === 'product') {
      switch (normalized) {
        case 'ACTIVE':
          return {
            label: 'Đang bán',
            dotColor: '#10b981',
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          };
        case 'INACTIVE':
          return {
            label: 'Ngừng bán',
            dotColor: '#64748b',
            badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
          };
        case 'DELETED':
          return {
            label: 'Đã xóa',
            dotColor: '#f43f5e',
            badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          };
        default:
          break;
      }
    }

    // 5. Review Statuses
    if (type === 'review') {
      switch (normalized) {
        case 'ACTIVE':
        case 'APPROVED':
          return {
            label: 'Hiển thị',
            dotColor: '#10b981',
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          };
        case 'PENDING':
          return {
            label: 'Chờ duyệt',
            dotColor: '#f59e0b',
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
          };
        case 'INACTIVE':
        case 'REJECTED':
        case 'HIDDEN':
        default:
          return {
            label: 'Bị ẩn',
            dotColor: '#64748b',
            badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
          };
      }
    }

    // 6. User Statuses
    if (type === 'user') {
      switch (normalized) {
        case 'ACTIVE':
          return {
            label: 'Hoạt động',
            dotColor: '#10b981',
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          };
        case 'INACTIVE':
          return {
            label: 'Tạm khóa',
            dotColor: '#64748b',
            badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
          };
        case 'DELETED':
          return {
            label: 'Đã xóa',
            dotColor: '#f43f5e',
            badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          };
        default:
          break;
      }
    }

    // 7. Role Statuses
    if (type === 'role') {
      if (normalized === '1' || normalized === 'ADMIN') {
        return {
          label: 'Quản trị viên',
          dotColor: '#0099FF',
          badgeClass: 'bg-sky-50 text-[#0077cc] border-sky-200/80',
        };
      }
      return {
        label: 'Khách hàng',
        dotColor: '#64748b',
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-200/80',
      };
    }

    // Generic active/inactive
    if (normalized === 'ACTIVE' || normalized === 'TRUE' || status === true) {
      return {
        label: 'Hoạt động',
        dotColor: '#10b981',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      };
    }

    if (normalized === 'INACTIVE' || normalized === 'FALSE' || status === false) {
      return {
        label: 'Tạm ẩn',
        dotColor: '#64748b',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
      };
    }

    if (normalized === 'DELETED') {
      return {
        label: 'Đã xóa',
        dotColor: '#f43f5e',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
      };
    }

    return {
      label: label || String(status || '---'),
      dotColor: '#64748b',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
    };
  };

  const config = getConfig();
  const displayLabel = label || config.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border shadow-xs whitespace-nowrap select-none transition-colors ${config.badgeClass} ${className}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: config.dotColor }}
      />
      <span>{displayLabel}</span>
    </span>
  );
}
