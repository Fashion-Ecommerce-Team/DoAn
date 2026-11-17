
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

import {
  paymentApi,
  type PaymentResponse,
  type PaymentStatus,
} from '@/features/payment/paymentApi';

export default function VietQrPaymentPage() {
  const params = useParams();
  const router = useRouter();

  const orderId = Number(params.orderId);

  const [payment, setPayment] =
    useState<PaymentResponse | null>(null);

  const [status, setStatus] =
    useState<PaymentStatus>('PENDING');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [remainingSeconds, setRemainingSeconds] =
    useState<number | null>(null);

  useEffect(() => {
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      setError('Mã đơn hàng không hợp lệ');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const initialize = async () => {
      try {
        const existing = await paymentApi.getByOrder(orderId);

        if (cancelled) return;

        if (existing.payment_method !== 'VIETQR') {
          router.replace(`/orders/${orderId}`);
          return;
        }

        setStatus(existing.payment_status);

        if (existing.payment_status !== 'PENDING') {
          setPayment(existing);
          return;
        }

        const qrPayment = await paymentApi.createQr(
          existing.id
        );

        if (cancelled) return;

        setPayment(qrPayment);
        setStatus(qrPayment.payment_status);
      } catch (err) {
        if (cancelled) return;

        setError(
          axios.isAxiosError(err)
            ? err.response?.data?.message ||
                'Không thể tải thông tin thanh toán'
            : 'Đã xảy ra lỗi khi tải thanh toán'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  useEffect(() => {
    if (!payment || status !== 'PENDING') return;

    let busy = false;

    const interval = window.setInterval(async () => {
      if (busy) return;
      busy = true;

      try {
        const result = await paymentApi.getStatus(
          payment.id
        );

        setStatus(result.payment_status);
      } catch (err) {
        console.error('Lỗi kiểm tra thanh toán:', err);
      } finally {
        busy = false;
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [payment, status]);

  useEffect(() => {
    if (!payment?.expired_at || status !== 'PENDING') {
      return;
    }

    const updateRemaining = () => {
      const expires = new Date(
        payment.expired_at as string
      ).getTime();

      if (!Number.isFinite(expires)) {
        setRemainingSeconds(null);
        return;
      }

      setRemainingSeconds(
        Math.max(
          0,
          Math.floor((expires - Date.now()) / 1000)
        )
      );
    };

    updateRemaining();

    const interval = window.setInterval(
      updateRemaining,
      1000
    );

    return () => window.clearInterval(interval);
  }, [payment, status]);

  if (loading) {
    return (
      <main className="mx-auto max-w-xl p-8 text-center">
        Đang tải thông tin thanh toán...
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-xl p-8">
        <h1 className="mb-4 text-xl font-semibold">
          Không thể tải thanh toán
        </h1>
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!payment) return null;

  const expired =
    remainingSeconds !== null &&
    remainingSeconds <= 0;

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-center text-2xl font-bold">
          Thanh toán VietQR
        </h1>

        <p className="mb-6 text-center text-gray-500">
          Đơn hàng #{orderId}
        </p>

        {status === 'PAID' ? (
          <div className="text-center">
            <h2 className="text-xl font-semibold text-green-600">
              Thanh toán thành công!
            </h2>
            <p className="mt-2 text-gray-600">
              Hệ thống đã xác nhận thanh toán.
            </p>
          </div>
        ) : status === 'FAILED' ||
          status === 'CANCELLED' ? (
          <p className="text-center text-red-600">
            Giao dịch không còn khả dụng:
            {' '}{status}
          </p>
        ) : (
          <>
            {payment.qr_code_url && !expired ? (
              <div className="flex justify-center">
                <img
                  src={payment.qr_code_url}
                  alt="Mã QR thanh toán VietQR"
                  className="h-72 w-72 object-contain"
                />
              </div>
            ) : (
              <p className="text-center text-amber-600">
                Mã QR đã hết hạn hoặc chưa khả dụng.
              </p>
            )}

            <div className="mt-6 space-y-3">
              <div className="flex justify-between">
                <span>Số tiền</span>
                <strong>
                  {Number(payment.amount).toLocaleString(
                    'vi-VN'
                  )} ₫
                </strong>
              </div>

              <div className="flex justify-between">
                <span>Nội dung chuyển khoản</span>
                <strong>PAY{payment.id}</strong>
              </div>

              <div className="flex justify-between">
                <span>Trạng thái</span>
                <strong className="text-amber-600">
                  Đang chờ thanh toán
                </strong>
              </div>

              {remainingSeconds !== null && (
                <p className="text-center text-sm text-gray-500">
                  {expired
                    ? 'Mã QR đã hết thời hạn'
                    : `Thời gian còn lại: ${Math.floor(
                        remainingSeconds / 60
                      )}:${String(
                        remainingSeconds % 60
                      ).padStart(2, '0')}`}
                </p>
              )}
            </div>

            <p className="mt-6 text-center text-sm text-gray-500">
              Sau khi chuyển khoản, hệ thống sẽ cập nhật
              trạng thái khi nhận được xác nhận thanh toán.
            </p>
          </>
        )}

        <button
          onClick={() =>
            router.push(`/order/${orderId}`)
          }
          className="mt-6 w-full rounded-lg bg-black px-4 py-3 text-white"
        >
          Xem đơn hàng
        </button>
      </div>
    </main>
  );
}
