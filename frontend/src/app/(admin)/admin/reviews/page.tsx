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
import { Input } from '@admin/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@admin/components/ui/select';
import { getReviews, updateReviewStatus, deleteReview, getProducts } from '@admin/services';
import { ReviewResponse, ProductResponse } from '@admin/types';
import { toast } from 'sonner';

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
    const timer = setTimeout(() => {
      loadReviews();
    }, 400);
    return () => clearTimeout(timer);
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

  const getStatusBadge = (statusStr: string) => {
    const baseClass = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm whitespace-nowrap";
    switch (statusStr) {
      case 'APPROVED':
      case 'ACTIVE':
      case 'PUBLISHED':
        return <span className={`${baseClass} bg-green-600 text-white`}>Hiển thị</span>;
      case 'HIDDEN':
      case 'PENDING':
      case 'REJECTED':
      case 'INACTIVE':
      default:
        return <span className={`${baseClass} bg-slate-500 text-white`}>Bị ẩn</span>;
    }
  };

  const getSentimentBadge = (label?: string) => {
    if (!label) return null;
    const lower = label.toLowerCase();
    if (lower === 'positive' || lower === 'tích cực') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
          <ThumbsUp className="w-3 h-3" /> Tích cực
        </span>
      );
    }
    if (lower === 'negative' || lower === 'tiêu cực') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
          <ThumbsDown className="w-3 h-3" /> Tiêu cực
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
        Trung tính
      </span>
    );
  };

  const statusFilters = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Hiển thị', value: 'ACTIVE' },
    { label: 'Bị ẩn', value: 'HIDDEN' },
  ];

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Đánh giá & Phản hồi</h2>
          <p className="text-xs text-slate-500 mt-1">Lọc và kiểm duyệt đánh giá theo từng sản phẩm cụ thể hoặc toàn bộ hệ thống</p>
        </div>
      </div>

      {/* Tabs lọc nhanh trạng thái */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusFilters.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(0); }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
              status === tab.value 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Tìm kiếm theo nội dung, khách hàng, sản phẩm */}
            <Input 
              placeholder="Tìm theo nội dung, khách hàng, sản phẩm..." 
              className="max-w-xs border-slate-300 text-slate-900 bg-slate-50 focus:bg-white text-sm" 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />

            {/* Bộ lọc theo sản phẩm */}
            <div className="flex items-center gap-2">
              <Select 
                value={selectedProductId} 
                onValueChange={(val) => { setSelectedProductId(val); setPage(0); }}
              >
                <SelectTrigger className="w-[260px] border-slate-300 bg-slate-50 focus:bg-white text-xs font-semibold">
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
              <TableRow>
                <TableHead className="w-16 font-bold text-slate-900">Mã ĐG</TableHead>
                <TableHead className="font-bold text-slate-900">Sản phẩm</TableHead>
                <TableHead className="font-bold text-slate-900">Khách hàng</TableHead>
                <TableHead className="font-bold text-slate-900">Đánh giá</TableHead>
                <TableHead className="font-bold text-slate-900">Nội dung bình luận</TableHead>
                <TableHead className="font-bold text-slate-900">Trạng thái</TableHead>
                <TableHead className="font-bold text-slate-900">Ngày gửi</TableHead>
                <TableHead className="text-center font-bold text-slate-900">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 font-bold text-slate-700">Đang tải...</TableCell>
                </TableRow>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <TableRow key={review.id} className="hover:bg-slate-50">
                    <TableCell className="font-bold text-slate-900">{review.id}</TableCell>
                    
                    {/* Sản phẩm */}
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-[220px]">
                        {review.productImage ? (
                          <img src={review.productImage} alt="" className="w-9 h-9 rounded object-cover border shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <Link 
                            href={`/admin/products/${review.productId}`}
                            className="text-sm font-semibold text-blue-600 hover:underline line-clamp-1 flex items-center gap-1"
                            title={review.productName || `Sản phẩm ${review.productId}`}
                          >
                            {review.productName || `Sản phẩm ${review.productId}`}
                            <ExternalLink className="w-3 h-3 inline shrink-0" />
                          </Link>
                          <span className="text-[11px] text-slate-400">Mã SP: {review.productId}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Khách hàng */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {review.userAvatar ? (
                          <img src={review.userAvatar} alt="" className="w-8 h-8 rounded-full object-cover border" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {review.userName || `Khách hàng ${review.userId}`}
                          </div>
                          {review.userEmail && (
                            <div className="text-xs text-slate-500 font-medium">{review.userEmail}</div>
                          )}
                          {review.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold mt-0.5">
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
                      <p className="text-sm text-slate-800 line-clamp-2 leading-relaxed" title={review.comment}>
                        {review.comment || <span className="text-slate-400 italic">Không có lời bình</span>}
                      </p>
                    </TableCell>

                    {/* Trạng thái */}
                    <TableCell>{getStatusBadge(review.status)}</TableCell>

                    {/* Ngày tạo */}
                    <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : '---'}
                    </TableCell>

                    {/* Hành động */}
                    <TableCell className="text-center space-x-2 whitespace-nowrap">
                      {review.status !== 'ACTIVE' && review.status !== 'APPROVED' && review.status !== 'PUBLISHED' ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleUpdateStatus(review.id, 'ACTIVE')}
                          className="font-bold border-green-200 hover:bg-green-50 text-green-700 bg-white"
                        >
                          Hiện
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleUpdateStatus(review.id, 'HIDDEN')}
                          className="font-bold border-slate-200 hover:bg-slate-50 text-slate-600 bg-white"
                        >
                          Ẩn
                        </Button>
                      )}

                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDelete(review.id)}
                        className="font-bold bg-red-600 hover:bg-red-700 text-white"
                      >
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 font-bold text-slate-700">
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
