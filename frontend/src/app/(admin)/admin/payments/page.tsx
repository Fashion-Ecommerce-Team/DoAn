'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@admin/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin/components/ui/table';
import { Button } from '@admin/components/ui/button';
import { Input } from '@admin/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@admin/components/ui/select';
import { getPayments, updatePaymentStatus } from '@admin/services';
import { PaymentResponse } from '@admin/types';
import { PaymentStatusBadge } from '@/features/admin';
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  formatCurrency,
  getApiErrorMessage,
} from '@/features/admin/utils/adminPayment.util';
import { toast } from 'sonner';

export default function PaymentPage() {
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [status, setStatus] = useState('ALL');
  const [method, setMethod] = useState('ALL');

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await getPayments(page, 10, search.trim() || undefined, status, method);
      setPayments(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Lỗi khi tải danh sách thanh toán'));
    } finally {
      setLoading(false);
    }
  };

  // Tải dữ liệu ngay khi chuyển trang, đổi trạng thái hoặc phương thức
  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, method, page]);

  // Chỉ debounce khi người dùng gõ tìm kiếm để không spam API
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPayments();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleUpdateStatus = async (id: number, newStatus: string, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return;
    try {
      await updatePaymentStatus(id, newStatus);
      toast.success(`Cập nhật trạng thái sang "${getPaymentStatusLabel(newStatus)}" thành công!`);
      loadPayments();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Lỗi khi cập nhật trạng thái thanh toán'));
    }
  };

  const statusFilters = [
    { label: 'Tất cả', value: 'ALL' },
    ...Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ label, value })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Thanh toán</h2>
      </div>

      {/* Bộ lọc trạng thái dạng Tab/Pills nhanh */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusFilters.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(0); }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${status === tab.value
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
            placeholder="Tìm theo Mã đơn hàng, Mã giao dịch..."
            className="max-w-md border-slate-300 text-slate-900 bg-slate-50 focus:bg-white text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
          <Select value={method} onValueChange={(v) => { setMethod(v); setPage(0); }}>
            <SelectTrigger className="w-[260px] border-slate-300 text-xs font-semibold">
              <SelectValue placeholder="Lọc theo phương thức" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả phương thức</SelectItem>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 font-bold text-slate-900">Mã TT</TableHead>
                <TableHead className="font-bold text-slate-900">Đơn hàng</TableHead>
                <TableHead className="font-bold text-slate-900">Phương thức</TableHead>
                <TableHead className="font-bold text-slate-900">Số tiền</TableHead>
                <TableHead className="font-bold text-slate-900">Mã giao dịch</TableHead>
                <TableHead className="font-bold text-slate-900">Trạng thái</TableHead>
                <TableHead className="font-bold text-slate-900">Ngày tạo</TableHead>
                <TableHead className="font-bold text-slate-900">Cập nhật</TableHead>
                <TableHead className="text-center font-bold text-slate-900">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 font-bold text-slate-700">Đang tải...</TableCell>
                </TableRow>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50">
                    <TableCell className="font-bold text-slate-900">{p.id}</TableCell>
                    <TableCell>
                      <Link href={`/admin/orders/${p.orderId}`} className="font-bold text-blue-700 hover:underline">
                        Đơn {p.orderId}
                      </Link>
                      {p.receiverName && (
                        <div className="text-xs text-slate-500 font-medium">{p.receiverName}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-800">{getPaymentMethodLabel(p.paymentMethod)}</TableCell>
                    <TableCell className="font-bold text-slate-900 whitespace-nowrap">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">{p.transactionId || '---'}</TableCell>
                    <TableCell><PaymentStatusBadge status={p.paymentStatus} /></TableCell>
                    <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : '---'}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                      {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('vi-VN') : '---'}
                    </TableCell>
                    <TableCell className="text-center space-x-2 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="font-bold border-blue-200 hover:bg-blue-50 text-blue-700 bg-white"
                      >
                        <Link href={`/admin/payments/${p.id}`}>Xem chi tiết</Link>
                      </Button>

                      {p.paymentStatus === 'PENDING' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(p.id, 'PAID')}
                            className="font-bold border-green-200 hover:bg-green-50 text-green-700 bg-white"
                          >
                            Xác nhận đã thanh toán
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleUpdateStatus(p.id, 'FAILED', `Đánh dấu thanh toán #${p.id} là thất bại?`)}
                            className="font-bold bg-red-600 hover:bg-red-700 text-white"
                          >
                            Thất bại
                          </Button>
                        </>
                      )}

                      {p.paymentStatus === 'PAID' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(p.id, 'REFUNDED', `Xác nhận hoàn tiền cho thanh toán #${p.id}?`)}
                          className="font-bold border-indigo-200 hover:bg-indigo-50 text-indigo-700 bg-white"
                        >
                          Hoàn tiền
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 font-bold text-slate-700">
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
