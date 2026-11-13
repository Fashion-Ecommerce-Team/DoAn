'use client';

import { CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { PolicyEmbeddingStatus } from '../../types';

interface PolicyStatusBadgeProps {
  status: PolicyEmbeddingStatus | string;
  needsResync?: boolean;
}

export default function PolicyStatusBadge({ status, needsResync }: PolicyStatusBadgeProps) {
  if (needsResync) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
        Cần đồng bộ lại
      </span>
    );
  }

  switch (status) {
    case 'SYNCED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Đã đồng bộ vector
        </span>
      );
    case 'PARTIAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
          <Clock className="w-3.5 h-3.5 text-sky-500" />
          Đồng bộ một phần
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          Lỗi đồng bộ
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          Chờ đồng bộ
        </span>
      );
  }
}
