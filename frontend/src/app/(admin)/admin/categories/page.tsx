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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@admin/components/ui/dialog';
import { Label } from '@admin/components/ui/label';

export default function CategoryPage() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
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
      const data = await getCategories(page, 10, search || undefined);
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
    const timer = setTimeout(() => {
      loadCategories();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, page]);

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

  const getStatusBadge = (status: string) => {
    const baseClass = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm";
    if (status === 'ACTIVE') return <span className={`${baseClass} bg-green-600 text-white`}>Hoạt động</span>;
    if (status === 'DELETED') return <span className={`${baseClass} bg-red-600 text-white`}>Đã xóa</span>;
    return <span className={`${baseClass} bg-slate-500 text-white`}>Tạm ẩn</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Danh mục</h2>
        <Button className="font-bold bg-blue-600 hover:bg-blue-700 text-white" onClick={openCreateDialog}>+ Thêm Danh Mục</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Input 
            placeholder="Tìm kiếm danh mục theo tên..." 
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
                <TableHead>Tên danh mục</TableHead>
                <TableHead>Đường dẫn</TableHead>
                <TableHead>Mô tả</TableHead>
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
              ) : categories.length > 0 ? (
                categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-bold text-slate-900">{cat.id}</TableCell>
                    <TableCell className="font-bold text-slate-900">{cat.name}</TableCell>
                    <TableCell>
                      <span className="inline-block font-mono text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {cat.slug || '---'}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">{cat.description || '---'}</TableCell>
                    <TableCell>{getStatusBadge(cat.status)}</TableCell>
                    <TableCell className="text-slate-500 text-sm whitespace-nowrap">{cat.createdAt ? new Date(cat.createdAt).toLocaleDateString('vi-VN') : '---'}</TableCell>
                    <TableCell className="text-slate-500 text-sm whitespace-nowrap">{cat.updatedAt ? new Date(cat.updatedAt).toLocaleDateString('vi-VN') : '---'}</TableCell>
                    <TableCell className="text-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(cat)} className="font-bold text-blue-600 hover:text-blue-700">
                        {cat.status === 'ACTIVE' ? 'Tạm ẩn' : 'Mở lại'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(cat)} className="font-bold">Sửa</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(cat.id)} className="font-bold">Xóa</Button>
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
