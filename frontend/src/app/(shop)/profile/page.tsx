'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { updateUser, logout } from '@/features/auth/authSlice';
import { profileApi, UserProfile } from '@/features/profile/services/profile.api';
import { addressApi, AddressItem, AddressPayload } from '@/features/profile/services/address.api';
import { toast } from 'sonner';
import { 
  User, 
  MapPin, 
  Lock, 
  LogOut, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  X, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Camera
} from 'lucide-react';
import Link from 'next/link';

type TabKey = 'profile' | 'address' | 'security';

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  // Tab State
  const initialTab = (searchParams.get('tab') as TabKey) || 'profile';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  // Profile Form State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    avatarUrl: '',
  });

  // Addresses State
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressPayload>({
    receiverName: '',
    receiverPhone: '',
    city: '',
    district: '',
    ward: '',
    addressLine: '',
    isDefault: false,
  });

  // Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabKey;
    if (tabParam && ['profile', 'address', 'security'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const data = await profileApi.getProfile();
      setProfile(data);
      setProfileForm({
        fullName: data.fullName || '',
        phone: data.phone || '',
        avatarUrl: data.avatarUrl || '',
      });
      dispatch(updateUser({
        id: data.id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
      }));
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        dispatch(logout());
        router.push('/login?redirect=/profile');
      } else {
        toast.error('Không thể tải thông tin cá nhân');
      }
    } finally {
      setProfileLoading(false);
    }
  }, [dispatch, router]);

  const loadAddresses = useCallback(async () => {
    setAddressesLoading(true);
    try {
      const data = await addressApi.getUserAddresses();
      setAddresses(data);
    } catch {
      // ignore
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  // Load Profile and Address on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vui lòng đăng nhập để truy cập thông tin tài khoản');
        router.push('/login?redirect=/profile');
        return;
      }
    }

    loadProfile();
    loadAddresses();
  }, [router, loadProfile, loadAddresses]);

  // 1. Handle Update Profile
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.fullName.trim()) {
      toast.error('Họ và tên không được để trống');
      return;
    }

    setProfileSaving(true);
    try {
      const updated = await profileApi.updateProfile({
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone.trim(),
        avatarUrl: profileForm.avatarUrl.trim() || undefined,
      });

      setProfile(updated);
      dispatch(updateUser({
        fullName: updated.fullName,
        phone: updated.phone,
        avatarUrl: updated.avatarUrl,
      }));
      toast.success('Cập nhật thông tin cá nhân thành công!');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      toast.error(apiErr.response?.data?.message || 'Cập nhật thông tin thất bại');
    } finally {
      setProfileSaving(false);
    }
  };

  // 2. Handle Address Modal Open (Create or Edit)
  const openCreateAddressModal = () => {
    setEditingAddressId(null);
    setAddressForm({
      receiverName: profile?.fullName || '',
      receiverPhone: profile?.phone || '',
      city: '',
      district: '',
      ward: '',
      addressLine: '',
      isDefault: addresses.length === 0,
    });
    setAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: AddressItem) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      receiverName: addr.receiverName || '',
      receiverPhone: addr.receiverPhone || '',
      city: addr.city || addr.province || '',
      district: addr.district || '',
      ward: addr.ward || '',
      addressLine: addr.addressLine || addr.streetAddress || '',
      isDefault: !!addr.isDefault,
    });
    setAddressModalOpen(true);
  };

  // 3. Handle Save Address
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.receiverName.trim() || !addressForm.receiverPhone.trim() || !addressForm.addressLine.trim()) {
      toast.error('Vui lòng điền các thông tin bắt buộc (*)');
      return;
    }

    setAddressSaving(true);
    try {
      if (editingAddressId) {
        await addressApi.updateAddress(editingAddressId, addressForm);
        toast.success('Cập nhật địa chỉ nhận hàng thành công!');
      } else {
        await addressApi.createAddress(addressForm);
        toast.success('Thêm địa chỉ nhận hàng mới thành công!');
      }
      setAddressModalOpen(false);
      loadAddresses();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      toast.error(apiErr.response?.data?.message || 'Lưu địa chỉ thất bại');
    } finally {
      setAddressSaving(false);
    }
  };

  // 4. Handle Delete Address
  const handleDeleteAddress = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ nhận hàng này?')) return;

    try {
      await addressApi.deleteAddress(id);
      toast.success('Đã xóa địa chỉ thành công');
      loadAddresses();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      toast.error(apiErr.response?.data?.message || 'Không thể xóa địa chỉ');
    }
  };

  // 5. Handle Set Default Address
  const handleSetDefaultAddress = async (id: number) => {
    try {
      await addressApi.setDefaultAddress(id);
      toast.success('Đã đặt làm địa chỉ mặc định');
      loadAddresses();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      toast.error(apiErr.response?.data?.message || 'Không thể đặt làm địa chỉ mặc định');
    }
  };

  // 6. Handle Change Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setPasswordSaving(true);
    try {
      const msg = await profileApi.changePassword(passwordForm);
      toast.success(msg || 'Đổi mật khẩu thành công!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      toast.error(apiErr.response?.data?.message || 'Đổi mật khẩu thất bại. Mật khẩu hiện tại không đúng.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Đã đăng xuất thành công');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-neutral-50/60 py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono uppercase tracking-wider mb-2">
            <Link href="/" className="hover:text-black">Trang chủ</Link>
            <span>/</span>
            <span className="text-black font-semibold">Tài khoản</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
                Tài Khoản Của Tôi
              </h1>
              <p className="text-xs text-neutral-500 mt-1">
                Quản lý thông tin hồ sơ, sổ địa chỉ và bảo mật tài khoản SEEME®
              </p>
            </div>
            
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 hover:text-red-600 text-xs font-bold uppercase tracking-wider transition-colors rounded-xs self-start sm:self-auto cursor-pointer"
            >
              <LogOut size={14} />
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Profile Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Quick Profile Summary Card */}
            <div className="bg-white p-6 border border-neutral-200 shadow-xs flex flex-col items-center text-center">
              <div className="relative group w-20 h-20 mb-3">
                {profile?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName || 'User'}
                    className="w-20 h-20 rounded-full object-cover border-2 border-black"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-neutral-900 text-white flex items-center justify-center text-2xl font-black font-sans uppercase">
                    {(profile?.fullName || 'U').charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                  <Camera size={18} className="text-white" />
                </div>
              </div>

              <h2 className="text-sm font-bold text-neutral-900 truncate max-w-full">
                {profile?.fullName || 'Khách hàng'}
              </h2>
              <p className="text-xs text-neutral-500 font-mono truncate max-w-full mt-0.5">
                {profile?.email}
              </p>

              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 text-[10px] font-mono uppercase tracking-wider text-neutral-700 rounded-full">
                <ShieldCheck size={12} className="text-emerald-500" />
                Thành viên SEEME
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="bg-white border border-neutral-200 p-2 shadow-xs space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors rounded-xs text-left cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-black text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <User size={16} />
                Thông tin cá nhân
              </button>

              <button
                onClick={() => setActiveTab('address')}
                className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors rounded-xs text-left cursor-pointer ${
                  activeTab === 'address'
                    ? 'bg-black text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <span className="flex items-center gap-3">
                  <MapPin size={16} />
                  Sổ địa chỉ ({addresses.length})
                </span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors rounded-xs text-left cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-black text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <Lock size={16} />
                Đổi mật khẩu
              </button>
            </nav>
          </div>

          {/* Right Main Content Pane */}
          <div className="lg:col-span-3">
            
            {/* TAB 1: THÔNG TIN CÁ NHÂN */}
            {activeTab === 'profile' && (
              <div className="bg-white border border-neutral-200 p-6 sm:p-8 shadow-xs">
                <div className="border-b border-neutral-200 pb-4 mb-6">
                  <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900">
                    Thông Tin Hồ Sơ Cá Nhân
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    Cập nhật họ tên, số điện thoại và đường dẫn ảnh đại diện của bạn
                  </p>
                </div>

                {profileLoading ? (
                  <div className="py-12 flex justify-center items-center">
                    <span className="w-6 h-6 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
                  </div>
                ) : (
                  <form onSubmit={handleProfileSubmit} className="space-y-5 max-w-xl">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                        Địa chỉ Email (Không thể thay đổi)
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          disabled
                          value={profile?.email || ''}
                          className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-100 border border-neutral-300 text-sm text-neutral-500 cursor-not-allowed select-none"
                        />
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                        Họ và tên *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={profileForm.fullName}
                          onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                          className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:border-black focus:bg-white focus:outline-none transition-all"
                          placeholder="Họ và tên của bạn"
                        />
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                        Số điện thoại
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:border-black focus:bg-white focus:outline-none transition-all"
                          placeholder="0912345678"
                          maxLength={11}
                        />
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                        Link ảnh đại diện (Avatar URL)
                      </label>
                      <input
                        type="url"
                        value={profileForm.avatarUrl}
                        onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:border-black focus:bg-white focus:outline-none transition-all placeholder:text-neutral-400"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>

                    <div className="pt-3">
                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {profileSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: SỔ ĐỊA CHỈ NHẬN HÀNG */}
            {activeTab === 'address' && (
              <div className="bg-white border border-neutral-200 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 mb-6 gap-3">
                  <div>
                    <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900">
                      Sổ Địa Chỉ Giao Hàng
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      Địa chỉ nhận hàng mặc định sẽ được ưu tiên khi bạn thanh toán đơn hàng
                    </p>
                  </div>
                  <button
                    onClick={openCreateAddressModal}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors rounded-xs self-start cursor-pointer"
                  >
                    <Plus size={15} />
                    Thêm địa chỉ mới
                  </button>
                </div>

                {addressesLoading ? (
                  <div className="py-12 flex justify-center items-center">
                    <span className="w-6 h-6 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-neutral-200 rounded-xs">
                    <MapPin size={32} className="mx-auto text-neutral-300 mb-3" />
                    <p className="text-sm font-bold text-neutral-700">Chưa có địa chỉ nhận hàng nào</p>
                    <p className="text-xs text-neutral-500 mt-1">Hãy thêm địa chỉ để việc mua hàng nhanh chóng và thuận tiện hơn.</p>
                    <button
                      onClick={openCreateAddressModal}
                      className="mt-4 px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Plus size={14} /> Thêm ngay
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-5 border transition-all ${
                          addr.isDefault
                            ? 'border-black bg-neutral-50/50'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-neutral-900">
                                {addr.receiverName}
                              </span>
                              <span className="text-xs text-neutral-500 font-mono">
                                ({addr.receiverPhone})
                              </span>
                              {addr.isDefault && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-xs">
                                  <CheckCircle2 size={11} /> Mặc định
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-neutral-700 leading-relaxed">
                              {addr.addressLine || addr.streetAddress}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {[addr.ward, addr.district, addr.city || addr.province].filter(Boolean).join(', ')}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                            {!addr.isDefault && (
                              <button
                                onClick={() => handleSetDefaultAddress(addr.id)}
                                className="px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:text-black border border-neutral-200 hover:border-black rounded-xs transition-colors cursor-pointer"
                              >
                                Đặt làm mặc định
                              </button>
                            )}
                            <button
                              onClick={() => openEditAddressModal(addr)}
                              className="p-1.5 text-neutral-500 hover:text-black transition-colors"
                              title="Sửa địa chỉ"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="p-1.5 text-neutral-500 hover:text-red-600 transition-colors"
                              title="Xóa địa chỉ"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ĐỔI MẬT KHẨU */}
            {activeTab === 'security' && (
              <div className="bg-white border border-neutral-200 p-6 sm:p-8 shadow-xs">
                <div className="border-b border-neutral-200 pb-4 mb-6">
                  <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900">
                    Bảo Mật & Đổi Mật Khẩu
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    Để đảm bảo an toàn, vui lòng không chia sẻ mật khẩu của bạn cho bất kỳ ai
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Mật khẩu hiện tại *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full pl-9 pr-10 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:border-black focus:bg-white focus:outline-none transition-all"
                        placeholder="••••••••"
                      />
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Mật khẩu mới *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:border-black focus:bg-white focus:outline-none transition-all"
                        placeholder="Tối thiểu 6 ký tự"
                      />
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Xác nhận mật khẩu mới *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:border-black focus:bg-white focus:outline-none transition-all"
                        placeholder="Nhập lại mật khẩu mới"
                      />
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {passwordSaving ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ADDRESS MODAL (POPUP) */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setAddressModalOpen(false)} />
          
          <div className="relative bg-white max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                {editingAddressId ? 'Cập Nhật Địa Chỉ Giao Hàng' : 'Thêm Địa Chỉ Giao Hàng Mới'}
              </h3>
              <button
                onClick={() => setAddressModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-black transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddressSubmit} className="mt-5 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Tên người nhận *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.receiverName}
                    onChange={(e) => setAddressForm({ ...addressForm, receiverName: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-xs focus:border-black focus:outline-none"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressForm.receiverPhone}
                    onChange={(e) => setAddressForm({ ...addressForm, receiverPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-xs focus:border-black focus:outline-none"
                    placeholder="0912345678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Tỉnh / TP *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-xs focus:border-black focus:outline-none"
                    placeholder="Hà Nội"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Quận / Huyện *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.district}
                    onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-xs focus:border-black focus:outline-none"
                    placeholder="Cầu Giấy"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Phường / Xã *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.ward}
                    onChange={(e) => setAddressForm({ ...addressForm, ward: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-xs focus:border-black focus:outline-none"
                    placeholder="Dịch Vọng Hậu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Địa chỉ chi tiết (Số nhà, tên đường, tòa nhà) *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.addressLine}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 text-xs focus:border-black focus:outline-none"
                  placeholder="Số 123 đường Xuân Thủy"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modalIsDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="h-3.5 w-3.5 accent-black rounded-xs border-neutral-300 cursor-pointer"
                />
                <label htmlFor="modalIsDefault" className="text-xs text-neutral-700 cursor-pointer select-none">
                  Đặt làm địa chỉ giao hàng mặc định
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black border border-neutral-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addressSaving}
                  className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {addressSaving ? 'Đang lưu...' : 'Lưu Địa Chỉ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
