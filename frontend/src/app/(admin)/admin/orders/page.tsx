'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@admin/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin/components/ui/table';
import { Button } from '@admin/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@admin/components/ui/select';
import { getOrders, updateOrderStatus, cancelOrder } from '@admin/services';
import { OrderResponse } from '@admin/types';
import { toast } from 'sonner';
import AdminSearchBar from '@/features/admin/components/common/AdminSearchBar';
import AdminStatusBadge from '@/features/admin/components/common/AdminStatusBadge';
import AdminPageHeader from '@/features/admin/components/common/AdminPageHeader';
import { AdminViewButton, AdminDeleteButton } from '@/features/admin/components/common/AdminTableActions';

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
    loadOrders();
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
    const defaultCancelNote = 'Quản trị viên chuyển trạng thái Hủy đơn hàng';
    const inputReason = prompt(
      `Nhập ghi chú / lý do hủy đơn hàng #${id} (để trống sẽ tự động lưu mặc định):`,
      defaultCancelNote
    );
    if (inputReason === null) return;
    const finalReason = inputReason.trim() || defaultCancelNote;
    try {
      await cancelOrder(id, finalReason);
      toast.success(`Đã hủy đơn hàng #${id} thành công!`);
      loadOrders();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Lỗi khi hủy đơn hàng');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quản lý Đơn hàng"
        description="Theo dõi toàn bộ đơn mua, thông tin người nhận, trạng thái vận chuyển và xử lý nghiệp vụ"
        badge={totalElements}
      />

      <Card className="border border-slate-200/80 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 py-4 border-b border-slate-100">
          <AdminSearchBar
            placeholder="Tìm theo Mã đơn, Tên người nhận, SĐT..."
            defaultValue={search}
            onSearch={(val) => {
              setSearch(val);
              setPage(0);
            }}
            className="w-full sm:max-w-md"
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-full sm:w-[190px] border-slate-200 text-xs font-bold rounded-xl">
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
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-20 text-xs font-bold text-slate-700 py-3.5">Mã ĐH</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Khách hàng / SĐT</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Địa chỉ giao hàng</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Tổng tiền</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Trạng thái</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Ngày tạo</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Cập nhật</TableHead>
                <TableHead className="text-center text-xs font-bold text-slate-700">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 font-bold text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-3 border-[#0099FF] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Đang tải danh sách đơn hàng...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : orders.length > 0 ? (
                orders.map((order) => {
                  const canCancel = order.status !== 'CANCELLED' && order.status !== 'COMPLETED';

                  return (
                    <TableRow key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <TableCell className="font-bold text-[#0099FF] text-xs">
                        <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                          #{order.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs">
                          {order.receiverName || 'Khách vãng lai'}
                        </div>
                        {order.receiverPhone && (
                          <div className="text-[11px] text-slate-400 font-medium">
                            {order.receiverPhone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell
                        className="max-w-[200px] truncate text-slate-600 font-medium text-xs"
                        title={order.shippingAddress}
                      >
                        {order.shippingAddress || '---'}
                      </TableCell>
                      <TableCell className="font-black text-slate-900 text-xs whitespace-nowrap">
                        {formatCurrency(order.totalAmount || 0)}
                      </TableCell>
                      <TableCell>
                        <AdminStatusBadge status={order.status || ''} type="order" />
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs whitespace-nowrap">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('vi-VN')
                          : '---'}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs whitespace-nowrap">
                        {order.updatedAt
                          ? new Date(order.updatedAt).toLocaleDateString('vi-VN')
                          : '---'}
                      </TableCell>
                      <TableCell className="text-center space-x-1.5 whitespace-nowrap py-3">
                        <AdminViewButton href={`/admin/orders/${order.id}`} />

                        {order.status === 'PENDING' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                            className="h-8 px-2.5 rounded-lg text-xs font-semibold border-sky-200 text-[#0077cc] bg-sky-50 hover:bg-sky-100 hover:text-[#005fa3] shadow-xs"
                          >
                            Xác nhận
                          </Button>
                        )}

                        {order.status === 'CONFIRMED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                            className="h-8 px-2.5 rounded-lg text-xs font-semibold border-sky-200 text-sky-700 bg-sky-50/70 hover:bg-sky-100 hover:text-sky-800 shadow-xs"
                          >
                            Giao hàng
                          </Button>
                        )}

                        {order.status === 'SHIPPED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                            className="h-8 px-2.5 rounded-lg text-xs font-semibold border-emerald-200 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 hover:text-emerald-800 shadow-xs"
                          >
                            Hoàn thành
                          </Button>
                        )}

                        {canCancel && (
                          <AdminDeleteButton label="Hủy đơn" onClick={() => handleCancel(order.id)} />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 font-bold text-slate-500">
                    Không tìm thấy dữ liệu đơn hàng
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <div className="text-xs text-slate-500 font-medium">
                Hiển thị tổng số <span className="font-bold text-slate-800">{totalElements}</span> đơn hàng
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="h-8 px-2.5 rounded-lg"
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
                  className="h-8 px-2.5 rounded-lg"
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
