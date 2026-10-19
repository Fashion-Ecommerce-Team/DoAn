'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@admin/components/ui/card';
import { Button } from '@admin/components/ui/button';
import { Input } from '@admin/components/ui/input';
import { Label } from '@admin/components/ui/label';
import { Textarea } from '@admin/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@admin/components/ui/select';
import { getProductById, updateProduct, getCategories, getBrands } from '@admin/services';
import { CategoryResponse, BrandResponse, ProductRequest } from '@admin/types';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    brandId: '',
    shortDescription: '',
    description: '',
    basePrice: '',
    discountPrice: '',
    gender: 'MALE',
    tags: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodData, catsData, brandsData] = await Promise.all([
          getProductById(Number(params.id)),
          getCategories(0, 100),
          getBrands(0, 100)
        ]);

        setCategories(catsData.content || []);
        setBrands(brandsData.content || []);

        setFormData({
          name: prodData.name || '',
          categoryId: prodData.categoryId?.toString() || '',
          brandId: prodData.brandId?.toString() || '',
          shortDescription: prodData.shortDescription || '',
          description: prodData.description || '',
          basePrice: prodData.basePrice?.toString() || '',
          discountPrice: prodData.discountPrice ? prodData.discountPrice.toString() : '',
          gender: prodData.gender || 'MALE',
          tags: prodData.tags || '',
          status: prodData.status || 'ACTIVE'
        });
      } catch {
        toast.error('Lỗi khi tải thông tin sản phẩm');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.categoryId || !formData.basePrice) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc (Tên, Danh mục, Giá cơ bản)');
      return;
    }

    setSaving(true);
    try {
      const payload: ProductRequest = {
        name: formData.name.trim(),
        categoryId: Number(formData.categoryId),
        brandId: formData.brandId ? Number(formData.brandId) : undefined,
        shortDescription: formData.shortDescription.trim() || undefined,
        description: formData.description.trim() || undefined,
        basePrice: Number(formData.basePrice),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
        gender: formData.gender,
        tags: formData.tags.trim() || undefined,
        status: formData.status
      };

      await updateProduct(Number(params.id), payload);
      toast.success('Cập nhật thông tin sản phẩm thành công');
      router.push(`/admin/products/${params.id}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Lỗi khi cập nhật sản phẩm');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 font-bold text-slate-600">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/products/${params.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sửa thông tin chung</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cập nhật sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Tên sản phẩm <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nhập tên sản phẩm..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Danh mục <span className="text-red-500">*</span></Label>
                <Select value={formData.categoryId} onValueChange={(val) => setFormData({ ...formData, categoryId: val })}>
                  <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Thương hiệu</Label>
                <Select value={formData.brandId} onValueChange={(val) => setFormData({ ...formData, brandId: val })}>
                  <SelectTrigger><SelectValue placeholder="Chọn thương hiệu (Tùy chọn)" /></SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="basePrice">Giá bán cơ bản (VNĐ) <span className="text-red-500">*</span></Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  placeholder="VD: 250000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountPrice">Giá khuyến mãi (VNĐ)</Label>
                <Input
                  id="discountPrice"
                  type="number"
                  value={formData.discountPrice}
                  onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                  placeholder="VD: 219000 (để trống nếu không giảm)"
                />
              </div>

              <div className="space-y-2">
                <Label>Giới tính / Đối tượng</Label>
                <Select value={formData.gender} onValueChange={(val) => setFormData({ ...formData, gender: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Nam</SelectItem>
                    <SelectItem value="FEMALE">Nữ</SelectItem>
                    <SelectItem value="UNISEX">Nam và Nữ (Unisex)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Đang bán (Hoạt động)</SelectItem>
                    <SelectItem value="INACTIVE">Ngừng bán (Tạm ẩn)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Thẻ tìm kiếm (Tags)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="VD: ao thun, cotton cao cap, nam"
              />
              <p className="text-xs text-slate-500">Các từ khóa cách nhau bởi dấu phẩy để khách hàng dễ dàng tìm kiếm.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Mô tả ngắn</Label>
              <Textarea
                id="shortDescription"
                rows={2}
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Mô tả tóm tắt sản phẩm (hiển thị ở thẻ sản phẩm)..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả chi tiết sản phẩm</Label>
              <Textarea
                id="description"
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Nhập mô tả chi tiết chất liệu, form dáng, cách bảo quản..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" type="button" asChild>
                <Link href={`/admin/products/${params.id}`}>Hủy bỏ</Link>
              </Button>
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                {saving ? 'Đang lưu...' : <><Save className="w-4 h-4 mr-2" /> Lưu thay đổi</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
