'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@admin/components/ui/card';
import { JobProgressResponse } from '@admin/types';
import { Activity, Square, Loader2 } from 'lucide-react';
import { Button } from '@admin/components/ui/button';
import EmbeddingStatusBadge from './EmbeddingStatusBadge';

const JOB_TYPE: Record<string, string> = { BATCH_SYNC: 'Đồng bộ hàng loạt', RECONCILE: 'Sửa lệch dữ liệu' };

export default function SyncJobProgress({
  job,
  onCancel,
  onClear,
}: {
  job: JobProgressResponse | null;
  onCancel?: () => void;
  onClear?: () => void;
}) {
  const rawPercent = job?.total ? (job.processed / job.total) * 100 : (job?.percent ?? 0);
  const displayPercent =
    rawPercent <= 0 ? '0%' : rawPercent < 1 ? `${rawPercent.toFixed(1)}%` : `${Math.round(rawPercent)}%`;
  const barWidth = job?.processed && job.processed > 0 ? Math.max(1.5, Math.min(100, rawPercent)) : 0;
  const isRunning = job?.status === 'RUNNING' || job?.status === 'PENDING';
  const barColor =
    job?.status === 'FAILED' ? 'bg-rose-500'
      : job?.status === 'CANCELLED' ? 'bg-slate-400'
      : job?.status === 'COMPLETED' ? 'bg-emerald-500'
        : 'bg-gradient-to-r from-[#0099FF] to-[#0077cc]';

  return (
    <Card className="border border-slate-200/80 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 space-y-0">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0099FF]" />
            Tiến trình chạy ngầm
          </CardTitle>
          <CardDescription className="mt-0.5">Theo dõi tiến độ đồng bộ theo thời gian thực</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {job && <EmbeddingStatusBadge status={job.status} />}
          {isRunning && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="h-7 px-2.5 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
            >
              <Square className="w-3 h-3 mr-1 fill-rose-600" />
              Dừng lại
            </Button>
          )}
          {!isRunning && job && onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-7 px-2 text-xs text-slate-400 hover:text-slate-600"
            >
              Đóng
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {!job ? (
          <p className="text-xs font-medium text-slate-500 py-6 text-center">
            Chưa có tiến trình nào đang chạy. Hãy bấm một nút đồng bộ phía trên.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">{JOB_TYPE[job.type] ?? job.type}</span>
              <span className="font-mono text-slate-500">#{job.jobId.slice(0, 8)}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor} ${isRunning ? 'animate-pulse' : ''}`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0099FF]" />}
                <span>{job.processed} / {job.total} mục</span>
              </span>
              <span className="font-mono text-[#0099FF]">{displayPercent}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200/60 py-2"><p className="font-black text-emerald-700 text-base">{job.successCount}</p><p className="text-emerald-700/80 font-medium">Thành công</p></div>
              <div className="rounded-xl bg-rose-50 border border-rose-200/60 py-2"><p className="font-black text-rose-700 text-base">{job.failedCount}</p><p className="text-rose-700/80 font-medium">Thất bại</p></div>
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 py-2"><p className="font-black text-slate-700 text-base">{job.skippedCount}</p><p className="text-slate-600 font-medium">Bỏ qua</p></div>
            </div>
            {job.message && (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                {isRunning && <span className="inline-block w-2 h-2 rounded-full bg-[#0099FF] animate-ping flex-shrink-0" />}
                <p className="truncate">{job.message}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
