'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@admin/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin/components/ui/table';
import { Button } from '@admin/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@admin/components/ui/select';
import { toast } from 'sonner';

import {
  getPolicies,
  getPolicyById,
  deletePolicy,
  updatePolicyStatus,
  syncPolicyEmbedding,
  deletePolicyEmbedding,
  getPolicyQdrantInfo,
  clearPolicyQdrant,
  syncAllPolicies,
} from '@/features/admin/services';
import { PolicyDocumentResponse } from '@/features/admin/types';

import AdminPageHeader from '@/features/admin/components/common/AdminPageHeader';
import AdminSearchBar from '@/features/admin/components/common/AdminSearchBar';
import { AdminEditButton, AdminDeleteButton, AdminToggleButton } from '@/features/admin/components/common/AdminTableActions';
import PolicyStatusBadge from '@/features/admin/components/policy/PolicyStatusBadge';
import PolicyChunksModal from '@/features/admin/components/policy/PolicyChunksModal';
import PolicyFormDialog from '@/features/admin/components/policy/PolicyFormDialog';

import {
  FileText,
  Plus,
  RotateCcw,
  Layers,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Database,
  Trash2,
  Cpu,
} from 'lucide-react';

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  RETURN: { label: 'Đổi trả & Hoàn tiền', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  WARRANTY: { label: 'Bảo hành', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  SHIPPING: { label: 'Vận chuyển', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  PAYMENT: { label: 'Thanh toán', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  GENERAL: { label: 'Điều khoản chung', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyDocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyDocumentResponse | null>(null);

  const [isChunksModalOpen, setIsChunksModalOpen] = useState(false);
  const [selectedPolicyDetail, setSelectedPolicyDetail] = useState<PolicyDocumentResponse | null>(null);

  // Actions states
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [deletingVectorId, setDeletingVectorId] = useState<number | null>(null);
  const [clearingQdrant, setClearingQdrant] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);

  // Qdrant Info
  const [qdrantInfo, setQdrantInfo] = useState<any>(null);
  const [loadingQdrant, setLoadingQdrant] = useState(false);

  const loadQdrantInfo = useCallback(async () => {
    setLoadingQdrant(true);
    try {
      const info = await getPolicyQdrantInfo();
      setQdrantInfo(info);
    } catch {
      // Qdrant service might be offline or initializing
    } finally {
      setLoadingQdrant(false);
    }
  }, []);

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPolicies(
        page,
        10,
        search.trim() || undefined,
        category === 'ALL' ? undefined : category,
        status === 'ALL' ? undefined : status
      );
      setPolicies(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error.response?.data?.message || error.message || 'Lỗi khi tải danh sách chính sách';
      toast.error(`Lỗi: ${msg}`, { id: 'load-policies-error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, category, status]);

  useEffect(() => {
    loadPolicies();
    loadQdrantInfo();
  }, [loadPolicies, loadQdrantInfo]);

  const handleDelete = async (id: number, title: string) => {
    if (confirm(`Bạn có chắc muốn xóa chính sách "${title}"? Tất cả vector trên Qdrant cũng sẽ bị xóa vĩnh viễn.`)) {
      try {
        await deletePolicy(id);
        toast.success('Xóa tài liệu chính sách thành công');
        loadPolicies();
        loadQdrantInfo();
      } catch {
        toast.error('Lỗi khi xóa tài liệu chính sách');
      }
    }
  };

  const handleToggleStatus = async (policy: PolicyDocumentResponse) => {
    try {
      const newStatus = !policy.isActive;
      await updatePolicyStatus(policy.id, newStatus);
      toast.success(newStatus ? 'Đã kích hoạt chính sách' : 'Đã tạm ẩn chính sách');
      loadPolicies();
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleSyncVector = async (id: number) => {
    setSyncingId(id);
    try {
      await syncPolicyEmbedding(id);
      toast.success('Đồng bộ lại vector BKAI lên Qdrant thành công!');
      loadPolicies();
      loadQdrantInfo();
    } catch {
      toast.error('Lỗi khi đồng bộ vector lên Qdrant');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteVector = async (id: number, title: string) => {
    if (confirm(`Bạn có chắc muốn XÓA VECTOR của chính sách "${title}" khỏi Qdrant?\n\nTài liệu vẫn được giữ nguyên trong CSDL nhưng chuyển trạng thái thành "Chờ đồng bộ".`)) {
      setDeletingVectorId(id);
      try {
        await deletePolicyEmbedding(id);
        toast.success('Đã xóa vector khỏi Qdrant thành công!');
        loadPolicies();
        loadQdrantInfo();
      } catch {
        toast.error('Lỗi khi xóa vector khỏi Qdrant');
      } finally {
        setDeletingVectorId(null);
      }
    }
  };

  const handleClearQdrant = async () => {
    if (confirm('CẢNH BÁO NGUY HIỂM: Bạn có chắc muốn LÀM SẠCH toàn bộ vector trong collection policy_knowledge_base trên Qdrant?\n\nThao tác này sẽ xóa sạch points trên Qdrant, tái tạo lại collection với chuẩn BKAI 768 chiều và đưa tất cả tài liệu về trạng thái chờ nạp.')) {
      setClearingQdrant(true);
      try {
        const res = await clearPolicyQdrant();
        toast.success(res?.message || 'Đã làm sạch Qdrant Policy collection thành công!');
        loadPolicies();
        loadQdrantInfo();
      } catch {
        toast.error('Lỗi khi làm sạch collection Qdrant');
      } finally {
        setClearingQdrant(false);
      }
    }
  };

  const handleSyncAll = async () => {
    if (confirm('Bạn muốn bắt đầu đồng bộ vector BKAI (768 chiều) cho toàn bộ tài liệu chính sách đang hoạt động lên Qdrant?')) {
      setSyncingAll(true);
      try {
        const res = await syncAllPolicies();
        toast.success(`Đã đồng bộ xong ${res?.successCount}/${res?.totalActive} tài liệu lên Qdrant!`);
        loadPolicies();
        loadQdrantInfo();
      } catch {
        toast.error('Lỗi khi đồng bộ hàng loạt lên Qdrant');
      } finally {
        setSyncingAll(false);
      }
    }
  };

  const handleViewChunks = async (id: number) => {
    try {
      const detail = await getPolicyById(id);
      setSelectedPolicyDetail(detail);
      setIsChunksModalOpen(true);
    } catch {
      toast.error('Không thể lấy chi tiết các đoạn cắt');
    }
  };

  // Thống kê nhanh
  const totalChunks = policies.reduce((acc, cur) => acc + (cur.chunkCount || 0), 0);
  const syncedCount = policies.filter((p) => p.embeddingStatus === 'SYNCED').length;
  const pendingCount = policies.filter((p) => p.embeddingStatus === 'PENDING' || p.needsResync).length;

  const qdrantPoints = qdrantInfo?.points_count ?? qdrantInfo?.vectors_count ?? 0;
  const qdrantStatus = qdrantInfo?.status || 'ACTIVE';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Quản lý Tài liệu Chính sách (BKAI RAG)"
        description="Bóc tách văn bản, tự động cắt đoạn (chunking), sinh vector bằng BKAI Bi-Encoder (768d) và nạp/xóa trên Qdrant Vector Database."
        badge={totalElements}
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Clear Qdrant Button */}
            <Button
              variant="outline"
              onClick={handleClearQdrant}
              disabled={clearingQdrant}
              className="rounded-xl font-bold text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-1.5 shadow-xs"
              title="Xóa toàn bộ vector points trong collection Qdrant"
            >
              <Trash2 className={`w-3.5 h-3.5 ${clearingQdrant ? 'animate-spin' : ''}`} />
              {clearingQdrant ? 'Đang làm sạch...' : 'Xóa sạch Qdrant'}
            </Button>

            {/* Sync All Button */}
            <Button
              variant="outline"
              onClick={handleSyncAll}
              disabled={syncingAll}
              className="rounded-xl font-bold text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 flex items-center gap-1.5 shadow-xs"
              title="Đồng bộ lại vector BKAI cho tất cả chính sách đang hoạt động"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
              {syncingAll ? 'Đang đồng bộ...' : 'Đồng bộ tất cả (BKAI)'}
            </Button>

            {/* Create Button */}
            <Button
              onClick={() => {
                setEditingPolicy(null);
                setIsFormOpen(true);
              }}
              className="rounded-xl font-bold text-xs bg-[#0099FF] hover:bg-[#0088e6] text-white shadow-md shadow-[#0099FF]/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Thêm tài liệu mới
            </Button>
          </div>
        }
      />

      {/* Model & Qdrant Compact Info Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50/90 border border-slate-200/80 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-slate-600 flex-wrap">
          <Cpu className="w-4 h-4 text-sky-500" />
          <span className="font-semibold text-slate-700">Model:</span>
          <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
            bkai-foundation-models/vietnamese-bi-encoder
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            768 chiều
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-600">
          <Database className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-slate-700">Qdrant:</span>
          <span className="font-mono text-slate-800">policy_knowledge_base</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-[#0099FF] border border-sky-200">
            {qdrantPoints} points
          </span>
          <button
            onClick={loadQdrantInfo}
            disabled={loadingQdrant}
            className="text-slate-400 hover:text-slate-700 transition-colors ml-0.5"
            title="Tải lại số liệu Qdrant"
          >
            <RefreshCw className={`w-3 h-3 ${loadingQdrant ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0099FF] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng số tài liệu</p>
              <p className="text-xl font-extrabold text-slate-900">{totalElements}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đã đồng bộ vector</p>
              <p className="text-xl font-extrabold text-emerald-600">{syncedCount}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chờ / Cần đồng bộ</p>
              <p className="text-xl font-extrabold text-amber-600">{pendingCount}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng đoạn cắt (Chunks)</p>
              <p className="text-xl font-extrabold text-indigo-600">{totalChunks}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vectors Qdrant</p>
              <p className="text-xl font-extrabold text-violet-600">{qdrantPoints}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <AdminSearchBar
              defaultValue={search}
              onSearch={(v: string) => {
                setSearch(v);
                setPage(0);
              }}
              placeholder="Tìm kiếm theo tiêu đề hoặc slug chính sách..."
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Filter Category */}
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px] h-10 text-xs rounded-xl font-bold text-slate-700">
                <SelectValue placeholder="Tất cả danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Tất cả danh mục</SelectItem>
                <SelectItem value="RETURN" className="text-xs">Đổi trả & Hoàn tiền</SelectItem>
                <SelectItem value="WARRANTY" className="text-xs">Bảo hành</SelectItem>
                <SelectItem value="SHIPPING" className="text-xs">Vận chuyển</SelectItem>
                <SelectItem value="PAYMENT" className="text-xs">Thanh toán</SelectItem>
                <SelectItem value="GENERAL" className="text-xs">Điều khoản chung</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Status */}
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[150px] h-10 text-xs rounded-xl font-bold text-slate-700">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Tất cả trạng thái</SelectItem>
                <SelectItem value="ACTIVE" className="text-xs">Hoạt động</SelectItem>
                <SelectItem value="INACTIVE" className="text-xs">Tạm ẩn</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Filter Button */}
            {(search || category !== 'ALL' || status !== 'ALL') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearch('');
                  setCategory('ALL');
                  setStatus('ALL');
                  setPage(0);
                }}
                className="h-10 w-10 text-slate-500 hover:text-slate-800 rounded-xl"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/75 border-b border-slate-200/80 hover:bg-slate-50/75">
                  <TableHead className="w-16 text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-500 py-3.5">
                    ID
                  </TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Tiêu đề chính sách
                  </TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Danh mục
                  </TableHead>
                  <TableHead className="w-24 text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Đoạn cắt
                  </TableHead>
                  <TableHead className="w-36 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Vector BKAI
                  </TableHead>
                  <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    File đính kèm
                  </TableHead>
                  <TableHead className="w-24 text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Kích hoạt
                  </TableHead>
                  <TableHead className="w-36 text-right pr-6 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#0099FF]" />
                        <span className="text-xs font-medium">Đang tải danh sách chính sách...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : policies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <BookOpen className="w-8 h-8 stroke-1 text-slate-300" />
                        <span className="text-xs font-medium">Chưa có tài liệu chính sách nào phù hợp</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  policies.map((p) => {
                    const catInfo = CATEGORY_MAP[p.category] || { label: p.category, color: 'bg-slate-100 text-slate-700 border-slate-200' };

                    return (
                      <TableRow key={p.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                        {/* ID */}
                        <TableCell className="text-center text-xs font-bold text-slate-400">
                          #{p.id}
                        </TableCell>

                        {/* Title & Slug */}
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-slate-900 hover:text-[#0099FF] transition-colors">
                              {p.title}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              /{p.slug} • v{p.version || 1}
                            </span>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${catInfo.color}`}>
                            {catInfo.label}
                          </span>
                        </TableCell>

                        {/* Chunks */}
                        <TableCell className="text-center">
                          <button
                            onClick={() => handleViewChunks(p.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold bg-sky-50 text-[#0099FF] hover:bg-sky-100 border border-sky-200/80 transition-colors group"
                            title="Xem chi tiết các đoạn cắt"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>{p.chunkCount || 0}</span>
                          </button>
                        </TableCell>

                        {/* Vector Embedding Status */}
                        <TableCell>
                          <PolicyStatusBadge
                            status={p.embeddingStatus}
                            needsResync={p.needsResync}
                          />
                        </TableCell>

                        {/* Cloudinary File */}
                        <TableCell>
                          {p.fileUrl ? (
                            <a
                              href={p.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0099FF] hover:underline bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 max-w-[150px] truncate"
                              title={p.fileName || 'Xem file gốc'}
                            >
                              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{p.fileName || 'File đính kèm'}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-70" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Văn bản gõ tay</span>
                          )}
                        </TableCell>

                        {/* Active Toggle */}
                        <TableCell className="text-center">
                          <AdminToggleButton
                            active={p.isActive}
                            onToggle={() => handleToggleStatus(p)}
                          />
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            {/* Sync Vector BKAI */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSyncVector(p.id)}
                              disabled={syncingId === p.id}
                              className="h-8 w-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg"
                              title="Đồng bộ vector BKAI (768d) lên Qdrant"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${syncingId === p.id ? 'animate-spin' : ''}`} />
                            </Button>

                            {/* Delete Vector from Qdrant */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteVector(p.id, p.title)}
                              disabled={deletingVectorId === p.id}
                              className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Xóa vector chính sách khỏi Qdrant"
                            >
                              <Database className={`w-3.5 h-3.5 ${deletingVectorId === p.id ? 'animate-spin' : ''}`} />
                            </Button>

                            {/* Edit */}
                            <AdminEditButton
                              onClick={() => {
                                setEditingPolicy(p);
                                setIsFormOpen(true);
                              }}
                            />

                            {/* Delete Document */}
                            <AdminDeleteButton
                              onClick={() => handleDelete(p.id, p.title)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && policies.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-500 font-medium">
                Hiển thị trang <strong className="text-slate-900">{page + 1}</strong> trên <strong className="text-slate-900">{totalPages}</strong> ({totalElements} tài liệu)
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                  disabled={page === 0}
                  className="h-8 w-8 p-0 rounded-lg text-slate-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {Array.from({ length: totalPages }).map((_, idx) => (
                  <Button
                    key={idx}
                    variant={page === idx ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(idx)}
                    className={`h-8 w-8 p-0 rounded-lg text-xs font-bold ${
                      page === idx ? 'bg-[#0099FF] text-white hover:bg-[#0088e6]' : 'text-slate-600'
                    }`}
                  >
                    {idx + 1}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                  disabled={page >= totalPages - 1}
                  className="h-8 w-8 p-0 rounded-lg text-slate-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog Create / Edit */}
      <PolicyFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false);
          loadPolicies();
          loadQdrantInfo();
        }}
        policy={editingPolicy}
      />

      {/* Modal View Chunks */}
      <PolicyChunksModal
        open={isChunksModalOpen}
        onOpenChange={setIsChunksModalOpen}
        policy={selectedPolicyDetail}
      />
    </div>
  );
}
