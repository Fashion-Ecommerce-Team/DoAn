'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Package, 
  ShieldCheck, 
  ThumbsUp, 
  ThumbsDown, 
  ExternalLink 
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@admin/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin/components/ui/table';
import { Button } from '@admin/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@admin/components/ui/select';
import { getReviews, updateReviewStatus, deleteReview, getProducts } from '@admin/services';
import { ReviewResponse, ProductResponse } from '@admin/types';
import { toast } from 'sonner';
import AdminSearchBar from '@/features/admin/components/common/AdminSearchBar';
import AdminPageHeader from '@/features/admin/components/common/AdminPageHeader';
import AdminStatusBadge from '@/features/admin/components/common/AdminStatusBadge';
import { AdminToggleButton, AdminDeleteButton } from '@/features/admin/components/common/AdminTableActions';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Load danh sách sản phẩm để cho vào bộ lọc
  useEffect(() => {
    const loadProductOptions = async () => {
      try {
        const prodData = await getProducts(0, 100);
        setProducts(prodData.content || []);
      } catch (err) {
        console.error('Lỗi khi tải danh sách sản phẩm', err);
      }
    };
    loadProductOptions();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const prodId = selectedProductId !== 'ALL' ? Number(selectedProductId) : undefined;
      const data = await getReviews(page, 10, search || undefined, status, prodId);
      setReviews(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch {
      toast.error('Lỗi khi tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [search, status, selectedProductId, page]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await updateReviewStatus(id, newStatus);
      const statusLabel = newStatus === 'ACTIVE' || newStatus === 'APPROVED' ? 'Hiển thị' : 'Bị ẩn';
      toast.success(`Cập nhật trạng thái thành "${statusLabel}" thành công!`);
      loadReviews();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Lỗi khi cập nhật trạng thái đánh giá');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này?')) {
      try {
        await deleteReview(id);
        toast.success('Đã xóa đánh giá thành công!');
        loadReviews();
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err?.response?.data?.message || 'Lỗi khi xóa đánh giá');
      }
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
            }`}
          />
        ))}
        <span className="text-xs font-bold text-slate-700 ml-1">({rating}/5)</span>
      </div>
    );
  };

  const getSentimentBadge = (label?: string) => {
    if (!label) return null;
    const lower = label.toLowerCase();
    if (lower === 'positive' || lower === 'tích cực') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
          <ThumbsUp className="w-3 h-3 text-emerald-600" /> Tích cực
        </span>
      );
    }
    if (lower === 'negative' || lower === 'tiêu cực') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full">
          <ThumbsDown className="w-3 h-3 text-rose-600" /> Tiêu cực
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
        Trung tính
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quản lý Đánh giá & Phản hồi"
        description="Kiểm duyệt bình luận, đánh giá sao và phân tích cảm xúc của khách hàng"
        badge={totalElements}
      />

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Tìm kiếm theo nội dung, khách hàng, sản phẩm */}
            <AdminSearchBar
              placeholder="Tìm theo nội dung, khách hàng, sản phẩm..."
              defaultValue={search}
              onSearch={(val) => {
                setSearch(val);
                setPage(0);
              }}
              className="w-full sm:max-w-md"
            />

            {/* Bộ lọc trạng thái */}
            <Select 
              value={status} 
              onValueChange={(val) => { setStatus(val); setPage(0); }}
            >
              <SelectTrigger className="w-full sm:w-[170px] border-slate-200 rounded-xl text-xs font-semibold h-9">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="ACTIVE">Hiển thị</SelectItem>
                <SelectItem value="HIDDEN">Bị ẩn</SelectItem>
              </SelectContent>
            </Select>

            {/* Bộ lọc theo sản phẩm */}
            <div className="flex items-center gap-2">
              <Select 
                value={selectedProductId} 
                onValueChange={(val) => { setSelectedProductId(val); setPage(0); }}
              >
                <SelectTrigger className="w-full sm:w-[240px] border-slate-200 rounded-xl text-xs font-semibold h-9">
                  <SelectValue placeholder="Lọc theo sản phẩm..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="ALL">Tất cả sản phẩm</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedProductId !== 'ALL' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setSelectedProductId('ALL'); setPage(0); }}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Xóa lọc sản phẩm
            </Button>
          )}
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="w-16 font-semibold text-slate-700 text-xs py-3.5">Mã ĐG</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Sản phẩm</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Khách hàng</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Đánh giá</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Nội dung bình luận</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Trạng thái</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Ngày gửi</TableHead>
                <TableHead className="text-center font-semibold text-slate-700 text-xs py-3.5">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 font-semibold text-slate-600">Đang tải...</TableCell>
                </TableRow>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <TableRow key={review.id} className="hover:bg-slate-50/80">
                    <TableCell className="font-mono text-xs font-bold text-slate-700">#{review.id}</TableCell>
                    
                    {/* Sản phẩm */}
                    <TableCell>
                      <div className="flex items-center gap-2.5 max-w-[220px]">
                        {review.productImage ? (
                          <img src={review.productImage} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <Link 
                            href={`/admin/products/${review.productId}`}
                            className="text-xs font-semibold text-[#0099FF] hover:text-[#0077cc] hover:underline line-clamp-1 flex items-center gap-1"
                            title={review.productName || `Sản phẩm ${review.productId}`}
                          >
                            {review.productName || `Sản phẩm ${review.productId}`}
                            <ExternalLink className="w-3 h-3 inline shrink-0" />
                          </Link>
                          <span className="text-[11px] text-slate-400 font-mono">SP #{review.productId}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Khách hàng */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {review.userAvatar ? (
                          <img src={review.userAvatar} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900 text-xs">
                            {review.userName || `Khách hàng #${review.userId}`}
                          </div>
                          {review.userEmail && (
                            <div className="text-[11px] text-slate-500 font-medium">{review.userEmail}</div>
                          )}
                          {review.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold mt-0.5">
                              <ShieldCheck className="w-3 h-3" /> Đã mua hàng
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Đánh giá sao & cảm xúc */}
                    <TableCell>
                      <div className="space-y-1">
                        {renderStars(review.rating || 5)}
                        {getSentimentBadge(review.sentimentLabel)}
                      </div>
                    </TableCell>

                    {/* Bình luận */}
                    <TableCell className="max-w-[260px]">
                      <p className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed" title={review.comment}>
                        {review.comment || <span className="text-slate-400 italic">Không có lời bình</span>}
                      </p>
                    </TableCell>

                    {/* Trạng thái */}
                    <TableCell><AdminStatusBadge status={review.status} type="review" /></TableCell>

                    {/* Ngày tạo */}
                    <TableCell className="text-slate-500 text-xs whitespace-nowrap">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : '---'}
                    </TableCell>

                    {/* Hành động */}
                    <TableCell className="text-center space-x-1.5 whitespace-nowrap py-3">
                      <AdminToggleButton
                        active={review.status === 'ACTIVE' || review.status === 'APPROVED' || review.status === 'PUBLISHED'}
                        onToggle={() =>
                          handleUpdateStatus(
                            review.id,
                            review.status === 'ACTIVE' || review.status === 'APPROVED' || review.status === 'PUBLISHED'
                              ? 'HIDDEN'
                              : 'ACTIVE'
                          )
                        }
                        activeLabel="Ẩn"
                        inactiveLabel="Hiện"
                      />
                      <AdminDeleteButton onClick={() => handleDelete(review.id)} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 font-semibold text-slate-500">
                    Không tìm thấy đánh giá nào {selectedProductId !== 'ALL' && 'cho sản phẩm này'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 0 && (
            <div className="flex items-center justify-between mt-4 border-t pt-4">
              <div className="text-sm font-medium text-slate-500">
                Tổng số: {totalElements} đánh giá
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium text-slate-700">Trang {page + 1} / {totalPages}</span>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1 || loading}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
