'use client';

import { QdrantInfo, EmbeddingStatus } from '@admin/types';
import { Database, Cpu, RefreshCw } from 'lucide-react';

interface QdrantInfoCardProps {
  info: QdrantInfo | null;
  status: EmbeddingStatus | null;
  loading: boolean;
  onRefresh?: () => void;
}

export default function QdrantInfoCard({ info, status, loading, onRefresh }: QdrantInfoCardProps) {
  const hasError = !!info?.error;
  const vec = info?.config?.params?.vectors;
  const modelName = info?.modelVersion ?? status?.modelVersion ?? 'fashion-clip-v1';
  const collectionName = info?.collection ?? status?.collection ?? 'product_embeddings';
  const pointsCount = info?.points_count ?? info?.vectors_count ?? status?.successPoints ?? 0;
  const vectorDim = vec?.size ?? 512;
  const distance = vec?.distance ?? 'Cosine';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50/90 border border-slate-200/80 rounded-xl text-xs">
      {/* Model Info */}
      <div className="flex items-center gap-2 text-slate-600 flex-wrap">
        <Cpu className="w-4 h-4 text-sky-500" />
        <span className="font-semibold text-slate-700">Model:</span>
        <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
          {modelName} (patrickjohncyh/fashion-clip)
        </span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {vectorDim} chiều • {distance}
        </span>
      </div>

      {/* Qdrant Info */}
      <div className="flex items-center gap-2 text-slate-600">
        <Database className="w-4 h-4 text-indigo-500" />
        <span className="font-semibold text-slate-700">Qdrant:</span>
        <span className="font-mono text-slate-800">{collectionName}</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-[#0099FF] border border-sky-200">
          {pointsCount.toLocaleString('vi-VN')} points
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            hasError
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {loading ? 'Đang tải' : hasError ? 'Mất kết nối' : (info?.status ?? 'green')}
        </span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-slate-400 hover:text-slate-700 transition-colors ml-0.5 cursor-pointer"
            title="Tải lại số liệu Qdrant"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
}
