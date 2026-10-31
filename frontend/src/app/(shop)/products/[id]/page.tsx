'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { productApi } from '@/features/shop/services/product.api';
import { wishlistApi } from '@/features/shop/services/wishlist.api';
import { reviewApi, ReviewItem, ProductReviewSummary } from '@/features/shop/services/review.api';
import { ProductDetail, ProductVariant } from '@/features/shop/types/product.types';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { toast } from 'sonner';
import { 
  Heart, 
  Ruler, 
  Truck, 
  RefreshCcw, 
  Star, 
  Plus, 
  Minus, 
  Check, 
  Sparkles, 
  ShoppingBag,
  Send,
  MessageSquare,
  X
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params.id);

  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Product state
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Size Guide Modal State
  const [sizeGuideOpen, setSizeGuideOpen] = useState<boolean>(false);

  // Reviews State
  const [reviewsSummary, setReviewsSummary] = useState<ProductReviewSummary | null>(null);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | undefined>(undefined);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Active Tab for details
  const [activeTab, setActiveTab] = useState<'desc' | 'shipping' | 'reviews'>('desc');

  // Load product detail & reviews
  const loadProduct = useCallback(async () => {
    if (!productId || isNaN(productId)) return;
    setLoading(true);
    try {
      const data = await productApi.getProductById(productId);
      setProduct(data);
      const defaultImg = data.primaryImageUrl || data.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';
      setSelectedImage(defaultImg);

      // Auto select first variant color/size if available
      if (data.variants && data.variants.length > 0) {
        const firstVariant = data.variants.find((v) => v.stockQuantity > 0) || data.variants[0];
        if (firstVariant.color) setSelectedColor(firstVariant.color);
        if (firstVariant.size) setSelectedSize(firstVariant.size);
      }
    } catch {
      toast.error('Không tìm thấy thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const loadReviews = useCallback(async () => {
    if (!productId || isNaN(productId)) return;
    try {
      const summary = await reviewApi.getProductReviews(productId, {
        rating: selectedRatingFilter,
        page: 0,
        size: 15,
      });
      setReviewsSummary(summary);
    } catch {
      // ignore
    }
  }, [productId, selectedRatingFilter]);

  const checkWishlistStatus = useCallback(async () => {
    if (!isAuthenticated || !productId) return;
    const status = await wishlistApi.checkWishlist(productId);
    setIsWishlisted(status);
  }, [isAuthenticated, productId]);

  useEffect(() => {
    loadProduct();
    loadReviews();
    checkWishlistStatus();
  }, [loadProduct, loadReviews, checkWishlistStatus]);

  // Wishlist Toggle
  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để lưu sản phẩm vào yêu thích!');
      router.push(`/login?redirect=/products/${productId}`);
      return;
    }

    try {
      if (isWishlisted) {
        await wishlistApi.removeFromWishlist(productId);
        setIsWishlisted(false);
        toast.success('Đã xóa khỏi danh sách yêu thích');
      } else {
        await wishlistApi.addToWishlist(productId);
        setIsWishlisted(true);
        toast.success('Đã thêm vào danh sách yêu thích!');
      }
    } catch {
      toast.error('Không thể cập nhật danh sách yêu thích');
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để gửi đánh giá!');
      router.push(`/login?redirect=/products/${productId}`);
      return;
    }

    if (!newComment.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá của bạn');
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewApi.createReview({
        productId,
        rating: newRating,
        comment: newComment.trim(),
      });
      toast.success('Gửi đánh giá thành công! Cảm ơn nhận xét của bạn.');
      setNewComment('');
      setNewRating(5);
      loadReviews();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Gửi đánh giá thất bại');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">Đang tải sản phẩm...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-4 text-center">
        <h2 className="text-xl font-bold uppercase tracking-wider text-neutral-900">Sản phẩm không tồn tại</h2>
        <p className="text-xs text-neutral-500 mt-2">Sản phẩm bạn đang tìm kiếm có thể đã bị xóa hoặc ngưng bán.</p>
        <Link href="/products" className="mt-6 px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xs">
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  // Calculate unique colors and sizes from variants
  const availableColors = Array.from(new Set(product.variants?.map((v) => v.color).filter(Boolean)));
  const availableSizes = Array.from(new Set(product.variants?.map((v) => v.size).filter(Boolean)));

  // Selected variant finding
  const selectedVariant: ProductVariant | undefined = product.variants?.find((v) => {
    const matchColor = !selectedColor || v.color === selectedColor;
    const matchSize = !selectedSize || v.size === selectedSize;
    return matchColor && matchSize;
  });

  const currentStock = selectedVariant?.stockQuantity ?? product.totalStock ?? 0;
  const isOutOfStock = currentStock <= 0;

  // Pricing
  const formatPrice = (price?: number | null) => {
    if (!price) return '0₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };
  const hasDiscount = product.discountPrice && product.discountPrice < product.basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.basePrice - product.discountPrice!) / product.basePrice) * 100)
    : 0;

  // Gallery image list
  const galleryImages = [
    product.primaryImageUrl,
    ...(product.images?.map((img) => img.imageUrl) || []),
  ].filter(Boolean) as string[];
  const uniqueImages = Array.from(new Set(galleryImages));

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Breadcrumb */}
      <div className="border-b border-neutral-200 bg-neutral-50/50 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-black">Trang chủ</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-black">Sản phẩm</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link href={`/products?category=${product.category.slug}`} className="hover:text-black">
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-black font-semibold truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
        </div>
      </div>

      {/* 2. Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14">
          
          {/* LEFT: GALLERY IMAGES (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnail selector */}
            {uniqueImages.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[580px] shrink-0 no-scrollbar">
                {uniqueImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-20 sm:w-20 sm:h-24 shrink-0 border rounded-xs overflow-hidden transition-all cursor-pointer ${
                      selectedImage === img ? 'border-black ring-1 ring-black' : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Featured Image with Lookbook aesthetic */}
            <div className="relative flex-1 aspect-[3/4] bg-neutral-100 rounded-xs overflow-hidden border border-neutral-200 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Discount / Tag Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                {hasDiscount && (
                  <span className="px-2.5 py-1 bg-black text-white text-[11px] font-black uppercase tracking-wider rounded-xs">
                    GIẢM {discountPercent}%
                  </span>
                )}
                {product.gender && (
                  <span className="px-2.5 py-1 bg-white/90 backdrop-blur-xs text-neutral-900 border border-neutral-200 text-[10px] font-bold uppercase tracking-widest rounded-xs">
                    {product.gender}
                  </span>
                )}
              </div>

              {/* Quick Wishlist Float Button */}
              <button
                onClick={handleToggleWishlist}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md z-10 cursor-pointer ${
                  isWishlisted ? 'bg-red-500 text-white' : 'bg-white/90 text-neutral-800 hover:bg-black hover:text-white'
                }`}
                title={isWishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
              >
                <Heart size={18} className={isWishlisted ? 'fill-white' : ''} />
              </button>
            </div>
          </div>

          {/* RIGHT: PRODUCT INFO & VARIANT SELECTOR (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Brand & Category header */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-500">
                {product.brand?.name || 'SEEME®'} • {product.category?.name || 'STREETWEAR'}
              </span>
              
              {/* Review rating link */}
              {reviewsSummary && (
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="flex items-center gap-1.5 text-xs text-neutral-700 hover:text-black font-semibold cursor-pointer"
                >
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span>{reviewsSummary.averageRating?.toFixed(1) || '5.0'}</span>
                  <span className="text-neutral-400">({reviewsSummary.totalReviews} đánh giá)</span>
                </button>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-neutral-950 leading-tight">
              {product.name}
            </h1>

            {/* Price Box */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-2xl sm:text-3xl font-black text-neutral-950">
                {formatPrice(product.discountPrice || product.basePrice)}
              </span>
              {hasDiscount && (
                <span className="text-base text-neutral-400 line-through font-normal">
                  {formatPrice(product.basePrice)}
                </span>
              )}
            </div>

            {/* COLOR SELECTOR */}
            {availableColors.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Màu sắc: <span className="font-normal text-neutral-500">{selectedColor || 'Chọn màu'}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => {
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color!)}
                        className={`px-3.5 py-2 text-xs font-semibold border rounded-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-black text-white border-black ring-1 ring-black'
                            : 'bg-white text-neutral-800 border-neutral-300 hover:border-black'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SIZE SELECTOR & SIZE GUIDE */}
            {availableSizes.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Kích thước: <span className="font-normal text-neutral-500">{selectedSize || 'Chọn size'}</span>
                  </span>

                  {/* Size Guide Trigger */}
                  <button
                    onClick={() => setSizeGuideOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-neutral-600 hover:text-black underline underline-offset-4 cursor-pointer"
                  >
                    <Ruler size={13} /> Bảng đo kích thước
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => {
                    const isSelected = selectedSize === size;
                    // Check stock for this size
                    const variantForSize = product.variants?.find(
                      (v) => v.size === size && (!selectedColor || v.color === selectedColor)
                    );
                    const sizeStock = variantForSize ? variantForSize.stockQuantity : product.totalStock;
                    const sizeOutOfStock = sizeStock <= 0;

                    return (
                      <button
                        key={size}
                        disabled={sizeOutOfStock}
                        onClick={() => setSelectedSize(size!)}
                        className={`min-w-[48px] h-11 px-3 flex items-center justify-center text-xs font-bold border rounded-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-black text-white border-black'
                            : sizeOutOfStock
                            ? 'border-neutral-200 text-neutral-300 bg-neutral-50 line-through cursor-not-allowed'
                            : 'border-neutral-300 text-neutral-800 hover:border-black'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QUANTITY & STOCK STATUS */}
            <div className="space-y-2 pt-3 border-t border-neutral-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-neutral-900">Số lượng:</span>
                <span className={`font-mono ${isOutOfStock ? 'text-red-500 font-bold' : 'text-emerald-600'}`}>
                  {isOutOfStock ? 'Hết hàng tạm thời' : `Còn lại: ${currentStock} sản phẩm`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border border-neutral-300 rounded-xs">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:text-black disabled:opacity-30 cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 text-center text-sm font-bold font-mono">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                    disabled={quantity >= currentStock || isOutOfStock}
                    className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:text-black disabled:opacity-30 cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Wishlist Button */}
                <button
                  onClick={handleToggleWishlist}
                  className={`flex-1 py-3 px-4 border rounded-xs text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    isWishlisted
                      ? 'border-red-500 text-red-600 bg-red-50/50'
                      : 'border-neutral-300 hover:border-black text-neutral-800'
                  }`}
                >
                  <Heart size={15} className={isWishlisted ? 'fill-red-500' : ''} />
                  {isWishlisted ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
                </button>
              </div>
            </div>

            {/* BUY / ADD TO CART BUTTON */}
            <div className="pt-2">
              <button
                disabled={isOutOfStock}
                onClick={() => {
                  toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng! (Demo)`);
                }}
                className="w-full py-4 bg-black text-white hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black uppercase tracking-widest transition-all rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <ShoppingBag size={16} />
                {isOutOfStock ? 'HẾT HÀNG' : 'THÊM VÀO GIỎ HÀNG'}
              </button>
            </div>

            {/* SEEME ASSURANCE BADGES */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-200">
              <div className="flex items-start gap-2.5">
                <Truck size={18} className="text-neutral-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase text-neutral-900">Giao hàng toàn quốc</h4>
                  <p className="text-[11px] text-neutral-500">Đồng giá 30.000₫, nhận hàng 2-4 ngày</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <RefreshCcw size={18} className="text-neutral-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase text-neutral-900">Đổi trả trong 07 ngày</h4>
                  <p className="text-[11px] text-neutral-500">Đổi size dễ dàng khi còn nguyên tem</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 3. TABS SECTION: MÔ TẢ & ĐÁNH GIÁ (REVIEWS) */}
        <div className="mt-16 sm:mt-24 border-t border-neutral-200 pt-10">
          {/* Tab Navigation */}
          <div className="flex border-b border-neutral-200 gap-8 justify-center sm:justify-start">
            <button
              onClick={() => setActiveTab('desc')}
              className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer border-b-2 ${
                activeTab === 'desc' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-neutral-800'
              }`}
            >
              Mô Tả Sản Phẩm
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === 'reviews' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-neutral-800'
              }`}
            >
              Đánh Giá Khách Hàng ({reviewsSummary?.totalReviews || 0})
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer border-b-2 ${
                activeTab === 'shipping' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-neutral-800'
              }`}
            >
              Chính Sách & Bảo Quản
            </button>
          </div>

          {/* TAB 1: DESCRIPTION */}
          {activeTab === 'desc' && (
            <div className="py-8 max-w-3xl space-y-4 text-sm text-neutral-700 leading-relaxed">
              <p className="whitespace-pre-line">
                {product.description ||
                  `Thiết kế nằm trong bộ sưu tập mới nhất của SEEME® streetwear. Phom dáng rộng rãi chuẩn phong cách thời trang đường phố đương đại, kết hợp chất liệu vải cao cấp định lượng cao, thoáng mát và co giãn nhẹ.`}
              </p>
              <div className="bg-neutral-50 p-5 border border-neutral-200 space-y-2 mt-4 rounded-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Chi tiết sản phẩm:</h4>
                <ul className="list-disc list-inside text-xs text-neutral-600 space-y-1">
                  <li>Chất liệu: 100% Cotton 2 chiều hoặc nỉ bông định lượng cao.</li>
                  <li>Họa tiết: Thêu hoặc in lụa thủ công cao cấp sắc nét, bền màu.</li>
                  <li>Phom dáng: Boxy / Oversized form fit chuẩn streetwear.</li>
                  <li>Made in Vietnam by SEEME® Team.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: SHIPPING & CARE */}
          {activeTab === 'shipping' && (
            <div className="py-8 max-w-3xl space-y-4 text-sm text-neutral-700">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Hướng dẫn giặt ủi:</h4>
                <ul className="list-disc list-inside text-xs text-neutral-600 space-y-1">
                  <li>Nên lộn trái áo khi giặt và phơi để giữ màu in bền lâu.</li>
                  <li>Không giặt chung đồ trắng với quần áo tối màu.</li>
                  <li>Không ủi trực tiếp lên bề mặt hình in/thêu.</li>
                  <li>Hạn chế sử dụng thuốc tẩy mạnh và sấy ở nhiệt độ cao.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: REVIEWS & RATINGS */}
          {activeTab === 'reviews' && (
            <div className="py-8 space-y-10">
              
              {/* Reviews Summary Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 sm:p-8 bg-neutral-50 border border-neutral-200 rounded-xs">
                {/* Score */}
                <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-neutral-200 pb-6 md:pb-0">
                  <span className="text-5xl font-black text-neutral-950">
                    {reviewsSummary?.averageRating?.toFixed(1) || '5.0'}
                  </span>
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={16} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs text-neutral-500 mt-1 font-mono">
                    Dựa trên {reviewsSummary?.totalReviews || 0} lượt đánh giá
                  </span>
                </div>

                {/* Rating Distribution Bars */}
                <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
                  {[5, 4, 3, 2, 1].map((s) => {
                    const count = reviewsSummary?.ratingCounts?.[s] || 0;
                    const total = reviewsSummary?.totalReviews || 1;
                    const percent = Math.round((count / total) * 100);
                    const isSelected = selectedRatingFilter === s;

                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedRatingFilter(isSelected ? undefined : s)}
                        className={`flex items-center gap-3 text-xs w-full text-left p-1 rounded-xs transition-colors cursor-pointer ${
                          isSelected ? 'bg-neutral-200' : 'hover:bg-neutral-100'
                        }`}
                      >
                        <span className="w-10 font-bold text-neutral-700 flex items-center gap-1">
                          {s} <Star size={11} className="fill-neutral-400 text-neutral-400" />
                        </span>
                        <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                          <div className="h-full bg-black rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="w-10 text-right text-neutral-400 font-mono">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* WRITE A REVIEW FORM */}
              <div className="border border-neutral-200 p-6 sm:p-8 rounded-xs space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <MessageSquare size={16} /> Viết Nhận Xét Của Bạn
                </h3>

                {isAuthenticated ? (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    {/* Select Rating Stars */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                        Đánh giá của bạn:
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            className="p-1 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star
                              size={24}
                              className={star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-neutral-700 ml-2">
                          {newRating === 5 && 'Tuyệt vời'}
                          {newRating === 4 && 'Rất tốt'}
                          {newRating === 3 && 'Bình thường'}
                          {newRating === 2 && 'Chưa hài lòng'}
                          {newRating === 1 && 'Kém'}
                        </span>
                      </div>
                    </div>

                    {/* Comment box */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                        Nội dung đánh giá *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Chia sẻ cảm nhận về chất vải, form áo, độ hoàn thiện hoặc trải nghiệm mua sắm của bạn..."
                        className="w-full p-3 text-xs bg-neutral-50 border border-neutral-300 focus:bg-white focus:border-black focus:outline-none transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      <Send size={13} />
                      {submittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                    </button>
                  </form>
                ) : (
                  <div className="py-4 text-center bg-neutral-50 border border-dashed border-neutral-200">
                    <p className="text-xs text-neutral-600">
                      Vui lòng <Link href={`/login?redirect=/products/${productId}`} className="font-bold underline text-black">đăng nhập</Link> để viết nhận xét và đánh giá cho sản phẩm này.
                    </p>
                  </div>
                )}
              </div>

              {/* REVIEWS LIST */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Tất Cả Nhận Xét ({reviewsSummary?.reviews?.totalElements || 0})
                </h3>

                {!reviewsSummary?.reviews?.content || reviewsSummary.reviews.content.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-6 text-center border-t border-neutral-100">
                    Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên đánh giá!
                  </p>
                ) : (
                  <div className="space-y-4 divide-y divide-neutral-100">
                    {reviewsSummary.reviews.content.map((review: ReviewItem) => (
                      <div key={review.id} className="pt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold font-sans">
                              {(review.userFullName || 'U').charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-neutral-900">{review.userFullName || 'Khách hàng'}</span>
                                {review.isVerifiedPurchase && (
                                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-xs flex items-center gap-0.5">
                                    <Check size={10} /> Đã mua hàng
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-neutral-400 font-mono">{review.createdAt}</span>
                            </div>
                          </div>

                          {/* Star count */}
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Review Content */}
                        <p className="text-xs text-neutral-700 leading-relaxed pl-10">
                          {review.comment}
                        </p>

                        {/* AI Sentiment Badge */}
                        {review.sentimentLabel && (
                          <div className="pl-10 pt-1">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs ${
                                review.sentimentLabel === 'POSITIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : review.sentimentLabel === 'NEGATIVE'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              <Sparkles size={10} />
                              Cảm xúc: {review.sentimentLabel}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* 4. SIZE GUIDE MODAL (POPUP) */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSizeGuideOpen(false)} />
          <div className="relative bg-white max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Ruler size={18} className="text-neutral-900" />
                <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                  Bảng Hướng Dẫn Chọn Size SEEME®
                </h3>
              </div>
              <button onClick={() => setSizeGuideOpen(false)} className="p-1 text-neutral-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-neutral-500">
                Form áo của SEEME được thiết kế theo phom dáng Boxy / Oversized rộng rãi đặc trưng streetwear. Nếu bạn muốn mặc vừa vặn có thể giảm 1 size.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-neutral-200">
                  <thead className="bg-neutral-100 text-neutral-800 font-bold uppercase">
                    <tr>
                      <th className="p-2.5 border-b border-r border-neutral-200">Size</th>
                      <th className="p-2.5 border-b border-r border-neutral-200">Chiều cao (cm)</th>
                      <th className="p-2.5 border-b border-r border-neutral-200">Cân nặng (kg)</th>
                      <th className="p-2.5 border-b border-neutral-200">Dài áo (cm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-neutral-700">
                    <tr>
                      <td className="p-2.5 font-bold border-r border-neutral-200">S</td>
                      <td className="p-2.5 border-r border-neutral-200">1m55 - 1m65</td>
                      <td className="p-2.5 border-r border-neutral-200">45kg - 55kg</td>
                      <td className="p-2.5">68 cm</td>
                    </tr>
                    <tr className="bg-neutral-50/50">
                      <td className="p-2.5 font-bold border-r border-neutral-200">M</td>
                      <td className="p-2.5 border-r border-neutral-200">1m65 - 1m72</td>
                      <td className="p-2.5 border-r border-neutral-200">55kg - 65kg</td>
                      <td className="p-2.5">71 cm</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold border-r border-neutral-200">L</td>
                      <td className="p-2.5 border-r border-neutral-200">1m72 - 1m78</td>
                      <td className="p-2.5 border-r border-neutral-200">65kg - 75kg</td>
                      <td className="p-2.5">74 cm</td>
                    </tr>
                    <tr className="bg-neutral-50/50">
                      <td className="p-2.5 font-bold border-r border-neutral-200">XL</td>
                      <td className="p-2.5 border-r border-neutral-200">1m78 - 1m88</td>
                      <td className="p-2.5 border-r border-neutral-200">75kg - 90kg</td>
                      <td className="p-2.5">77 cm</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-2 text-[11px] text-neutral-400 italic">
                * Số đo mang tính tham khảo, nếu bạn cần tư vấn cụ thể hãy liên hệ CSKH của chúng tôi.
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200 flex justify-end">
              <button
                onClick={() => setSizeGuideOpen(false)}
                className="px-5 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xs"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
