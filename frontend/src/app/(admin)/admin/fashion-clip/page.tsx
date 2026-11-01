'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@admin/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin/components/ui/table';
import { Button } from '@admin/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@admin/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@admin/components/ui/dialog';
import {
  getEmbeddings,
  getMissingEmbeddingProducts,
  getEmbeddingStatus,
  getQdrantInfo,
  getEmbeddingJob,
  cancelEmbeddingJob,
  startBatchSync,
  startReconcile,
  retryFailedEmbeddings,
  syncProductEmbedding,
  deleteProductEmbedding,
} from '@admin/services';
import { EmbeddingLogResponse, EmbeddingStatus, QdrantInfo, JobProgressResponse, MissingEmbeddingProduct } from '@admin/types';
import AdminPageHeader from '@/features/admin/components/common/AdminPageHeader';
import AdminSearchBar from '@/features/admin/components/common/AdminSearchBar';
import AdminStatusBadge from '@/features/admin/components/common/AdminStatusBadge';
import { AdminEditButton, AdminDeleteButton } from '@/features/admin/components/common/AdminTableActions';
import EmbeddingStatsCards from '@/features/admin/components/fashionclip/EmbeddingStatsCards';
import QdrantInfoCard from '@/features/admin/components/fashionclip/QdrantInfoCard';
import SyncJobProgress from '@/features/admin/components/fashionclip/SyncJobProgress';
import EmbeddingStatusBadge from '@/features/admin/components/fashionclip/EmbeddingStatusBadge';
import { ChevronLeft, ChevronRight, RotateCcw, DownloadCloud, RefreshCw, Wrench, Undo2 } from 'lucide-react';

const fmt = (v?: string | null) => (v ? new Date(v).toLocaleString('vi-VN') : '---');

const ACTIVE_JOB_KEY = 'fashionclip_active_job_id';

