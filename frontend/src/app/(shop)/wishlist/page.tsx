'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { wishlistApi, WishlistItem } from '@/features/shop/services/wishlist.api';
import { toast } from 'sonner';
import { Heart, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';

export default function WishlistPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalElements, setTotalElements] = useState<number>(0);

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await wishlistApi.getWishlist(0, 50);
      setWishlistItems(data?.content || []);
      setTotalElements(data?.totalElements || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleRemove = async (productId: number, name: string) => {
    try {
      await wishlistApi.removeFromWishlist(productId);
      setWishlistItems((prev) => prev.filter((item) => item.productId !== productId));
      setTotalElements((prev) => Math.max(0, prev - 1));
      toast.success(`Đã xóa "${name}" khỏi danh sách yêu thích`);
    } catch {
      toast.error('Không thể xóa sản phẩm khỏi danh sách');
    }
  };

  const formatPrice = (price?: number | null) => {
    if (!price) return '0₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4 text-center bg-white">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
          <Heart size={28} />
        </div>
        <h1 className="text-xl font-bold uppercase tracking-wider text-neutral-900">
          Danh Sách Yêu Thích Của Bạn
        </h1>
        <p className="text-xs text-neutral-500 mt-2 max-w-sm">
          Đăng nhập vào tài khoản SEEME® để lưu trữ và quản lý các thiết kế bạn yêu thích trên mọi thiết bị.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/login?redirect=/wishlist"
            className="px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-neutral-800 transition-colors"
          >
            Đăng Nhập Ngay
          </Link>
          <Link
            href="/products"
            className="px-6 py-3 border border-neutral-300 text-xs font-bold uppercase tracking-wider rounded-xs hover:border-black transition-colors"
          >
            Xem Cửa Hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-neutral-50/60 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 mb-2">
            <Link href="/" className="hover:text-black">Trang chủ</Link>
            <span>/</span>
            <span className="text-black font-semibold">Danh sách yêu thích</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-neutral-950">
                Sản Phẩm Yêu Thích
              </h1>
              <p className="text-xs text-neutral-500 mt-1 font-mono uppercase tracking-wider">
                {totalElements} THIẾT KẾ ĐÃ ĐƯỢC LƯU
              </p>
            </div>

            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-black self-start sm:self-auto"
            >
              <ArrowLeft size={14} /> Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="aspect-[3/4] bg-neutral-100 rounded-xs" />
                <div className="h-4 bg-neutral-100 rounded-xs w-3/4" />
                <div className="h-3 bg-neutral-100 rounded-xs w-1/2" />
              </div>
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          /* Empty State */
          <div className="py-20 text-center border-2 border-dashed border-neutral-200 rounded-xs">
            <Heart size={36} className="mx-auto text-neutral-300 mb-3" />
            <h3 className="text-base font-bold uppercase tracking-wider text-neutral-800">
              Danh sách yêu thích đang trống
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Hãy bấm vào biểu tượng trái tim ở góc các sản phẩm để lưu lại những thiết kế mà bạn ưng ý nhất.
            </p>
            <Link
              href="/products"
              className="mt-6 px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors inline-flex items-center gap-2 rounded-xs"
            >
              Khám Phá Sản Phẩm Ngay <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
            {wishlistItems.map((item) => {
              const hasDiscount = item.discountPrice && item.discountPrice < item.basePrice;
              const img = item.primaryImageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';

              return (
                <div key={item.wishlistId || item.productId} className="group flex flex-col space-y-3">
                  {/* Image container */}
                  <div className="relative aspect-[3/4] bg-neutral-100 rounded-xs overflow-hidden border border-neutral-200">
                    <Link href={`/products/${item.productId}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemove(item.productId, item.name)}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-red-500 hover:text-white text-neutral-700 flex items-center justify-center transition-colors shadow-xs z-10 cursor-pointer"
                      title="Xóa khỏi danh sách yêu thích"
                    >
                      <Trash2 size={14} />
                    </button>

                    {/* Stock badge */}
                    {!item.inStock && (
                      <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-xs">
                        Hết hàng
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 block truncate">
                      {item.categoryName || 'SEEME STREETWEAR'}
                    </span>
                    <Link
                      href={`/products/${item.productId}`}
                      className="text-xs font-bold uppercase tracking-tight text-neutral-900 hover:text-neutral-600 transition-colors line-clamp-1 block"
                    >
                      {item.name}
                    </Link>
                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="text-xs sm:text-sm font-bold text-neutral-950">
                        {formatPrice(item.discountPrice || item.basePrice)}
                      </span>
                      {hasDiscount && (
                        <span className="text-[11px] text-neutral-400 line-through">
                          {formatPrice(item.basePrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* View Detail Action */}
                  <Link
                    href={`/products/${item.productId}`}
                    className="w-full py-2 border border-neutral-300 hover:border-black text-center text-[11px] font-bold uppercase tracking-wider text-neutral-800 hover:text-black rounded-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag size={13} /> Xem chi tiết
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
