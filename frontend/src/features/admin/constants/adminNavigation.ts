import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Package,
  Layers,
  Tag,
  TicketPercent,
  Users,
  Star,
  LucideIcon
} from 'lucide-react';

export interface AdminNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

export interface AdminNavGroup {
  groupTitle: string;
  items: AdminNavItem[];
}

export const ADMIN_NAVIGATION: AdminNavGroup[] = [
  {
    groupTitle: 'TỔNG QUAN',
    items: [
      { name: 'Bảng điều khiển', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    groupTitle: 'QUẢN LÝ BÁN HÀNG',
    items: [
      { name: 'Đơn hàng', href: '/admin/orders', icon: ShoppingBag },
      { name: 'Giao dịch thanh toán', href: '/admin/payments', icon: CreditCard },
    ],
  },
  {
    groupTitle: 'SẢN PHẨM & KHO',
    items: [
      { name: 'Sản phẩm', href: '/admin/products', icon: Package },
      { name: 'Danh mục', href: '/admin/categories', icon: Layers },
      { name: 'Thương hiệu', href: '/admin/brands', icon: Tag },
    ],
  },
  {
    groupTitle: 'MARKETING & TƯƠNG TÁC',
    items: [
      { name: 'Mã giảm giá', href: '/admin/coupons', icon: TicketPercent },
      { name: 'Đánh giá sản phẩm', href: '/admin/reviews', icon: Star },
    ],
  },
  {
    groupTitle: 'HỆ THỐNG & NGƯỜI DÙNG',
    items: [
      { name: 'Khách hàng', href: '/admin/users', icon: Users },
    ],
  },
];
