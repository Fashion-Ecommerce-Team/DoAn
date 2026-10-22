export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
  EXPIRED: 'Hết hạn',
  REFUNDED: 'Đã hoàn tiền',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  BANK_TRANSFER: 'Chuyển khoản / QR',
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
};

export const getPaymentStatusLabel = (status?: string) =>
  (status && PAYMENT_STATUS_LABELS[status]) || status || '---';

export const getPaymentMethodLabel = (method?: string) =>
  (method && PAYMENT_METHOD_LABELS[method]) || method || '---';

export const formatCurrency = (amount?: number) => {
  if (amount === undefined || amount === null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
      })
    : '---';


export const getApiErrorMessage = (error: unknown, fallback: string) => {
  const err = error as { response?: { data?: { message?: string } } };
  return err?.response?.data?.message || fallback;
};
