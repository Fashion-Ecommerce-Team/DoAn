'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@admin/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin/components/ui/table';
import {
  getDashboardStats,
  getRecentOrders,
  getRevenueChart,
  getTopSellingProducts,
  getUserGrowthChart,
  getOrderGrowthChart,
  getBrandRevenue,
  getCategoryRevenue,
  getTopCoupons,
  getCustomerRetention,
  getPaymentMethodRevenue,
  getCancellationStats,
} from '@admin/services';
import {
  DashboardStatsResponse,
  RecentOrder,
  RevenueData,
  TopSellingProduct,
  UserGrowthData,
  OrderGrowthData,
  BrandRevenueData,
  CategoryRevenueData,
  TopCouponData,
  CustomerRetentionData,
  PaymentRevenueData,
  CancellationStatsData,
} from '@admin/types';
import AdminPageHeader from '@/features/admin/components/common/AdminPageHeader';
import AdminStatusBadge from '@/features/admin/components/common/AdminStatusBadge';
import {
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  UserPlus,
  ShoppingBag,
  PieChart as PieChartIcon,
  Table as TableIcon,
  Sparkles,
  Award,
  BarChart3 as BarChart3Icon,
  AreaChart as AreaChartIcon,
  LineChart as LineChartIcon,
  UserCheck,
  XCircle,
  Tag,
  Layers,
  CreditCard,
  TicketPercent,
  Repeat,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

const PIE_COLORS = [
  '#0099FF', // Azure Brand
  '#00b4d8', // Cyan-Blue
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#0284c7', // Sky Deep
  '#fb923c', // Orange
  '#22c55e', // Green
  '#64748b', // Slate
  '#e11d48', // Crimson
  '#0284c7', // Sky
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopSellingProduct[]>([]);
  const [chartData, setChartData] = useState<RevenueData[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [orderGrowth, setOrderGrowth] = useState<OrderGrowthData[]>([]);
  const [period, setPeriod] = useState<string>('1year');
  const [revenueChartType, setRevenueChartType] = useState<'bar' | 'area' | 'line'>('bar');
  const [topProductView, setTopProductView] = useState<'chart' | 'table'>('chart');
  const [topLimit, setTopLimit] = useState<number>(10);
  const [loading, setLoading] = useState(true);

  // New statistics states
  const [brandRevenue, setBrandRevenue] = useState<BrandRevenueData[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenueData[]>([]);
  const [topCoupons, setTopCoupons] = useState<TopCouponData[]>([]);
  const [retentionData, setRetentionData] = useState<CustomerRetentionData | null>(null);
  const [paymentRevenue, setPaymentRevenue] = useState<PaymentRevenueData[]>([]);
  const [cancellationStats, setCancellationStats] = useState<CancellationStatsData | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          statsData,
          ordersData,
          chart,
          productsData,
          usersData,
          ordersGrowthData,
          brandData,
          catData,
          couponsData,
          retention,
          paymentData,
          cancelData,
        ] = await Promise.all([
          getDashboardStats(),
          getRecentOrders(),
          getRevenueChart('1year'),
          getTopSellingProducts(),
          getUserGrowthChart().catch(() => []),
          getOrderGrowthChart().catch(() => []),
          getBrandRevenue().catch(() => []),
          getCategoryRevenue().catch(() => []),
          getTopCoupons().catch(() => []),
          getCustomerRetention().catch(() => null),
          getPaymentMethodRevenue().catch(() => []),
          getCancellationStats().catch(() => null),
        ]);
        setStats(statsData);
        setRecentOrders(ordersData);
        setChartData(chart);
        setTopProducts(productsData || []);
        setUserGrowth(usersData || []);
        setOrderGrowth(ordersGrowthData || []);
        setBrandRevenue(brandData || []);
        setCategoryRevenue(catData || []);
        setTopCoupons(couponsData || []);
        setRetentionData(retention);
        setPaymentRevenue(paymentData || []);
        setCancellationStats(cancelData);
      } catch {
        toast.error('Lỗi khi tải dữ liệu Dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const loadChartData = async (p: string) => {
    try {
      const data = await getRevenueChart(p);
      setChartData(data);
    } catch {
      toast.error('Lỗi khi tải biểu đồ doanh thu');
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    loadChartData(newPeriod);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Chart data calculations
  const brandChartData = useMemo(() => {
    const totalRev = brandRevenue.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
    return brandRevenue.map((b, idx) => ({
      ...b,
      revenueNum: Number(b.revenue) || 0,
      percentage: totalRev > 0 ? Math.round(((Number(b.revenue) || 0) / totalRev) * 100) : 0,
      color: PIE_COLORS[idx % PIE_COLORS.length],
    }));
  }, [brandRevenue]);

  const categoryChartData = useMemo(() => {
    const totalRev = categoryRevenue.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
    return categoryRevenue.map((c, idx) => ({
      ...c,
      revenueNum: Number(c.revenue) || 0,
      percentage: totalRev > 0 ? Math.round(((Number(c.revenue) || 0) / totalRev) * 100) : 0,
      color: PIE_COLORS[idx % PIE_COLORS.length],
    }));
  }, [categoryRevenue]);

  const paymentChartData = useMemo(() => {
    const totalRev = paymentRevenue.reduce((acc, curr) => acc + (Number(curr.totalRevenue) || 0), 0);
    return paymentRevenue.map((p, idx) => ({
      ...p,
      revenueNum: Number(p.totalRevenue) || 0,
      percentage: totalRev > 0 ? Math.round(((Number(p.totalRevenue) || 0) / totalRev) * 100) : 0,
      color: PIE_COLORS[idx % PIE_COLORS.length],
    }));
  }, [paymentRevenue]);

  // Prepare top selling products formatted for pie chart and ranking
  const topProductsChartData = useMemo(() => {
    if (!topProducts || topProducts.length === 0) return [];
    const sliced = topLimit > 0 ? topProducts.slice(0, topLimit) : topProducts;
    return sliced.map((p, index) => {
      const sold = Number(p.total_sold ?? p.totalSold ?? p.soldQuantity ?? 0);
      const name = p.name || `Sản phẩm #${p.id}`;
      const shortName = name.length > 22 ? `${name.substring(0, 20)}...` : name;
      return {
        id: p.id,
        name,
        shortName,
        value: sold,
        sold,
        price: p.price || 0,
        rank: index + 1,
        color: PIE_COLORS[index % PIE_COLORS.length],
      };
    });
  }, [topProducts, topLimit]);

  const totalTopSold = useMemo(() => {
    return topProductsChartData.reduce((acc, item) => acc + item.sold, 0);
  }, [topProductsChartData]);

  // Aggregate stats for 12-month charts
  const totalNewUsers12m = useMemo(() => {
    return userGrowth.reduce((acc, item) => acc + (item.users || 0), 0);
  }, [userGrowth]);

  const totalNewOrders12m = useMemo(() => {
    return orderGrowth.reduce((acc, item) => acc + (item.orders || 0), 0);
  }, [orderGrowth]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] text-slate-500">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-[#0099FF] rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#0099FF] animate-pulse" />
          </div>
        </div>
        <span className="font-bold text-sm text-slate-700 mt-4">Đang tải dữ liệu báo cáo chuyên sâu...</span>
        <span className="text-xs text-slate-400 mt-1">Hệ thống đang tổng hợp dữ liệu doanh thu và khách hàng</span>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Tổng doanh thu',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/20',
      iconBg: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25',
      description: 'Doanh số tích lũy',
    },
    {
      title: 'Tổng đơn hàng',
      value: (stats?.totalOrders || 0).toLocaleString('vi-VN'),
      icon: ShoppingCart,
      gradient: 'from-[#0099FF]/10 via-[#0099FF]/5 to-transparent border-[#0099FF]/20',
      iconBg: 'bg-[#0099FF] text-white shadow-md shadow-[#0099FF]/25',
      description: 'Tổng số đơn đã tạo',
    },
    {
      title: 'Khách hàng',
      value: (stats?.totalUsers || 0).toLocaleString('vi-VN'),
      icon: Users,
      gradient: 'from-cyan-500/10 via-blue-500/5 to-transparent border-cyan-500/20',
      iconBg: 'bg-cyan-600 text-white shadow-md shadow-cyan-600/25',
      description: 'Tài khoản hoạt động',
    },
    {
      title: 'Sản phẩm trong kho',
      value: (stats?.totalProducts || 0).toLocaleString('vi-VN'),
      icon: Package,
      gradient: 'from-sky-500/10 via-blue-500/5 to-transparent border-sky-500/20',
      iconBg: 'bg-blue-600 text-white shadow-md shadow-blue-600/25',
      description: 'Sản phẩm kinh doanh',
    },
  ];

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <AdminPageHeader
        title="Bảng điều khiển kinh doanh"
        description="Tổng quan số liệu kinh doanh, tăng trưởng người dùng mới, tiến độ đơn hàng và phân tích doanh thu thời gian thực."
        badge="Dữ liệu trực tiếp"
      >
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl shadow-xs hover:border-slate-300 active:scale-[0.98] transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
            Quản lý đơn hàng
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <Link
            href="/admin/products/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gradient-to-r from-[#0099FF] via-[#0088e6] to-[#0077cc] hover:from-[#0088e6] hover:to-[#0066b3] text-white rounded-xl shadow-md shadow-[#0099FF]/25 hover:shadow-lg hover:shadow-[#0099FF]/35 active:scale-[0.98] transition-all"
          >
            + Thêm sản phẩm mới
          </Link>
        </div>
      </AdminPageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c, i) => (
          <Card
            key={i}
            className={`border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 relative overflow-hidden bg-gradient-to-br ${c.gradient}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{c.title}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                <c.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900 tracking-tight">{c.value}</div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                {c.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 1: Revenue Chart & Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4 border border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#0099FF]" />
                Biểu đồ doanh thu
              </CardTitle>
              <CardDescription className="mt-0.5">Biến động doanh thu theo các mốc thời gian</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
              {/* Chart Type Selector: Cột | Miền | Đường */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {[
                  { type: 'bar', label: 'Cột', icon: BarChart3Icon },
                  { type: 'area', label: 'Miền', icon: AreaChartIcon },
                  { type: 'line', label: 'Đường', icon: LineChartIcon },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setRevenueChartType(item.type as 'bar' | 'area' | 'line')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                        revenueChartType === item.type
                          ? 'bg-white text-[#0099FF] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title={`Xem dạng biểu đồ ${item.label}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Period selector buttons */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {[
                  { key: '7days', label: '7 ngày' },
                  { key: '1month', label: '1 tháng' },
                  { key: '1year', label: '1 năm' },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handlePeriodChange(p.key)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      period === p.key
                        ? 'bg-white text-[#0099FF] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 pl-0 pr-4">
            <div className="h-[310px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {revenueChartType === 'bar' ? (
                  <BarChart data={chartData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0099FF" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.75} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(241, 245, 249, 0.7)' }}
                      formatter={(value: unknown) => [formatCurrency(Number(value) || 0), 'Doanh thu']}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: '#ffffff',
                      }}
                    />
                    <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[8, 8, 0, 0]} maxBarSize={48} />
                  </BarChart>
                ) : revenueChartType === 'area' ? (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="revenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0099FF" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#0099FF" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      formatter={(value: unknown) => [formatCurrency(Number(value) || 0), 'Doanh thu']}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: '#ffffff',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0099FF"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#revenueAreaGradient)"
                      activeDot={{ r: 6, fill: '#0099FF', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      formatter={(value: unknown) => [formatCurrency(Number(value) || 0), 'Doanh thu']}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: '#ffffff',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0099FF"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#0099FF', stroke: '#ffffff', strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: '#0099FF', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-3 border border-slate-200/80 shadow-xs flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#0099FF]" />
                Đơn hàng mới
              </CardTitle>
              <CardDescription className="mt-0.5">Các giao dịch phát sinh gần nhất</CardDescription>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[#0099FF] hover:text-[#0077cc] hover:underline flex items-center gap-1"
            >
              Xem tất cả →
            </Link>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="text-xs font-bold text-slate-700">Mã ĐH</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Khách hàng</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Trạng thái</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-700">Tổng tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length > 0 ? (
                  recentOrders.slice(0, 6).map((order) => (
                    <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-bold text-[#0099FF] text-xs">
                        <Link href={`/admin/orders/${order.id}`}>#{order.id}</Link>
                      </TableCell>
                      <TableCell className="font-medium text-slate-800 text-xs truncate max-w-[110px]">
                        {order.receiverName || 'Khách vãng lai'}
                      </TableCell>
                      <TableCell>
                        <AdminStatusBadge status={order.status || ''} type="order" />
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900 text-xs whitespace-nowrap">
                        {formatCurrency(order.totalAmount || 0)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 py-8 text-xs font-medium">
                      Chưa có đơn hàng nào gần đây
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: 12-Month Growth Charts (Users Growth & Orders Growth) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart 1: New User Growth (12 Months) */}
        <Card className="border border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Tăng trưởng người mới tạo tài khoản
                </CardTitle>
              </div>
              <CardDescription className="mt-1">
                Số lượng tài khoản đăng ký mới qua 12 tháng gần nhất
              </CardDescription>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">12 tháng qua</span>
              <span className="text-lg font-black text-emerald-600">
                +{totalNewUsers12m.toLocaleString('vi-VN')}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-6 pl-0 pr-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowth}>
                  <defs>
                    <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: '#ffffff',
                    }}
                    formatter={(value: unknown) => [`${value} tài khoản`, 'Người dùng mới']}
                    labelFormatter={(label) => `Tháng: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#userGrowthGradient)"
                    activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Order Growth (12 Months) */}
        <Card className="border border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#0099FF] border border-sky-200 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Tăng trưởng đơn hàng mới
                </CardTitle>
              </div>
              <CardDescription className="mt-1">
                Lượng đơn đặt hàng phát sinh qua từng tháng trong 12 tháng gần nhất
              </CardDescription>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">12 tháng qua</span>
              <span className="text-lg font-black text-[#0099FF]">
                +{totalNewOrders12m.toLocaleString('vi-VN')} đơn
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-6 pl-0 pr-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={orderGrowth}>
                  <defs>
                    <linearGradient id="orderGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0099FF" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0099FF" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: '#ffffff',
                    }}
                    formatter={(value: unknown, name: unknown) => {
                      if (name === 'orders') return [`${value} đơn`, 'Số đơn hàng mới'];
                      return [String(value ?? ''), String(name ?? '')];
                    }}
                    labelFormatter={(label) => `Tháng: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#0099FF"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#orderGrowthGradient)"
                    activeDot={{ r: 6, fill: '#0099FF', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Top Selling Products (Donut / Pie Chart + Ranking Breakdown) */}
      <Card className="border border-slate-200/80 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#0099FF] border border-sky-200 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <CardTitle className="text-base font-bold text-slate-900">
                Biểu đồ tỷ trọng top sản phẩm bán chạy nhất
              </CardTitle>
            </div>
            <CardDescription className="mt-0.5">
              Cơ cấu và số lượng bán ra của {topProductsChartData.length} mặt hàng được ưa chuộng nhất toàn hệ thống
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
            {/* Top Quantity Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {[
                { value: 5, label: 'Top 5' },
                { value: 10, label: 'Top 10' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTopLimit(item.value)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    topLimit === item.value
                      ? 'bg-white text-[#0099FF] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setTopProductView('chart')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  topProductView === 'chart'
                    ? 'bg-white text-[#0099FF] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PieChartIcon className="w-3.5 h-3.5" />
                Biểu đồ tròn
              </button>
              <button
                type="button"
                onClick={() => setTopProductView('table')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  topProductView === 'table'
                    ? 'bg-white text-[#0099FF] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                Bảng xếp hạng
              </button>
            </div>

            <Link
              href="/admin/products"
              className="text-xs font-bold text-[#0099FF] hover:text-[#0077cc] hover:underline flex items-center gap-1 whitespace-nowrap pl-1"
            >
              Quản lý kho hàng →
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {topProductView === 'chart' ? (
            /* Donut / Pie Chart & Breakdown Side-by-Side */
            <div className="w-full">
              {topProductsChartData.length > 0 ? (
                <div className="grid gap-6 lg:grid-cols-12 items-center">
                  {/* Left: Donut Chart with center metric */}
                  <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-2">
                    <div className="h-[300px] w-full max-w-[340px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={topProductsChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={3}
                            cornerRadius={6}
                          >
                            {topProductsChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                stroke="#ffffff"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                              fontSize: '12px',
                              fontWeight: 600,
                              backgroundColor: '#ffffff',
                            }}
                            formatter={(value: unknown, name: unknown, props: unknown) => {
                              const payload = (props as { payload?: { price?: number; value?: number } })?.payload;
                              const valNum = Number(payload?.value || value || 0);
                              const pct = totalTopSold > 0 ? ((valNum / totalTopSold) * 100).toFixed(1) : 0;
                              return [
                                <span key="val" className="space-y-1 block">
                                  <span className="block text-[#0099FF] font-bold">
                                    {valNum} sản phẩm ({pct}%)
                                  </span>
                                  {payload?.price ? (
                                    <span className="block text-slate-500 font-normal">
                                      Đơn giá: {formatCurrency(payload.price)}
                                    </span>
                                  ) : null}
                                </span>,
                                String(name),
                              ];
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Center Stats in Donut Hole */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Tổng đã bán
                        </span>
                        <span className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                          {totalTopSold.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-[10px] font-semibold text-[#0099FF] mt-0.5">
                          Top {topProductsChartData.length} sản phẩm
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Detailed Product Share Cards with scroll support */}
                  <div className="lg:col-span-7 space-y-2 max-h-[380px] overflow-y-auto pr-1.5">
                    {topProductsChartData.map((item) => {
                      const percentage =
                        totalTopSold > 0 ? ((item.sold / totalTopSold) * 100).toFixed(1) : '0';
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/60 transition-colors"
                        >
                          {/* Rank badge with slice color indicator */}
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs"
                            style={{ backgroundColor: item.color }}
                          >
                            #{item.rank}
                          </div>

                          {/* Product name & price */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-slate-900 truncate" title={item.name}>
                                {item.name}
                              </p>
                              <span className="text-xs font-black text-slate-900 flex-shrink-0">
                                {item.sold} sp
                              </span>
                            </div>

                            {/* Progress bar and metadata */}
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: item.color,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 flex-shrink-0 w-10 text-right">
                                {percentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-sm font-medium">
                  Chưa có dữ liệu sản phẩm bán chạy để hiển thị biểu đồ tròn
                </div>
              )}
            </div>
          ) : (
            /* Table View */
            <div className="p-0 -mx-6 -mb-6">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="w-20 text-xs font-bold text-slate-700">Thứ hạng</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Mã SP</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Tên sản phẩm</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Giá bán niêm yết</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-700">Đã bán</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProductsChartData.length > 0 ? (
                    topProductsChartData.map((prod, idx) => (
                      <TableRow key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell>
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              idx === 0
                                ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                : idx === 1
                                ? 'bg-slate-200 text-slate-700'
                                : idx === 2
                                ? 'bg-amber-50 text-amber-800'
                                : 'text-slate-500'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-slate-700 text-xs">{prod.id}</TableCell>
                        <TableCell className="font-semibold text-slate-900 text-xs">{prod.name}</TableCell>
                        <TableCell className="font-medium text-slate-700 text-xs">
                          {formatCurrency(prod.price || 0)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-[#0099FF] text-xs">
                          {prod.sold} lượt
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500 py-8 text-xs font-medium">
                        Chưa có dữ liệu thống kê sản phẩm bán chạy
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
   
      {/* =========================================================================
          SECTION 4: ADVANCED BUSINESS INTELLIGENCE (6 CHỈ SỐ THỐNG KÊ MỚI)
          ========================================================================= */}
      <div className="pt-6 border-t border-slate-200/80 space-y-7">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-6 rounded-full bg-[#0099FF]" />
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
              Chỉ số kinh doanh & Hiệu quả vận hành
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-[#0077cc] border border-sky-200 shadow-xs">
              Báo cáo phân tích chuyên sâu
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi chi tiết hiệu quả bán hàng theo thương hiệu, danh mục, tỷ lệ giữ chân khách hàng, tỷ lệ hủy đơn và cổng thanh toán.
          </p>
        </div>

        {/* --- ROW A: TỶ LỆ KHÁCH QUAY LẠI & TỶ LỆ HỦY ĐƠN --- */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 1. TỶ LỆ KHÁCH HÀNG QUAY LẠI (RETENTION RATE) */}
          <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0099FF] border border-sky-200/80 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                    Tỷ lệ khách hàng quay lại
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Mức độ gắn kết và tỷ lệ khách hàng mua lại từ 2 đơn trở lên
                  </CardDescription>
                </div>
              </div>
              <span className="text-xs font-black text-[#0099FF] bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                Retention
              </span>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              {/* Highlight Metrics */}
              <div className="flex items-baseline justify-between gap-4 p-4 rounded-xl bg-gradient-to-br from-sky-50/70 via-blue-50/30 to-white border border-sky-200/80">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ quay lại mua hàng</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-[#0099FF] tracking-tight">
                      {retentionData?.retentionRate ?? 0}%
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      ({retentionData?.repeatCustomers ?? 0}/{retentionData?.totalCustomers ?? 0} khách có đơn)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-500">Trung bình đơn / khách</p>
                  <p className="text-xl font-extrabold text-slate-800 mt-0.5">
                    {retentionData?.avgOrdersPerCustomer ?? 0} <span className="text-xs font-medium text-slate-500">đơn</span>
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Tiến độ khách hàng mua lại</span>
                  <span className="font-bold text-[#0099FF]">{retentionData?.retentionRate ?? 0}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                  <div
                    className="h-full bg-gradient-to-r from-[#0099FF] to-[#0077cc] rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, retentionData?.retentionRate ?? 0))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-0.5">
                  <span>Khách mua 1 lần: <strong className="text-slate-700">{retentionData?.oneTimeCustomers ?? 0}</strong></span>
                  <span>Khách thân thiết (&gt;= 2 đơn): <strong className="text-[#0099FF]">{retentionData?.repeatCustomers ?? 0}</strong></span>
                </div>
              </div>

              {/* Top Repeat Customers */}
              <div className="space-y-2.5 pt-1">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-[#0099FF]" />
                  Khách hàng thân thiết mua nhiều nhất
                </p>
                <div className="space-y-1.5">
                  {retentionData?.topCustomers && retentionData.topCustomers.length > 0 ? (
                    retentionData.topCustomers.map((cust, idx) => (
                      <div
                        key={cust.userId}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/70"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            #{idx + 1}
                          </span>
                          <div className="min-w-0 truncate">
                            <p className="text-xs font-bold text-slate-800 truncate">{cust.fullName}</p>
                            <p className="text-[10px] text-slate-400 truncate">{cust.email}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 pl-2">
                          <span className="text-xs font-black text-[#0099FF]">{cust.orderCount} đơn</span>
                          <p className="text-[10px] font-bold text-slate-500">{formatCurrency(cust.totalSpent || 0)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-3 text-center">Chưa có đủ dữ liệu đơn hàng khách hàng</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. TỶ LỆ HỦY ĐƠN HÀNG (CANCELLATION RATE) */}
          <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                    Tỷ lệ hủy đơn hàng
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tỷ lệ đơn hàng bị hủy bỏ và tổng doanh số bị thất thoát
                  </CardDescription>
                </div>
              </div>
              <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                (cancellationStats?.cancellationRate || 0) > 20
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                Cancel Rate
              </span>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              {/* Highlight Metrics */}
              <div className="flex items-baseline justify-between gap-4 p-4 rounded-xl bg-gradient-to-br from-rose-50/70 via-orange-50/30 to-white border border-rose-200/80">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ hủy đơn toàn sàn</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-rose-600 tracking-tight">
                      {cancellationStats?.cancellationRate ?? 0}%
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      ({cancellationStats?.cancelledOrders ?? 0}/{cancellationStats?.totalOrders ?? 0} đơn đã hủy)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-500">Doanh thu thất thoát</p>
                  <p className="text-lg font-black text-rose-600 mt-0.5">
                    {formatCurrency(cancellationStats?.cancelledRevenue ?? 0)}
                  </p>
                </div>
              </div>

              {/* Order Status Composition Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Cơ cấu trạng thái đơn hàng</span>
                  <span className="text-slate-500 font-bold">Tổng: {cancellationStats?.totalOrders ?? 0} đơn</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/60">
                  {/* Completed */}
                  <div
                    title={`Đã hoàn thành: ${cancellationStats?.completedOrders || 0} đơn`}
                    className="bg-emerald-500 h-full transition-all"
                    style={{
                      width: `${cancellationStats?.totalOrders ? ((cancellationStats.completedOrders || 0) / cancellationStats.totalOrders) * 100 : 0}%`,
                    }}
                  />
                  {/* In Progress */}
                  <div
                    title={`Đang xử lý / giao: ${cancellationStats?.inProgressOrders || 0} đơn`}
                    className="bg-[#0099FF] h-full transition-all"
                    style={{
                      width: `${cancellationStats?.totalOrders ? ((cancellationStats.inProgressOrders || 0) / cancellationStats.totalOrders) * 100 : 0}%`,
                    }}
                  />
                  {/* Cancelled */}
                  <div
                    title={`Đã hủy: ${cancellationStats?.cancelledOrders || 0} đơn`}
                    className="bg-rose-500 h-full transition-all"
                    style={{
                      width: `${cancellationStats?.totalOrders ? ((cancellationStats.cancelledOrders || 0) / cancellationStats.totalOrders) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold pt-1">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Hoàn thành: {cancellationStats?.completedOrders ?? 0}
                  </span>
                  <span className="flex items-center gap-1.5 text-[#0077cc]">
                    <span className="w-2 h-2 rounded-full bg-[#0099FF]" />
                    Đang xử lý: {cancellationStats?.inProgressOrders ?? 0}
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-700">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Đã hủy: {cancellationStats?.cancelledOrders ?? 0}
                  </span>
                </div>
              </div>

              {/* Cancellation Reasons Breakdown */}
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  Lý do hủy đơn ghi nhận
                </p>
                <div className="space-y-1.5">
                  {cancellationStats?.reasons && cancellationStats.reasons.length > 0 ? (
                    cancellationStats.reasons.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs"
                      >
                        <span className="font-semibold text-slate-700 truncate">{r.reason}</span>
                        <span className="font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                          {r.count} đơn
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-3 text-center">Chưa có thông tin chi tiết lý do hủy</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- ROW B: DOANH THU THEO THƯƠNG HIỆU & DOANH THU THEO DANH MỤC --- */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 3. DOANH THU THEO THƯƠNG HIỆU */}
          <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0099FF] border border-sky-200/80 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                    Doanh thu theo thương hiệu
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Xếp hạng thương hiệu thời trang mang lại doanh số cao nhất
                  </CardDescription>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {brandChartData.length} thương hiệu
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              {brandChartData.length > 0 ? (
                <div className="space-y-3">
                  {brandChartData.map((b, idx) => (
                    <div key={b.id} className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: b.color }}
                          />
                          <p className="text-xs font-bold text-slate-900 truncate">
                            #{idx + 1} {b.name}
                          </p>
                          <span className="text-[10px] font-semibold text-slate-400">
                            ({b.totalSold} sp đã bán)
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-black text-slate-900">
                            {formatCurrency(b.revenueNum)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${b.percentage}%`,
                              backgroundColor: b.color,
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 w-8 text-right flex-shrink-0">
                          {b.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center">Chưa có dữ liệu doanh thu theo thương hiệu</p>
              )}
            </CardContent>
          </Card>

          {/* 4. DOANH THU THEO DANH MỤC SẢN PHẨM */}
          <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0099FF] border border-sky-200/80 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                    Doanh thu theo danh mục
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cơ cấu đóng góp doanh thu của các ngành hàng sản phẩm
                  </CardDescription>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {categoryChartData.length} danh mục
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              {categoryChartData.length > 0 ? (
                <div className="space-y-3">
                  {categoryChartData.map((c, idx) => (
                    <div key={c.id} className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          <p className="text-xs font-bold text-slate-900 truncate">
                            #{idx + 1} {c.name}
                          </p>
                          <span className="text-[10px] font-semibold text-slate-400">
                            ({c.totalSold} sp đã bán)
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-black text-slate-900">
                            {formatCurrency(c.revenueNum)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${c.percentage}%`,
                              backgroundColor: c.color,
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 w-8 text-right flex-shrink-0">
                          {c.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center">Chưa có dữ liệu doanh thu theo danh mục</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* --- ROW C: PHƯƠNG THỨC THANH TOÁN & MÃ GIẢM GIÁ SỬ DỤNG NHIỀU NHẤT --- */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 5. DOANH THU THEO PHƯƠNG THỨC THANH TOÁN */}
          <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0099FF] border border-sky-200/80 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                    Doanh thu theo phương thức thanh toán
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tỷ trọng và giá trị giao dịch theo từng kênh (COD, Chuyển khoản, VNPay...)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {paymentChartData.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentChartData.map((p) => (
                      <div key={p.paymentMethod} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            {p.paymentMethod === 'COD' ? 'Tiền mặt (COD)' : p.paymentMethod === 'QR' ? 'Chuyển khoản QR' : p.paymentMethod}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-[#0077cc] border border-sky-200">
                            {p.percentage}%
                          </span>
                        </div>
                        <p className="text-base font-black text-slate-900 mt-2">
                          {formatCurrency(p.revenueNum)}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                          <span>{p.successfulTransactions}/{p.totalTransactions} GD thành công</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment Methods Table Breakdown */}
                  <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="text-xs font-bold text-slate-700 py-2.5">Hình thức</TableHead>
                          <TableHead className="text-center text-xs font-bold text-slate-700 py-2.5">Tổng GD</TableHead>
                          <TableHead className="text-center text-xs font-bold text-slate-700 py-2.5">Thành công</TableHead>
                          <TableHead className="text-right text-xs font-bold text-slate-700 py-2.5">Thực thu</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentRevenue.map((pm) => (
                          <TableRow key={pm.paymentMethod} className="hover:bg-slate-50/80">
                            <TableCell className="font-bold text-xs text-slate-900">
                              {pm.paymentMethod === 'COD' ? 'Tiền mặt khi giao (COD)' : pm.paymentMethod === 'QR' ? 'Thanh toán QR Code' : pm.paymentMethod}
                            </TableCell>
                            <TableCell className="text-center font-semibold text-xs text-slate-700">{pm.totalTransactions}</TableCell>
                            <TableCell className="text-center font-bold text-xs text-emerald-600">
                              {pm.successfulTransactions} ({pm.totalTransactions ? Math.round((pm.successfulTransactions / pm.totalTransactions) * 100) : 0}%)
                            </TableCell>
                            <TableCell className="text-right font-black text-xs text-[#0099FF]">
                              {formatCurrency(pm.successfulRevenue || pm.totalRevenue || 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center">Chưa có dữ liệu giao dịch thanh toán</p>
              )}
            </CardContent>
          </Card>

          {/* 6. MÃ GIẢM GIÁ ĐƯỢC SỬ DỤNG NHIỀU NHẤT */}
          <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0099FF] border border-sky-200/80 flex items-center justify-center">
                  <TicketPercent className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                    Mã giảm giá được dùng nhiều nhất
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Xếp hạng mã khuyến mãi kích thích chuyển đổi đơn hàng tốt nhất
                  </CardDescription>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {topCoupons.length} mã hoạt động
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              {topCoupons.length > 0 ? (
                <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-12 text-center text-xs font-bold text-slate-700 py-2.5">Hạng</TableHead>
                        <TableHead className="text-xs font-bold text-slate-700 py-2.5">Mã Coupon</TableHead>
                        <TableHead className="text-center text-xs font-bold text-slate-700 py-2.5">Lượt dùng</TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-700 py-2.5">Tiền đã giảm</TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-700 py-2.5">Doanh số kéo theo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCoupons.map((cp, idx) => (
                        <TableRow key={cp.id} className="hover:bg-slate-50/80">
                          <TableCell className="text-center">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                              idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              #{idx + 1}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono font-bold text-xs text-[#0077cc] bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                              {cp.code}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-bold text-xs text-slate-800">
                            {cp.usageCount} lượt
                          </TableCell>
                          <TableCell className="text-right font-semibold text-xs text-rose-600">
                            -{formatCurrency(cp.totalDiscountAmount || 0)}
                          </TableCell>
                          <TableCell className="text-right font-black text-xs text-slate-900">
                            {formatCurrency(cp.totalOrderAmount || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center">Chưa có mã giảm giá nào được sử dụng trong các đơn hàng</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
