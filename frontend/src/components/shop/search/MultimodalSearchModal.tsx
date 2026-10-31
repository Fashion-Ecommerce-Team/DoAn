'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Search, 
  Camera, 
  Loader2, 
  ArrowRight,
  RotateCcw,
  Image as ImageIcon 
} from 'lucide-react';
import apiClient from '@/config/axios';
import { ApiResponse, PageResponse } from '@/types/response.type';
import { ProductSummary } from '@/features/shop/types/product.types';
import ProductCard from '../product/ProductCard';
import { toast } from 'sonner';

interface MultimodalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MultimodalSearchModal({ isOpen, onClose }: MultimodalSearchModalProps) {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Text search state
  const [keyword, setKeyword] = useState('');
  
  // Image search state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hybridKeyword, setHybridKeyword] = useState('');
  const [imageWeight] = useState(0.6);
  const [isImageSearchActive, setIsImageSearchActive] = useState(false);
  
  // Loading & Results
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductSummary[] | null>(null);

  if (!isOpen) return null;

  // 1. Text Search execution
  const handleTextSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;

    setIsLoading(true);
    setSearchResults(null);
    setIsImageSearchActive(false);

    try {
      const response = await apiClient.get<ApiResponse<PageResponse<ProductSummary>>>('/products/search', {
        params: { keyword: keyword.trim() },
      });
      if (response.data?.data?.content) {
        setSearchResults(response.data.data.content);
      } else {
        setSearchResults([]);
      }
    } catch {
      toast.info('Đang chuyển hướng tới trang sản phẩm...');
      router.push(`/products?keyword=${encodeURIComponent(keyword.trim())}`);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Automated Image Search (Triggered immediately when camera file is selected)
  const handleCameraFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn một tệp hình ảnh (JPG, PNG, WEBP)!');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsImageSearchActive(true);
    setSearchResults(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      let endpoint = '/products/search/image';
      if (hybridKeyword.trim()) {
        endpoint = '/products/search/hybrid';
        formData.append('keyword', hybridKeyword.trim());
        formData.append('imageWeight', imageWeight.toString());
      }

      const response = await apiClient.post<ApiResponse<PageResponse<ProductSummary>>>(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.data?.content) {
        setSearchResults(response.data.data.content);
        toast.success(`Đã tìm thấy ${response.data.data.content.length} sản phẩm tương đồng với ảnh!`);
      } else {
        setSearchResults([]);
      }
    } catch {
      toast.error('Không thể phân tích ảnh hoặc server đang bận, vui lòng thử ảnh khác!');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Re-run with Hybrid refinement (Ảnh + Từ khóa bổ trợ)
  const handleRefineWithHybrid = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      let endpoint = '/products/search/image';
      if (hybridKeyword.trim()) {
        endpoint = '/products/search/hybrid';
        formData.append('keyword', hybridKeyword.trim());
        formData.append('imageWeight', imageWeight.toString());
      }

      const response = await apiClient.post<ApiResponse<PageResponse<ProductSummary>>>(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.data?.content) {
        setSearchResults(response.data.data.content);
        toast.success('Đã cập nhật kết quả tìm kiếm kết hợp!');
      } else {
        setSearchResults([]);
      }
    } catch {
      toast.error('Lỗi khi tìm kiếm kết hợp');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to text mode
  const handleClearImage = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setIsImageSearchActive(false);
    setSearchResults(null);
    setHybridKeyword('');
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const popularTags = ['HOODIE MONOGRAM', 'OVERSIZED TEE', 'CARGO PANTS', 'VARSITY JACKET', 'TÚI MINI'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Hidden native file input for Camera button */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        onChange={handleCameraFileChange}
        className="hidden"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white rounded-xs shadow-2xl overflow-hidden z-10 my-auto border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-black text-white">
          <span className="text-sm font-black uppercase tracking-wider">
            TÌM KIẾM SẢN PHẨM SEEME
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          
          {/* SEARCH INPUT BAR WITH CAMERA AT THE EDGE */}
          <form onSubmit={handleTextSearch} className="relative flex items-center">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập tên sản phẩm cần tìm..."
              className="w-full py-3.5 pl-11 pr-36 sm:pr-40 text-sm bg-neutral-50 border border-neutral-300 rounded-xs focus:outline-none focus:border-black transition-colors"
              autoFocus={!isImageSearchActive}
            />
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            
            {/* Ô NHỎ HÌNH CAMERA Ở CẠNH */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 hover:text-black rounded-xs transition-colors text-xs font-bold"
                title="Bấm vào để tìm kiếm bằng hình ảnh (Tải ảnh hoặc chụp ảnh)"
              >
                <Camera size={16} />
                <span className="hidden sm:inline text-[11px] uppercase tracking-wider font-semibold">Ảnh</span>
              </button>

              <button
                type="submit"
                disabled={isLoading || !keyword.trim()}
                className="px-3.5 py-1.5 bg-black text-white hover:bg-neutral-800 text-xs font-black uppercase tracking-wider rounded-xs disabled:opacity-50 transition-colors"
              >
                Tìm
              </button>
            </div>
          </form>

          {/* ACTIVE IMAGE SEARCH STATUS & PREVIEW */}
          {isImageSearchActive && previewUrl && (
            <div className="mt-4 p-4 border border-neutral-300 bg-neutral-50 rounded-xs flex flex-col sm:flex-row gap-4">
              <div className="relative w-24 h-28 sm:w-28 sm:h-32 shrink-0 bg-neutral-200 overflow-hidden rounded-xs border border-neutral-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Ảnh tìm kiếm"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 inset-x-1 bg-black/80 text-white text-[9px] font-bold text-center py-0.5 rounded-xs uppercase">
                  Ảnh của bạn
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                    <ImageIcon size={15} /> Đang tìm kiếm sản phẩm theo hình ảnh
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="text-xs font-semibold text-neutral-700 hover:text-black flex items-center gap-1"
                    >
                      <RotateCcw size={12} /> Đổi ảnh
                    </button>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                </div>

                {/* Hybrid input: thêm từ khóa bổ trợ nếu muốn */}
                <div className="pt-2 border-t border-neutral-200">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                    KẾT HỢP TỪ KHÓA (TÙY CHỌN):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={hybridKeyword}
                      onChange={(e) => setHybridKeyword(e.target.value)}
                      placeholder="Ví dụ: Giống ảnh nhưng màu đen, hoặc size L..."
                      className="flex-1 text-xs p-2 bg-white border border-neutral-300 rounded-xs focus:outline-none focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={handleRefineWithHybrid}
                      disabled={isLoading}
                      className="px-3 py-2 bg-neutral-900 text-white hover:bg-black text-xs font-bold uppercase rounded-xs"
                    >
                      Lọc thêm
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Popular Search Suggestions (when no search executed yet) */}
          {!searchResults && !isLoading && !isImageSearchActive && (
            <div className="mt-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                GỢI Ý TÌM KIẾM PHỔ BIẾN:
              </p>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setKeyword(tag);
                      router.push(`/products?keyword=${encodeURIComponent(tag)}`);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-xs transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LOADING INDICATOR */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 size={28} className="animate-spin text-neutral-900" />
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                {isImageSearchActive ? 'Đang trích xuất đặc trưng và tìm kiếm sản phẩm theo ảnh...' : 'Đang tìm kiếm...'}
              </p>
            </div>
          )}

          {/* RESULTS DISPLAY */}
          {searchResults && !isLoading && (
            <div className="mt-6 pt-4 border-t border-neutral-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                  {isImageSearchActive ? 'SẢN PHẨM PHÙ HỢP VỚI ẢNH CỦA BẠN' : 'KẾT QUẢ TÌM THẤY'} ({searchResults.length})
                </h4>
                {searchResults.length > 0 && (
                  <button
                    onClick={() => {
                      router.push('/products');
                      onClose();
                    }}
                    className="text-xs font-bold text-neutral-600 hover:text-black flex items-center gap-1"
                  >
                    Xem tất cả trong cửa hàng <ArrowRight size={13} />
                  </button>
                )}
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  Không tìm thấy sản phẩm nào khớp. Hãy thử từ khóa hoặc hình ảnh khác!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {searchResults.slice(0, 6).map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
