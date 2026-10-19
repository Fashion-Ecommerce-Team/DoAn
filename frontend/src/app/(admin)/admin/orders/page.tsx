'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@admin/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin/components/ui/table';
import { Button } from '@admin/components/ui/button';
import { Input } from '@admin/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@admin/components/ui/select';
import { getOrders, updateOrderStatus, cancelOrder } from '@admin/services';
import { OrderResponse } from '@admin/types';
import { toast } from 'sonner';

export default function OrderPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [status, setStatus] = useState('ALL');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders(page, 10, search.trim() || undefined, status);
      setOrders(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      toast.error('Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, status, page]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await updateOrderStatus(id, newStatus);
      toast.success(`Cập nhật trạng thái sang ${newStatus} thành công!`);
      loadOrders();
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái đơn hàng');
    }
  };

  const handleCancel = async (id: number) => {
    const defaultCancelNote = "Quản trị viên chuyển trạng thái Hủy đơn hàng";
    const inputReason = prompt(
      `Nhập ghi chú / lý do hủy đơn hàng ${id} (để trống sẽ tự động lưu mặc định):`,
      defaultCancelNote
    );
    if (inputReason === null) return;
    const finalReason = inputReason.trim() || defaultCancelNote;
    try {
      await cancelOrder(id, finalReason);
      toast.success(`Đã hủy đơn hàng ${id} thành công!`);
      loadOrders();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Lỗi khi hủy đơn hàng');
    }
  };

  const getStatusBadge = (statusStr: string) => {
    const baseClass = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm whitespace-nowrap";
    switch (statusStr) {
      case 'PENDING':
        return <span className={`${baseClass} bg-amber-500 text-white`}>Chờ xử lý</span>;
      case 'CONFIRMED':
        return <span className={`${baseClass} bg-indigo-600 text-white`}>Đã xác nhận</span>;
      case 'SHIPPED':
        return <span className={`${baseClass} bg-blue-600 text-white`}>Đang giao</span>;
      case 'COMPLETED':
        return <span className={`${baseClass} bg-green-600 text-white`}>Hoàn thành</span>;
      case 'CANCELLED':
        return <span className={`${baseClass} bg-red-600 text-white`}>Đã hủy</span>;
      default:
        return <span className={`${baseClass} bg-slate-500 text-white`}>{statusStr || '---'}</span>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const statusFilters = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Chờ xử lý', value: 'PENDING' },
    { label: 'Đã xác nhận', value: 'CONFIRMED' },
    { label: 'Đang giao', value: 'SHIPPED' },
    { label: 'Hoàn thành', value: 'COMPLETED' },
    { label: 'Đã hủy', value: 'CANCELLED' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Đơn hàng</h2>
      </div>

      {/* Bộ lọc trạng thái dạng Tab/Pills nhanh */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusFilters.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(0); }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
              status === tab.value 
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
            placeholder="Tìm theo Mã đơn, Tên người nhận, SĐT..." 
            className="max-w-md border-slate-300 text-slate-900 bg-slate-50 focus:bg-white text-sm" 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
            <SelectTrigger className="w-[180px] border-slate-300 text-xs font-semibold">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="PENDING">Chờ xử lý</SelectItem>
              <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
              <SelectItem value="SHIPPED">Đang giao hàng</SelectItem>
              <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 font-bold text-slate-900">Mã ĐH</TableHead>
                <TableHead className="font-bold text-slate-900">Khách hàng</TableHead>
                <TableHead className="font-bold text-slate-900">Địa chỉ giao hàng</TableHead>
                <TableHead className="font-bold text-slate-900">Tổng tiền</TableHead>
                <TableHead className="font-bold text-slate-900">Trạng thái</TableHead>
                <TableHead className="font-bold text-slate-900">Ngày tạo</TableHead>
                <TableHead className="font-bold text-slate-900">Cập nhật</TableHead>
                <TableHead className="text-center font-bold text-slate-900">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 font-bold text-slate-700">Đang tải...</TableCell>
                </TableRow>
              ) : orders.length > 0 ? (
                orders.map((order) => {
                  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';
                  return (
                    <TableRow key={order.id} className="hover:bg-slate-50">
                      <TableCell className="font-bold text-slate-900">{order.id}</TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-900">{order.receiverName || `Khách hàng ${order.userId}`}</div>
                        <div className="text-xs text-slate-500 font-medium">{order.receiverPhone || ''}</div>
                        {order.orderNote && (
                          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-1 max-w-[180px] truncate font-medium" title={order.orderNote}>
                            Ghi chú: {order.orderNote}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-slate-700 font-medium text-sm" title={order.shippingAddress}>
                        {order.shippingAddress || '---'}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(order.totalAmount || 0)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '---'}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                        {order.updatedAt ? new Date(order.updatedAt).toLocaleDateString('vi-VN') : '---'}
                      </TableCell>
                      <TableCell className="text-center space-x-2 whitespace-nowrap">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                          className="font-bold border-blue-200 hover:bg-blue-50 text-blue-700 bg-white"
                        >
                          <Link href={`/admin/orders/${order.id}`}>Xem chi tiết</Link>
                        </Button>

                        {order.status === 'PENDING' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                            className="font-bold border-indigo-200 hover:bg-indigo-50 text-indigo-700 bg-white"
                          >
                            Xác nhận
                          </Button>
                        )}

                        {order.status === 'CONFIRMED' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                            className="font-bold border-blue-200 hover:bg-blue-50 text-blue-700 bg-white"
                          >
                            Giao hàng
                          </Button>
                        )}

                        {order.status === 'SHIPPED' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                            className="font-bold border-green-200 hover:bg-green-50 text-green-700 bg-white"
                          >
                            Hoàn thành
                          </Button>
                        )}

                        {canCancel && (
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleCancel(order.id)}
                            className="font-bold bg-red-600 hover:bg-red-700 text-white"
                          >
                            Hủy đơn
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
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
    </div>
  );
}


