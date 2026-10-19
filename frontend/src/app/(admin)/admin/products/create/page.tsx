'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@admin/components/ui/card';
import { Button } from '@admin/components/ui/button';
import { Input } from '@admin/components/ui/input';
import { Textarea } from '@admin/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@admin/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@admin/components/ui/form';
import { toast } from 'sonner';
import { createProduct, getCategories, getBrands } from '@admin/services';
import { CategoryResponse, BrandResponse } from '@admin/types';

const formSchema = z.object({
  name: z.string().min(2, 'Tên sản phẩm phải có ít nhất 2 ký tự'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  brandId: z.string().optional(),
  basePrice: z.coerce.number().min(0, 'Giá không hợp lệ'),
  discountPrice: z.coerce.number().min(0, 'Giá không hợp lệ').optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  gender: z.string().optional(),
  tags: z.string().optional(),
});

export default function CreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      brandId: '',
      basePrice: 0,
      discountPrice: 0,
      shortDescription: '',
      description: '',
      gender: 'UNISEX',
      tags: '',
    },
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          getCategories(0, 100),
          getBrands(0, 100),
        ]);
        if (catRes?.content) setCategories(catRes.content);
        if (brandRes?.content) setBrands(brandRes.content);
      } catch (error) {
        console.error('Failed to load categories or brands:', error);
      }
    };
    fetchMetadata();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      const productPayload = {
        name: values.name,
        categoryId: Number(values.categoryId),
        brandId: values.brandId ? Number(values.brandId) : undefined,
        basePrice: values.basePrice,
        discountPrice: values.discountPrice ? Number(values.discountPrice) : undefined,
        shortDescription: values.shortDescription,
        description: values.description,
        gender: values.gender || 'UNISEX',
        tags: values.tags,
      };

      await createProduct(productPayload);
      toast.success('Thêm sản phẩm thành công!');
      router.push('/admin/products');
    } catch {
      toast.error('Lỗi khi thêm sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Thêm Sản Phẩm Mới</h2>
        <Button variant="outline" onClick={() => router.push('/admin/products')}>Hủy</Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Cột Trái - Thông Tin Chính */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Thông tin chung</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên sản phẩm *</FormLabel>
                      <FormControl><Input placeholder="Ví dụ: Áo thun nam" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Danh mục *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn danh mục" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="brandId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thương hiệu</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn thương hiệu" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {brands.map(b => (
                              <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô tả ngắn</FormLabel>
                      <FormControl><Textarea rows={2} {...field} /></FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô tả chi tiết (Bài viết)</FormLabel>
                      <FormControl><Textarea rows={8} {...field} /></FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Cột Phải - Giá và Hình ảnh */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Giá cả</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá gốc (VNĐ) *</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="discountPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá khuyến mãi (VNĐ)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Đối tượng (Giới tính)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn giới tính" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UNISEX">Unisex (Tất cả)</SelectItem>
                            <SelectItem value="MALE">Nam (Male)</SelectItem>
                            <SelectItem value="FEMALE">Nữ (Female)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thẻ tags</FormLabel>
                        <FormControl><Input placeholder="ao, mua he, basic..." {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Button type="submit" disabled={loading} className="w-full font-bold" size="lg">
              {loading ? 'Đang lưu...' : 'Lưu Sản Phẩm'}
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}
