'use client';

import { Card, CardContent, CardHeader } from '@admin/components/ui/card';
import { EmbeddingStatus } from '@admin/types';
import { Package, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function EmbeddingStatsCards({ status, loading }: { status: EmbeddingStatus | null; loading: boolean }) {
  const items = [
    {
      title: 'Tổng sản phẩm',
      value: status?.totalProducts,
      sub: `${status?.missingProducts ?? 0} sản phẩm chưa đồng bộ`,
      icon: Package,
      gradient: 'from-sky-500/10 via-blue-500/5 to-transparent border-sky-500/20',
      iconBg: 'bg-blue-600 text-white shadow-md shadow-blue-600/25',
    },
    {
      title: 'Đã đồng bộ',
      value: status?.syncedProducts,
      sub: `${status?.successPoints ?? 0} vector thành công`,
      icon: CheckCircle2,
      gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/20',
      iconBg: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25',
    },
    {
      title: 'Vector lỗi',
      value: status?.failedPoints,
      sub: `${status?.pendingPoints ?? 0} vector đang chờ`,
      icon: AlertTriangle,
      gradient: 'from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/20',
      iconBg: 'bg-rose-500 text-white shadow-md shadow-rose-500/25',
    },
    {
      title: 'Cần đồng bộ lại',
      value: status?.needsResyncProducts,
      sub: `${status?.noImageProducts ?? 0} sản phẩm không có ảnh`,
      icon: RefreshCw,
      gradient: 'from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/20',
      iconBg: 'bg-amber-500 text-white shadow-md shadow-amber-500/25',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((c) => (
        <Card
          key={c.title}
          className={`border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 relative overflow-hidden bg-gradient-to-br ${c.gradient}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{c.title}</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.iconBg}`}>
              <c.icon className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {loading ? '...' : (c.value ?? 0).toLocaleString('vi-VN')}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">{loading ? '\u00A0' : c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
