'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@admin/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin/components/ui/table';
import { Badge } from '@admin/components/ui/badge';
import { Button } from '@admin/components/ui/button';
import { Input } from '@admin/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@admin/components/ui/dialog';
import { Label } from '@admin/components/ui/label';
import {
  getProductById,
  addVariant, updateVariant, deleteVariant, toggleVariantStatus,
  uploadImage, addProductImage, deleteProductImage, setPrimaryProductImage,
  getCategories,
  getBrands,
  getReviews, updateReviewStatus, deleteReview
} from '@admin/services';
import { ProductResponse, ProductVariantResponse, ProductImageResponse, CategoryResponse, BrandResponse, ReviewResponse } from '@admin/types';
import { toast } from 'sonner';
import {
  PackageOpen,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  X,
  Upload,
  Star,
  MessageSquare,
  Tag,
  ShieldCheck,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Record<number, string>>({});
  const [brands, setBrands] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reviews State
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewStatus, setReviewStatus] = useState('ALL');
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewTotalPages, setReviewTotalPages] = useState(0);

  // Variant Modal State
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariantResponse | null>(null);
  const [variantForm, setVariantForm] = useState({
    size: '',
    color: '',
    sku: '',
    priceAdjustment: 0,
    stockQuantity: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodData, catsData, brandsData] = await Promise.all([
        getProductById(Number(params.id)),
        getCategories(0, 100),
        getBrands(0, 100)
      ]);
      setProduct(prodData);

      const catMap = catsData.content.reduce((acc: Record<number, string>, cat: CategoryResponse) => { acc[cat.id] = cat.name; return acc; }, {});
      const brandMap = brandsData.content.reduce((acc: Record<number, string>, brand: BrandResponse) => { acc[brand.id] = brand.name; return acc; }, {});
      setCategories(catMap);
      setBrands(brandMap);
    } catch {
      toast.error('Lỗi khi tải dữ liệu chi tiết');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const revData = await getReviews(
        reviewPage,
        5,
        reviewSearch || undefined,
        reviewStatus,
        Number(params.id)
      );
      setReviews(revData.content || []);
      setTotalReviews(revData.totalElements || 0);
      setReviewTotalPages(revData.totalPages || 0);
    } catch {
      console.error('Lỗi khi tải đánh giá của sản phẩm');
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      const timer = setTimeout(() => {
        fetchReviews();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [params.id, reviewSearch, reviewStatus, reviewPage]);

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading('Đang tải ảnh lên...', { id: 'uploadImage' });
      const uploaded = await uploadImage(file);

      await addProductImage(Number(params.id), {
        imageUrl: uploaded.url,
        cloudinaryPublicId: uploaded.publicId,
        displayOrder: product?.images?.length || 0
      });

      toast.success('Thêm ảnh thành công', { id: 'uploadImage' });
      fetchData();
    } catch {
      toast.error('Lỗi khi thêm ảnh', { id: 'uploadImage' });
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Xóa ảnh này?')) return;
    try {
      await deleteProductImage(imageId);
      toast.success('Xóa ảnh thành công');
      fetchData();
    } catch {
      toast.error('Lỗi khi xóa ảnh');
    }
  };

  const handleSetPrimaryImage = async (imageId: number) => {
    try {
      await setPrimaryProductImage(imageId);
      toast.success('Đã đặt làm ảnh chính');
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Lỗi khi đặt ảnh chính');
    }
  };

  // Variant Handlers
  const openVariantModal = (variant?: ProductVariantResponse) => {
    if (variant) {
      setEditingVariant(variant);
      setVariantForm({
        size: variant.size || '',
        color: variant.color || '',
        sku: variant.sku || '',
        priceAdjustment: 0,
        stockQuantity: variant.stock || 0
      });
    } else {
      setEditingVariant(null);
      setVariantForm({ size: '', color: '', sku: '', priceAdjustment: 0, stockQuantity: 0 });
    }
    setIsVariantModalOpen(true);
  };

  const handleSaveVariant = async () => {
    const size = variantForm.size.trim();
    const color = variantForm.color.trim();

    if (!size || !color) {
      toast.error('Kích thước và màu sắc không được để trống!');
      return;
    }

    // Kiểm tra trùng kích cỡ và màu sắc ngay trên giao diện
    const isDuplicate = product?.variants?.some((v: ProductVariantResponse) => {
      const sameSize = (v.size || '').trim().toLowerCase() === size.toLowerCase();
      const sameColor = (v.color || '').trim().toLowerCase() === color.toLowerCase();
      const isSelf = editingVariant && v.id === editingVariant.id;
      return sameSize && sameColor && !isSelf;
    });

    if (isDuplicate) {
      toast.error(`Sản phẩm này đã có biến thể Size "${size}" - Màu "${color}" rồi!`);
      return;
    }

    try {
      const autoSku = editingVariant?.sku || `${params.id}-${size.toUpperCase()}-${color.toUpperCase()}`;
      const payload = {
        ...variantForm,
        size,
        color,
        sku: autoSku
      };

      if (editingVariant) {
        await updateVariant(editingVariant.id, payload);
        toast.success('Cập nhật biến thể thành công');
      } else {
        await addVariant(Number(params.id), payload);
        toast.success('Thêm biến thể thành công');
      }
      setIsVariantModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Lỗi khi lưu biến thể');
    }
  };

  const handleDeleteVariant = async (variantId: number) => {
    if (!confirm('Xóa biến thể này?')) return;
    try {
      await deleteVariant(variantId);
      toast.success('Xóa biến thể thành công');
      fetchData();
    } catch {
      toast.error('Lỗi khi xóa biến thể');
    }
  };

  const handleToggleVariantStatus = async (variantId: number) => {
    try {
      await toggleVariantStatus(variantId);
      toast.success('Cập nhật trạng thái thành công');
      fetchData();
    } catch {
      toast.error('Lỗi cập nhật trạng thái');
    }
  };

  // Review Handlers
  const handleToggleReviewStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' || currentStatus === 'APPROVED' ? 'HIDDEN' : 'ACTIVE';
    try {
      await updateReviewStatus(id, nextStatus);
      toast.success(`Đã chuyển trạng thái đánh giá sang "${nextStatus === 'ACTIVE' ? 'Hiển thị' : 'Ẩn'}"`);
      fetchReviews();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Lỗi khi cập nhật trạng thái đánh giá');
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    try {
      await deleteReview(id);
      toast.success('Đã xóa đánh giá thành công');
      fetchReviews();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Lỗi khi xóa đánh giá');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const baseClass = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm";
    if (status === 'ACTIVE') return <span className={`${baseClass} bg-green-600 text-white`}>Đang bán</span>;
    if (status === 'DELETED') return <span className={`${baseClass} bg-red-600 text-white`}>Đã xóa</span>;
    return <span className={`${baseClass} bg-slate-500 text-white`}>Ngừng bán</span>;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
              }`}
          />
        ))}
      </div>
    );
  };

  if (loading) return <div className="text-center py-12 font-bold text-slate-600">Đang tải...</div>;
  if (!product) return <div className="text-center py-12 font-bold text-red-500">Không tìm thấy sản phẩm!</div>;

  const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <div className="space-y-6 pb-12">
      {/* Thanh tiêu đề */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild className="bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-slate-200">
            <Link href="/admin/products"><ArrowLeft className="w-4 h-4 mr-2" /> Quay lại</Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Chi tiết sản phẩm</h2>
        </div>
        <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
          <Link href={`/admin/products/${product.id}/edit`}><Edit2 className="w-4 h-4 mr-2" /> Sửa thông tin chung</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Hình ảnh */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Hình ảnh</CardTitle>
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Thêm ảnh
              </Button>
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
            </CardHeader>
            <CardContent className="space-y-4">
              {product.images && product.images.length > 0 ? (
                <>
                  <div className="aspect-square bg-slate-100 rounded-lg border overflow-hidden relative group">
                    <img
                      src={
                        product.images.find((i: ProductImageResponse) => i.isPrimary)?.imageUrl ||
                        product.images[0]?.imageUrl
                      }
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.map((img: ProductImageResponse, idx: number) => (
                      <div key={img.id || idx} className={`aspect-square rounded border overflow-hidden relative group ${img.isPrimary ? 'ring-2 ring-blue-500' : ''}`}>
                        <img src={img.imageUrl} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleDeleteImage(img.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Xóa ảnh"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {img.isPrimary ? (
                          <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] font-bold rounded px-1.5 py-0.5 flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-white" /> Chính
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetPrimaryImage(img.id)}
                            className="absolute bottom-1 left-1 bg-white/90 text-blue-700 text-[10px] font-bold rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                            title="Đặt làm ảnh chính"
                          >
                            Đặt ảnh chính
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="aspect-square bg-slate-100 rounded-lg border flex flex-col items-center justify-center text-slate-400">
                  <PackageOpen className="w-12 h-12 mb-2" />
                  <span className="text-sm">Chưa có hình ảnh</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Khối Thẻ Tags */}
          {product.tags && (
            <Card>
              <CardHeader className="py-3.5 border-b bg-slate-50/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" /> Thẻ tìm kiếm (Tags)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.split(',').map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="font-medium text-xs bg-slate-100 text-slate-700">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cột phải: Thông tin, Biến thể & Đánh giá */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Thông tin chung */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <div className="text-slate-500">Tên sản phẩm</div>
                  <div className="font-bold text-slate-900 text-base">{product.name}</div>
                </div>
                <div>
                  <div className="text-slate-500">Đường dẫn (Slug)</div>
                  <div className="font-medium text-slate-700 font-mono text-xs">{product.slug || '---'}</div>
                </div>
                <div>
                  <div className="text-slate-500">Phân loại danh mục</div>
                  <div className="font-bold text-slate-900">{categories[product.categoryId] || '---'}</div>
                </div>
                <div>
                  <div className="text-slate-500">Thương hiệu</div>
                  <div className="font-bold text-slate-900">{brands[product.brandId] || 'Không có'}</div>
                </div>
                <div>
                  <div className="text-slate-500">Giá bán cơ bản</div>
                  <div className="font-bold text-lg text-slate-900">{formatCurrency(product.basePrice)}</div>
                </div>
                <div>
                  <div className="text-slate-500">Giá khuyến mãi</div>
                  <div className="font-bold text-lg text-red-600">
                    {product.discountPrice ? formatCurrency(product.discountPrice) : 'Không giảm giá'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Đối tượng / Giới tính</div>
                  <div className="font-bold text-slate-800">
                    {product.gender === 'MALE' ? 'Nam' : product.gender === 'FEMALE' ? 'Nữ' : 'Nam và Nữ (Unisex)'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Trạng thái kinh doanh</div>
                  <div>{getStatusBadge(product.status)}</div>
                </div>
              </div>

              {product.shortDescription && (
                <div className="pt-3 border-t">
                  <div className="text-slate-500 text-xs font-semibold mb-1">Mô tả ngắn:</div>
                  <p className="text-sm text-slate-700 italic bg-slate-50 p-2.5 rounded border border-slate-200">
                    {product.shortDescription}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Biến thể */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Biến thể (Kích thước & Màu sắc)</CardTitle>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="font-bold">Tổng tồn kho: {totalStock}</Badge>
                <Button size="sm" onClick={() => openVariantModal()}><Plus className="w-4 h-4 mr-1" /> Thêm biến thể</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                    <TableHead className="w-[12%] min-w-[70px] text-center font-bold text-slate-700">Kích cỡ</TableHead>
                    <TableHead className="w-[18%] min-w-[90px] font-bold text-slate-700">Màu sắc</TableHead>
                    <TableHead className="w-[28%] min-w-[140px] font-bold text-slate-700">Mã SKU</TableHead>
                    <TableHead className="w-[12%] min-w-[80px] text-center font-bold text-slate-700">Tồn kho</TableHead>
                    <TableHead className="w-[14%] min-w-[95px] text-center font-bold text-slate-700">Trạng thái</TableHead>
                    <TableHead className="w-[16%] min-w-[140px] text-center font-bold text-slate-700">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.variants?.map((variant: ProductVariantResponse) => (
                    <TableRow key={variant.id} className="hover:bg-slate-50/60 transition-colors">
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800 text-xs border border-slate-200">
                          {variant.size}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">{variant.color}</TableCell>
                      <TableCell>
                        <span className="inline-block font-mono text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {variant.sku || `${product.id}-${(variant.size || '').toUpperCase()}-${(variant.color || '').toUpperCase()}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-slate-700">
                        {variant.stock}
                      </TableCell>
                      <TableCell className="text-center">
                        {variant.status
                          ? <Badge className="bg-emerald-100 text-emerald-800 border-none font-medium hover:bg-emerald-100">Hoạt động</Badge>
                          : <Badge className="bg-slate-100 text-slate-600 border-none font-medium hover:bg-slate-100">Tạm ẩn</Badge>
                        }
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs px-2.5"
                            onClick={() => handleToggleVariantStatus(variant.id)}
                            title="Bật/Tắt trạng thái hoạt động"
                          >
                            Đổi TT
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openVariantModal(variant)}
                            title="Sửa biến thể"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDeleteVariant(variant.id)}
                            title="Xóa biến thể"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!product.variants || product.variants.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                        Chưa có biến thể nào được tạo cho sản phẩm này.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Card Mô tả chi tiết */}
          {product.description && (
            <Card>
              <CardHeader><CardTitle>Mô tả chi tiết sản phẩm</CardTitle></CardHeader>
              <CardContent>
                <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border leading-relaxed whitespace-pre-line">
                  {product.description}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Card Đánh giá & Phản hồi của khách hàng (Hiển thị toàn trang chiều rộng, có tìm kiếm và phân trang) */}
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
              <MessageSquare className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Đánh giá & Phản hồi của khách hàng ({totalReviews})</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Danh sách các bình luận và phản hồi riêng cho sản phẩm này</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-800 shadow-sm self-start sm:self-auto">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>Điểm trung bình: {avgRating} / 5.0</span>
          </div>
        </CardHeader>

        {/* Thanh tìm kiếm và bộ lọc trạng thái */}
        <div className="p-4 border-b bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Input
              placeholder="Tìm theo nội dung bình luận, người đánh giá..."
              value={reviewSearch}
              onChange={(e) => { setReviewSearch(e.target.value); setReviewPage(0); }}
              className="bg-white text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { label: 'Tất cả', value: 'ALL' },
              { label: 'Hiển thị', value: 'ACTIVE' },
              { label: 'Bị ẩn', value: 'HIDDEN' }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setReviewStatus(tab.value); setReviewPage(0); }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${reviewStatus === tab.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {reviewsLoading ? (
            <div className="text-center py-10 font-medium text-slate-500 text-sm">Đang tải danh sách đánh giá...</div>
          ) : reviews.length > 0 ? (
            <>
              <div className="space-y-4 divide-y divide-slate-100">
                {reviews.map((rev) => (
                  <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {rev.userAvatar ? (
                          <img src={rev.userAvatar} alt="" className="w-9 h-9 rounded-full object-cover border" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{rev.userName || `Khách hàng #${rev.userId}`}</span>
                            {rev.userEmail && (
                              <span className="text-xs text-slate-400 font-normal">({rev.userEmail})</span>
                            )}
                            {rev.isVerifiedPurchase && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <ShieldCheck className="w-3 h-3" /> Đã mua
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-400">
                              {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('vi-VN') : '---'}
                            </span>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.2 text-[10px] font-bold ${rev.status === 'ACTIVE' || rev.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                              {rev.status === 'ACTIVE' || rev.status === 'APPROVED' ? 'Hiển thị' : 'Bị ẩn'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Số sao & Nút thao tác Admin */}
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        {renderStars(rev.rating || 5)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleReviewStatus(rev.id, rev.status)}
                          className="h-8 text-xs font-semibold px-3"
                        >
                          {rev.status === 'ACTIVE' || rev.status === 'APPROVED' ? 'Ẩn' : 'Hiện'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteReview(rev.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-slate-800 pl-12 leading-relaxed bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                      {rev.comment || <span className="italic text-slate-400">Không có lời bình</span>}
                    </p>
                  </div>
                ))}
              </div>

              {/* Phân trang đánh giá */}
              {reviewTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-xs text-slate-500 font-medium">
                    Trang {reviewPage + 1} / {reviewTotalPages} (Tổng cộng {totalReviews} đánh giá)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReviewPage((prev) => Math.max(0, prev - 1))}
                      disabled={reviewPage === 0}
                      className="text-xs h-8"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReviewPage((prev) => Math.min(reviewTotalPages - 1, prev + 1))}
                      disabled={reviewPage >= reviewTotalPages - 1}
                      className="text-xs h-8"
                    >
                      Sau <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 text-slate-500 text-sm">
              Không tìm thấy đánh giá nào phù hợp với điều kiện tìm kiếm.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variant Modal */}
      <Dialog open={isVariantModalOpen} onOpenChange={setIsVariantModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVariant ? 'Sửa biến thể' : 'Thêm biến thể mới'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Kích cỡ</Label>
              <Input className="col-span-3" value={variantForm.size} onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })} placeholder="VD: S, M, L, XL..." />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Màu sắc</Label>
              <Input className="col-span-3" value={variantForm.color} onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })} placeholder="VD: Đỏ, Xanh, Đen..." />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Tồn kho</Label>
              <Input type="number" className="col-span-3" value={variantForm.stockQuantity} onChange={(e) => setVariantForm({ ...variantForm, stockQuantity: Number(e.target.value) })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Mã SKU</Label>
              <div className="col-span-3 space-y-1">
                <Input
                  disabled
                  readOnly
                  className="bg-slate-100 font-mono text-xs text-slate-600 cursor-not-allowed select-none"
                  value={
                    editingVariant
                      ? (editingVariant.sku || `${params.id}-${variantForm.size.toUpperCase()}-${variantForm.color.toUpperCase()}`)
                      : (variantForm.size && variantForm.color
                          ? `${params.id}-${variantForm.size.trim().toUpperCase()}-${variantForm.color.trim().toUpperCase()}`
                          : '(Hệ thống tự động sinh theo Kích cỡ & Màu sắc)')
                  }
                />
                <p className="text-[11px] text-slate-500">Mã SKU được hệ thống tự động tạo, không cần nhập thủ công.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVariantModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveVariant}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
