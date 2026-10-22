'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  ShoppingBag,
  User,
  Phone,
  Mail,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@admin/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@admin/components/ui/table';
import { Badge } from '@admin/components/ui/badge';
import { Button } from '@admin/components/ui/button';
import { Input } from '@admin/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@admin/components/ui/select';
import { getUsers, updateUserStatus, deleteUser, updateUserRole, getUserAddresses, getOrders } from '@admin/services';
import { UserResponse, UserAddressResponse, OrderResponse } from '@admin/types';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@admin/components/ui/dialog';
import { Label } from '@admin/components/ui/label';

export default function UserPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [status, setStatus] = useState('ALL');

  // Role Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [selectedRole, setSelectedRole] = useState('2'); // default USER
  const [saving, setSaving] = useState(false);

  // Detail Modal state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'addresses' | 'orders'>('info');
  const [addresses, setAddresses] = useState<UserAddressResponse[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers(page, 10, search.trim() || undefined, status);
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      toast.error('Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, status, page]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    if (confirm('Bạn có chắc chắn muốn thay đổi trạng thái tài khoản này?')) {
      try {
        await updateUserStatus(id, newStatus);
        toast.success('Cập nhật trạng thái thành công');
        loadUsers();
      } catch {
        toast.error('Lỗi khi cập nhật trạng thái');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await deleteUser(id);
        toast.success('Xóa người dùng thành công');
        loadUsers();
      } catch {
        toast.error('Lỗi khi xóa người dùng');
      }
    }
  };

  const openRoleDialog = (user: UserResponse) => {
    setEditingUser(user);
    setSelectedRole(user.roleId?.toString() || '2');
    setIsDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      await updateUserRole(editingUser.id, parseInt(selectedRole));
      toast.success('Cập nhật phân quyền thành công');
      setIsDialogOpen(false);
      loadUsers();
    } catch {
      toast.error('Lỗi khi cập nhật quyền');
    } finally {
      setSaving(false);
    }
  };

  const openDetailModal = async (user: UserResponse) => {
    setSelectedUser(user);
    setActiveTab('info');
    setIsDetailOpen(true);

    // Tải danh sách địa chỉ
    setAddressesLoading(true);
    try {
      const addressData = await getUserAddresses(user.id);
      setAddresses(addressData || []);
    } catch (err) {
      console.error('Lỗi khi tải địa chỉ khách hàng', err);
      setAddresses([]);
    } finally {
      setAddressesLoading(false);
    }

    // Tải lịch sử đơn hàng
    setOrdersLoading(true);
    try {
      const ordersData = await getOrders(0, 50, undefined, 'ALL', user.id);
      setOrders(ordersData.content || []);
    } catch (err) {
      console.error('Lỗi khi tải đơn hàng của khách hàng', err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getOrderStatusBadge = (statusStr: string) => {
    const baseClass = "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold shadow-sm whitespace-nowrap";
    switch (statusStr) {
      case 'PENDING':
        return <span className={`${baseClass} bg-amber-500 text-white`}>Chờ xử lý</span>;
      case 'CONFIRMED':
        return <span className={`${baseClass} bg-indigo-600 text-white`}>Đã xác nhận</span>;
      case 'SHIPPED':
        return <span className={`${baseClass} bg-blue-600 text-white`}>Đang giao</span>;
      case 'COMPLETED':
        return <span className={`${baseClass} bg-green-600 text-white`}>Hoàn thành</span>;
      case 'CANCELLED':
        return <span className={`${baseClass} bg-red-600 text-white`}>Đã hủy</span>;
      default:
        return <span className={`${baseClass} bg-slate-500 text-white`}>{statusStr || '---'}</span>;
    }
  };

  const getStatusBadge = (statusStr: string) => {
    const baseClass = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm";
    switch (statusStr) {
      case 'ACTIVE': return <span className={`${baseClass} bg-green-600 text-white`}>Hoạt động</span>;
      case 'INACTIVE': return <span className={`${baseClass} bg-slate-500 text-white`}>Tạm khóa</span>;
      case 'DELETED': return <span className={`${baseClass} bg-red-600 text-white`}>Đã xóa</span>;
      default: return <span className={`${baseClass} bg-slate-500 text-white`}>{statusStr}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Khách hàng</h2>
          <p className="text-xs text-slate-500 mt-1">Tra cứu thông tin, lịch sử mua hàng và địa chỉ giao hàng của khách hàng</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Input
            placeholder="Tìm theo Tên, Email, Số điện thoại..."
            className="max-w-md border-slate-300 text-slate-900 bg-slate-50 focus:bg-white text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
            <SelectTrigger className="w-[180px] border-slate-300 text-xs font-semibold">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="ACTIVE">Hoạt động</SelectItem>
              <SelectItem value="INACTIVE">Tạm khóa</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-slate-900">Họ Tên</TableHead>
                <TableHead className="font-bold text-slate-900">Email</TableHead>
                <TableHead className="font-bold text-slate-900">Số điện thoại</TableHead>
                <TableHead className="text-center font-bold text-slate-900">Vai trò</TableHead>
                <TableHead className="text-center font-bold text-slate-900">Trạng thái</TableHead>
                <TableHead className="font-bold text-slate-900">Ngày tạo</TableHead>
                <TableHead className="text-center font-bold text-slate-900">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 font-bold text-slate-700">Đang tải danh sách khách hàng...</TableCell>
                </TableRow>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-bold text-slate-900">{user.fullName}</TableCell>
                    <TableCell className="font-medium text-slate-700">{user.email}</TableCell>
                    <TableCell className="font-medium text-slate-700">{user.phone || '---'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={user.roleId === 1 ? 'default' : 'secondary'} className={user.roleId === 1 ? 'bg-indigo-600' : ''}>
                        {user.roleId === 1 ? 'Quản trị viên' : 'Khách hàng'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-slate-500 text-sm whitespace-nowrap">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '---'}</TableCell>
                    <TableCell className="text-center space-x-1.5 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailModal(user)}
                        className="font-bold border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Chi tiết
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(user.id, user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                        className="font-bold text-slate-700 hover:bg-slate-50"
                      >
                        {user.status === 'ACTIVE' ? 'Tạm khóa' : 'Mở khóa'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openRoleDialog(user)} className="font-bold">
                        Phân quyền
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id)} className="font-bold">
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 font-bold text-slate-700">
                    Không tìm thấy dữ liệu khách hàng phù hợp
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 0 && (
            <div className="flex items-center justify-between mt-4 border-t pt-4">
              <div className="text-sm font-medium text-slate-500">
                Tổng số: {totalElements} khách hàng
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium text-slate-700">Trang {page + 1} / {totalPages}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1 || loading}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Phân quyền */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phân quyền Khách hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tên khách hàng</Label>
              <Input value={editingUser?.fullName || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Vai trò</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Quản trị viên</SelectItem>
                  <SelectItem value="2">Khách hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveRole} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu lại'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Xem chi tiết Khách hàng (Hồ sơ, Sổ địa chỉ & Lịch sử đơn hàng) */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                {selectedUser?.avatarUrl ? (
                  <img src={selectedUser.avatarUrl} alt={selectedUser.fullName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  selectedUser?.fullName?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              <div>
                <DialogTitle className="text-lg">Chi tiết Khách hàng: {selectedUser?.fullName}</DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5">{selectedUser?.email} • ID: {selectedUser?.id}</p>
              </div>
            </div>
          </DialogHeader>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b pb-2 pt-2">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${activeTab === 'info' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <User className="w-3.5 h-3.5" /> Thông tin cá nhân
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${activeTab === 'addresses' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <MapPin className="w-3.5 h-3.5" /> Sổ địa chỉ ({addresses.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Lịch sử đơn hàng ({orders.length})
            </button>
          </div>

          <div className="py-3">
            {/* TAB 1: THÔNG TIN CÁ NHÂN */}
            {activeTab === 'info' && selectedUser && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-400 block">Họ và tên</span>
                    <span className="font-bold text-slate-800 text-base">{selectedUser.fullName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Địa chỉ Email</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedUser.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Số điện thoại</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedUser.phone || 'Chưa cập nhật'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-400 block">Vai trò hệ thống</span>
                    <Badge variant={selectedUser.roleId === 1 ? 'default' : 'secondary'} className={`mt-0.5 ${selectedUser.roleId === 1 ? 'bg-indigo-600' : ''}`}>
                      {selectedUser.roleId === 1 ? 'Quản trị viên' : 'Khách hàng'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Trạng thái tài khoản</span>
                    <div className="mt-0.5">{getStatusBadge(selectedUser.status)}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Ngày tham gia hệ thống</span>
                    <span className="font-medium text-slate-600 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString('vi-VN') : '---'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SỔ ĐỊA CHỈ */}
            {activeTab === 'addresses' && (
              <div className="space-y-3">
                {addressesLoading ? (
                  <div className="text-center py-8 text-slate-500 text-sm">Đang tải danh sách địa chỉ...</div>
                ) : addresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="p-3.5 rounded-lg border bg-white shadow-xs space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">{addr.receiverName}</span>
                          {addr.isDefault && (
                            <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {addr.receiverPhone}
                        </div>
                        <div className="text-xs text-slate-700 flex items-start gap-1.5 leading-relaxed">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                          <span>{addr.streetAddress}, {addr.ward}, {addr.district}, {addr.province}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-lg border">
                    Khách hàng này chưa lưu địa chỉ nhận hàng nào.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: LỊCH SỬ ĐƠN HÀNG */}
            {activeTab === 'orders' && (
              <div className="space-y-3">
                {ordersLoading ? (
                  <div className="text-center py-8 text-slate-500 text-sm">Đang tải lịch sử đơn hàng...</div>
                ) : orders.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-bold text-slate-900">Mã đơn</TableHead>
                          <TableHead className="font-bold text-slate-900">Ngày đặt</TableHead>
                          <TableHead className="font-bold text-slate-900">Người nhận</TableHead>
                          <TableHead className="font-bold text-slate-900">Tổng tiền</TableHead>
                          <TableHead className="text-center font-bold text-slate-900">Trạng thái</TableHead>
                          <TableHead className="text-right font-bold text-slate-900">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((ord) => (
                          <TableRow key={ord.id}>
                            <TableCell className="font-bold text-slate-900">{ord.id}</TableCell>
                            <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                              {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('vi-VN') : '---'}
                            </TableCell>
                            <TableCell>
                              <div className="text-xs font-semibold text-slate-800">{ord.receiverName}</div>
                              <div className="text-[11px] text-slate-500">{ord.receiverPhone}</div>
                            </TableCell>
                            <TableCell className="font-bold text-sm text-red-600 whitespace-nowrap">
                              {formatCurrency(ord.totalAmount)}
                            </TableCell>
                            <TableCell className="text-center">
                              {getOrderStatusBadge(ord.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild className="text-xs text-blue-600 hover:text-blue-800 h-7 px-2">
                                <Link href={`/admin/orders/${ord.id}`} target="_blank">
                                  Xem đơn <ExternalLink className="w-3 h-3 ml-1" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-lg border">
                    Khách hàng này chưa có đơn hàng nào trong hệ thống.
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
