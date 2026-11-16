'use client';

const CONFIG: Record<string, { label: string; dot: string; cls: string }> = {
  SUCCESS: { label: 'Thành công', dot: '#10b981', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/80' },
  FAILED: { label: 'Thất bại', dot: '#f43f5e', cls: 'bg-rose-50 text-rose-700 border-rose-200/80' },
  PENDING: { label: 'Đang chờ', dot: '#f59e0b', cls: 'bg-amber-50 text-amber-700 border-amber-200/80' },
  NO_IMAGE: { label: 'Không có ảnh', dot: '#64748b', cls: 'bg-slate-100 text-slate-700 border-slate-200/80' },
  RUNNING: { label: 'Đang chạy', dot: '#0099FF', cls: 'bg-sky-50 text-[#0077cc] border-sky-200/80' },
  COMPLETED: { label: 'Hoàn tất', dot: '#10b981', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/80' },
  CANCELLED: { label: 'Đã hủy', dot: '#64748b', cls: 'bg-slate-100 text-slate-700 border-slate-200/80' },
};

export default function EmbeddingStatusBadge({ status }: { status: string }) {
  const key = String(status ?? '').toUpperCase();
  const c = CONFIG[key] ?? { label: status || '---', dot: '#64748b', cls: 'bg-slate-100 text-slate-700 border-slate-200/80' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border shadow-xs whitespace-nowrap select-none ${c.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.dot }} />
      <span>{c.label}</span>
    </span>
  );
}
