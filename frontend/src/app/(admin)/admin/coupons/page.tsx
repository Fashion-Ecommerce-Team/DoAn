'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Tag, Calendar, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@admin/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin/components/ui/table';
import { Button } from '@admin/components/ui/button';
import { Input } from '@admin/components/ui/input';
import { Textarea } from '@admin/components/ui/textarea';
import { Label } from '@admin/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@admin/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@admin/components/ui/select';
import { getCoupons, getCouponById, createCoupon, updateCoupon, updateCouponStatus, deleteCoupon } from '@admin/services';
import { CouponResponse, CouponRequest } from '@admin/types';
import { toast } from 'sonner';

export default function CouponPage() {
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Dialog State (Thêm/Sửa)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponResponse | null>(null);
  const [saving, setSaving] = useState(false);

  // Detail Modal State (Xem chi tiết)
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailCoupon, setDetailCoupon] = useState<CouponResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    description: string;
    discountType: string;
    discountValue: string;
    minOrderValue: string;
    maxDiscountAmount: string;
    usageLimit: string;
    startDate: string;
    endDate: string;
    status: string;
  }>({
    code: '',
    description: '',
    discountType: 'PERCENT',
    discountValue: '',
    minOrderValue: '0',
    maxDiscountAmount: '',
    usageLimit: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
  });

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await getCoupons(page, 10, search || undefined, statusFilter);
      setCoupons(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch {
      toast.error('Lỗi khi tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCoupons();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, page, statusFilter]);

  const openCreateDialog = () => {
    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(now.getMonth() + 1);

    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENT',
      discountValue: '',
      minOrderValue: '0',
      maxDiscountAmount: '',
      usageLimit: '100',
      startDate: now.toISOString().slice(0, 16),
      endDate: oneMonthLater.toISOString().slice(0, 16),
      status: 'ACTIVE',
    });
    setIsDialogOpen(true);
  };

  const openDetailDialog = async (id: number) => {
    setDetailLoading(true);
    setIsDetailOpen(true);
    try {
      const data = await getCouponById(id);
      setDetailCoupon(data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Lỗi khi tải chi tiết mã giảm giá');
      setIsDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openEditDialog = (coupon: CouponResponse) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || '',
      description: coupon.description || '',
      discountType: coupon.discountType === 'PERCENTAGE' ? 'PERCENT' : (coupon.discountType || 'PERCENT'),
      discountValue: coupon.discountValue !== undefined && coupon.discountValue !== null ? coupon.discountValue.toString() : '',
      minOrderValue: coupon.minOrderValue !== undefined && coupon.minOrderValue !== null ? coupon.minOrderValue.toString() : '0',
      maxDiscountAmount: coupon.maxDiscountAmount ? coupon.maxDiscountAmount.toString() : '',
      usageLimit: coupon.usageLimit ? coupon.usageLimit.toString() : '',
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 16) : '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().slice(0, 16) : '',
      status: coupon.status || 'ACTIVE',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }
    const val = parseFloat(formData.discountValue);
    if (isNaN(val) || val <= 0) {
      toast.error('Vui lòng nhập mức giảm hợp lệ');
      return;
    }
    if (formData.discountType === 'PERCENT' && val > 100) {
      toast.error('Giảm theo phần trăm không được vượt quá 100%');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('Vui lòng chọn thời hạn áp dụng');
      return;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error('Ngày kết thúc phải lớn hơn ngày bắt đầu');
      return;
    }

    setSaving(true);
    try {
      const payload: CouponRequest = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: val,
        minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : 0,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        startDate: formData.startDate.length === 16 ? `${formData.startDate}:00` : formData.startDate,
        endDate: formData.endDate.length === 16 ? `${formData.endDate}:00` : formData.endDate,
        status: formData.status,
      };

      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, payload);
        toast.success(`Cập nhật mã giảm giá ${payload.code} thành công!`);
      } else {
        await createCoupon(payload);
        toast.success(`Tạo mã giảm giá ${payload.code} thành công!`);
      }
      setIsDialogOpen(false);
      loadCoupons();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Lỗi khi lưu mã giảm giá');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (coupon: CouponResponse) => {
    const nextStatus = coupon.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateCouponStatus(coupon.id, nextStatus);
      toast.success(`Đã chuyển mã ${coupon.code} sang "${nextStatus === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}"`);
      loadCoupons();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Lỗi khi đổi trạng thái');
    }
  };

  const handleDelete = async (id: number, code: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${code}"?`)) {
      try {
        await deleteCoupon(id);
        toast.success(`Đã xóa mã giảm giá ${code}`);
        loadCoupons();
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err?.response?.data?.message || 'Lỗi khi xóa mã giảm giá');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClass = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm whitespace-nowrap";
    switch (status) {
      case 'ACTIVE': return <span className={`${baseClass} bg-green-600 text-white`}>Hoạt động</span>;
      case 'INACTIVE': return <span className={`${baseClass} bg-amber-500 text-white`}>Tạm dừng</span>;
      case 'EXPIRED': return <span className={`${baseClass} bg-slate-500 text-white`}>Hết hạn</span>;
      case 'DELETED': return <span className={`${baseClass} bg-red-600 text-white`}>Đã xóa</span>;
      default: return <span className={`${baseClass} bg-slate-500 text-white`}>{status}</span>;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDiscount = (type: string, value?: number) => {
    if (value === undefined || value === null) return '---';
    if (type === 'PERCENT' || type === 'PERCENTAGE') return `${value}%`;
    return formatCurrency(value);
  };

  const statusFilters = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Hoạt động', value: 'ACTIVE' },
    { label: 'Tạm dừng', value: 'INACTIVE' },
    { label: 'Hết hạn', value: 'EXPIRED' },
  ];

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Nút Thêm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Mã giảm giá</h2>
          <p className="text-xs text-slate-500 mt-1">Tạo và quản lý các chương trình ưu đãi, khuyến mãi</p>
        </div>
        <Button 
          className="font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm"
          onClick={openCreateDialog}
        >
          <Plus className="w-4 h-4" />
          Thêm Mã Mới
        </Button>
      </div>

      {/* Tabs lọc nhanh trạng thái */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusFilters.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(0); }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
              statusFilter === tab.value 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 py-4">
          <Input 
            placeholder="Tìm kiếm theo mã code (VD: WELCOME10, SALE20)..." 
            className="max-w-md border-slate-300 text-slate-900 bg-slate-50 focus:bg-white text-sm" 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-slate-900">Mã (Code)</TableHead>
                <TableHead className="font-bold text-slate-900">Mức giảm</TableHead>
                <TableHead className="font-bold text-slate-900">Điều kiện</TableHead>
                <TableHead className="font-bold text-slate-900">Lượt dùng</TableHead>
                <TableHead className="font-bold text-slate-900">Thời hạn áp dụng</TableHead>
                <TableHead className="font-bold text-slate-900">Trạng thái</TableHead>
                <TableHead className="font-bold text-slate-900">Ngày tạo</TableHead>
                <TableHead className="text-center font-bold text-slate-900">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 font-bold text-slate-700">Đang tải...</TableCell>
                </TableRow>
              ) : coupons.length > 0 ? (
                coupons.map((coupon) => (
                  <TableRow key={coupon.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded inline-block text-xs">
                        {coupon.code}
                      </div>
                      {coupon.description && (
                        <div className="text-xs text-slate-500 mt-1 max-w-[200px] truncate" title={coupon.description}>
                          {coupon.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-red-600 text-sm">
                        {formatDiscount(coupon.discountType, coupon.discountValue)}
                      </span>
                      {(coupon.discountType === 'PERCENT' || coupon.discountType === 'PERCENTAGE') && coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0 ? (
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Tối đa: {formatCurrency(coupon.maxDiscountAmount)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-900">
                        Đơn từ {formatCurrency(coupon.minOrderValue || 0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-bold text-slate-900">
                        {coupon.usedCount || 0} / {coupon.usageLimit && coupon.usageLimit > 0 ? coupon.usageLimit : '∞'}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-xs text-slate-700 font-medium">
                        Từ: {coupon.startDate ? new Date(coupon.startDate).toLocaleDateString('vi-VN') : '---'}
                      </div>
                      <div className="text-xs text-slate-700 font-medium">
                        Đến: {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString('vi-VN') : '---'}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(coupon.status)}</TableCell>
                    <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                      {coupon.createdAt ? new Date(coupon.createdAt).toLocaleDateString('vi-VN') : '---'}
                    </TableCell>
                    <TableCell className="text-center space-x-1.5 whitespace-nowrap">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openDetailDialog(coupon.id)}
                        className="font-bold border-indigo-200 hover:bg-indigo-50 text-indigo-700 bg-white"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Chi tiết
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openEditDialog(coupon)}
                        className="font-bold border-blue-200 hover:bg-blue-50 text-blue-700 bg-white"
                      >
                        Sửa
                      </Button>
                      {coupon.status !== 'DELETED' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleToggleStatus(coupon)}
                          disabled={coupon.status === 'EXPIRED'}
                          title={coupon.status === 'EXPIRED' ? 'Mã đã hết hạn, vui lòng sửa hạn sử dụng để kích hoạt lại' : ''}
                          className={`font-bold ${
                            coupon.status === 'EXPIRED'
                              ? 'border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed'
                              : coupon.status === 'ACTIVE' 
                              ? 'border-amber-200 hover:bg-amber-50 text-amber-700 bg-white' 
                              : 'border-green-200 hover:bg-green-50 text-green-700 bg-white'
                          }`}
                        >
                          {coupon.status === 'ACTIVE' ? 'Tạm dừng' : coupon.status === 'EXPIRED' ? 'Hết hạn' : 'Kích hoạt'}
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDelete(coupon.id, coupon.code)}
                        className="font-bold bg-red-600 hover:bg-red-700 text-white"
                      >
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 font-bold text-slate-700">
                    Không tìm thấy mã giảm giá nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 0 && (
            <div className="flex items-center justify-between mt-4 border-t pt-4">
              <div className="text-sm font-medium text-slate-500">
                Tổng số: {totalElements} mã giảm giá
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

      {/* Dialog Thêm / Sửa Mã Giảm Giá */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingCoupon ? `Sửa Mã Giảm Giá: ${editingCoupon.code}` : 'Thêm Mã Giảm Giá Mới'}
            </DialogTitle>
            <DialogDescription>
              Nhập các thông tin chi tiết và điều kiện áp dụng cho mã ưu đãi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Mã Code & Loại giảm giá */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Mã Code <span className="text-red-500">*</span>
                </Label>
                <Input 
                  value={formData.code} 
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} 
                  placeholder="VD: SALE50, FREESHIP..." 
                  className="font-mono uppercase font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Loại giảm giá <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.discountType} 
                  onValueChange={val => setFormData({ ...formData, discountType: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại giảm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Phần trăm (%)</SelectItem>
                    <SelectItem value="FIXED">Số tiền cố định (VNĐ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mức giảm & Giảm tối đa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Mức giảm <span className="text-red-500">*</span>
                </Label>
                <Input 
                  type="number"
                  value={formData.discountValue} 
                  onChange={e => setFormData({ ...formData, discountValue: e.target.value })} 
                  placeholder={formData.discountType === 'PERCENT' ? 'VD: 10 (tức 10%)' : 'VD: 50000'} 
                />
              </div>

              {formData.discountType === 'PERCENT' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Giảm tối đa (VNĐ)</Label>
                  <Input 
                    type="number"
                    value={formData.maxDiscountAmount} 
                    onChange={e => setFormData({ ...formData, maxDiscountAmount: e.target.value })} 
                    placeholder="VD: 100000 (để trống nếu không giới hạn)" 
                  />
                </div>
              )}
            </div>

            {/* Đơn tối thiểu & Giới hạn lượt dùng */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Đơn hàng tối thiểu (VNĐ)</Label>
                <Input 
                  type="number"
                  value={formData.minOrderValue} 
                  onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })} 
                  placeholder="0" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Giới hạn số lượt dùng</Label>
                <Input 
                  type="number"
                  value={formData.usageLimit} 
                  onChange={e => setFormData({ ...formData, usageLimit: e.target.value })} 
                  placeholder="Để trống nếu không giới hạn" 
                />
              </div>
            </div>

            {/* Ngày bắt đầu & Ngày kết thúc */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </Label>
                <Input 
                  type="datetime-local"
                  value={formData.startDate} 
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })} 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Ngày kết thúc <span className="text-red-500">*</span>
                </Label>
                <Input 
                  type="datetime-local"
                  value={formData.endDate} 
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })} 
                />
              </div>
            </div>

            {/* Trạng thái */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Trạng thái</Label>
              <Select 
                value={formData.status} 
                onValueChange={val => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                  <SelectItem value="INACTIVE">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mô tả ngắn */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Mô tả ngắn</Label>
              <Textarea 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                placeholder="VD: Áp dụng cho khách hàng mới, giảm tối đa 50k..." 
                rows={3}
                className="text-sm border-slate-300"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving} className="font-bold bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? 'Đang lưu...' : 'Lưu lại'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Xem chi tiết Mã giảm giá */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg">Chi tiết Mã giảm giá</DialogTitle>
                <DialogDescription>
                  Thông tin thiết lập và trạng thái áp dụng của mã ưu đãi
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-12 text-center text-sm font-bold text-slate-500">
              Đang tải dữ liệu chi tiết mã giảm giá...
            </div>
          ) : detailCoupon ? (
            <div className="space-y-4 py-2">
              {/* Header Box mã */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Mã ưu đãi</span>
                  <span className="text-xl font-extrabold text-blue-900 tracking-wide">{detailCoupon.code}</span>
                </div>
                <div>{getStatusBadge(detailCoupon.status)}</div>
              </div>

              {/* Thông số ưu đãi */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg border">
                  <span className="text-xs text-slate-500 block">Hình thức giảm</span>
                  <span className="font-bold text-slate-800">
                    {detailCoupon.discountType === 'PERCENT' || detailCoupon.discountType === 'PERCENTAGE' 
                      ? 'Giảm theo phần trăm (%)' 
                      : 'Giảm số tiền cố định'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border">
                  <span className="text-xs text-slate-500 block">Mức giảm</span>
                  <span className="font-extrabold text-emerald-600 text-base">
                    {detailCoupon.discountType === 'PERCENT' || detailCoupon.discountType === 'PERCENTAGE'
                      ? `${detailCoupon.discountValue}%`
                      : formatCurrency(detailCoupon.discountValue || 0)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border">
                  <span className="text-xs text-slate-500 block">Giảm tối đa</span>
                  <span className="font-bold text-slate-800">
                    {detailCoupon.maxDiscountAmount && detailCoupon.maxDiscountAmount > 0
                      ? formatCurrency(detailCoupon.maxDiscountAmount)
                      : 'Không giới hạn'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border">
                  <span className="text-xs text-slate-500 block">Đơn hàng tối thiểu</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(detailCoupon.minOrderValue || 0)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border">
                  <span className="text-xs text-slate-500 block">Lượt đã sử dụng</span>
                  <span className="font-bold text-slate-800">
                    {detailCoupon.usedCount || 0} lượt
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border">
                  <span className="text-xs text-slate-500 block">Giới hạn toàn hệ thống</span>
                  <span className="font-bold text-slate-800">
                    {detailCoupon.usageLimit && detailCoupon.usageLimit > 0
                      ? `${detailCoupon.usageLimit} lượt`
                      : 'Không giới hạn'}
                  </span>
                </div>
              </div>

              {/* Thời gian hiệu lực */}
              <div className="p-3 bg-slate-50 rounded-lg border space-y-2">
                <span className="text-xs text-slate-500 font-semibold block flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Thời gian áp dụng
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-400 block">Bắt đầu từ:</span>
                    <span className="font-bold">
                      {detailCoupon.startDate ? new Date(detailCoupon.startDate).toLocaleString('vi-VN') : '---'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Hết hạn vào:</span>
                    <span className="font-bold">
                      {detailCoupon.endDate ? new Date(detailCoupon.endDate).toLocaleString('vi-VN') : '---'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mô tả ngắn */}
              <div className="p-3 bg-slate-50 rounded-lg border">
                <span className="text-xs text-slate-500 font-semibold block mb-1">Mô tả ngắn:</span>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                  {detailCoupon.description ? (
                    detailCoupon.description
                  ) : (
                    <span className="text-slate-400 italic">Chưa có mô tả cho mã này</span>
                  )}
                </p>
              </div>

              {/* Ngày tạo */}
              <div className="text-[11px] text-slate-400 text-right">
                Ngày tạo mã: {detailCoupon.createdAt ? new Date(detailCoupon.createdAt).toLocaleString('vi-VN') : '---'}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">
              Không tìm thấy thông tin mã giảm giá
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Đóng
            </Button>
            {detailCoupon && (
              <Button 
                onClick={() => {
                  setIsDetailOpen(false);
                  openEditDialog(detailCoupon);
                }} 
                className="font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                Chỉnh sửa mã này
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
