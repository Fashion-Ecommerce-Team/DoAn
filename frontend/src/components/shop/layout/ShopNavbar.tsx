'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Search, 
  Heart, 
  User, 
  Menu, 
  X, 
  LogOut, 
  MapPin
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/features/auth/authSlice';
import { toast } from 'sonner';

interface ShopNavbarProps {
  onOpenSearch?: () => void;
  wishlistCount?: number;
}

export default function ShopNavbar({ onOpenSearch, wishlistCount = 0 }: ShopNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const currentUser = user as { fullName?: string; email?: string; role?: string } | null;

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Đã đăng xuất thành công');
    router.push('/');
  };

  // Menu trái sang tiếng Việt
  const leftNavLinks = [
    { label: 'CỬA HÀNG', href: '/products' },
    { label: 'ÁO THUN', href: '/products?category=ao-thun' },
    { label: 'ÁO KHOÁC', href: '/products?category=hoodie-jacket' },
    { label: 'BỘ SƯU TẬP', href: '/#lookbook' },
  ];

  // Menu phải sang tiếng Việt
  const rightNavLinks = [
    { label: 'TIN TỨC', href: '/#lookbook' },
    { label: 'LIÊN HỆ', href: '/#contact' },
    { label: 'VỀ CHÚNG TÔI', href: '/#about' },
  ];

  return (
    <>
      {/* MAIN STICKY HEADER (DIRTY COINS STYLE) */}
      <header
        className={`sticky top-0 z-40 w-full bg-white transition-all duration-200 border-b border-neutral-300 ${
          isScrolled ? 'shadow-xs' : ''
        }`}
      >
        <div className="w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between">
          
          {/* 1. LEFT SECTION: NAVIGATION LINKS (Desktop) / HAMBURGER (Mobile) */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 -ml-1.5 text-neutral-900 hover:text-neutral-600 transition-colors lg:hidden"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Desktop Left Nav Links */}
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              {leftNavLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`text-[12px] font-semibold tracking-wider uppercase transition-colors hover:text-black ${
                      isActive ? 'text-black font-bold' : 'text-neutral-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 2. CENTER SECTION: BRAND LOGO */}
          <div className="flex flex-col items-center justify-center text-center">
            <Link 
              href="/" 
              className="group flex flex-col items-center justify-center leading-none"
            >
              <span className="text-xl sm:text-2xl lg:text-[26px] font-black font-sans uppercase tracking-tight text-neutral-950 group-hover:opacity-85 transition-opacity">
                SEEME®
              </span>
              <span className="text-[10px] font-medium tracking-normal text-neutral-800 lowercase mt-0.5">
                madeinvietnam
              </span>
            </Link>
          </div>

          {/* 3. RIGHT SECTION: RIGHT NAV LINKS & PILL-SHAPED ACTION BOX */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            
            {/* Desktop Right Nav Links */}
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              {rightNavLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-[12px] font-semibold tracking-wider uppercase text-neutral-700 hover:text-black transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* PILL-SHAPED ACTION CAPSULE (As seen in the screenshot) */}
            <div className="relative">
              <div className="flex items-center bg-neutral-200/70 hover:bg-neutral-200 border border-neutral-300 rounded-full px-3.5 py-1.5 gap-3.5 sm:gap-4 transition-colors shadow-2xs">
                
                {/* Search Button (Opens Search with Camera Image Search) */}
                <button
                  onClick={onOpenSearch}
                  className="text-neutral-800 hover:text-black transition-colors"
                  title="Tìm kiếm sản phẩm (Từ khóa hoặc bằng ảnh)"
                  aria-label="Search"
                >
                  <Search size={16} className="stroke-[2.2]" />
                </button>

                {/* User / Account Button */}
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="text-neutral-800 hover:text-black transition-colors"
                  title="Tài khoản cá nhân"
                  aria-label="Account"
                >
                  <User size={16} className="stroke-[2.2]" />
                </button>

                {/* Wishlist Link with Circular Badge Count */}
                <Link
                  href="/wishlist"
                  className="relative text-neutral-800 hover:text-black transition-colors flex items-center justify-center"
                  title="Danh sách yêu thích"
                  aria-label="Wishlist"
                >
                  <Heart size={16} className="stroke-[2.2]" />
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 bg-black text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {wishlistCount}
                  </span>
                </Link>
              </div>

              {/* User Account Dropdown Menu */}
              {userDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2.5 w-60 bg-white rounded-sm shadow-xl border border-neutral-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider">Tài khoản</p>
                        <p className="text-xs font-bold text-neutral-900 truncate mt-0.5">
                          {currentUser?.fullName || currentUser?.email}
                        </p>
                      </div>

                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                      >
                        <User size={14} className="mr-2 text-neutral-500" /> Thông tin cá nhân
                      </Link>

                      <Link
                        href="/profile?tab=address"
                        className="flex items-center px-4 py-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                      >
                        <MapPin size={14} className="mr-2 text-neutral-500" /> Sổ địa chỉ nhận hàng
                      </Link>

                      <Link
                        href="/wishlist"
                        className="flex items-center px-4 py-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                      >
                        <Heart size={14} className="mr-2 text-neutral-500" /> Sản phẩm yêu thích
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors border-t border-neutral-100"
                      >
                        <LogOut size={14} className="mr-2" /> Đăng xuất
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2 text-xs text-neutral-500">
                        Đăng nhập để xem danh sách yêu thích và lịch sử mua sắm.
                      </div>
                      <Link
                        href="/login"
                        className="block mx-3 my-1 py-2 text-center text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-colors rounded-xs"
                      >
                        Đăng Nhập
                      </Link>
                      <Link
                        href="/register"
                        className="block mx-3 my-1 py-2 text-center text-xs font-bold uppercase tracking-wider border border-black text-black hover:bg-neutral-100 transition-colors rounded-xs"
                      >
                        Đăng Ký Tài Khoản
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* 4. MOBILE SLIDE-OUT MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-250">
            <div className="p-5 flex items-center justify-between border-b border-neutral-200">
              <div className="flex flex-col">
                <span className="text-lg font-black uppercase tracking-tight text-neutral-900 leading-none">
                  SEEME®
                </span>
                <span className="text-[9px] font-medium text-neutral-500 lowercase mt-0.5">
                  madeinvietnam
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-neutral-600 hover:text-black"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
              {/* Quick Search trigger in drawer */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSearch?.();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xs bg-neutral-100 text-xs font-bold uppercase tracking-wider text-neutral-800 hover:bg-neutral-200 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Search size={15} /> Tìm kiếm sản phẩm
                </span>
              </button>

              {/* Navigation links */}
              <div className="space-y-1 pt-2">
                {[...leftNavLinks, ...rightNavLinks].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block py-3 text-xs font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-100 hover:text-black hover:pl-1 transition-all"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Extra Account links */}
              <div className="pt-4 space-y-2">
                <Link
                  href="/wishlist"
                  className="flex items-center justify-between py-2 text-xs font-bold uppercase tracking-wider text-neutral-800"
                >
                  <span className="flex items-center gap-2">
                    <Heart size={15} /> Sản phẩm yêu thích
                  </span>
                  <span className="bg-black text-white px-2 py-0.5 rounded-full text-[10px]">
                    {wishlistCount}
                  </span>
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center gap-2 py-2 text-xs font-bold uppercase tracking-wider text-neutral-800"
                >
                  <User size={15} /> Thông tin cá nhân & Sổ địa chỉ
                </Link>
              </div>
            </div>

            {/* Bottom Auth Buttons */}
            <div className="p-5 border-t border-neutral-200">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 text-center text-xs font-bold uppercase tracking-wider border border-red-500 text-red-600 rounded-xs"
                >
                  Đăng Xuất ({currentUser?.fullName || 'Tài khoản'})
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    className="py-2.5 text-center text-xs font-bold uppercase tracking-wider bg-black text-white rounded-xs"
                  >
                    Đăng Nhập
                  </Link>
                  <Link
                    href="/register"
                    className="py-2.5 text-center text-xs font-bold uppercase tracking-wider border border-black text-black rounded-xs"
                  >
                    Đăng Ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
