'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@admin/components/ui/card';
import { Button } from '@admin/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@admin/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@admin/components/ui/dialog';
import {
  ArrowLeft,
  CreditCard,
  Receipt,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  Undo2,
  QrCode,
  FileText,
  User,
  Phone,
  Wallet,
} from 'lucide-react';
import { getPaymentById, updatePaymentStatus } from '@admin/services';
import { PaymentResponse } from '@admin/types';
import { PaymentStatusBadge } from '@/features/admin';
import {
  PAYMENT_STATUS_LABELS,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  formatCurrency,
  formatDateTime,
  getApiErrorMessage,
} from '@/features/admin/utils/adminPayment.util';
import { toast } from 'sonner';

export default function PaymentDetailPage() {
  const params = useParams();
  const paymentId = Number(params.id);

  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal xác nhận đổi trạng thái
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getPaymentById(paymentId);
      setPayment(data);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Lỗi khi tải thông tin chi tiết thanh toán'));
      setPayment(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paymentId) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  const openStatusModal = (newStatus: string) => {
    if (!payment || newStatus === payment.paymentStatus) return;
    setPendingStatus(newStatus);
    setIsModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!payment || !pendingStatus) return;
    try {
      setActionLoading(true);
      await updatePaymentStatus(payment.id, pendingStatus);
      toast.success(`Cập nhật trạng thái sang "${getPaymentStatusLabel(pendingStatus)}" thành công!`);
      setIsModalOpen(false);
      loadData();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Lỗi khi cập nhật trạng thái thanh toán'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-bold text-slate-700">Đang tải thông tin chi tiết thanh toán...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="font-bold text-red-600 text-lg">Không tìm thấy thanh toán {paymentId}!</div>
        <Button asChild variant="outline">
          <Link href="/admin/payments">Quay lại danh sách thanh toán</Link>
        </Button>
      </div>
    );
  }

  const isPending = payment.paymentStatus === 'PENDING';
  const isPaid = payment.paymentStatus === 'PAID';
  const isRefunded = payment.paymentStatus === 'REFUNDED';

  return (
    <div className="space-y-6 pb-12">
      {/* Thanh tiêu đề & nút thao tác */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="h-9 w-9 border-slate-300">
            <Link href="/admin/payments">
              <ArrowLeft className="w-4 h-4 text-slate-700" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Chi tiết thanh toán {payment.id}</h1>
              <PaymentStatusBadge status={payment.paymentStatus} large />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Thời gian tạo: <span className="font-medium text-slate-700">{formatDateTime(payment.createdAt)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isPending && (
            <>
              <Button
                onClick={() => openStatusModal('PAID')}
                disabled={actionLoading}
                className="font-bold bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Xác nhận đã thanh toán
              </Button>
              <Button
                variant="destructive"
                onClick={() => openStatusModal('FAILED')}
                disabled={actionLoading}
                className="font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Đánh dấu thất bại
              </Button>
            </>
          )}
          {isPaid && (
            <Button
              onClick={() => openStatusModal('REFUNDED')}
              disabled={actionLoading}
              className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Undo2 className="w-4 h-4 mr-1.5" />
              Hoàn tiền
            </Button>
          )}
        </div>
      </div>

      {/* Thẻ thống kê tóm tắt 4 ô */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Số tiền thanh toán</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(payment.amount)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Phương thức</p>
              <p className="text-sm font-bold text-slate-800">{getPaymentMethodLabel(payment.paymentMethod)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Đơn hàng</p>
              <Link href={`/admin/orders/${payment.orderId}`} className="text-lg font-bold text-slate-800 hover:text-blue-600 hover:underline">
                {payment.orderId}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Thanh toán lúc</p>
              <p className="text-sm font-bold text-slate-800">{formatDateTime(payment.paidAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bố cục 2 cột chính */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái (2/3): Thông tin giao dịch, QR, phản hồi cổng thanh toán */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50/50 py-3.5">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Thông tin giao dịch
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Mã thanh toán:</span>
                <span className="font-bold text-slate-900">{payment.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Trạng thái:</span>
                <PaymentStatusBadge status={payment.paymentStatus} />
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Phương thức:</span>
                <span className="font-bold text-slate-900">{getPaymentMethodLabel(payment.paymentMethod)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Mã giao dịch:</span>
                <span className="font-mono text-slate-800 break-all text-right">{payment.transactionId || '---'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Hết hạn lúc:</span>
                <span className="font-medium text-slate-800">{formatDateTime(payment.expiredAt)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Thanh toán lúc:</span>
                <span className="font-medium text-slate-800">{formatDateTime(payment.paidAt)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Cập nhật lần cuối:</span>
                <span className="font-medium text-slate-800">{formatDateTime(payment.updatedAt || payment.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {payment.qrCodeUrl && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b bg-slate-50/50 py-3.5">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-blue-600" />
                  Mã QR thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={payment.qrCodeUrl} alt="QR thanh toán" className="mx-auto max-h-64 object-contain" />
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50/50 py-3.5">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Phản hồi từ cổng thanh toán
              </CardTitle>
              <CardDescription>Dữ liệu thô do cổng thanh toán trả về (nếu có)</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {payment.paymentResponse ? (
                <pre className="text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded p-3 whitespace-pre-wrap break-all max-h-64 overflow-auto">
                  {payment.paymentResponse}
                </pre>
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-4">Chưa có dữ liệu phản hồi.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cột phải (1/3): Quản lý trạng thái & Đơn hàng liên quan */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="py-3.5 border-b bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900">Quản lý trạng thái</CardTitle>
              <CardDescription>Cập nhật trạng thái thanh toán</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Chọn trạng thái để cập nhật:</label>
                <Select
                  value={payment.paymentStatus}
                  onValueChange={(val) => openStatusModal(val)}
                  disabled={actionLoading || isRefunded}
                >
                  <SelectTrigger className="w-full border-slate-300 font-medium">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem
                        key={value}
                        value={value}
                        disabled={value === 'REFUNDED' && !isPaid && value !== payment.paymentStatus}
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700">
                {isRefunded
                  ? 'Giao dịch đã hoàn tiền, không thể thay đổi trạng thái.'
                  : 'Chỉ có thể chuyển sang "Đã hoàn tiền" khi giao dịch đang ở trạng thái "Đã thanh toán".'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="py-3.5 border-b bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                Đơn hàng liên quan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-900">{payment.receiverName || '---'}</span>
              </div>
              {payment.receiverPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-700">{payment.receiverPhone}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tổng tiền đơn hàng:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(payment.orderTotalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trạng thái đơn:</span>
                  <span className="font-semibold text-slate-800">{payment.orderStatus || '---'}</span>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full font-bold border-blue-200 text-blue-700 hover:bg-blue-50">
                <Link href={`/admin/orders/${payment.orderId}`}>Xem chi tiết đơn hàng</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal xác nhận đổi trạng thái */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Cập nhật trạng thái thanh toán</DialogTitle>
            <DialogDescription>
              Chuyển trạng thái thanh toán {payment.id} từ &quot;{getPaymentStatusLabel(payment.paymentStatus)}&quot; sang
              &quot;{getPaymentStatusLabel(pendingStatus)}&quot;.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={actionLoading}>
              Đóng
            </Button>
            <Button
              variant={pendingStatus === 'FAILED' ? 'destructive' : 'default'}
              onClick={handleConfirmStatusChange}
              disabled={actionLoading}
              className="font-bold"
            >
              {actionLoading ? 'Đang lưu...' : 'Xác nhận lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
