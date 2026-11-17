
'use client';

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Truck,
  CreditCard,
  ShoppingBag,
  Loader2,
} from 'lucide-react';

import { orderApi } from '@/features/order/orderApi';

import checkoutApi, {
  type CheckoutAddress,
  type CheckoutPreviewResponse,
  type CreateCheckoutAddressRequest,
} from '../../../features/checkout/checkoutApi';

import couponApi, {
  type CouponValidateResponse,
} from '../../../features/coupon/couponApi';

type PaymentMethod = 'COD' | 'VIETQR';
type AddressMode = 'saved' | 'new';

const formatPrice = (price: number) =>
  Number(price).toLocaleString('vi-VN') + '₫';

const inputClass =
  'mt-2 w-full border border-neutral-300 px-4 py-3 outline-none focus:border-black';

const emptyAddress: CreateCheckoutAddressRequest = {
  receiverName: '',
  receiverPhone: '',
  province: '',
  district: '',
  ward: '',
  streetAddress: '',
};

function resolveImage(url: string | null) {
  if (!url) return '';

  if (/^(https?:)?\/\//i.test(url)) return url;

  const base = (
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8080/api/v1'
  ).replace(/\/api\/v1\/?$/, '');

  return `${base}/${url.replace(/^\//, '')}`;
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (
      error as {
        response?: {
          data?: { message?: string };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}

export default function CheckoutPage() {
  const router = useRouter();

  const [preview, setPreview] =
    useState<CheckoutPreviewResponse | null>(null);

  const [addresses, setAddresses] =
    useState<CheckoutAddress[]>([]);

  const [addressMode, setAddressMode] =
    useState<AddressMode>('saved');

  const [addressId, setAddressId] =
    useState<number | null>(null);

  const [newAddress, setNewAddress] =
    useState<CreateCheckoutAddressRequest>(
      emptyAddress
    );

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('COD');

  const [coupon, setCoupon] = useState('');
  const [couponMessage, setCouponMessage] = useState('');

  const [appliedCoupon, setAppliedCoupon] =
    useState<CouponValidateResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [orderCreated, setOrderCreated] =
    useState<number | null>(null);

  const submittingRef = useRef(false);

  useEffect(() => {
    async function loadCheckout() {
      setLoading(true);

      try {
        const [previewData, addressData] =
          await Promise.all([
            checkoutApi.preview(),
            checkoutApi.getAddresses(),
          ]);

        setPreview(previewData);
        setAddresses(addressData);

        if (addressData.length > 0) {
          const defaultAddress =
            addressData.find(address =>
              Boolean(Number(address.is_default))
            ) ?? addressData[0];

          setAddressId(defaultAddress.id);
          setAddressMode('saved');
        } else {
          setAddressMode('new');
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    void loadCheckout();
  }, []);

  function updateAddress(
    field: keyof CreateCheckoutAddressRequest,
    value: string
  ) {
    setNewAddress(current => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveAddress(): Promise<number | null> {
    const fields = Object.values(newAddress);

    if (fields.some(value => !value.trim())) {
      setError(
        'Vui lòng nhập đầy đủ thông tin giao hàng.'
      );
      return null;
    }

    const created =
      await checkoutApi.createAddress(newAddress);

    setAddresses(current => [...current, created]);
    setAddressId(created.id);
    setAddressMode('saved');

    return created.id;
  }

  async function handleSaveAddress() {
    if (busy || submittingRef.current) return;

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const createdId = await saveAddress();

      if (createdId !== null) {
        setSuccess(
          'Đã lưu địa chỉ giao hàng thành công.'
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function applyCoupon() {
    if (busy || !preview || submittingRef.current) {
      return;
    }

    setCouponMessage('');
    setError('');
    setSuccess('');

    const code = coupon.trim();

    if (!code) {
      setAppliedCoupon(null);
      setCouponMessage(
        'Vui lòng nhập mã giảm giá.'
      );
      return;
    }

    setBusy(true);

    try {
      const result = await couponApi.validate(code);

      if (!result.valid) {
        setAppliedCoupon(null);
        setCouponMessage(
          result.message ||
          'Mã giảm giá không hợp lệ.'
        );
        return;
      }

      if (
        Number(result.subtotal) !==
          Number(preview.subtotal) ||
        Number(result.shippingFee) !==
          Number(preview.shippingFee)
      ) {
        setAppliedCoupon(null);
        setCouponMessage(
          'Thông tin đơn hàng đã thay đổi. ' +
          'Vui lòng tải lại trang.'
        );
        return;
      }

      setAppliedCoupon(result);
      setCoupon(result.couponCode);

      setCouponMessage(
        'Áp dụng mã giảm giá thành công.'
      );
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMessage(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function removeCoupon() {
    if (busy || submittingRef.current) return;

    setCoupon('');
    setAppliedCoupon(null);
    setCouponMessage('Đã xóa mã giảm giá.');
    setError('');
    setSuccess('');
  }

  // =====================================================
  // CHECKOUT VALIDATE + TẠO ORDER
  // =====================================================

  async function handlePlaceOrder(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      busy ||
      submittingRef.current ||
      !preview ||
      orderCreated !== null
    ) {
      return;
    }

    submittingRef.current = true;

    setBusy(true);
    setError('');
    setSuccess('');

    let requestStarted = false;

    try {
      let selectedAddressId = addressId;

      // Nếu đang nhập địa chỉ mới thì lưu trước.
      if (addressMode === 'new') {
        selectedAddressId = await saveAddress();
      }

      if (selectedAddressId === null) {
        setError(
          'Vui lòng chọn hoặc thêm địa chỉ giao hàng.'
        );
        return;
      }

      // Chỉ gửi coupon đã được áp dụng hợp lệ.
      if (
        coupon.trim() &&
        !appliedCoupon
      ) {
        setError(
          'Bạn đã nhập mã coupon nhưng chưa áp dụng ' +
          'thành công. Vui lòng áp dụng hoặc xóa mã.'
        );
        return;
      }

      const couponCode =
        appliedCoupon?.couponCode || undefined;

      // 1. Kiểm tra Checkout.
      const validation =
        await checkoutApi.validate({
          addressId: selectedAddressId,
          couponCode,
        });

      if (!validation.valid) {
        const messages =
          Array.isArray(validation.errors)
            ? validation.errors.map(String).join(', ')
            : validation.message;

        setError(
          messages ||
          'Thông tin Checkout chưa hợp lệ.'
        );
        return;
      }

      // 2. Tạo Order đúng một lần.
      requestStarted = true;

      const order = await orderApi.createOrder({
        addressId: selectedAddressId,
        couponCode,
        paymentMethod,
      });

      setOrderCreated(order.orderId);

      // 3. Điều hướng theo phương thức thanh toán.
      if (paymentMethod === 'VIETQR') {
        router.push(`/payment/${order.orderId}`);
      } else {
        router.push(`/orders/${order.orderId}`);
      }
    } catch (err) {
      if (requestStarted) {
        setError(
          'Không thể xác nhận kết quả tạo đơn hàng. ' +
          'Vui lòng kiểm tra lịch sử đơn hàng ' +
          'trước khi thử đặt lại. ' +
          getErrorMessage(err)
        );
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center gap-3">
        <Loader2 className="animate-spin" />
        Đang tải thông tin thanh toán...
      </main>
    );
  }

  if (!preview) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="mb-6 text-red-600">
          {error ||
            'Không thể tải thông tin Checkout.'}
        </p>

        <Link href="/cart" className="underline">
          Quay lại giỏ hàng
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 text-black sm:px-8 lg:py-14">
      <Link
        href="/cart"
        className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black"
      >
        <ArrowLeft size={16} />
        QUAY LẠI GIỎ HÀNG
      </Link>

      <div className="mb-10 border-b pb-6">
        <p className="mb-2 text-xs tracking-[0.25em] text-neutral-500">
          SEEME
        </p>

        <h1 className="text-3xl font-bold uppercase sm:text-4xl">
          Thanh toán
        </h1>

        <p className="mt-3 text-sm text-neutral-500">
          Kiểm tra thông tin giao hàng và đơn hàng của bạn.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="mb-6 border border-green-200 bg-green-50 p-4 text-sm text-green-700"
        >
          {success}
        </p>
      )}

      {orderCreated !== null && (
        <div className="mb-6 border border-green-200 bg-green-50 p-4 text-sm">
          Đã tạo đơn hàng #{orderCreated}.
          {' '}
          <Link
            href={
              paymentMethod === 'VIETQR'
                ? `/payment/${orderCreated}`
                : `/orders/${orderCreated}`
            }
            className="font-semibold underline"
          >
            Tiếp tục
          </Link>
        </div>
      )}

      <form onSubmit={handlePlaceOrder}>
        <div className="grid gap-12 lg:grid-cols-[1fr_390px]">
          <div className="space-y-10">
            {/* THÔNG TIN GIAO HÀNG */}
            <section>
              <div className="mb-6 flex items-center gap-3">
                <MapPin size={21} />
                <h2 className="text-lg font-bold uppercase">
                  Thông tin giao hàng
                </h2>
              </div>

              <div className="mb-6 space-y-3">
                <label className="flex cursor-pointer gap-3 border p-4">
                  <input
                    type="radio"
                    name="addressMode"
                    checked={addressMode === 'saved'}
                    onChange={() => {
                      setAddressMode('saved');
                      setError('');
                    }}
                    disabled={
                      addresses.length === 0 ||
                      busy ||
                      orderCreated !== null
                    }
                    className="accent-black"
                  />
                  <span>Sử dụng địa chỉ đã lưu</span>
                </label>

                <label className="flex cursor-pointer gap-3 border p-4">
                  <input
                    type="radio"
                    name="addressMode"
                    checked={addressMode === 'new'}
                    onChange={() => {
                      setAddressMode('new');
                      setError('');
                    }}
                    disabled={
                      busy || orderCreated !== null
                    }
                    className="accent-black"
                  />
                  <span>Nhập địa chỉ mới</span>
                </label>
              </div>

              {addressMode === 'saved' ? (
                <div className="space-y-3">
                  {addresses.map(address => (
                    <label
                      key={address.id}
                      className={`flex cursor-pointer gap-4 border p-5 ${
                        addressId === address.id
                          ? 'border-black'
                          : 'border-neutral-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        checked={addressId === address.id}
                        onChange={() =>
                          setAddressId(address.id)
                        }
                        disabled={
                          busy ||
                          orderCreated !== null
                        }
                        className="accent-black"
                      />

                      <div className="text-sm">
                        <p className="font-semibold">
                          {address.receiver_name}
                        </p>

                        <p className="mt-1">
                          {address.receiver_phone}
                        </p>

                        <p className="mt-2 text-neutral-500">
                          {[
                            address.street_address,
                            address.ward,
                            address.district,
                            address.province,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>

                        {Boolean(
                          Number(address.is_default)
                        ) && (
                          <p className="mt-2 text-xs font-medium">
                            Địa chỉ mặc định
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {(
                    [
                      ['receiverName', 'Họ và tên'],
                      ['receiverPhone', 'Số điện thoại'],
                      ['province', 'Tỉnh / Thành phố'],
                      ['district', 'Quận / Huyện'],
                      ['ward', 'Phường / Xã'],
                      ['streetAddress', 'Địa chỉ chi tiết'],
                    ] as const
                  ).map(([field, label]) => (
                    <label
                      key={field}
                      className="block text-sm"
                    >
                      {label} *
                      <input
                        required
                        value={newAddress[field]}
                        onChange={e =>
                          updateAddress(
                            field,
                            e.target.value
                          )
                        }
                        disabled={
                          busy ||
                          orderCreated !== null
                        }
                        type={
                          field === 'receiverPhone'
                            ? 'tel'
                            : 'text'
                        }
                        maxLength={
                          field === 'receiverPhone'
                            ? 20
                            : field === 'province' ||
                                field === 'district' ||
                                field === 'ward'
                              ? 100
                              : 255
                        }
                        className={inputClass}
                        placeholder={`Nhập ${label.toLowerCase()}`}
                      />
                    </label>
                  ))}

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleSaveAddress}
                      disabled={
                        busy ||
                        orderCreated !== null
                      }
                      className="border border-black px-6 py-3 text-sm font-semibold disabled:opacity-50"
                    >
                      Lưu địa chỉ mới
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* PHƯƠNG THỨC THANH TOÁN */}
            <section>
              <div className="mb-6 flex items-center gap-3">
                <CreditCard size={21} />
                <h2 className="text-lg font-bold uppercase">
                  Phương thức thanh toán
                </h2>
              </div>

              <div className="space-y-3">
                {(
                  [
                    [
                      'COD',
                      'Thanh toán khi nhận hàng',
                      'Thanh toán trực tiếp khi nhận sản phẩm.',
                    ],
                    [
                      'VIETQR',
                      'Chuyển khoản qua QR',
                      'Mã QR sẽ được hiển thị sau khi đặt hàng.',
                    ],
                  ] as const
                ).map(([value, title, description]) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer gap-4 border p-5 ${
                      paymentMethod === value
                        ? 'border-black'
                        : 'border-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={
                        paymentMethod === value
                      }
                      onChange={() =>
                        setPaymentMethod(value)
                      }
                      disabled={
                        busy ||
                        orderCreated !== null
                      }
                      className="accent-black"
                    />

                    <div>
                      <p className="font-semibold">
                        {title}
                      </p>

                      <p className="mt-1 text-sm text-neutral-500">
                        {description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <div className="flex gap-3 bg-neutral-50 p-4 text-sm text-neutral-600">
              <Truck
                size={20}
                className="shrink-0"
              />
              <p>
                Phí vận chuyển được tính từ hệ thống backend.
              </p>
            </div>
          </div>

          {/* TÓM TẮT ĐƠN HÀNG */}
          <aside className="h-fit border p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <ShoppingBag size={21} />
              <h2 className="text-lg font-bold uppercase">
                Đơn hàng của bạn
              </h2>
            </div>

            <div className="divide-y">
              {preview.items.map(item => (
                <div
                  key={item.cartItemId}
                  className="flex gap-4 py-5 first:pt-0"
                >
                  <div className="relative h-24 w-20 shrink-0 bg-neutral-100">
                    {item.imageUrl ? (
                      <img
                        src={resolveImage(
                          item.imageUrl
                        )}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingBag className="text-neutral-400" />
                      </div>
                    )}

                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs text-white">
                      {item.quantity}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold">
                      {item.productName}
                    </h3>

                    <p className="mt-2 text-xs text-neutral-500">
                      Màu: {item.color ?? '—'} /
                      Size: {item.size ?? '—'}
                    </p>

                    <p className="mt-3 text-sm font-medium">
                      {formatPrice(item.lineTotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* COUPON */}
            <div className="border-t pt-5">
              <label className="text-sm font-medium">
                Mã giảm giá
              </label>

              <div className="mt-2 flex">
                <input
                  value={coupon}
                  onChange={e => {
                    setCoupon(e.target.value);
                    setAppliedCoupon(null);
                    setCouponMessage('');
                    setSuccess('');
                  }}
                  disabled={
                    busy ||
                    orderCreated !== null
                  }
                  placeholder="Nhập mã coupon"
                  className="min-w-0 flex-1 border px-3 py-3 text-sm outline-none"
                />

                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={
                    busy ||
                    orderCreated !== null
                  }
                  className="border border-l-0 px-4 text-sm font-semibold disabled:opacity-50"
                >
                  ÁP DỤNG
                </button>
              </div>

              {couponMessage && (
                <p className="mt-2 text-xs text-neutral-600">
                  {couponMessage}
                </p>
              )}

              {appliedCoupon && (
                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-green-700">
                    Đã áp dụng:
                    {' '}
                    {appliedCoupon.couponCode}
                  </span>

                  <button
                    type="button"
                    onClick={removeCoupon}
                    disabled={
                      busy ||
                      orderCreated !== null
                    }
                    className="text-red-600 underline disabled:opacity-50"
                  >
                    Xóa mã
                  </button>
                </div>
              )}
            </div>

            {/* TỔNG TIỀN */}
            <div className="mt-6 space-y-4 border-t pt-5 text-sm">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span>
                  {formatPrice(preview.subtotal)}
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-green-700">
                  <span>
                    Giảm giá (
                    {appliedCoupon.couponCode})
                  </span>

                  <span>
                    -{formatPrice(
                      appliedCoupon.discountAmount
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Vận chuyển</span>
                <span>
                  {formatPrice(
                    preview.shippingFee
                  )}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-between border-t pt-6 font-bold">
              <span>Tổng cộng</span>

              <span className="text-xl">
                {formatPrice(
                  appliedCoupon
                    ? appliedCoupon.totalAmount
                    : preview.totalAmount
                )}
              </span>
            </div>

            <p className="mt-2 text-xs text-neutral-500">
              {appliedCoupon
                ? 'Tổng tiền đã bao gồm giảm giá coupon.'
                : 'Bạn có thể nhập coupon để nhận ưu đãi.'}
            </p>

            <button
              type="submit"
              disabled={
                busy ||
                orderCreated !== null ||
                preview.items.length === 0
              }
              className="mt-7 flex w-full items-center justify-center gap-2 bg-black px-5 py-4 text-sm font-semibold uppercase text-white disabled:opacity-50"
            >
              {busy && (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              )}

              {busy
                ? 'Đang xử lý đơn hàng...'
                : orderCreated !== null
                  ? 'Đã tạo đơn hàng'
                  : 'Đặt hàng'}
            </button>

            <p className="mt-4 text-center text-xs text-neutral-500">
              {paymentMethod === 'COD'
                ? 'Thanh toán khi nhận hàng.'
                : 'Sau khi đặt hàng, bạn sẽ được chuyển đến trang quét QR.'}
            </p>
          </aside>
        </div>
      </form>
    </main>
  );
}
