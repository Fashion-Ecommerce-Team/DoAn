'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';
import HeroBanner from '@/components/shop/home/HeroBanner';
import CategoryShowcase from '@/components/shop/home/CategoryShowcase';
import LookbookSection from '@/components/shop/home/LookbookSection';
import ProductCard from '@/components/shop/product/ProductCard';
import MultimodalSearchModal from '@/components/shop/search/MultimodalSearchModal';
import { productApi } from '@/features/shop/services/product.api';
import { ProductSummary } from '@/features/shop/types/product.types';

export default function ShopHomePage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    productApi.getProducts({ page: 0, sizePerPage: 12 })
      .then((data) => {
        if (isMounted) {
          setProducts(data.content || []);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = products.filter((p) => {
    if (activeCategoryFilter === 'ALL') return true;
    if (activeCategoryFilter === 'TEES') return p.category?.slug?.includes('ao-thun') || p.name.includes('TEE');
    if (activeCategoryFilter === 'HOODIE') return p.category?.slug?.includes('hoodie') || p.name.includes('HOODIE') || p.name.includes('SWEATSHIRT');
    if (activeCategoryFilter === 'PANTS') return p.category?.slug?.includes('quan') || p.name.includes('PANTS') || p.name.includes('JEANS');
    return true;
  });

  return (
    <div className="flex flex-col w-full bg-white">

      <HeroBanner onOpenAiSearch={() => setSearchModalOpen(true)} />

      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-500">
                LATEST DROP 2026
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-sans uppercase tracking-tight text-neutral-900">
              NEW ARRIVALS
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
            {[
              { label: 'TẤT CẢ', key: 'ALL' },
              { label: 'ÁO THUN (TEES)', key: 'TEES' },
              { label: 'HOODIE & JACKET', key: 'HOODIE' },
              { label: 'QUẦN STREETWEAR', key: 'PANTS' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveCategoryFilter(tab.key)}
                className={`text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all ${activeCategoryFilter === tab.key
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="aspect-[3/4] bg-neutral-200 rounded-xs" />
                <div className="h-3 bg-neutral-200 rounded w-2/3" />
                <div className="h-3 bg-neutral-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-500 text-sm">
            Chưa có sản phẩm nào trong danh mục này.
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-black text-white hover:bg-neutral-800 text-xs font-black uppercase tracking-widest transition-all rounded-xs shadow-md group"
          >
            XEM TẤT CẢ SẢN PHẨM MỚI
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </section>

      <CategoryShowcase />

      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-1.5 text-amber-600 mb-1">
              <Flame size={15} className="fill-amber-500" />
              <span className="text-[11px] font-mono tracking-widest uppercase font-bold">
                HIGH IN DEMAND
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-neutral-900">
              SẢN PHẨM BÁN CHẠY NHẤT
            </h2>
          </div>

          <Link
            href="/products"
            className="mt-3 sm:mt-0 text-xs font-bold uppercase tracking-widest text-neutral-900 hover:text-neutral-500 flex items-center gap-1 group"
          >
            XEM BẢNG XẾP HẠNG
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Best Sellers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={`best-${product.id}`} product={product} />
          ))}
        </div>
      </section>

      <LookbookSection />

      <MultimodalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

    </div>
  );
}
