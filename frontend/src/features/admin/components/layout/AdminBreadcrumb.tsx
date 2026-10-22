'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  admin: 'Tổng quan',
  orders: 'Đơn hàng',
  payments: 'Thanh toán',
  products: 'Sản phẩm',
  categories: 'Danh mục',
  brands: 'Thương hiệu',
  coupons: 'Mã giảm giá',
  users: 'Khách hàng',
  reviews: 'Đánh giá',
  create: 'Thêm mới',
  edit: 'Chỉnh sửa',
};

export default function AdminBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // If we're at /admin, show simple home
  if (segments.length <= 1) {
    return (
      <div className="flex items-center text-xs font-medium text-slate-500">
        <Home className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
        <span className="text-slate-800 font-semibold">Bảng điều khiển</span>
      </div>
    );
  }

  const breadcrumbs = segments.map((segment, index) => {
    const url = `/${segments.slice(0, index + 1).join('/')}`;
    const isLast = index === segments.length - 1;
    const label = ROUTE_LABELS[segment] || (!isNaN(Number(segment)) ? `${segment}` : segment);

    return { url, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center space-x-1.5 text-xs font-medium text-slate-500">
      <Link href="/admin" className="flex items-center hover:text-slate-900 transition-colors">
        <Home className="w-3.5 h-3.5 mr-1 text-slate-400" />
        <span>Admin</span>
      </Link>
      {breadcrumbs.slice(1).map((crumb, idx) => (
        <div key={idx} className="flex items-center space-x-1.5">
          <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
          {crumb.isLast ? (
            <span className="text-slate-900 font-semibold max-w-[200px] truncate" title={crumb.label}>
              {crumb.label}
            </span>
          ) : (
            <Link href={crumb.url} className="hover:text-slate-900 transition-colors max-w-[150px] truncate">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
