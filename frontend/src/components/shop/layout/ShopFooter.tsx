'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Phone, 
  Mail, 
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Truck,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function ShopFooter() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Vui lòng nhập địa chỉ email hợp lệ!');
      return;
    }
    toast.success('Đăng ký nhận tin thành công! Mã giảm giá DC10% đã được ghi nhận.');
    setEmail('');
  };

  return (
    <footer className="bg-black text-white border-t border-neutral-800">
      
      {/* 1. BENEFIT / VALUE PROPOSITION BAR */}
      <div className="border-b border-neutral-800 py-8 bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
            
            <div className="flex items-center sm:items-start gap-4 justify-center sm:justify-start">
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-sm text-white">
                <Truck size={24} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">GIAO HÀNG HỎA TỐC</h4>
                <p className="text-[12px] text-neutral-400 mt-1">Miễn phí cho đơn hàng từ 500.000₫</p>
              </div>
            </div>

            <div className="flex items-center sm:items-start gap-4 justify-center sm:justify-start">
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-sm text-white">
                <RotateCcw size={24} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">ĐỔI TRẢ TRONG 7 NGÀY</h4>
                <p className="text-[12px] text-neutral-400 mt-1">Thủ tục nhanh chóng, tiện lợi</p>
              </div>
            </div>

            <div className="flex items-center sm:items-start gap-4 justify-center sm:justify-start">
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-sm text-white">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">CHÍNH HÃNG 100%</h4>
                <p className="text-[12px] text-neutral-400 mt-1">Sản phẩm SEEME chính hãng nguyên tem</p>
              </div>
            </div>

            <div className="flex items-center sm:items-start gap-4 justify-center sm:justify-start">
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-sm text-white">
                <Sparkles size={24} className="text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">TÌM ĐỒ BẰNG AI</h4>
                <p className="text-[12px] text-neutral-400 mt-1">Fashion-CLIP tìm kiếm đa phương thức</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. MAIN FOOTER CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Manifesto & Info */}
          <div className="lg:col-span-2 space-y-4">
            <span className="text-2xl font-black uppercase tracking-tight text-white block">
              SEEME®
            </span>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
              Ra đời với tuyên ngôn tự do định hình phong cách cá nhân, SEEME mang đến làn sóng thời trang Streetwear trẻ trung, đậm tính thẩm mỹ đương đại. Tiên phong trải nghiệm mua sắm thông minh với hệ sinh thái AI Fashion-CLIP.
            </p>
            
            <div className="space-y-2 text-xs text-neutral-300 pt-2">
              <p className="flex items-center gap-2">
                <MapPin size={15} className="text-neutral-400 shrink-0" />
                <span>Trụ sở: 17 Bắc Hải, P. 15, Quận 10, TP. Hồ Chí Minh</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone size={15} className="text-neutral-400 shrink-0" />
                <span>Hotline: 1900 633 459 (9:00 - 22:00)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail size={15} className="text-neutral-400 shrink-0" />
                <span>Email: contact@seeme.vn</span>
              </p>
            </div>

            {/* Social icons */}
            <div className="flex items-center space-x-3 pt-3">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-sm bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-sm bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.6 5H18V0h-3.808C10.597 0 9 1.583 9 4.615V8z"/>
                </svg>
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-sm bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                aria-label="YouTube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Cửa hàng Flagship */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white border-l-2 border-white pl-2">
              HỆ THỐNG CỬA HÀNG
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <strong className="text-white block font-semibold">TP. HỒ CHÍ MINH</strong>
                17 Bắc Hải, Phường 15, Quận 10
              </li>
              <li>
                <strong className="text-white block font-semibold">HÀ NỘI</strong>
                49-51 Hàng Bông, Phường Hàng Bông, Quận Hoàn Kiếm
              </li>
              <li>
                <strong className="text-white block font-semibold">ĐÀ NẴNG</strong>
                28 Lê Duẩn, Phường Hải Châu 1, Quận Hải Châu
              </li>
            </ul>
          </div>

          {/* Trợ giúp & Chính sách */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white border-l-2 border-white pl-2">
              CHÍNH SÁCH & HỖ TRỢ
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  Chính sách đổi trả trong 7 ngày
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  Bảng quy đổi kích cỡ (Size Guide)
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  Hướng dẫn bảo quản quần áo
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-white transition-colors">
                  Danh sách sản phẩm yêu thích
                </Link>
              </li>
            </ul>
          </div>

          {/* Đăng ký nhận tin / SEEME Club */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white border-l-2 border-white pl-2">
              SEEME CLUB
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Đăng ký email để nhận thông tin về các đợt <strong>Drop BST mới</strong> và mã giảm <strong>10%</strong> cho đơn hàng đầu tiên.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn..."
                  className="w-full bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 text-xs px-3 py-2.5 rounded-sm focus:outline-none focus:border-white transition-colors pr-10"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-2.5 bg-white text-black hover:bg-neutral-200 transition-colors rounded-xs flex items-center justify-center"
                  aria-label="Submit"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
              <span className="text-[10px] text-neutral-500 block">
                * Không spam, hủy đăng ký bất cứ khi nào bạn muốn.
              </span>
            </form>
          </div>

        </div>

        {/* 3. COPYRIGHT & DISCLAIMER */}
        <div className="mt-12 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500">
          <p>© 2026 SEEME® VIETNAM. ALL RIGHTS RESERVED.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <span className="hover:text-neutral-400 cursor-pointer">Bảo mật thông tin</span>
            <span className="hover:text-neutral-400 cursor-pointer">Điều khoản sử dụng</span>
            <span className="hover:text-neutral-400 cursor-pointer">Powered by FashionCLIP AI</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
