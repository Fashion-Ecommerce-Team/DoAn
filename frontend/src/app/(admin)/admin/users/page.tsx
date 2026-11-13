'use client';

import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  ShoppingBag,
  User,
  Phone,
  Mail,
  Calendar
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
import AdminSearchBar from '@/features/admin/components/common/AdminSearchBar';
import AdminStatusBadge from '@/features/admin/components/common/AdminStatusBadge';
import AdminPageHeader from '@/features/admin/components/common/AdminPageHeader';
import { AdminViewButton, AdminToggleButton, AdminRoleButton, AdminDeleteButton } from '@/features/admin/components/common/AdminTableActions';
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
    loadUsers();
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


  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quản lý Khách hàng"
        description="Tra cứu thông tin tài khoản, quyền hạn, lịch sử mua hàng và địa chỉ giao hàng"
        badge={totalElements}
      />

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <AdminSearchBar
            placeholder="Tìm theo Tên, Email, Số điện thoại..."
            defaultValue={search}
            onSearch={(val) => {
              setSearch(val);
              setPage(0);
            }}
            className="w-full sm:max-w-md"
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
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="text-xs font-bold text-slate-700 py-3.5">Họ & Tên</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Email</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Số điện thoại</TableHead>
                <TableHead className="text-center text-xs font-bold text-slate-700">Vai trò</TableHead>
                <TableHead className="text-center text-xs font-bold text-slate-700">Trạng thái</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Ngày tạo</TableHead>
                <TableHead className="text-center text-xs font-bold text-slate-700">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 font-bold text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-3 border-[#0099FF] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Đang tải danh sách khách hàng...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <TableCell className="font-bold text-slate-900 text-xs">{user.fullName}</TableCell>
                    <TableCell className="font-medium text-slate-700 text-xs">{user.email}</TableCell>
                    <TableCell className="font-medium text-slate-700 text-xs">{user.phone || '---'}</TableCell>
                    <TableCell className="text-center">
                      <AdminStatusBadge status={user.roleId || 2} type="role" />
                    </TableCell>
                    <TableCell className="text-center">
                      <AdminStatusBadge status={user.status || ''} type="user" />
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs whitespace-nowrap">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '---'}
                    </TableCell>
                    <TableCell className="text-center space-x-1.5 whitespace-nowrap py-3">
                      <AdminViewButton onClick={() => openDetailModal(user)} />
                      <AdminToggleButton
                        active={user.status === 'ACTIVE'}
                        onToggle={() => handleUpdateStatus(user.id, user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                        activeLabel="Tạm khóa"
                        inactiveLabel="Mở khóa"
                      />
                      <AdminRoleButton onClick={() => openRoleDialog(user)} label="Phân quyền" />
                      <AdminDeleteButton onClick={() => handleDelete(user.id)} />
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
                    <Badge variant={selectedUser.roleId === 1 ? 'default' : 'secondary'} className={`mt-0.5 ${selectedUser.roleId === 1 ? 'bg-[#0099FF]' : ''}`}>
                      {selectedUser.roleId === 1 ? 'Quản trị viên' : 'Khách hàng'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Trạng thái tài khoản</span>
                    <div className="mt-0.5"><AdminStatusBadge status={selectedUser.status} type="user" /></div>
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
                              <AdminStatusBadge status={ord.status || ''} type="order" />
                            </TableCell>
                            <TableCell className="text-right">
                              <AdminViewButton href={`/admin/orders/${ord.id}`} />
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
