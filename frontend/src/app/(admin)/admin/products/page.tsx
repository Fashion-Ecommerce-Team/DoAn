'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@admin/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin/components/ui/table';
import { Button } from '@admin/components/ui/button';
import { Input } from '@admin/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@admin/components/ui/select';
import { getProducts, deleteProduct, getProductById, toggleProductStatus, getCategories, getBrands } from '@admin/services';
import { ProductResponse, ProductImageResponse } from '@admin/types';
import { toast } from 'sonner';
import { PackageOpen, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductPage() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');

  const ProductImageCell = ({ productId, productName }: { productId: number, productName: string }) => {
    const [imgUrl, setImgUrl] = useState<string | null>(null);

    useEffect(() => {
      getProductById(productId).then(detail => {
        const primary = detail.images?.find((i: ProductImageResponse) => i.isPrimary) || detail.images?.[0];
        if (primary) {
          setImgUrl(primary.imageUrl);
        }
      }).catch(() => {});
    }, [productId]);

    return (
      <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
        {imgUrl ? (
          <img src={imgUrl} alt={productName} className="w-full h-full object-cover" />
        ) : (
          <PackageOpen className="text-slate-400 w-6 h-6" />
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
  const [brands, setBrands] = useState<Record<number, string>>({});

  const loadDependencies = async () => {
    try {
      const [cats, brnds] = await Promise.all([
        getCategories(0, 100),
        getBrands(0, 100)
      ]);
      const catMap = cats.content.reduce((acc, cat) => { acc[cat.id] = cat.name; return acc; }, {} as Record<number, string>);
      const brandMap = brnds.content.reduce((acc, brand) => { acc[brand.id] = brand.name; return acc; }, {} as Record<number, string>);
      setCategories(catMap);
      setBrands(brandMap);
    } catch {
      console.error('Failed to load dependencies');
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts(page, 10, search || undefined, categoryId);
      setProducts(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
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
    const timer = setTimeout(() => {
      loadProducts();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, page, categoryId]);

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

  const getStatusBadge = (status: string) => {
    const baseClass = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm";
    if (status === 'ACTIVE') return <span className={`${baseClass} bg-green-600 text-white`}>Đang bán</span>;
    if (status === 'DELETED') return <span className={`${baseClass} bg-red-600 text-white`}>Đã xóa</span>;
    return <span className={`${baseClass} bg-slate-500 text-white`}>Ngừng bán</span>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Sản phẩm</h2>
        <Button asChild className="font-bold">
          <Link href="/admin/products/create">+ Thêm Sản Phẩm</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Input 
            placeholder="Tìm kiếm sản phẩm theo tên..." 
            className="max-w-md border-slate-300 text-slate-900 bg-slate-50 focus:bg-white" 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
          <Select value={categoryId} onValueChange={(val) => { setCategoryId(val); setPage(0); }}>
            <SelectTrigger className="w-[200px] border-slate-300">
              <SelectValue placeholder="Lọc theo Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {Object.entries(categories).map(([id, name]) => (
                <SelectItem key={id} value={id}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Ảnh</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Phân loại</TableHead>
                <TableHead>Giá bán</TableHead>
                <TableHead>Giới tính</TableHead>
                <TableHead>Lượt xem</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Cập nhật</TableHead>
                <TableHead className="text-center">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 font-bold text-slate-700">Đang tải...</TableCell>
                </TableRow>
              ) : products.length > 0 ? (
                products.map((prod) => {
                  return (
                    <TableRow key={prod.id}>
                      <TableCell>
                        <ProductImageCell productId={prod.id} productName={prod.name} />
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 max-w-[200px] truncate" title={prod.name}>
                        {prod.name}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-bold text-black">{categories[prod.categoryId] || '---'}</div>
                        <div className="text-xs font-medium text-black">{brands[prod.brandId] || '---'}</div>
                      </TableCell>
                      <TableCell>
                        {prod.discountPrice && prod.discountPrice < prod.basePrice ? (
                          <>
                            <div className="text-red-600 font-bold">{formatCurrency(prod.discountPrice)}</div>
                            <div className="text-xs font-medium text-slate-500 line-through">{formatCurrency(prod.basePrice)}</div>
                          </>
                        ) : (
                          <div className="font-bold text-slate-900">{formatCurrency(prod.basePrice)}</div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">
                        {prod.gender === 'MALE' ? 'Nam' : prod.gender === 'FEMALE' ? 'Nữ' : prod.gender === 'UNISEX' ? 'Nam và Nữ' : '---'}
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">{prod.viewCount || 0}</TableCell>
                      <TableCell>{getStatusBadge(prod.status)}</TableCell>
                      <TableCell className="text-slate-500 text-sm whitespace-nowrap">{prod.createdAt ? new Date(prod.createdAt).toLocaleDateString('vi-VN') : '---'}</TableCell>
                    <TableCell className="text-slate-500 text-sm whitespace-nowrap">{prod.updatedAt ? new Date(prod.updatedAt).toLocaleDateString('vi-VN') : '---'}</TableCell>
                    <TableCell className="text-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleUpdateStatus(prod.id)} 
                          className="font-bold border-amber-200 hover:bg-amber-50 text-amber-700 bg-white"
                        >
                          {prod.status === 'ACTIVE' ? 'Ngừng bán' : 'Mở bán'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                          className="font-bold border-blue-200 hover:bg-blue-50 text-blue-700 bg-white"
                        >
                           <Link href={`/admin/products/${prod.id}`}>Xem chi tiết</Link>
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDelete(prod.id)} 
                          className="font-bold bg-red-600 hover:bg-red-700 text-white"
                        >
                          Xóa
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 font-bold text-slate-700">
                    Không tìm thấy sản phẩm nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-slate-500">
                Hiển thị tổng số {totalElements} sản phẩm
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="text-sm font-medium text-black">Trang {page + 1} / {totalPages}</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
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
