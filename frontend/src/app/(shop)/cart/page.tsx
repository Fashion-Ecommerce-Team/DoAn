
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Loader2,
} from 'lucide-react';
import apiClient from '../../../config/axios';
import cartApi, { type CartItem } from '../../../features/cart/cartApi';

interface ProductVariant {
  id: number;
  size?: string;
  color?: string;
  price?: number | string;
  stockQuantity?: number;
}

interface ProductDetail {
  id: number;
  name: string;
  slug?: string;
  basePrice?: number | string;
  discountPrice?: number | string | null;
  images?: { imageUrl?: string; isPrimary?: boolean }[];
  variants?: ProductVariant[];
}

interface CartDisplayItem extends CartItem {
  product?: ProductDetail;
  variant?: ProductVariant;
}

function money(value: number | string | undefined | null) {
  return Number(value ?? 0).toLocaleString('vi-VN') + '₫';
}

export default function CartPage() {
  const [items, setItems] = useState<CartDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function loadCart() {
    setLoading(true);
    setError('');

    try {
      const cartItems = await cartApi.getCart();

      const details = await Promise.all(
        cartItems.map(async (item) => {
          try {
            const response = await apiClient.get<{
              data: ProductDetail;
            }>(`/products/${item.productVariantId}`);

            const product = response.data.data;

            return {
              ...item,
              product,
              variant: product.variants?.find(
                (variant) => variant.id === item.productVariantId
              ),
            };
          } catch {
            return { ...item };
          }
        })
      );

      setItems(details);
    } catch (err) {
      console.error('Không thể tải giỏ hàng:', err);
      setError('Không thể tải giỏ hàng. Vui lòng đăng nhập và thử lại.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCart();
  }, []);

  async function changeQuantity(item: CartDisplayItem, amount: number) {
    const quantity = item.quantity + amount;

    if (quantity < 1) return;

    setBusyId(item.id);
    setError('');

    try {
      await cartApi.updateItem(item.id, quantity);
      setItems((current) =>
        current.map((value) =>
          value.id === item.id ? { ...value, quantity } : value
        )
      );
    } catch (err) {
      console.error(err);
      setError('Không thể cập nhật số lượng sản phẩm.');
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(item: CartDisplayItem) {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;

    setBusyId(item.id);
    setError('');

    try {
      await cartApi.deleteItem(item.productVariantId);
      setItems((current) => current.filter((value) => value.id !== item.id));
    } catch (err) {
      console.error(err);
      setError('Không thể xóa sản phẩm khỏi giỏ hàng.');
    } finally {
      setBusyId(null);
    }
  }

const total = items.reduce((sum, item) => {
  const price = Number(item.price ?? 0);
  return sum + price * item.quantity;
}, 0);
  return (
    <div className="mx-auto min-h-[70vh] max-w-7xl bg-white px-4 py-10 text-black sm:px-8 lg:py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-black"
      >
        <ArrowLeft size={16} />
        TIẾP TỤC MUA SẮM
      </Link>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <p className="mb-2 text-xs font-medium tracking-[0.25em] text-neutral-500">
            SEEMEE
          </p>
          <h1 className="text-3xl font-bold uppercase tracking-tight sm:text-4xl">
            Giỏ hàng của bạn
          </h1>
          <p className="mt-3 text-sm text-neutral-500">
            {items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm trong
            giỏ hàng
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={async () => {
              if (!window.confirm('Bạn muốn xóa toàn bộ giỏ hàng?')) return;

              setError('');
              try {
                await cartApi.clearCart();
                setItems([]);
              } catch (err) {
                console.error(err);
                setError('Không thể xóa toàn bộ giỏ hàng.');
              }
            }}
            className="text-sm text-neutral-500 underline underline-offset-4 hover:text-black"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center gap-3 text-neutral-500">
          <Loader2 className="animate-spin" size={22} />
          Đang tải giỏ hàng...
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center border border-neutral-200 px-6 text-center">
          <ShoppingBag size={42} strokeWidth={1.2} className="mb-5 text-neutral-400" />
          <h2 className="text-xl font-semibold uppercase">
            Giỏ hàng đang trống
          </h2>
          <p className="mt-3 text-sm text-neutral-500">
            Hãy khám phá và chọn sản phẩm bạn yêu thích.
          </p>
          <Link
            href="/"
            className="mt-7 bg-black px-8 py-4 text-sm font-medium uppercase tracking-wider text-white transition hover:bg-neutral-800"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
          <section>
            <div className="hidden grid-cols-[1fr_130px_130px] border-b border-neutral-200 pb-3 text-xs uppercase tracking-widest text-neutral-500 sm:grid">
              <span>Sản phẩm</span>
              <span className="text-center">Số lượng</span>
              <span className="text-right">Thành tiền</span>
            </div>

            <div className="divide-y divide-neutral-200">
              {items.map((item) => {
       const price = Number(item.price ?? 0);

                const image = item.product?.images?.find(
                  (img) => img.isPrimary
                )?.imageUrl ?? item.product?.images?.[0]?.imageUrl;

                return (
                  <article
                    key={item.id}
                    className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-[1fr_130px_130px] sm:items-center"
                  >
                    <div className="flex gap-5">
                      <div className="flex h-36 w-28 shrink-0 items-center justify-center bg-neutral-100">
                        {image ? (
                          <img
                            src={image}
                            alt={item.product?.name ?? 'Sản phẩm thời trang'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ShoppingBag size={30} className="text-neutral-400" />
                        )}
                      </div>

                      <div className="flex flex-col items-start py-1">
                        <h2 className="font-semibold">
                          {item.product?.name ?? `Sản phẩm #${item.productVariantId}`}
                        </h2>
                        <p className="mt-2 text-sm text-neutral-500">
                          Màu sắc: {item.variant?.color ?? 'Chưa có thông tin'}
                        </p>
                        <p className="mt-1 text-sm text-neutral-500">
                          Kích thước: {item.variant?.size ?? 'Chưa có thông tin'}
                        </p>
                        <p className="mt-3 font-medium">{money(price)}</p>

                        <button
                          onClick={() => void removeItem(item)}
                          disabled={busyId === item.id}
                          className="mt-auto flex items-center gap-1 pt-4 text-xs text-neutral-500 underline underline-offset-4 hover:text-black disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                          Xóa
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center sm:justify-center">
                      <div className="flex items-center border border-neutral-300">
                        <button
                          onClick={() => void changeQuantity(item, -1)}
                          disabled={busyId === item.id || item.quantity <= 1}
                          aria-label="Giảm số lượng"
                          className="p-2.5 hover:bg-neutral-100 disabled:opacity-30"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-9 text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => void changeQuantity(item, 1)}
                          disabled={busyId === item.id}
                          aria-label="Tăng số lượng"
                          className="p-2.5 hover:bg-neutral-100 disabled:opacity-30"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <p className="text-right font-semibold">
                      {money(price * item.quantity)}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="h-fit border border-neutral-200 p-6 sm:p-8">
            <h2 className="border-b border-neutral-200 pb-5 text-lg font-bold uppercase tracking-wide">
              Tổng đơn hàng
            </h2>

            <div className="flex justify-between gap-4 py-6 text-sm">
              <span className="text-neutral-500">Tạm tính</span>
              <span className="font-medium">{money(total)}</span>
            </div>

            <p className="border-b border-neutral-200 pb-6 text-xs leading-5 text-neutral-500">
              Phí vận chuyển và mã giảm giá sẽ được xác định ở bước thanh toán.
            </p>

            <div className="flex items-center justify-between gap-4 py-6">
              <span className="text-sm font-semibold uppercase">Tổng cộng</span>
              <span className="text-xl font-bold">{money(total)}</span>
            </div>

            <Link
              href="/checkout"
              className="block w-full bg-black px-5 py-4 text-center text-sm font-semibold uppercase tracking-widest text-white transition hover:bg-neutral-800"
            >
              Thanh toán ngay
            </Link>

            <p className="mt-4 text-center text-xs text-neutral-500">
              Cảm ơn bạn đã mua sắm tại SEEMEE.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
