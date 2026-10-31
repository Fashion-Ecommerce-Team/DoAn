'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@admin/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin/components/ui/table';
import { Button } from '@admin/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@admin/components/ui/select';
import { getProducts, deleteProduct, getProductById, toggleProductStatus, getCategories, getBrands } from '@admin/services';
import { ProductResponse, ProductImageResponse } from '@admin/types';
import { toast } from 'sonner';
import { PackageOpen, ChevronLeft, ChevronRight, Plus, RotateCcw } from 'lucide-react';
import AdminStatusBadge from '@/features/admin/components/common/AdminStatusBadge';
import AdminSearchBar from '@/features/admin/components/common/AdminSearchBar';
import AdminPageHeader from '@/features/admin/components/common/AdminPageHeader';
import { AdminViewButton, AdminToggleButton, AdminDeleteButton } from '@/features/admin/components/common/AdminTableActions';

export default function ProductPage() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [gender, setGender] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [priceRange, setPriceRange] = useState('ALL');

  const ProductImageCell = ({ productId, productName }: { productId: number; productName: string }) => {
    const [imgUrl, setImgUrl] = useState<string | null>(null);

    useEffect(() => {
      getProductById(productId)
        .then((detail) => {
          const primary = detail.images?.find((i: ProductImageResponse) => i.isPrimary) || detail.images?.[0];
          if (primary) {
            setImgUrl(primary.imageUrl);
          }
        })
        .catch(() => {});
    }, [productId]);

    return (
      <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200/80 shadow-xs group relative flex-shrink-0">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={productName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 p-1 text-center">
            <PackageOpen className="w-7 h-7" />
            <span className="text-[10px] font-semibold mt-0.5">Không ảnh</span>
          </div>
        )}
      </div>
    );
  };

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Mappings for Category and Brand
  const [categories, setCategories] = useState<Record<number, string>>({});
  const [, setBrands] = useState<Record<number, string>>({});

  const loadDependencies = async () => {
    try {
      const [cats, brnds] = await Promise.all([getCategories(0, 100), getBrands(0, 100)]);
      const catMap = cats.content.reduce((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
      }, {} as Record<number, string>);
      const brandMap = brnds.content.reduce((acc, brand) => {
        acc[brand.id] = brand.name;
        return acc;
      }, {} as Record<number, string>);
      setCategories(catMap);
      setBrands(brandMap);
    } catch {
      console.error('Failed to load dependencies');
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      let minPrice: number | undefined = undefined;
      let maxPrice: number | undefined = undefined;
      if (priceRange === 'UNDER_200') {
        maxPrice = 200000;
      } else if (priceRange === '200_500') {
        minPrice = 200000;
        maxPrice = 500000;
      } else if (priceRange === '500_1000') {
        minPrice = 500000;
        maxPrice = 1000000;
      } else if (priceRange === 'ABOVE_1000') {
        minPrice = 1000000;
      }

      const data = await getProducts(
        page,
        10,
        search || undefined,
        categoryId !== 'all' ? categoryId : undefined,
        gender !== 'ALL' ? gender : undefined,
        status !== 'ALL' ? status : undefined,
        minPrice,
        maxPrice
      );
      setProducts(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch {
      toast.error('Lỗi khi tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search, page, categoryId, gender, status, priceRange]);

  const handleResetFilters = () => {
    setSearch('');
    setCategoryId('all');
    setGender('ALL');
    setStatus('ALL');
    setPriceRange('ALL');
    setPage(0);
  };

  const hasActiveFilters = search !== '' || categoryId !== 'all' || gender !== 'ALL' || status !== 'ALL' || priceRange !== 'ALL';

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        await deleteProduct(id);
        toast.success('Xóa sản phẩm thành công');
        loadProducts();
      } catch {
        toast.error('Lỗi khi xóa sản phẩm');
      }
    }
  };

  const handleUpdateStatus = async (id: number) => {
    try {
      await toggleProductStatus(id);
      toast.success('Cập nhật trạng thái thành công');
      loadProducts();
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quản lý Sản phẩm"
        description="Danh sách tất cả các mặt hàng thời trang đang kinh doanh trong hệ thống"
        badge={totalElements}
        action={
          <Button asChild className="gap-2 shadow-sm font-semibold">
            <Link href="/admin/products/create">
              <Plus className="w-4 h-4" />
              Thêm sản phẩm mới
            </Link>
          </Button>
        }
      />

      <Card className="border border-slate-200/80 shadow-xs">
        <CardHeader className="flex flex-col gap-3 pb-4 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <AdminSearchBar
              placeholder="Tìm kiếm sản phẩm theo tên..."
              defaultValue={search}
              onSearch={(val) => {
                setSearch(val);
                setPage(0);
              }}
              className="w-full lg:max-w-md"
            />

            {/* Quick Reset Filter Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-3 rounded-xl text-xs font-semibold border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100 gap-1.5 self-start lg:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Đặt lại bộ lọc
              </Button>
            )}
          </div>

          {/* Filter Bar with Category, Gender, Status, Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {/* 1. Lọc Danh mục */}
            <Select
              value={categoryId}
              onValueChange={(val) => {
                setCategoryId(val);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full border-slate-200 rounded-xl text-xs font-semibold h-9">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {Object.entries(categories).map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 2. Lọc Giới tính */}
            <Select
              value={gender}
              onValueChange={(val) => {
                setGender(val);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full border-slate-200 rounded-xl text-xs font-semibold h-9">
                <SelectValue placeholder="Giới tính" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả giới tính</SelectItem>
                <SelectItem value="MALE">Nam (Male)</SelectItem>
                <SelectItem value="FEMALE">Nữ (Female)</SelectItem>
                <SelectItem value="UNISEX">Nam & Nữ (Unisex)</SelectItem>
              </SelectContent>
            </Select>

            {/* 3. Lọc Trạng thái */}
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full border-slate-200 rounded-xl text-xs font-semibold h-9">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="ACTIVE">Đang bán (Active)</SelectItem>
                <SelectItem value="INACTIVE">Ngừng bán (Inactive)</SelectItem>
              </SelectContent>
            </Select>

            {/* 4. Lọc Giá bán */}
            <Select
              value={priceRange}
              onValueChange={(val) => {
                setPriceRange(val);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full border-slate-200 rounded-xl text-xs font-semibold h-9">
                <SelectValue placeholder="Khoảng giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả mức giá</SelectItem>
                <SelectItem value="UNDER_200">Dưới 200.000 ₫</SelectItem>
                <SelectItem value="200_500">200.000 ₫ - 500.000 ₫</SelectItem>
                <SelectItem value="500_1000">500.000 ₫ - 1.000.000 ₫</SelectItem>
                <SelectItem value="ABOVE_1000">Trên 1.000.000 ₫</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-28 text-center text-xs font-semibold text-slate-700 py-3.5">
                  Hình ảnh
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Tên sản phẩm</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Danh mục</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Giá bán</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Giới tính</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Lượt xem</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Trạng thái</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Ngày tạo</TableHead>
                <TableHead className="text-center text-xs font-semibold text-slate-700">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 font-semibold text-slate-600">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-3 border-[#0099FF] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Đang tải danh sách sản phẩm...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : products.length > 0 ? (
                products.map((prod) => {
                  return (
                    <TableRow key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Image */}
                      <TableCell className="w-28 py-3.5 text-center">
                        <div className="flex justify-center">
                          <ProductImageCell productId={prod.id} productName={prod.name} />
                        </div>
                      </TableCell>

                      {/* Product Name & Code */}
                      <TableCell className="max-w-[220px]">
                        <p className="font-semibold text-slate-900 text-xs truncate" title={prod.name}>
                          {prod.name}
                        </p>
                        <span className="text-[11px] font-mono text-slate-400">
                          #{prod.id}
                        </span>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <div className="text-xs font-semibold text-slate-800">
                          {categories[prod.categoryId] || '---'}
                        </div>
                      </TableCell>

                      {/* Price */}
                      <TableCell>
                        {prod.discountPrice && prod.discountPrice < prod.basePrice ? (
                          <div>
                            <div className="text-xs font-bold text-rose-600">
                              {formatCurrency(prod.discountPrice)}
                            </div>
                            <div className="text-[11px] font-medium text-slate-400 line-through">
                              {formatCurrency(prod.basePrice)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-slate-900">
                            {formatCurrency(prod.basePrice)}
                          </div>
                        )}
                      </TableCell>

                      {/* Gender */}
                      <TableCell className="text-xs font-medium text-slate-700">
                        {prod.gender === 'MALE'
                          ? 'Nam'
                          : prod.gender === 'FEMALE'
                          ? 'Nữ'
                          : prod.gender === 'UNISEX'
                          ? 'Nam & Nữ'
                          : '---'}
                      </TableCell>

                      {/* View count */}
                      <TableCell className="text-xs font-semibold text-slate-700">
                        {prod.viewCount || 0}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <AdminStatusBadge status={prod.status || ''} type="product" />
                      </TableCell>

                      {/* Created date */}
                      <TableCell className="text-slate-500 text-xs whitespace-nowrap">
                        {prod.createdAt
                          ? new Date(prod.createdAt).toLocaleDateString('vi-VN')
                          : '---'}
                      </TableCell>

                      {/* Standardized Actions */}
                      <TableCell className="text-center py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <AdminViewButton href={`/admin/products/${prod.id}`} />
                          <AdminToggleButton
                            active={prod.status === 'ACTIVE'}
                            onToggle={() => handleUpdateStatus(prod.id)}
                            activeLabel="Ngừng bán"
                            inactiveLabel="Mở bán"
                          />
                          <AdminDeleteButton onClick={() => handleDelete(prod.id)} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 font-semibold text-slate-500">
                    Không tìm thấy sản phẩm nào phù hợp với bộ lọc
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <div className="text-xs text-slate-500 font-medium">
                Hiển thị tổng số <span className="font-bold text-slate-800">{totalElements}</span> sản phẩm
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="h-8 px-2.5 rounded-lg text-xs font-semibold"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Trước
                </Button>
                <div className="text-xs font-bold text-slate-700 px-2">
                  Trang {page + 1} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="h-8 px-2.5 rounded-lg text-xs font-semibold"
                >
                  Sau
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
