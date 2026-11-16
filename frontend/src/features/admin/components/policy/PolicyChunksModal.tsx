'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@admin/components/ui/dialog';
import { Button } from '@admin/components/ui/button';
import { PolicyChunkResponse, PolicyDocumentResponse } from '../../types';
import { CheckCircle2, AlertCircle, Copy, Layers, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface PolicyChunksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: PolicyDocumentResponse | null;
}

export default function PolicyChunksModal({ open, onOpenChange, policy }: PolicyChunksModalProps) {
  if (!policy) return null;

  const chunks = policy.chunks || [];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép nội dung đoạn cắt!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-100">
        <DialogHeader className="p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0099FF] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Danh sách các đoạn cắt (Chunks Preview)
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Chính sách: <span className="font-semibold text-slate-700">{policy.title}</span> ({chunks.length} đoạn)
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chunks.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">Chưa có đoạn cắt nào cho tài liệu này.</p>
            </div>
          ) : (
            chunks.map((chunk: PolicyChunkResponse) => (
              <div
                key={chunk.id}
                className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-sky-300 hover:shadow-xs transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0099FF] bg-sky-50 px-2 py-0.5 rounded-md">
                      Đoạn #{chunk.chunkIndex + 1}
                    </span>
                    <span className="text-slate-400">
                      (Vị trí: {chunk.charStart} - {chunk.charEnd})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {chunk.isEmbedded ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã nạp Qdrant
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Chưa nạp
                      </span>
                    )}
                    <button
                      onClick={() => handleCopy(chunk.chunkText)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      title="Sao chép đoạn này"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                  {chunk.chunkText}
                </p>

                {chunk.qdrantPointId && (
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    Point ID: {chunk.qdrantPointId}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl font-bold text-xs">
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
