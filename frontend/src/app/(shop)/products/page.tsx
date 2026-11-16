'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { productApi } from '@/features/shop/services/product.api';
import { ProductSummary, Category } from '@/features/shop/types/product.types';
import ProductCard from '@/components/shop/product/ProductCard';
import { 
  SlidersHorizontal, 
  X, 
  ArrowUpDown, 
  RefreshCw, 
  Search,
  Filter,
  Check
} from 'lucide-react';

const PRICE_RANGES = [
  { label: 'Tất cả mức giá', min: undefined, max: undefined },
  { label: 'Dưới 300.000₫', min: 0, max: 300000 },
  { label: '300.000₫ - 500.000₫', min: 300000, max: 500000 },
  { label: '500.000₫ - 1.000.000₫', min: 500000, max: 1000000 },
  { label: 'Trên 1.000.000₫', min: 1000000, max: undefined },
];

const GENDERS = [
  { label: 'TẤT CẢ', value: '' },
  { label: 'NAM', value: 'MEN' },
  { label: 'NỮ', value: 'WOMEN' },
  { label: 'UNISEX', value: 'UNISEX' },
];

const SIZES = ['S', 'M', 'L', 'XL', 'FREESIZE'];

const SORT_OPTIONS = [
  { label: 'Mới nhất', sortBy: 'createdAt', sortDir: 'desc' as const },
  { label: 'Giá: Thấp đến Cao', sortBy: 'basePrice', sortDir: 'asc' as const },
  { label: 'Giá: Cao đến Thấp', sortBy: 'basePrice', sortDir: 'desc' as const },
  { label: 'Tên: A - Z', sortBy: 'name', sortDir: 'asc' as const },
];

function ProductsCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Query Parameters
  const initialKeyword = searchParams.get('keyword') || searchParams.get('q') || '';
  const initialCategorySlug = searchParams.get('category') || '';
  const initialGender = searchParams.get('gender') || '';
  const initialSortBy = searchParams.get('sortBy') || 'createdAt';
  const initialSortDir = (searchParams.get('sortDir') as 'asc' | 'desc') || 'desc';
  const initialPage = searchParams.get('page') ? Number(searchParams.get('page')) : 0;

  // State
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Active Filter state
  const [keyword, setKeyword] = useState(initialKeyword);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategorySlug);
  const [selectedGender, setSelectedGender] = useState<string>(initialGender);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialSortDir);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Mobile Filter Drawer
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Load Categories on Mount
  useEffect(() => {
    productApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Fetch Products based on current filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const activeRange = PRICE_RANGES[selectedPriceRange] || PRICE_RANGES[0];
      const data = await productApi.getProducts({
        keyword: keyword.trim() || undefined,
        categorySlug: selectedCategory || undefined,
        gender: selectedGender || undefined,
        minPrice: activeRange.min,
        maxPrice: activeRange.max,
        size: selectedSize || undefined,
        sortBy,
        sortDir,
        page: currentPage,
        sizePerPage: 12,
      });

      setProducts(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      // Fallback
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [
    keyword,
    selectedCategory,
    selectedGender,
    selectedPriceRange,
    selectedSize,
    sortBy,
    sortDir,
    currentPage,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Sync state when URL params change
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat !== null) setSelectedCategory(cat);
    const kw = searchParams.get('keyword') || searchParams.get('q');
    if (kw !== null) setKeyword(kw);
  }, [searchParams]);

  // Reset all filters
  const handleResetFilters = () => {
    setKeyword('');
    setSelectedCategory('');
    setSelectedGender('');
    setSelectedPriceRange(0);
    setSelectedSize('');
    setSortBy('createdAt');
    setSortDir('desc');
    setCurrentPage(0);
    router.push('/products');
  };

  // Find Category Title
  const activeCategoryObj = categories.find((c) => c.slug === selectedCategory);
  const pageTitle = keyword
    ? `KẾT QUẢ TÌM KIẾM CHO "${keyword}"`
    : activeCategoryObj
    ? activeCategoryObj.name.toUpperCase()
    : 'TẤT CẢ SẢN PHẨM';

  const hasActiveFilters =
    Boolean(keyword) ||
    Boolean(selectedCategory) ||
    Boolean(selectedGender) ||
    selectedPriceRange !== 0 ||
    Boolean(selectedSize);

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Page Header & Streetwear Banner */}
      <div className="border-b border-neutral-200 bg-neutral-50/70 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-neutral-500 mb-2">
            <Link href="/" className="hover:text-black">Trang chủ</Link>
            <span>/</span>
            <span className="text-black font-bold">Khám phá sản phẩm</span>
            {activeCategoryObj && (
              <>
                <span>/</span>
                <span className="text-black">{activeCategoryObj.name}</span>
              </>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black font-sans uppercase tracking-tight text-neutral-950">
                {pageTitle}
              </h1>
              <p className="text-xs text-neutral-500 mt-1 font-mono uppercase tracking-widest">
                SEEME® STREETWEAR ARCHIVE • {totalElements} SẢN PHẨM
              </p>
            </div>

            {/* Sort & Mobile filter trigger */}
            <div className="flex items-center gap-3">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3.5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer"
              >
                <SlidersHorizontal size={14} />
                Bộ Lọc {hasActiveFilters && '•'}
              </button>

              {/* Sort Dropdown */}
              <div className="relative flex items-center bg-white border border-neutral-300 px-3 py-2 rounded-xs">
                <ArrowUpDown size={13} className="text-neutral-500 mr-2" />
                <span className="text-[11px] font-bold uppercase text-neutral-500 mr-1.5 hidden sm:inline">
                  Sắp xếp:
                </span>
                <select
                  value={`${sortBy}:${sortDir}`}
                  onChange={(e) => {
                    const [newSortBy, newSortDir] = e.target.value.split(':');
                    setSortBy(newSortBy);
                    setSortDir(newSortDir as 'asc' | 'desc');
                    setCurrentPage(0);
                  }}
                  className="text-xs font-bold uppercase bg-transparent text-neutral-900 focus:outline-none cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={`${opt.sortBy}:${opt.sortDir}`} value={`${opt.sortBy}:${opt.sortDir}`}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content: Sidebar Filter + Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* DESKTOP FILTER SIDEBAR */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6 pr-4 border-r border-neutral-200">
            {/* Filter Header with Reset */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-900 flex items-center gap-2">
                <Filter size={14} /> BỘ LỌC TÌM KIẾM
              </span>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] font-semibold text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={11} /> Đặt lại
                </button>
              )}
            </div>

            {/* Filter Group: Categories */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Danh Mục Sản Phẩm
              </h3>
              <div className="space-y-1.5">
                <button
                  onClick={() => { setSelectedCategory(''); setCurrentPage(0); }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-xs transition-colors cursor-pointer text-left ${
                    selectedCategory === '' ? 'bg-black text-white font-bold' : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <span>Tất cả sản phẩm</span>
                </button>
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.slug || ''); setCurrentPage(0); }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-xs transition-colors cursor-pointer text-left ${
                        isSelected ? 'bg-black text-white font-bold' : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {isSelected && <Check size={12} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Group: Gender */}
            <div className="space-y-3 pt-4 border-t border-neutral-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Giới Tính / Phân Loại
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {GENDERS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => { setSelectedGender(g.value); setCurrentPage(0); }}
                    className={`px-3 py-2 text-[11px] font-bold uppercase tracking-wider border rounded-xs transition-colors cursor-pointer text-center ${
                      selectedGender === g.value
                        ? 'bg-black text-white border-black'
                        : 'border-neutral-200 text-neutral-700 hover:border-black'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Group: Price Range */}
            <div className="space-y-3 pt-4 border-t border-neutral-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Khoảng Giá
              </h3>
              <div className="space-y-1.5">
                {PRICE_RANGES.map((r, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-2.5 text-xs text-neutral-700 hover:text-black cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="priceRange"
                      checked={selectedPriceRange === idx}
                      onChange={() => { setSelectedPriceRange(idx); setCurrentPage(0); }}
                      className="accent-black h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Group: Sizes */}
            <div className="space-y-3 pt-4 border-t border-neutral-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Kích Thước (Size)
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {SIZES.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => {
                      setSelectedSize(selectedSize === sz ? '' : sz);
                      setCurrentPage(0);
                    }}
                    className={`w-10 h-9 flex items-center justify-center text-xs font-bold border rounded-xs transition-colors cursor-pointer ${
                      selectedSize === sz
                        ? 'bg-black text-white border-black'
                        : 'border-neutral-200 text-neutral-800 hover:border-black'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* PRODUCT LIST CONTENT */}
          <main className="lg:col-span-3">
            
            {/* Active Filter Badges */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-neutral-100">
                <span className="text-[11px] font-bold uppercase text-neutral-400 mr-1">
                  Đang lọc:
                </span>
                {keyword && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-xs font-bold uppercase tracking-wider text-neutral-900 rounded-full">
                    Từ khóa: {keyword}
                    <button onClick={() => setKeyword('')} className="hover:text-red-500"><X size={12} /></button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-xs font-bold uppercase tracking-wider text-neutral-900 rounded-full">
                    Danh mục: {activeCategoryObj?.name || selectedCategory}
                    <button onClick={() => setSelectedCategory('')} className="hover:text-red-500"><X size={12} /></button>
                  </span>
                )}
                {selectedGender && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-xs font-bold uppercase tracking-wider text-neutral-900 rounded-full">
                    Giới tính: {selectedGender}
                    <button onClick={() => setSelectedGender('')} className="hover:text-red-500"><X size={12} /></button>
                  </span>
                )}
                {selectedPriceRange !== 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-xs font-bold uppercase tracking-wider text-neutral-900 rounded-full">
                    Giá: {PRICE_RANGES[selectedPriceRange].label}
                    <button onClick={() => setSelectedPriceRange(0)} className="hover:text-red-500"><X size={12} /></button>
                  </span>
                )}
                {selectedSize && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-xs font-bold uppercase tracking-wider text-neutral-900 rounded-full">
                    Size: {selectedSize}
                    <button onClick={() => setSelectedSize('')} className="hover:text-red-500"><X size={12} /></button>
                  </span>
                )}
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-red-600 hover:underline ml-2 cursor-pointer"
                >
                  Xóa tất cả
                </button>
              </div>
            )}

            {/* Loading Skeleton */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse space-y-3">
                    <div className="w-full aspect-[3/4] bg-neutral-200 rounded-xs" />
                    <div className="h-4 bg-neutral-200 rounded-xs w-3/4" />
                    <div className="h-3 bg-neutral-200 rounded-xs w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              /* Empty State */
              <div className="py-20 text-center border-2 border-dashed border-neutral-200 rounded-xs">
                <Search size={40} className="mx-auto text-neutral-300 mb-3" />
                <h3 className="text-base font-bold uppercase tracking-wider text-neutral-800">
                  Không tìm thấy sản phẩm phù hợp
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  Vui lòng thử tìm kiếm bằng từ khóa khác hoặc điều chỉnh lại các bộ lọc danh mục và mức giá.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-6 px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} /> Xóa Bộ Lọc
                </button>
              </div>
            ) : (
              /* Products Grid */
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-12 pt-6 border-t border-neutral-200 flex items-center justify-between">
                    <p className="text-xs text-neutral-500 font-mono">
                      Trang {currentPage + 1} / {totalPages} ({totalElements} sản phẩm)
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="px-3.5 py-2 border border-neutral-300 text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none rounded-xs cursor-pointer"
                      >
                        Trước
                      </button>
                      {[...Array(totalPages)].map((_, idx) => {
                        // Chỉ hiển thị tối đa 5 nút trang
                        if (idx < currentPage - 2 || idx > currentPage + 2) return null;
                        return (
                          <button
                            key={idx}
                            onClick={() => setCurrentPage(idx)}
                            className={`w-9 h-8.5 text-xs font-bold border rounded-xs transition-colors cursor-pointer ${
                              currentPage === idx
                                ? 'bg-black text-white border-black'
                                : 'border-neutral-300 text-neutral-800 hover:border-black'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage >= totalPages - 1}
                        className="px-3.5 py-2 border border-neutral-300 text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none rounded-xs cursor-pointer"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          </main>
        </div>
      </div>

      {/* 3. MOBILE FILTER DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileFilterOpen(false)} />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-wider text-neutral-900">
                Bộ Lọc Sản Phẩm
              </span>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 text-neutral-600 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Categories */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2">Danh mục</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => { setSelectedCategory(''); setCurrentPage(0); }}
                    className={`w-full text-left py-2 px-2.5 text-xs font-medium rounded-xs ${selectedCategory === '' ? 'bg-black text-white font-bold' : 'text-neutral-700'}`}
                  >
                    Tất cả sản phẩm
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCategory(c.slug || ''); setCurrentPage(0); }}
                      className={`w-full text-left py-2 px-2.5 text-xs font-medium rounded-xs ${selectedCategory === c.slug ? 'bg-black text-white font-bold' : 'text-neutral-700'}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="border-t border-neutral-100 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2">Khoảng giá</h4>
                <div className="space-y-2">
                  {PRICE_RANGES.map((r, i) => (
                    <label key={i} className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                      <input
                        type="radio"
                        name="mobilePrice"
                        checked={selectedPriceRange === i}
                        onChange={() => { setSelectedPriceRange(i); setCurrentPage(0); }}
                        className="accent-black"
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-200 grid grid-cols-2 gap-2">
              <button
                onClick={handleResetFilters}
                className="py-2.5 text-xs font-bold uppercase tracking-wider border border-neutral-300 text-neutral-700 rounded-xs"
              >
                Đặt Lại
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="py-2.5 text-xs font-bold uppercase tracking-wider bg-black text-white rounded-xs"
              >
                Áp Dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
      </div>
    }>
      <ProductsCatalogContent />
    </Suspense>
  );
}