export default function FashionClipPage() {
  const [stats, setStats] = useState<EmbeddingStatus | null>(null);
  const [qdrant, setQdrant] = useState<QdrantInfo | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [logs, setLogs] = useState<EmbeddingLogResponse[]>([]);
  const [missing, setMissing] = useState<MissingEmbeddingProduct[]>([]);
  const [tab, setTab] = useState<'missing' | 'logs'>('missing');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('ALL');
  const [productSearch, setProductSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [job, setJob] = useState<JobProgressResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    const [s, q] = await Promise.allSettled([getEmbeddingStatus(), getQdrantInfo()]);
    if (s.status === 'fulfilled') setStats(s.value);
    else toast.error('Lỗi khi tải thống kê đồng bộ', { id: 'load-stats-error' });
    if (q.status === 'fulfilled') setQdrant(q.value);
    else setQdrant({ error: 'Không thể kết nối tới Qdrant' });
    setOverviewLoading(false);
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'missing') {
        const data = await getMissingEmbeddingProducts(page, 10, productSearch.trim() || undefined);
        setMissing(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      } else {
        const pid = productSearch.trim() ? Number(productSearch.trim()) : undefined;
        const data = await getEmbeddings(page, 10, status === 'ALL' ? undefined : status, Number.isFinite(pid) ? pid : undefined);
        setLogs(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      }
    } catch {
      toast.error('Lỗi khi tải danh sách embedding', { id: 'load-logs-error' });
    } finally {
      setLoading(false);
    }
  }, [tab, page, status, productSearch]);

  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => { loadLogs(); }, [loadLogs]);

  // Khôi phục tiến trình ngầm từ localStorage nếu có
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedJobId = localStorage.getItem(ACTIVE_JOB_KEY);
    if (!savedJobId) return;

    getEmbeddingJob(savedJobId)
      .then((j) => {
        setJob(j);
        if (j.status === 'RUNNING' || j.status === 'PENDING') {
          toast.info(`Đang theo dõi tiến trình #${j.jobId.slice(0, 8)}...`, { id: 'resume-job' });
        } else {
          localStorage.removeItem(ACTIVE_JOB_KEY);
        }
      })
      .catch(() => {
        localStorage.removeItem(ACTIVE_JOB_KEY);
      });
  }, []);

  // Poll tiến độ job tới khi kết thúc
  const jobId = job?.jobId;
  const jobActive = job?.status === 'PENDING' || job?.status === 'RUNNING';
  useEffect(() => {
    if (!jobId || !jobActive) return;
    const timer = setInterval(async () => {
      try {
        const j = await getEmbeddingJob(jobId);
        setJob(j);
        if (j.status === 'COMPLETED' || j.status === 'FAILED' || j.status === 'CANCELLED') {
          clearInterval(timer);
          if (typeof window !== 'undefined') {
            localStorage.removeItem(ACTIVE_JOB_KEY);
          }
          if (j.status === 'CANCELLED') {
            toast.info('Tiến trình đã được dừng lại');
          } else {
            toast[j.status === 'COMPLETED' ? 'success' : 'error'](j.status === 'COMPLETED' ? 'Tiến trình đã hoàn tất' : 'Tiến trình thất bại');
          }
          loadOverview();
          loadLogs();
        }
      } catch {
        clearInterval(timer);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [jobId, jobActive, loadOverview, loadLogs]);

  const errMsg = (e: unknown, fallback: string) =>
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

  const runJob = async (fn: () => Promise<JobProgressResponse>, okMsg: string) => {
    if (jobActive) { toast.warning('Đang có tiến trình chạy, vui lòng đợi'); return; }
    setBusy(true);
    try {
      const res = await fn();
      setJob(res);
      if (typeof window !== 'undefined' && res?.jobId) {
        localStorage.setItem(ACTIVE_JOB_KEY, res.jobId);
      }
      toast.success(okMsg);
    } catch (e) {
      toast.error(errMsg(e, 'Không thể khởi chạy tiến trình'));
    } finally {
      setBusy(false);
    }
  };

  const handleCancelJob = async () => {
    if (!job?.jobId) return;
    try {
      const res = await cancelEmbeddingJob(job.jobId);
      setJob(res);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(ACTIVE_JOB_KEY);
      }
      toast.info('Đang gửi lệnh dừng tiến trình...');
      loadOverview();
      loadLogs();
    } catch {
      toast.error('Lỗi khi hủy tiến trình');
    }
  };

  const handleClearJob = () => {
    setJob(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_JOB_KEY);
    }
  };

  const handleRetryFailed = async () => {
    setBusy(true);
    try {
      const r = await retryFailedEmbeddings();
      toast.success(`Đã thử lại ${r.totalRetried} sản phẩm: ${r.success} thành công, ${r.failed} lỗi`);
      loadOverview();
      loadLogs();
    } catch (e) {
      toast.error(errMsg(e, 'Lỗi khi thử lại'));
    } finally {
      setBusy(false);
    }
  };

  const handleSyncOne = async (productId: number) => {
    try {
      await syncProductEmbedding(productId);
      toast.success(`Đã đồng bộ sản phẩm #${productId}`);
      loadOverview();
      loadLogs();
    } catch (e) {
      toast.error(errMsg(e, 'Lỗi khi đồng bộ sản phẩm'));
    }
  };

  const handleDeleteOne = async (productId: number) => {
    if (!confirm(`Xóa toàn bộ embedding của sản phẩm #${productId} khỏi Qdrant?`)) return;
    try {
      await deleteProductEmbedding(productId);
      toast.success('Xóa embedding thành công');
      loadOverview();
      loadLogs();
    } catch (e) {
      toast.error(errMsg(e, 'Lỗi khi xóa embedding'));
    }
  };

  const hasFilter = status !== 'ALL' || productSearch;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quản lý FashionCLIP"
        description="Theo dõi và đồng bộ vector embedding sản phẩm lên Qdrant phục vụ tìm kiếm bằng hình ảnh"
        badge={stats?.totalProducts}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="gap-2 font-semibold" disabled={busy} onClick={handleRetryFailed}>
              <Undo2 className="w-4 h-4" /> Thử lại lỗi
            </Button>
            <Button variant="outline" className="gap-2 font-semibold" disabled={busy || jobActive}
              onClick={() => runJob(startReconcile, 'Đã khởi chạy sửa lệch dữ liệu')}>
              <Wrench className="w-4 h-4" /> Sửa lệch
            </Button>
            <Button variant="outline" className="gap-2 font-semibold" disabled={busy || jobActive}
              onClick={() => setConfirmAllOpen(true)}>
              <RefreshCw className="w-4 h-4" /> Đồng bộ lại tất cả
            </Button>
            <Button className="gap-2 shadow-sm font-semibold" disabled={busy || jobActive}
              onClick={() => runJob(() => startBatchSync({ onlyMissing: true }), 'Đã khởi chạy đồng bộ sản phẩm còn thiếu')}>
              <DownloadCloud className="w-4 h-4" /> Đồng bộ phần thiếu
            </Button>
          </div>
        }
      />

      <EmbeddingStatsCards status={stats} loading={overviewLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <QdrantInfoCard info={qdrant} status={stats} loading={overviewLoading} />
        <SyncJobProgress job={job} onCancel={handleCancelJob} onClear={handleClearJob} />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 py-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
            {([
              { key: 'missing', label: 'Chưa có vector', count: stats?.missingProducts },
              { key: 'logs', label: 'Nhật ký embedding' },
            ] as const).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => { setTab(t.key); setPage(0); setStatus('ALL'); setProductSearch(''); }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  tab === t.key ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
                {'count' in t && t.count !== undefined && (
                  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <AdminSearchBar
              key={tab}
              placeholder={tab === 'missing' ? 'Tìm sản phẩm theo tên...' : 'Lọc theo ID sản phẩm...'}
              defaultValue={productSearch}
              onSearch={(val) => { setProductSearch(tab === 'missing' ? val : val.replace(/\D/g, '')); setPage(0); }}
              className="w-full sm:max-w-md"
            />
            <div className="flex items-center gap-2">
              {tab === 'logs' && (
                <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
                  <SelectTrigger className="w-full sm:w-[170px] border-slate-300 text-xs font-semibold">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                    <SelectItem value="SUCCESS">Thành công</SelectItem>
                    <SelectItem value="FAILED">Thất bại</SelectItem>
                    <SelectItem value="PENDING">Đang chờ</SelectItem>
                    <SelectItem value="NO_IMAGE">Không có ảnh</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {hasFilter && (
                <Button variant="outline" size="sm"
                  onClick={() => { setProductSearch(''); setStatus('ALL'); setPage(0); }}
                  className="h-9 px-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 border-slate-300"
                  title="Đặt lại bộ lọc">
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Đặt lại
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tab === 'missing' ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="w-20 font-semibold text-slate-700 text-xs py-3.5">ID</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Tên sản phẩm</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Đường dẫn</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Trạng thái SP</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Embedding</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Ngày tạo</TableHead>
                  <TableHead className="text-center font-semibold text-slate-700 text-xs py-3.5">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 font-semibold text-slate-600">Đang tải...</TableCell></TableRow>
                ) : missing.length > 0 ? (
                  missing.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/80">
                      <TableCell className="font-mono text-xs font-bold text-slate-700">#{p.id}</TableCell>
                      <TableCell className="font-semibold text-slate-900 text-xs max-w-[320px] truncate" title={p.name}>{p.name}</TableCell>
                      <TableCell>
                        <span className="inline-block font-mono text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 max-w-[220px] truncate align-middle">
                          {p.slug || '---'}
                        </span>
                      </TableCell>
                      <TableCell><AdminStatusBadge status={p.status || ''} type="product" /></TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border shadow-xs whitespace-nowrap bg-amber-50 text-amber-700 border-amber-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Chưa tạo vector
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs whitespace-nowrap">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : '---'}</TableCell>
                      <TableCell className="text-center whitespace-nowrap py-3">
                        <AdminEditButton label="Tạo vector" onClick={() => handleSyncOne(p.id)} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 font-semibold text-slate-500">Tất cả sản phẩm đã có vector embedding</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="w-16 font-semibold text-slate-700 text-xs py-3.5">ID</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Sản phẩm</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Ảnh</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Loại</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Model</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Trạng thái</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Cần sync lại</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Lỗi</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Đồng bộ lúc</TableHead>
                <TableHead className="text-center font-semibold text-slate-700 text-xs py-3.5">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 font-semibold text-slate-600">Đang tải...</TableCell></TableRow>
              ) : logs.length > 0 ? (
                logs.map((l) => (
                  <TableRow key={l.id} className="hover:bg-slate-50/80">
                    <TableCell className="font-mono text-xs font-bold text-slate-700">#{l.id}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-slate-900">#{l.productId}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">{l.imageId ? `#${l.imageId}` : '---'}</TableCell>
                    <TableCell className="text-xs text-slate-600">{l.embeddingType || '---'}</TableCell>
                    <TableCell className="text-xs text-slate-600 whitespace-nowrap">{l.modelVersion || '---'}</TableCell>
                    <TableCell><EmbeddingStatusBadge status={l.status} /></TableCell>
                    <TableCell className="text-xs">
                      {l.needsResync
                        ? <span className="font-bold text-amber-600">Có</span>
                        : <span className="text-slate-400">Không</span>}
                    </TableCell>
                    <TableCell className="text-xs text-rose-600 max-w-[200px] truncate" title={l.errorMessage || undefined}>
                      {l.errorMessage || '---'}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs whitespace-nowrap">{fmt(l.syncedAt)}</TableCell>
                    <TableCell className="text-center space-x-1.5 whitespace-nowrap py-3">
                      <AdminEditButton label="Sync lại" onClick={() => handleSyncOne(l.productId)} />
                      <AdminDeleteButton label="Xóa" onClick={() => handleDeleteOne(l.productId)} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={10} className="text-center py-8 font-semibold text-slate-500">Không có bản ghi embedding</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          )}

          {totalPages > 0 && (
            <div className="flex items-center justify-between mt-4 border-t pt-4">
              <div className="text-sm font-medium text-slate-500">Tổng số: {totalElements} bản ghi</div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="icon" className="w-8 h-8"
                  onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium text-slate-700">Trang {page + 1} / {totalPages}</span>
                <Button variant="outline" size="icon" className="w-8 h-8"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1 || loading}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmAllOpen} onOpenChange={setConfirmAllOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Đồng bộ lại tất cả sản phẩm?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 py-2">
            Toàn bộ sản phẩm sẽ được tạo lại vector, kể cả những sản phẩm đã đồng bộ. Quá trình có thể mất nhiều thời gian và chạy ngầm.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAllOpen(false)}>Hủy</Button>
            <Button onClick={() => {
              setConfirmAllOpen(false);
              runJob(() => startBatchSync({ onlyMissing: false }), 'Đã khởi chạy đồng bộ lại toàn bộ');
            }}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
