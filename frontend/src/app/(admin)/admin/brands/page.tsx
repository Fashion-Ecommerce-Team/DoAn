'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@admin/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin/components/ui/table';
import { Button } from '@admin/components/ui/button';
import { Input } from '@admin/components/ui/input';

import { getBrands, deleteBrand, updateBrandStatus, createBrand, updateBrand } from '@admin/services';
import { uploadImage } from '@admin/services';
import { BrandResponse } from '@admin/types';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, ImageIcon, UploadCloud } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@admin/components/ui/dialog';
import { Label } from '@admin/components/ui/label';

export default function BrandPage() {
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandResponse | null>(null);
  const [formData, setFormData] = useState({ name: '', logoUrl: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const data = await getBrands(page, 10, search || undefined);
      setBrands(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      toast.error('Lỗi khi tải danh sách thương hiệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBrands();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, page]);

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa thương hiệu này?')) {
      try {
        await deleteBrand(id);
        toast.success('Xóa thương hiệu thành công');
        loadBrands();
      } catch {
        toast.error('Lỗi khi xóa thương hiệu');
      }
    }
  };

  const handleUpdateStatus = async (brand: BrandResponse) => {
    try {
      const newStatus = brand.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updateBrandStatus(brand.id, newStatus);
      toast.success('Cập nhật trạng thái thành công');
      loadBrands();
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const openCreateDialog = () => {
    setEditingBrand(null);
    setFormData({ name: '', logoUrl: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (brand: BrandResponse) => {
    setEditingBrand(brand);
    setFormData({ name: brand.name || '', logoUrl: brand.logoUrl || '' });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    try {
      const file = e.target.files[0];
      const res = await uploadImage(file);
      setFormData(prev => ({ ...prev, logoUrl: res.url }));
      toast.success('Tải ảnh lên thành công');
    } catch {
      toast.error('Lỗi khi tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên thương hiệu');
      return;
    }
    setSaving(true);
    try {
      if (editingBrand) {
        await updateBrand(editingBrand.id, { ...formData, status: editingBrand.status || 'ACTIVE' });
        toast.success('Cập nhật thương hiệu thành công');
      } else {
        await createBrand({ ...formData, status: 'ACTIVE' });
        toast.success('Thêm thương hiệu thành công');
      }
      setIsDialogOpen(false);
      loadBrands();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Lỗi khi lưu thương hiệu');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClass = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm";
    if (status === 'ACTIVE') return <span className={`${baseClass} bg-green-600 text-white`}>Hoạt động</span>;
    if (status === 'DELETED') return <span className={`${baseClass} bg-red-600 text-white`}>Đã xóa</span>;
    return <span className={`${baseClass} bg-slate-500 text-white`}>Tạm ẩn</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Thương hiệu</h2>
        <Button className="font-bold bg-blue-600 hover:bg-blue-700 text-white" onClick={openCreateDialog}>+ Thêm Thương Hiệu</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Input 
            placeholder="Tìm kiếm thương hiệu theo tên..." 
            className="max-w-md border-slate-300 text-slate-900 bg-slate-50 focus:bg-white" 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Logo</TableHead>
                <TableHead>Tên thương hiệu</TableHead>
                <TableHead>Đường dẫn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Cập nhật</TableHead>
                <TableHead className="text-center">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 font-bold text-slate-700">Đang tải...</TableCell>
                </TableRow>
              ) : brands.length > 0 ? (
                brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-bold text-slate-900">{brand.id}</TableCell>
                    <TableCell>
                      <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                        {brand.logoUrl ? (
                          <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon className="text-slate-400 w-6 h-6" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">{brand.name}</TableCell>
                    <TableCell>
                      <span className="inline-block font-mono text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {brand.slug || '---'}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(brand.status)}</TableCell>
                    <TableCell className="text-slate-500 text-sm whitespace-nowrap">{brand.createdAt ? new Date(brand.createdAt).toLocaleDateString('vi-VN') : '---'}</TableCell>
                    <TableCell className="text-slate-500 text-sm whitespace-nowrap">{brand.updatedAt ? new Date(brand.updatedAt).toLocaleDateString('vi-VN') : '---'}</TableCell>
                    <TableCell className="text-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(brand)} className="font-bold text-blue-600 hover:text-blue-700">
                        {brand.status === 'ACTIVE' ? 'Tạm ẩn' : 'Mở lại'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(brand)} className="font-bold">Sửa</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(brand.id)} className="font-bold">Xóa</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 font-bold text-slate-700">
                    Không tìm thấy dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 0 && (
            <div className="flex items-center justify-between mt-4 border-t pt-4">
              <div className="text-sm font-medium text-slate-500">
                Tổng số: {totalElements} bản ghi
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium text-slate-700">Trang {page + 1} / {totalPages}</span>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1 || loading}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Sửa Thương Hiệu' : 'Thêm Thương Hiệu Mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tên thương hiệu <span className="text-red-500">*</span></Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                placeholder="Nhập tên..." 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Logo Thương Hiệu</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded border flex items-center justify-center bg-slate-50 overflow-hidden">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="text-slate-400 w-8 h-8" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 cursor-pointer w-full">
                    {uploading ? 'Đang tải lên...' : (
                      <>
                        <UploadCloud className="w-4 h-4 mr-2" />
                        Tải ảnh lên
                      </>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      disabled={uploading} 
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving ? 'Đang lưu...' : 'Lưu lại'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
