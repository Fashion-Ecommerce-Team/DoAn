'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Sparkles } from 'lucide-react';
import { ProductSummary } from '@/features/shop/types/product.types';
import { wishlistApi } from '@/features/shop/services/wishlist.api';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface ProductCardProps {
  product: ProductSummary;
  isWishlisted?: boolean;
  onWishlistChange?: (productId: number, status: boolean) => void;
}

export default function ProductCard({
  product,
  isWishlisted = false,
  onWishlistChange,
}: ProductCardProps) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [inWishlist, setInWishlist] = useState(isWishlisted);
  const [isHovered, setIsHovered] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Fallback image placeholder
  const primaryImg = product.primaryImageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80';
  const secondaryImg = product.secondaryImageUrl || primaryImg;

  // Format VND price
  const formatPrice = (price?: number | null) => {
    if (!price) return '0₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Calculate discount percentage
  const hasDiscount = product.discountPrice && product.discountPrice < product.basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.basePrice - product.discountPrice!) / product.basePrice) * 100)
    : 0;

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để lưu sản phẩm vào danh sách yêu thích!');
      return;
    }

    if (isToggling) return;
    setIsToggling(true);

    try {
      if (inWishlist) {
        await wishlistApi.removeFromWishlist(product.id);
        setInWishlist(false);
        onWishlistChange?.(product.id, false);
        toast.success(`Đã xóa "${product.name}" khỏi mục yêu thích`);
      } else {
        await wishlistApi.addToWishlist(product.id);
        setInWishlist(true);
        onWishlistChange?.(product.id, true);
        toast.success(`Đã thêm "${product.name}" vào mục yêu thích`);
      }
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật danh sách yêu thích!');
    } finally {
      setIsToggling(false);
    }
  };

  const productUrl = `/products/${product.id}`;

  return (
    <div 
      className="group relative flex flex-col bg-white overflow-hidden transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. PRODUCT IMAGE CONTAINER (Aspect 3:4) */}
      <div className="relative aspect-[3/4] w-full bg-neutral-100 overflow-hidden">
        <Link href={productUrl} className="block w-full h-full">
          {/* Primary & Secondary Image Hover Swap */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={isHovered && secondaryImg ? secondaryImg : primaryImg}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* BADGES (Top Left) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {hasDiscount && (
            <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xs shadow-xs">
              -{discountPercent}%
            </span>
          )}
          {product.status === 'OUT_OF_STOCK' || product.totalStock <= 0 ? (
            <span className="bg-black/90 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xs">
              SOLD OUT
            </span>
          ) : (
            <span className="bg-black text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xs">
              NEW DROP
            </span>
          )}
          {product.similarityScore && (
            <span className="bg-neutral-900/90 text-amber-300 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-xs flex items-center gap-1">
              <Sparkles size={9} /> AI Match {Math.round(product.similarityScore * 100)}%
            </span>
          )}
        </div>

        {/* WISHLIST BUTTON (Top Right) */}
        <button
          onClick={handleToggleWishlist}
          disabled={isToggling}
          aria-label="Wishlist toggle"
          className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
            inWishlist 
              ? 'bg-red-600 text-white scale-110' 
              : 'bg-white/90 text-neutral-800 hover:bg-black hover:text-white'
          }`}
        >
          <Heart 
            size={16} 
            className={`transition-transform duration-200 ${inWishlist ? 'fill-current scale-110' : ''}`} 
          />
        </button>

        {/* QUICK SIZES OVERLAY ON HOVER */}
        {product.availableSizes && product.availableSizes.length > 0 && (
          <div 
            className={`absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-xs py-2 px-3 flex items-center justify-center gap-1.5 transition-transform duration-300 ${
              isHovered ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 mr-1">
              SIZE:
            </span>
            {product.availableSizes.map((size) => (
              <span
                key={size}
                className="text-[10px] font-bold border border-neutral-300 bg-white px-1.5 py-0.5 rounded-xs text-neutral-800"
              >
                {size}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 2. PRODUCT INFO */}
      <div className="pt-3 pb-2 flex flex-col flex-1">
        {/* Brand / Category subtitle */}
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          {product.category?.name || 'SEEME STREETWEAR'}
        </span>

        {/* Product Name */}
        <Link 
          href={productUrl}
          className="text-xs font-black uppercase tracking-wider text-neutral-900 hover:text-neutral-600 transition-colors mt-1 line-clamp-1"
          title={product.name}
        >
          {product.name}
        </Link>

        {/* Price & Stock info */}
        <div className="flex items-center gap-2 mt-1.5">
          {hasDiscount ? (
            <>
              <span className="text-xs font-black text-red-600 tracking-tight">
                {formatPrice(product.discountPrice)}
              </span>
              <span className="text-[11px] text-neutral-400 line-through">
                {formatPrice(product.basePrice)}
              </span>
            </>
          ) : (
            <span className="text-xs font-black text-neutral-900 tracking-tight">
              {formatPrice(product.basePrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
