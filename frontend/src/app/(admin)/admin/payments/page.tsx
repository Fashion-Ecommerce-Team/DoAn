'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@admin/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin/components/ui/table';
import { Button } from '@admin/components/ui/button';
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
import AdminSearchBar from '@/features/admin/components/common/AdminSearchBar';
import AdminPageHeader from '@/features/admin/components/common/AdminPageHeader';
import { AdminViewButton, AdminDeleteButton } from '@/features/admin/components/common/AdminTableActions';

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

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, method, page, search]);

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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Giao dịch Thanh toán"
        description="Theo dõi chi tiết các giao dịch thanh toán qua cổng và COD"
        badge={totalElements}
      />

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 py-4">
          <AdminSearchBar
            placeholder="Tìm theo Mã đơn hàng, Mã giao dịch..."
            defaultValue={search}
            onSearch={(val) => {
              setSearch(val);
              setPage(0);
            }}
            className="w-full sm:max-w-md"
          />
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-[180px] border-slate-200 rounded-xl text-xs font-semibold h-9">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={method} onValueChange={(v) => { setMethod(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-[220px] border-slate-200 rounded-xl text-xs font-semibold h-9">
              <SelectValue placeholder="Lọc theo phương thức" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả phương thức</SelectItem>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(status !== 'ALL' || method !== 'ALL' || search) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatus('ALL');
                setMethod('ALL');
                setPage(0);
              }}
              className="h-9 px-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 border-slate-200"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Đặt lại
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="w-20 font-semibold text-slate-700 text-xs py-3.5">Mã TT</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Đơn hàng</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Phương thức</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Số tiền</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Mã giao dịch</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Trạng thái</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Ngày tạo</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs py-3.5">Cập nhật</TableHead>
                <TableHead className="text-center font-semibold text-slate-700 text-xs py-3.5">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 font-semibold text-slate-600">Đang tải...</TableCell>
                </TableRow>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/80">
                    <TableCell className="font-mono text-xs font-bold text-slate-700">#{p.id}</TableCell>
                    <TableCell>
                      <Link href={`/admin/orders/${p.orderId}`} className="font-semibold text-xs text-[#0099FF] hover:text-[#0077cc] hover:underline">
                        Đơn #{p.orderId}
                      </Link>
                      {p.receiverName && (
                        <div className="text-[11px] text-slate-500 font-medium">{p.receiverName}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-800">{getPaymentMethodLabel(p.paymentMethod)}</TableCell>
                    <TableCell className="font-bold text-xs text-slate-900 whitespace-nowrap">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="font-mono text-[11px] text-slate-600">{p.transactionId || '---'}</TableCell>
                    <TableCell><PaymentStatusBadge status={p.paymentStatus} /></TableCell>
                    <TableCell className="text-slate-500 text-xs whitespace-nowrap">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : '---'}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs whitespace-nowrap">
                      {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('vi-VN') : '---'}
                    </TableCell>
                    <TableCell className="text-center space-x-1.5 whitespace-nowrap py-3">
                      <AdminViewButton href={`/admin/payments/${p.id}`} />

                      {p.paymentStatus === 'PENDING' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(p.id, 'PAID')}
                            className="h-8 px-2.5 rounded-lg text-xs font-semibold border-emerald-200 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 hover:text-emerald-800 shadow-xs"
                          >
                            Xác nhận TT
                          </Button>
                          <AdminDeleteButton
                            label="Thất bại"
                            onClick={() => handleUpdateStatus(p.id, 'FAILED', `Đánh dấu thanh toán #${p.id} là thất bại?`)}
                          />
                        </>
                      )}

                      {p.paymentStatus === 'PAID' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(p.id, 'REFUNDED', `Xác nhận hoàn tiền cho thanh toán #${p.id}?`)}
                          className="h-8 px-2.5 rounded-lg text-xs font-semibold border-amber-200 text-amber-700 bg-amber-50/70 hover:bg-amber-100 hover:text-amber-800 shadow-xs"
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
