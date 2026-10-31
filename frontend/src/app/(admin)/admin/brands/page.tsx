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
import AdminSearchBar from '@/features/admin/components/common/AdminSearchBar';
import AdminPageHeader from '@/features/admin/components/common/AdminPageHeader';
import AdminStatusBadge from '@/features/admin/components/common/AdminStatusBadge';
import { AdminToggleButton, AdminEditButton, AdminDeleteButton } from '@/features/admin/components/common/AdminTableActions';
import { ChevronLeft, ChevronRight, ImageIcon, UploadCloud, Plus, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@admin/components/ui/dialog';
import { Label } from '@admin/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@admin/components/ui/select';

export default function BrandPage() {
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  
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
      const statusParam = status === 'ALL' ? undefined : status;
      const data = await getBrands(page, 10, search || undefined, statusParam);
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
    loadBrands();
  }, [search, status, page]);

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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quản lý Thương hiệu"
        description="Quản lý danh sách các thương hiệu và đối tác thời trang"
        badge={totalElements}
        action={
          <Button className="gap-2 shadow-sm font-semibold" onClick={openCreateDialog}>
            <Plus className="w-4 h-4" />
            Thêm Thương Hiệu
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 py-4">
          <AdminSearchBar
            placeholder="Tìm kiếm thương hiệu theo tên..."
            defaultValue={search}
            onSearch={(val) => {
              setSearch(val);
              setPage(0);
            }}
            className="w-full sm:max-w-md"
          />
          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-[170px] border-slate-300 text-xs font-semibold">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Tạm ẩn</SelectItem>
              </SelectContent>
            </Select>

            {(status !== 'ALL' || search) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatus('ALL');
                  setPage(0);
                }}
                className="h-9 px-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 border-slate-300"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Đặt lại
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="w-16 font-semibold text-slate-700 text-xs py-3.5">ID</TableHead>
                <TableHead className="w-20 font-semibold text-slate-700 text-xs py-3.5">Logo</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Tên thương hiệu</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Đường dẫn</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Trạng thái</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Ngày tạo</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Cập nhật</TableHead>
                <TableHead className="text-center font-semibold text-slate-700 text-xs py-3.5">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 font-semibold text-slate-600">Đang tải...</TableCell>
                </TableRow>
              ) : brands.length > 0 ? (
                brands.map((brand) => (
                  <TableRow key={brand.id} className="hover:bg-slate-50/80">
                    <TableCell className="font-mono text-xs font-bold text-slate-700">#{brand.id}</TableCell>
                    <TableCell>
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-200/80 p-1">
                        {brand.logoUrl ? (
                          <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon className="text-slate-400 w-5 h-5" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 text-xs">{brand.name}</TableCell>
                    <TableCell>
                      <span className="inline-block font-mono text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {brand.slug || '---'}
                      </span>
                    </TableCell>
                    <TableCell><AdminStatusBadge status={brand.status} type="active" /></TableCell>
                    <TableCell className="text-slate-500 text-xs whitespace-nowrap">{brand.createdAt ? new Date(brand.createdAt).toLocaleDateString('vi-VN') : '---'}</TableCell>
                    <TableCell className="text-slate-500 text-xs whitespace-nowrap">{brand.updatedAt ? new Date(brand.updatedAt).toLocaleDateString('vi-VN') : '---'}</TableCell>
                    <TableCell className="text-center space-x-1.5 whitespace-nowrap py-3">
                      <AdminToggleButton
                        active={brand.status === 'ACTIVE'}
                        onToggle={() => handleUpdateStatus(brand)}
                        activeLabel="Tạm ẩn"
                        inactiveLabel="Mở lại"
                      />
                      <AdminEditButton onClick={() => openEditDialog(brand)} />
                      <AdminDeleteButton onClick={() => handleDelete(brand.id)} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 font-semibold text-slate-500">
                    Không tìm thấy dữ liệu thương hiệu
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
