'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@admin/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin/components/ui/table';
import { Button } from '@admin/components/ui/button';
import { Badge } from '@admin/components/ui/badge';
import { MapPin, User, Mail, Phone, Calendar, ArrowLeft, Shield, ShoppingBag } from 'lucide-react';
import { getUserById, getUserAddresses, updateUserStatus, getOrders } from '@admin/services';
import { UserResponse, UserAddressResponse, OrderResponse } from '@admin/types';
import { toast } from 'sonner';
import AdminStatusBadge from '@/features/admin/components/common/AdminStatusBadge';
import { AdminViewButton } from '@/features/admin/components/common/AdminTableActions';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = Number(params.id);

  const [user, setUser] = useState<UserResponse | null>(null);
  const [addresses, setAddresses] = useState<UserAddressResponse[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [userData, addressData, ordersData] = await Promise.all([
        getUserById(userId),
        getUserAddresses(userId),
        getOrders(0, 50, undefined, undefined, userId)
      ]);
      setUser(userData);
      setAddresses(addressData);
      setOrders(ordersData?.content || []);
    } catch {
      toast.error('Lỗi khi tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadData();
  }, [userId]);

  const handleUpdateStatus = async () => {
    if (!user) return;
    if (confirm('Bạn có chắc chắn muốn thay đổi trạng thái tài khoản này?')) {
      try {
        const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await updateUserStatus(user.id, newStatus);
        toast.success('Cập nhật trạng thái thành công');
        loadData();
      } catch {
        toast.error('Lỗi khi cập nhật trạng thái');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-12 font-bold text-slate-700">Đang tải thông tin...</div>;
  }

  if (!user) {
    return <div className="text-center py-12 font-bold text-red-600">Không tìm thấy người dùng!</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Chi tiết Khách hàng</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant={user.status === 'ACTIVE' ? 'destructive' : 'default'}
            className="font-bold"
            onClick={handleUpdateStatus}
          >
            {user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Thông tin cơ bản */}
        <Card className="md:col-span-1 shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" /> Hồ sơ
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">{user.fullName}</h3>
                <Badge variant={user.roleId === 1 ? 'default' : 'secondary'} className={user.roleId === 1 ? 'bg-[#0099FF]' : ''}>
                  {user.roleId === 1 ? 'ADMIN' : 'USER'}
                </Badge>
              </div>
            </div>

            <div className="space-y-3 mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{user.phone || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-medium">Tham gia: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '---'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Shield className="w-4 h-4 text-slate-400" />
                <span className="font-medium flex items-center gap-2">
                  Trạng thái:
                  <AdminStatusBadge status={user.status} type="user" />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sổ địa chỉ */}
        <Card className="md:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" /> Sổ địa chỉ ({addresses.length})
            </CardTitle>
            <CardDescription>Các địa chỉ giao hàng khách hàng đã lưu</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {addresses.length === 0 ? (
              <div className="text-center py-8 text-slate-500 font-medium bg-slate-50 rounded-lg border border-dashed border-slate-200">
                Khách hàng này chưa lưu địa chỉ nào.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="relative p-4 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-colors shadow-sm">
                    {addr.isDefault && (
                      <Badge className="absolute -top-3 -right-2 bg-emerald-500 hover:bg-emerald-600">Mặc định</Badge>
                    )}
                    <h4 className="font-bold text-slate-900 mb-1">{addr.receiverName}</h4>
                    <p className="text-sm font-medium text-slate-600 mb-3">{addr.receiverPhone}</p>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {addr.streetAddress}<br />
                      {addr.ward}, {addr.district}, {addr.province}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lịch sử đơn hàng của khách hàng */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" /> Lịch sử đơn hàng ({orders.length})
            </CardTitle>
            <CardDescription>Toàn bộ các đơn hàng khách hàng này đã từng đặt</CardDescription>
          </div>
          <div className="text-sm font-bold text-slate-700">
            Tổng chi tiêu: <span className="text-blue-600 text-base">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0))}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/60">
                <TableHead className="w-20 font-bold text-slate-900">Mã ĐH</TableHead>
                <TableHead className="font-bold text-slate-900">Ngày đặt</TableHead>
                <TableHead className="font-bold text-slate-900">Địa chỉ giao</TableHead>
                <TableHead className="font-bold text-slate-900">Tổng tiền</TableHead>
                <TableHead className="font-bold text-slate-900">Trạng thái</TableHead>
                <TableHead className="text-right font-bold text-slate-900">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500 font-medium">
                    Khách hàng này chưa có đơn hàng nào.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id} className="hover:bg-slate-50/80">
                    <TableCell className="font-mono text-xs font-bold text-slate-700">#{o.id}</TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : '---'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 max-w-[220px] truncate" title={o.shippingAddress}>
                      {o.shippingAddress || '---'}
                    </TableCell>
                    <TableCell className="font-bold text-xs text-slate-900 whitespace-nowrap">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(o.totalAmount || 0)}
                    </TableCell>
                    <TableCell><AdminStatusBadge status={o.status} type="order" /></TableCell>
                    <TableCell className="text-right py-3 whitespace-nowrap">
                      <AdminViewButton href={`/admin/orders/${o.id}`} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
