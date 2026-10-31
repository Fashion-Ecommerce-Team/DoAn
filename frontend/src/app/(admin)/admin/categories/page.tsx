'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@admin/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin/components/ui/table';
import { Button } from '@admin/components/ui/button';
import { Input } from '@admin/components/ui/input';
import { Textarea } from '@admin/components/ui/textarea';
import { getCategories, deleteCategory, updateCategoryStatus, createCategory, updateCategory } from '@admin/services';
import { CategoryResponse } from '@admin/types';
import { toast } from 'sonner';
import AdminSearchBar from '@/features/admin/components/common/AdminSearchBar';
import AdminPageHeader from '@/features/admin/components/common/AdminPageHeader';
import AdminStatusBadge from '@/features/admin/components/common/AdminStatusBadge';
import { AdminToggleButton, AdminEditButton, AdminDeleteButton } from '@/features/admin/components/common/AdminTableActions';
import { ChevronLeft, ChevronRight, Plus, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@admin/components/ui/dialog';
import { Label } from '@admin/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@admin/components/ui/select';

export default function CategoryPage() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryResponse | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const statusParam = status === 'ALL' ? undefined : status;
      const data = await getCategories(page, 10, search || undefined, statusParam);
      setCategories(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      toast.error('Lỗi khi tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [search, status, page]);

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      try {
        await deleteCategory(id);
        toast.success('Xóa danh mục thành công');
        loadCategories();
      } catch {
        toast.error('Lỗi khi xóa danh mục');
      }
    }
  };

  const handleUpdateStatus = async (cat: CategoryResponse) => {
    try {
      const newStatus = cat.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updateCategoryStatus(cat.id, newStatus);
      toast.success('Cập nhật trạng thái thành công');
      loadCategories();
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const openCreateDialog = () => {
    setEditingCat(null);
    setFormData({ name: '', description: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (cat: CategoryResponse) => {
    setEditingCat(cat);
    setFormData({ name: cat.name || '', description: cat.description || '' });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }
    setSaving(true);
    try {
      if (editingCat) {
        await updateCategory(editingCat.id, { ...formData, parentId: undefined, status: editingCat.status || 'ACTIVE' });
        toast.success('Cập nhật danh mục thành công');
      } else {
        await createCategory({ ...formData, parentId: undefined, status: 'ACTIVE' });
        toast.success('Thêm danh mục thành công');
      }
      setIsDialogOpen(false);
      loadCategories();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Lỗi khi lưu danh mục');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quản lý Danh mục"
        description="Quản lý hệ thống phân loại danh mục sản phẩm thời trang"
        badge={totalElements}
        action={
          <Button className="gap-2 shadow-sm font-semibold" onClick={openCreateDialog}>
            <Plus className="w-4 h-4" />
            Thêm Danh Mục
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 py-4">
          <AdminSearchBar
            placeholder="Tìm kiếm danh mục theo tên..."
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
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Tên danh mục</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Đường dẫn</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Mô tả</TableHead>
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
              ) : categories.length > 0 ? (
                categories.map((cat) => (
                  <TableRow key={cat.id} className="hover:bg-slate-50/80">
                    <TableCell className="font-mono text-xs font-bold text-slate-700">#{cat.id}</TableCell>
                    <TableCell className="font-semibold text-slate-900 text-xs">{cat.name}</TableCell>
                    <TableCell>
                      <span className="inline-block font-mono text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {cat.slug || '---'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 font-medium max-w-xs truncate" title={cat.description || ''}>
                      {cat.description || '---'}
                    </TableCell>
                    <TableCell><AdminStatusBadge status={cat.status} type="active" /></TableCell>
                    <TableCell className="text-slate-500 text-xs whitespace-nowrap">{cat.createdAt ? new Date(cat.createdAt).toLocaleDateString('vi-VN') : '---'}</TableCell>
                    <TableCell className="text-slate-500 text-xs whitespace-nowrap">{cat.updatedAt ? new Date(cat.updatedAt).toLocaleDateString('vi-VN') : '---'}</TableCell>
                    <TableCell className="text-center space-x-1.5 whitespace-nowrap py-3">
                      <AdminToggleButton
                        active={cat.status === 'ACTIVE'}
                        onToggle={() => handleUpdateStatus(cat)}
                        activeLabel="Tạm ẩn"
                        inactiveLabel="Mở lại"
                      />
                      <AdminEditButton onClick={() => openEditDialog(cat)} />
                      <AdminDeleteButton onClick={() => handleDelete(cat.id)} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 font-semibold text-slate-500">
                    Không tìm thấy dữ liệu danh mục
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
            <DialogTitle>{editingCat ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tên danh mục <span className="text-red-500">*</span></Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                placeholder="Nhập tên..." 
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Nhập mô tả..." 
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu lại'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
