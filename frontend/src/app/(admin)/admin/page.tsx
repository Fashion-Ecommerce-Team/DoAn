'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@admin/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin/components/ui/table';
import { getDashboardStats, getRecentOrders, getRevenueChart, getTopSellingProducts } from '@admin/services';
import { DashboardStatsResponse, RecentOrder, RevenueData, TopSellingProduct } from '@admin/types';
import AdminPageHeader from '@/features/admin/components/common/AdminPageHeader';
import AdminStatusBadge from '@/features/admin/components/common/AdminStatusBadge';
import { Package, Users, ShoppingCart, DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopSellingProduct[]>([]);
  const [chartData, setChartData] = useState<RevenueData[]>([]);
  const [period, setPeriod] = useState<string>('7days');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, ordersData, chart, productsData] = await Promise.all([
          getDashboardStats(),
          getRecentOrders(),
          getRevenueChart('7days'),
          getTopSellingProducts(),
        ]);
        setStats(statsData);
        setRecentOrders(ordersData);
        setChartData(chart);
        setTopProducts(productsData);
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
      toast.error('Lỗi khi tải biểu đồ');
    }
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value;
    setPeriod(newPeriod);
    loadChartData(newPeriod);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="font-semibold text-sm">Đang tải dữ liệu báo cáo...</span>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Tổng doanh thu',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/80',
      description: 'Doanh số tích lũy',
    },
    {
      title: 'Đơn hàng',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-200/80',
      description: 'Tổng số đơn đã tạo',
    },
    {
      title: 'Khách hàng',
      value: stats?.totalUsers || 0,
      icon: Users,
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-200/80',
      description: 'Tài khoản hoạt động',
    },
    {
      title: 'Sản phẩm',
      value: stats?.totalProducts || 0,
      icon: Package,
      iconBg: 'bg-violet-50 text-violet-600 border border-violet-200/80',
      description: 'Sản phẩm trong kho',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Professional Page Header */}
      <AdminPageHeader
        title="Bảng điều khiển"
        description="Tổng quan số liệu kinh doanh, hiệu suất bán hàng và phân tích doanh thu thời gian thực."
        badge="Realtime Data"
      >
        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-sm transition-colors"
          >
            Quản lý đơn hàng
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <Link
            href="/admin/products/create"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
          >
            + Thêm sản phẩm
          </Link>
        </div>
      </AdminPageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c, i) => (
          <Card key={i} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{c.title}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.iconBg}`}>
                <c.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{c.value}</div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                {c.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid: Chart & Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4 border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Biểu đồ doanh thu</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Biến động doanh thu theo các mốc thời gian</p>
            </div>
            <select
              value={period}
              onChange={handlePeriodChange}
              className="border border-slate-200 rounded-lg text-xs font-semibold px-2.5 py-1.5 text-slate-700 bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="7days">7 ngày qua</option>
              <option value="1month">1 tháng qua</option>
              <option value="1year">1 năm qua</option>
            </select>
          </CardHeader>
          <CardContent className="pt-4 pl-0 pr-4">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                    formatter={(value: unknown) => [formatCurrency(Number(value) || 0), 'Doanh thu']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-3 border-slate-200 shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Đơn hàng mới</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Các đơn giao dịch phát sinh gần nhất</p>
            </div>
            <Link href="/admin/orders" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
              Xem tất cả →
            </Link>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <Table>
              <TableHeader className="bg-slate-50/75">
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
                      <TableCell className="font-bold text-blue-600 text-xs">
                        <Link href={`/admin/orders/${order.id}`}>{order.id}</Link>
                      </TableCell>
                      <TableCell className="font-medium text-slate-800 text-xs truncate max-w-[120px]">
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

      {/* Top Selling Products */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">Sản phẩm bán chạy nhất</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Top các sản phẩm có lượt mua cao nhất toàn sàn</p>
          </div>
          <Link href="/admin/products" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
            Quản lý kho hàng →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/75">
              <TableRow>
                <TableHead className="w-20 text-xs font-bold text-slate-700">Mã SP</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Tên sản phẩm</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Giá bán niêm yết</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-700">Đã bán</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.length > 0 ? (
                topProducts.map((prod) => (
                  <TableRow key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-bold text-slate-700 text-xs">{prod.id}</TableCell>
                    <TableCell className="font-semibold text-slate-900 text-xs">{prod.name}</TableCell>
                    <TableCell className="font-medium text-slate-700 text-xs">{formatCurrency(prod.price || 0)}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 text-xs">
                      {prod.total_sold || prod.totalSold || 0} lượt
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-500 py-8 text-xs font-medium">
                    Chưa có dữ liệu thống kê sản phẩm bán chạy
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
