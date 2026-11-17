'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Loader2,
  ArrowLeft,
  Package,
  Clock,
  Ban,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  orderApi,
  OrderDetail,
  OrderItem,
  OrderStatusHistoryItem,
} from '@/features/order/orderApi';

function formatPrice(value: number) {
  return Number(value || 0).toLocaleString('vi-VN') + '₫';
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = Number(params.orderId);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<OrderStatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadOrderData = useCallback(async () => {
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      setError('Mã đơn hàng không hợp lệ.');
      setLoading(false);
      return;
    }

    try {
      const [detail, orderItems, statusHistory] = await Promise.all([
        orderApi.getOrderDetail(orderId),
        orderApi.getOrderItems(orderId).catch(() => []),
        orderApi.getOrderStatusHistory(orderId).catch(() => []),
      ]);
      setOrder(detail);
      setItems(orderItems);
      setHistory(statusHistory);
    } catch {
      setError('Không thể tải thông tin đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadOrderData();
  }, [loadOrderData]);

  const handleCancelOrder = async () => {
    if (!order) return;
    const reason = cancelReason.trim() || 'Khách hàng yêu cầu hủy đơn hàng';
    setCancelling(true);
    try {
      await orderApi.cancelOrder(order.orderId, reason);
      toast.success(`Đã hủy đơn hàng #${order.orderId} thành công`);
      await loadOrderData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Không thể hủy đơn hàng này';
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center gap-3">
        <Loader2 className="animate-spin" />
        Đang tải thông tin đơn hàng...
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="mb-6 text-red-600">
          {error || 'Không tìm thấy đơn hàng.'}
        </p>
        <Link href="/profile?tab=orders" className="underline">
          Quay lại lịch sử mua hàng
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 text-black">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/profile?tab=orders"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-black"
        >
          <ArrowLeft size={15} />
          Quay lại lịch sử mua hàng
        </Link>

        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-black"
        >
          <ShoppingBag size={15} />
          Tiếp tục mua sắm
        </Link>
      </div>

      <div className="border border-neutral-200 bg-white p-6 sm:p-10 shadow-xs">
        <div className="mb-8 text-center">
          <CheckCircle size={48} className="mx-auto mb-3 text-emerald-600" />
          <h1 className="text-2xl font-black uppercase tracking-tight">
            Chi Tiết Đơn Hàng #{order.orderId}
          </h1>
          <p className="mt-1.5 text-xs text-neutral-500">
            Cảm ơn bạn đã mua sắm tại SEEME®.
          </p>
        </div>

        <div className="space-y-3 border-y border-neutral-200 py-5 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Mã đơn hàng</span>
            <strong>#{order.orderId}</strong>
          </div>

          <div className="flex justify-between">
            <span className="text-neutral-500">Trạng thái đơn hàng</span>
            <strong>{order.status}</strong>
          </div>

          <div className="flex justify-between">
            <span className="text-neutral-500">Phương thức thanh toán</span>
            <strong>
              {order.paymentMethod === 'COD'
                ? 'Thanh toán khi nhận hàng (COD)'
                : order.paymentMethod === 'VIETQR'
                ? 'Chuyển khoản VietQR'
                : order.paymentMethod || 'Chưa có thông tin'}
            </strong>
          </div>

          <div className="flex justify-between">
            <span className="text-neutral-500">Trạng thái thanh toán</span>
            <strong>{order.paymentStatus || 'PENDING'}</strong>
          </div>

          {order.cancelReason && (
            <div className="flex justify-between text-red-600">
              <span>Lý do hủy</span>
              <strong>{order.cancelReason}</strong>
            </div>
          )}
        </div>

        {/* Danh sách sản phẩm trong đơn */}
        {items.length > 0 && (
          <section className="my-8">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider">
              Sản phẩm đã đặt ({items.length})
            </h2>
            <div className="divide-y divide-neutral-200 border border-neutral-200">
              {items.map((item) => (
                <div
                  key={item.orderDetailId}
                  className="flex items-center gap-4 p-4 text-sm"
                >
                  {item.productImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.productImageUrl}
                      alt={item.productName}
                      className="h-16 w-16 object-cover border border-neutral-200 shrink-0"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center bg-neutral-100 text-neutral-400 shrink-0">
                      <Package size={20} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-neutral-900 truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Phân loại: {item.color || 'Tiêu chuẩn'} / Size{' '}
                      {item.size || 'Free'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatPrice(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right font-bold text-neutral-900">
                    {formatPrice(item.lineTotal)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="my-8">
          <div className="mb-3 flex items-center gap-2">
            <Package size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Thông tin giao hàng
            </h2>
          </div>

          <div className="space-y-1.5 text-sm bg-neutral-50 p-4 border border-neutral-200">
            <p>
              <strong>Người nhận: </strong>
              {order.receiverName}
            </p>
            <p>
              <strong>Số điện thoại: </strong>
              {order.receiverPhone}
            </p>
            <p>
              <strong>Địa chỉ: </strong>
              {order.shippingAddress}
            </p>
          </div>
        </section>

        {/* Lịch sử trạng thái */}
        {history.length > 0 && (
          <section className="my-8">
            <div className="mb-3 flex items-center gap-2">
              <Clock size={18} />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Lịch sử trạng thái đơn hàng
              </h2>
            </div>
            <div className="space-y-2.5 border-l-2 border-neutral-300 pl-4 text-xs">
              {history.map((h) => (
                <div
                  key={h.historyId}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-neutral-900">
                      {h.newStatus}
                    </span>
                    {h.note && (
                      <span className="text-neutral-600"> — {h.note}</span>
                    )}
                  </div>
                  <span className="font-mono text-neutral-400">
                    {h.createdAt
                      ? new Date(h.createdAt).toLocaleString('vi-VN')
                      : ''}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="border-t border-neutral-200 pt-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider">
            Tổng kết đơn hàng
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Tạm tính</span>
              <span>{formatPrice(order.subtotalAmount)}</span>
            </div>

            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>
                  Giảm giá coupon
                  {order.couponCode ? ` (${order.couponCode})` : ''}
                </span>
                <span>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-neutral-500">Phí vận chuyển</span>
              <span>{formatPrice(order.shippingFee)}</span>
            </div>
          </div>

          <div className="mt-5 flex justify-between border-t border-neutral-200 pt-4 text-lg font-black">
            <span>Tổng cộng</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </section>

        {/* Hủy đơn hàng khi đang PENDING */}
        {order.status?.toUpperCase() === 'PENDING' && (
          <div className="mt-6 border border-red-200 bg-red-50/60 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
              <Ban size={14} /> Hủy đơn hàng đang chờ xác nhận
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn hàng..."
                className="flex-1 px-3 py-2 bg-white border border-red-200 text-xs focus:border-red-500 focus:outline-none"
              />
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="px-5 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
              </button>
            </div>
          </div>
        )}

        {order.paymentMethod === 'VIETQR' &&
          order.status?.toUpperCase() === 'PENDING' && (
            <Link
              href={`/payment/${order.orderId}`}
              className="mt-6 block bg-black px-6 py-3.5 text-center text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 transition-colors"
            >
              Tiếp tục thanh toán VietQR
            </Link>
          )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/profile?tab=orders"
            className="block border border-neutral-300 px-6 py-3.5 text-center text-xs font-bold uppercase tracking-widest text-neutral-800 hover:border-black transition-colors"
          >
            Xem Lịch Sử Mua Hàng
          </Link>
          <Link
            href="/products"
            className="block border border-black bg-black px-6 py-3.5 text-center text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 transition-colors"
          >
            Tiếp Tục Mua Sắm
          </Link>
        </div>
      </div>
    </main>
  );
}
