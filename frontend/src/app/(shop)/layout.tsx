'use client';

import React, { useState, useEffect } from 'react';
import ShopNavbar from '@/components/shop/layout/ShopNavbar';
import ShopFooter from '@/components/shop/layout/ShopFooter';
import MultimodalSearchModal from '@/components/shop/search/MultimodalSearchModal';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/features/auth/authSlice';
import { wishlistApi } from '@/features/shop/services/wishlist.api';

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Hydrate auth from localStorage on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          dispatch(setCredentials({ user, token }));
        } catch {
          // ignore
        }
      }
    }
    
    // Fetch initial wishlist count if token exists
    const token = localStorage.getItem('token');
    if (token) {
      wishlistApi.getWishlist(0, 1)
        .then((data) => {
          if (data?.totalElements !== undefined) {
            setWishlistCount(data.totalElements);
          }
        })
        .catch(() => {
          // ignore if unauthenticated or error
        });
    }
  }, [dispatch]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navbar Placeholder */}
      <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm sticky top-0 z-50">
        <div className="text-2xl font-bold text-slate-800">Seeme</div>
        <nav>
          <ul className="flex space-x-6 text-slate-600">
            <li className="hover:text-blue-600 cursor-pointer">Trang chủ</li>
            <li className="hover:text-blue-600 cursor-pointer">Sản phẩm</li>
            <li className="hover:text-blue-600 cursor-pointer">Giỏ hàng</li>
          </ul>
        </nav>
      </header>
    <div className="flex flex-col min-h-screen bg-white text-neutral-900 selection:bg-black selection:text-white">
      {/* Sticky Dirty Coins Navbar */}
      <ShopNavbar 
        onOpenSearch={() => setSearchModalOpen(true)}
        wishlistCount={wishlistCount}
      />

      {/* Main Page Content */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Footer Placeholder */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center">
        <p>&copy; 2026 Seeme. All rights reserved.</p>
      </footer>
      {/* Streetwear Footer */}
      <ShopFooter />

      {/* Multimodal AI Search Modal */}
      <MultimodalSearchModal 
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </div>
  );
}
