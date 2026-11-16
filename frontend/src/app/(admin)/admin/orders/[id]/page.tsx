'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@admin/components/ui/card';
import { Button } from '@admin/components/ui/button';
import { Badge } from '@admin/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@admin/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@admin/components/ui/dialog';
import { Textarea } from '@admin/components/ui/textarea';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  CreditCard, 
  User, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  Truck, 
  XCircle,
  Receipt,
  Clock,
  Tag,
  History,
  Home,
  Check,
  ArrowRight
} from 'lucide-react';
import { getOrderById, updateOrderStatus, cancelOrder } from '@admin/services';
import { OrderResponse } from '@admin/types';
import { toast } from 'sonner';
import AdminStatusBadge from '@/features/admin/components/common/AdminStatusBadge';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = Number(params.id);

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // State cho Modal Cập nhật trạng thái kèm Ghi chú của Admin
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [adminNote, setAdminNote] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch {
      toast.error('Lỗi khi tải thông tin chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) loadData();
  }, [orderId]);

  // Mở modal xác nhận cập nhật trạng thái
  const openStatusModal = (newStatus: string) => {
    if (newStatus === 'CANCELLED' && !canCancel) {
      toast.error('Không thể hủy đơn hàng khi đơn đang giao hoặc đã hoàn thành!');
      return;
    }
    setPendingStatus(newStatus);
    if (newStatus === 'CANCELLED') {
      setAdminNote('');
    } else if (newStatus === 'SHIPPED') {
      setAdminNote('Đã bàn giao cho đơn vị vận chuyển');
    } else if (newStatus === 'COMPLETED') {
      setAdminNote('Khách hàng đã nhận hàng và thanh toán đủ');
    } else {
      setAdminNote('');
    }
    setIsModalOpen(true);
  };

  // Thực thi cập nhật trạng thái kèm ghi chú
  const handleConfirmStatusChange = async () => {
    if (!order || !pendingStatus) return;

    try {
      setActionLoading(true);
      const defaultCancelNote = 'Quản trị viên chuyển trạng thái Hủy đơn hàng';
      const noteToSave = adminNote.trim() || (pendingStatus === 'CANCELLED' ? defaultCancelNote : undefined);

      if (pendingStatus === 'CANCELLED') {
        await cancelOrder(order.id, noteToSave);
        toast.success(`Hủy đơn hàng ${order.id} thành công!`);
      } else {
        await updateOrderStatus(order.id, pendingStatus, noteToSave);
        toast.success(`Cập nhật trạng thái sang "${getStatusLabel(pendingStatus)}" thành công!`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Lỗi khi cập nhật trạng thái đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusLabel = (statusStr?: string) => {
    if (!statusStr) return 'Khởi tạo';
    switch (statusStr) {
      case 'PENDING': return 'Chờ xử lý';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'SHIPPED': return 'Đang giao hàng';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return statusStr;
    }
  };


  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  // Đơn hàng có thể hủy khi chưa xuất kho / giao hàng (PENDING hoặc CONFIRMED)
  const canCancel = order && (order.status === 'PENDING' || order.status === 'CONFIRMED');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-bold text-slate-700">Đang tải thông tin chi tiết đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="font-bold text-red-600 text-lg">Không tìm thấy đơn hàng {orderId}!</div>
        <Button asChild variant="outline">
          <Link href="/admin/orders">Quay lại danh sách đơn hàng</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Thanh tiêu đề & Các nút điều hướng / thao tác */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="h-9 w-9 border-slate-300">
            <Link href="/admin/orders">
              <ArrowLeft className="w-4 h-4 text-slate-700" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Chi tiết đơn hàng #{order.id}</h1>
              <AdminStatusBadge status={order.status} type="order" />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Thời gian đặt hàng: <span className="font-medium text-slate-700">{formatDate(order.createdAt)}</span>
            </p>
          </div>
        </div>

        {/* Nút hành động nhanh */}
        <div className="flex items-center gap-2 flex-wrap">
          {canCancel && (
            <Button 
              variant="destructive" 
              onClick={() => openStatusModal('CANCELLED')}
              disabled={actionLoading}
              className="font-bold bg-red-600 hover:bg-red-700 text-white"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Hủy đơn hàng
            </Button>
          )}

          {order.status === 'PENDING' && (
            <Button 
              onClick={() => openStatusModal('CONFIRMED')}
              disabled={actionLoading}
              className="font-bold bg-[#0099FF] hover:bg-[#0084e0] text-white shadow-sm shadow-[#0099FF]/20"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Xác nhận đơn
            </Button>
          )}

          {order.status === 'CONFIRMED' && (
            <Button 
              onClick={() => openStatusModal('SHIPPED')}
              disabled={actionLoading}
              className="font-bold bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Truck className="w-4 h-4 mr-1.5" />
              Giao hàng
            </Button>
          )}

          {order.status === 'SHIPPED' && (
            <Button 
              onClick={() => openStatusModal('COMPLETED')}
              disabled={actionLoading}
              className="font-bold bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Hoàn thành
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
              <p className="text-xs text-slate-500 font-medium">Tổng thanh toán</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(order.totalAmount)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Phương thức thanh toán</p>
              <p className="text-sm font-bold text-slate-800">
                {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận' : (order.paymentMethod || 'Thanh toán khi nhận')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-[#0077cc] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Khách hàng</p>
              <p className="text-sm font-bold text-slate-800 truncate max-w-[140px]" title={order.receiverName}>
                {order.receiverName || `Khách hàng ${order.userId}`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Số lượng mặt hàng</p>
              <p className="text-lg font-bold text-slate-800">
                {order.items?.length || 0} sản phẩm
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bố cục 2 cột chính */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái rộng (2/3): Danh sách sản phẩm + Lịch sử trạng thái */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Danh sách sản phẩm */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50/50 py-3.5">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                Danh sách sản phẩm trong đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-bold text-slate-900">Sản phẩm</TableHead>
                    <TableHead className="font-bold text-slate-900 text-center">Phân loại</TableHead>
                    <TableHead className="font-bold text-slate-900 text-right">Đơn giá</TableHead>
                    <TableHead className="font-bold text-slate-900 text-center">Số lượng</TableHead>
                    <TableHead className="font-bold text-slate-900 text-right">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <TableRow key={item.id || index} className="hover:bg-slate-50/60">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.productImageUrl ? (
                              <img 
                                src={item.productImageUrl} 
                                alt={item.productName} 
                                className="w-12 h-12 object-cover rounded border border-slate-200"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{item.productName}</p>
                              {item.productVariantId && (
                                <p className="text-xs text-slate-500">Mã biến thể: {item.productVariantId}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex flex-col gap-1 items-center">
                            {item.variantSize && (
                              <Badge variant="outline" className="font-semibold text-xs border-slate-300">
                                Size: {item.variantSize}
                              </Badge>
                            )}
                            {item.variantColor && (
                              <Badge variant="secondary" className="font-semibold text-xs">
                                {item.variantColor}
                              </Badge>
                            )}
                            {!item.variantSize && !item.variantColor && (
                              <span className="text-xs text-slate-400">Mặc định</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-700">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-center font-bold text-slate-900">
                          x{item.quantity}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          {formatCurrency(item.subtotal || ((item.unitPrice || 0) * (item.quantity || 1)))}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-slate-500 font-medium">
                        Không có sản phẩm nào trong chi tiết đơn hàng
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Chi tiết tính toán chi phí */}
              <div className="p-4 border-t bg-slate-50/70 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tạm tính hàng hóa:</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(order.subtotalAmount || order.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Phí vận chuyển:</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(order.shippingFee || 0)}
                  </span>
                </div>
                {order.discountAmount ? (
                  <div className="flex justify-between text-sm text-emerald-600 font-medium">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Giảm giá voucher:
                    </span>
                    <span>-{formatCurrency(order.discountAmount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2 mt-2">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-blue-600 text-lg font-extrabold">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Lịch sử thay đổi trạng thái đơn hàng (order_status_history) */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50/50 py-3.5">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-[#0099FF]" />
                Lịch sử xử lý đơn hàng
              </CardTitle>
              <CardDescription>Theo dõi toàn bộ các lần thay đổi trạng thái và ghi chú của người phụ trách</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {order.statusHistory && order.statusHistory.length > 0 ? (
                <div className="relative border-l-2 border-sky-200 ml-3.5 pl-6 space-y-6">
                  {order.statusHistory.map((item, idx) => (
                    <div key={item.id || idx} className="relative group">
                      {/* Vòng tròn mốc thời gian */}
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-white border-2 border-[#0099FF] shadow-sm flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0099FF]"></div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {item.oldStatus && (
                              <>
                                <span className="font-semibold text-slate-600 text-xs">{getStatusLabel(item.oldStatus)}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                              </>
                            )}
                            <span className="font-bold text-[#0077cc]">{getStatusLabel(item.newStatus)}</span>
                          </div>
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(item.createdAt)}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-700">Người thực hiện: </span>
                          <span className="font-medium text-slate-900">{item.changedByName || (item.changedBy ? `Quản trị viên ${item.changedBy}` : 'Hệ thống')}</span>
                        </div>

                        {item.note && (
                          <div className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200 mt-1 font-medium">
                            📝 {item.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-4">Chưa có lịch sử thay đổi trạng thái nào.</p>
              )}
            </CardContent>
          </Card>

          {/* Card Thông tin hủy nếu đơn hàng bị hủy */}
          {order.status === 'CANCELLED' && (
            <Card className="border-red-200 bg-red-50/60 shadow-sm">
              <CardHeader className="py-3.5 border-b border-red-100">
                <CardTitle className="text-sm font-bold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Thông tin hủy đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="font-semibold text-slate-900">Thời gian hủy:</span>
                  <span className="font-medium text-red-700">{formatDate(order.cancelledAt || order.updatedAt || order.createdAt)}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-700">
                  <span className="font-semibold text-slate-900">Lý do hủy:</span>
                  <span className="font-medium text-red-800 bg-white px-2 py-1 rounded border border-red-200 inline-block">
                    {order.cancelReason || 'Hủy bởi Quản trị viên'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cột phải (1/3): Quản lý trạng thái, Khách hàng & Địa chỉ giao hàng */}
        <div className="space-y-6">
          {/* Card Quản lý trạng thái */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="py-3.5 border-b bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900">Quản lý trạng thái</CardTitle>
              <CardDescription>Cập nhật trạng thái và ghi chú nội bộ</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Chọn trạng thái để cập nhật:</label>
                <Select 
                  value={order.status} 
                  onValueChange={(val) => openStatusModal(val)}
                  disabled={actionLoading || order.status === 'COMPLETED' || order.status === 'CANCELLED'}
                >
                  <SelectTrigger className="w-full border-slate-300 font-medium">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING" disabled={order.status !== 'PENDING'}>Chờ xử lý</SelectItem>
                    <SelectItem value="CONFIRMED" disabled={order.status === 'SHIPPED' || order.status === 'COMPLETED' || order.status === 'CANCELLED'}>Đã xác nhận</SelectItem>
                    <SelectItem value="SHIPPED" disabled={order.status === 'COMPLETED' || order.status === 'CANCELLED'}>Đang giao hàng</SelectItem>
                    <SelectItem value="COMPLETED" disabled={order.status === 'CANCELLED'}>Hoàn thành</SelectItem>
                    <SelectItem value="CANCELLED" disabled={!canCancel}>
                      {canCancel ? 'Đã hủy' : 'Đã hủy (Không được phép hủy khi đang giao / hoàn thành)'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {canCancel ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Đơn hàng chưa giao
                  </div>
                  <p>Đơn hàng này chưa xuất kho / giao hàng, quản trị viên có thể hủy đơn nếu khách yêu cầu.</p>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => openStatusModal('CANCELLED')}
                    disabled={actionLoading}
                    className="w-full font-bold bg-red-600 hover:bg-red-700"
                  >
                    Hủy đơn hàng ngay
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
                  {order.status === 'SHIPPED' ? (
                    <div className="flex items-start gap-1.5 text-blue-700 font-semibold">
                      <Truck className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Đơn hàng đang giao. Theo quy định, không được phép hủy đơn hàng khi đang vận chuyển.</span>
                    </div>
                  ) : order.status === 'COMPLETED' ? (
                    <div className="flex items-start gap-1.5 text-green-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Đơn hàng đã hoàn thành. Đơn hàng thành công không được phép hủy.</span>
                    </div>
                  ) : order.status === 'CANCELLED' ? (
                    <div className="flex items-start gap-1.5 text-red-600 font-semibold">
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Đơn hàng này đã bị hủy.</span>
                    </div>
                  ) : (
                    <span>Đơn hàng đang ở trạng thái <strong>{getStatusLabel(order.status)}</strong>.</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Thông tin người nhận & Địa chỉ */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="py-3.5 border-b bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" />
                Thông tin nhận hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-900">
                    {order.receiverName || `Khách hàng ${order.userId}`}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs font-semibold text-slate-600">
                  Mã KH: {order.userId}
                </Badge>
              </div>

              {order.receiverPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">{order.receiverPhone}</span>
                </div>
              )}

              {/* Địa chỉ giao hàng thực tế của đơn hàng */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="text-xs text-slate-500 block font-medium">Địa chỉ giao hàng đơn này:</span>
                <p className="text-sm text-slate-800 leading-relaxed font-normal bg-slate-50 p-2.5 rounded border border-slate-200">
                  {order.shippingAddress || 'Chưa cập nhật địa chỉ'}
                </p>
              </div>

              {/* Địa chỉ mặc định của tài khoản (lấy từ user_id) */}
              {order.customerDefaultAddress && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold flex items-center gap-1 text-slate-700">
                      <Home className="w-3.5 h-3.5 text-blue-600" />
                      Địa chỉ mặc định của tài khoản:
                    </span>
                    {order.shippingAddress === order.customerDefaultAddress ? (
                      <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Trùng khớp
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-600 bg-blue-50/50 p-2 rounded border border-blue-100 leading-relaxed">
                    {order.customerDefaultAddress}
                  </p>
                </div>
              )}

              {/* Ghi chú đơn hàng từ khách hàng (order_note) */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="text-xs text-slate-500 block font-medium">Ghi chú từ khách hàng:</span>
                {order.orderNote ? (
                  <p className="text-xs text-amber-900 bg-amber-50/80 p-2.5 rounded border border-amber-200 leading-relaxed font-medium italic">
                    &ldquo;{order.orderNote}&rdquo;
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-2 rounded border border-slate-100">
                    Không có ghi chú từ khách hàng
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card Thông tin thanh toán & Lịch sử */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="py-3.5 border-b bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Chi tiết thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Phương thức:</span>
                <span className="font-bold text-slate-900">
                  {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : (order.paymentMethod || 'Thanh toán khi nhận hàng')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Trạng thái thanh toán:</span>
                <span className="font-semibold text-slate-800">
                  {order.paymentStatus === 'COMPLETED' ? 'Đã thanh toán' : (order.paymentStatus || 'Chưa thanh toán')}
                </span>
              </div>
              {order.transactionId && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Mã giao dịch:</span>
                  <span className="font-mono text-slate-800">{order.transactionId}</span>
                </div>
              )}
              {order.paidAt && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Thời gian thanh toán:</span>
                  <span className="font-medium text-slate-800">{formatDate(order.paidAt)}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Cập nhật lần cuối:</span>
                <span className="font-medium text-slate-800">{formatDate(order.updatedAt || order.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Nhập ghi chú Admin khi đổi trạng thái / Hủy đơn */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {pendingStatus === 'CANCELLED' ? 'Xác nhận hủy đơn hàng' : 'Cập nhật trạng thái đơn hàng'}
            </DialogTitle>
            <DialogDescription>
              {pendingStatus === 'CANCELLED' 
                ? `Bạn đang chuẩn bị hủy đơn hàng ${order.id}. Vui lòng nhập lý do hủy.`
                : `Chuyển trạng thái đơn hàng sang "${getStatusLabel(pendingStatus)}".`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-bold text-slate-700 block">
              {pendingStatus === 'CANCELLED' ? 'Lý do / Ghi chú hủy đơn hàng:' : 'Ghi chú của Quản trị viên (Tùy chọn):'}
            </label>
            <Textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={pendingStatus === 'CANCELLED' 
                ? 'Để trống sẽ tự động lưu: "Quản trị viên chuyển trạng thái Hủy đơn hàng"' 
                : 'Nhập ghi chú xử lý (ví dụ: Đã gửi mã vận đơn,...)'}
              className="border-slate-300 min-h-[90px] text-sm"
            />
            {pendingStatus === 'CANCELLED' && (
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded border border-slate-200">
                <span className="text-slate-600">
                  Mặc định: <strong className="text-slate-800">Quản trị viên chuyển trạng thái Hủy đơn hàng</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setAdminNote('Quản trị viên chuyển trạng thái Hủy đơn hàng')}
                  className="text-blue-600 hover:underline font-bold text-xs"
                >
                  Dùng mặc định
                </button>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={actionLoading}>
              Đóng
            </Button>
            <Button 
              variant={pendingStatus === 'CANCELLED' ? 'destructive' : 'default'}
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
