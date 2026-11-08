
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Loader2,
  ArrowLeft,
  Package,
} from 'lucide-react';

import { orderApi } from '@/features/order/orderApi';

interface OrderDetail {
  orderId: number;
  status: string;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  subtotalAmount: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  couponCode: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
}

function formatPrice(value: number) {
  return Number(value).toLocaleString('vi-VN') + '₫';
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = Number(params.orderId);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      setError('Mã đơn hàng không hợp lệ.');
      setLoading(false);
      return;
    }

    let active = true;

    async function loadOrder() {
      try {
        const result = await orderApi.getOrderDetail(orderId);

        if (active) {
          setOrder(result);
        }
      } catch (err) {
        console.error(err);

        if (active) {
          setError('Không thể tải thông tin đơn hàng.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadOrder();

    return () => {
      active = false;
    };
  }, [orderId]);

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
        <Link href="/" className="underline">
          Quay lại trang chủ
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 text-black">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft size={16} />
        Tiếp tục mua sắm
      </Link>

      <div className="border p-6 sm:p-10">
        <div className="mb-8 text-center">
          <CheckCircle
            size={54}
            className="mx-auto mb-4 text-green-600"
          />

          <h1 className="text-2xl font-bold">
            Đặt hàng thành công!
          </h1>

          <p className="mt-2 text-neutral-500">
            Cảm ơn bạn đã mua sắm tại SEEME.
          </p>
        </div>

        <div className="space-y-4 border-y py-6">
          <div className="flex justify-between">
            <span>Mã đơn hàng</span>
            <strong>#{order.orderId}</strong>
          </div>

          <div className="flex justify-between">
            <span>Trạng thái đơn hàng</span>
            <strong>{order.status}</strong>
          </div>

          <div className="flex justify-between">
            <span>Phương thức thanh toán</span>
            <strong>
              {order.paymentMethod === 'COD'
                ? 'Thanh toán khi nhận hàng'
                : order.paymentMethod === 'VIETQR'
                  ? 'Chuyển khoản VietQR'
                  : 'Chưa có thông tin'}
            </strong>
          </div>

          <div className="flex justify-between">
            <span>Trạng thái thanh toán</span>
            <strong>
              {order.paymentStatus || 'Chưa xác định'}
            </strong>
          </div>
        </div>

        <section className="my-8">
          <div className="mb-4 flex items-center gap-2">
            <Package size={20} />
            <h2 className="text-lg font-bold">
              Thông tin giao hàng
            </h2>
          </div>

          <div className="space-y-2 text-sm">
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

        <section className="border-t pt-6">
          <h2 className="mb-5 text-lg font-bold">
            Tổng kết đơn hàng
          </h2>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span>Tạm tính</span>
              <span>
                {formatPrice(order.subtotalAmount)}
              </span>
            </div>

            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-green-700">
                <span>
                  Giảm giá coupon
                  {order.couponCode
                    ? ` (${order.couponCode})`
                    : ''}
                </span>
                <span>
                  -{formatPrice(order.discountAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Phí vận chuyển</span>
              <span>
                {formatPrice(order.shippingFee)}
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-between border-t pt-5 text-lg font-bold">
            <span>Tổng cộng</span>
            <span>
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </section>

        {order.paymentMethod === 'COD' && (
          <div className="mt-8 bg-neutral-100 p-4 text-center text-sm">
            Đơn hàng đã được ghi nhận.
            Bạn sẽ thanh toán khi nhận hàng.
          </div>
        )}

        {order.paymentMethod === 'VIETQR' && (
          <Link
            href={`/payment/${order.orderId}`}
            className="mt-8 block bg-black px-6 py-4 text-center text-white"
          >
            Tiếp tục thanh toán VietQR
          </Link>
        )}

        <Link
          href="/"
          className="mt-4 block border border-black px-6 py-4 text-center"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    </main>
  );
}
