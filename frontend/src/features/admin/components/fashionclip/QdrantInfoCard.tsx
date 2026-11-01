'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@admin/components/ui/card';
import { QdrantInfo, EmbeddingStatus } from '@admin/types';
import { Database } from 'lucide-react';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 text-xs">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="font-bold text-slate-900 font-mono">{value ?? '---'}</span>
    </div>
  );
}

export default function QdrantInfoCard({ info, status, loading }: { info: QdrantInfo | null; status: EmbeddingStatus | null; loading: boolean }) {
  const hasError = !!info?.error;
  const vec = info?.config?.params?.vectors;
  return (
    <Card className="border border-slate-200/80 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 space-y-0">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#0099FF]" />
            Qdrant Vector Database
          </CardTitle>
          <CardDescription className="mt-0.5">Thông tin collection lưu trữ vector sản phẩm</CardDescription>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border shadow-xs ${
          loading ? 'bg-slate-100 text-slate-600 border-slate-200/80'
            : hasError ? 'bg-rose-50 text-rose-700 border-rose-200/80' : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
        }`}>
          {loading ? 'Đang tải' : hasError ? 'Mất kết nối' : (info?.status ?? 'Hoạt động')}
        </span>
      </CardHeader>
      <CardContent className="pt-4">
        {hasError ? (
          <p className="text-xs text-rose-600 font-medium break-words">{info?.error}</p>
        ) : (
          <>
            <Row label="Collection" value={info?.collection ?? status?.collection} />
            <Row label="Số điểm (points)" value={info?.points_count} />
            <Row label="Số vector" value={info?.vectors_count ?? info?.points_count} />
            <Row label="Số chiều" value={vec?.size} />
            <Row label="Độ đo" value={vec?.distance} />
            <Row label="Model" value={info?.modelVersion ?? status?.modelVersion} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
