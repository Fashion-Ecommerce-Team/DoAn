'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const CATEGORIES = [
  {
    id: 1,
    name: 'ÁO THUN (TEES)',
    slug: 'ao-thun',
    itemCount: '45+ ITEMS',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    colSpan: 'col-span-1 md:col-span-2',
  },
  {
    id: 2,
    name: 'HOODIE & JACKETS',
    slug: 'hoodie-jacket',
    itemCount: '32+ ITEMS',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    colSpan: 'col-span-1',
  },
  {
    id: 3,
    name: 'QUẦN STREETWEAR',
    slug: 'quan-dai',
    itemCount: '28+ ITEMS',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    colSpan: 'col-span-1',
  },
  {
    id: 4,
    name: 'PHỤ KIỆN & TÚI',
    slug: 'phu-kien',
    itemCount: '19+ ITEMS',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
    colSpan: 'col-span-1 md:col-span-2',
  },
];

export default function CategoryShowcase() {
  return (
    <section className="py-16 bg-neutral-50 border-y border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-neutral-300">
          <div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-500 block mb-1">
              CURATED COLLECTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-neutral-900">
              DANH MỤC NỔI BẬT
            </h2>
          </div>
          <Link
            href="/products"
            className="mt-3 sm:mt-0 text-xs font-bold uppercase tracking-widest text-neutral-900 hover:text-neutral-500 flex items-center gap-1 group"
          >
            XEM TẤT CẢ SẢN PHẨM
            <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className={`group relative h-72 sm:h-80 overflow-hidden rounded-xs bg-neutral-900 ${cat.colSpan}`}
            >
              {/* Background Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover object-center filter brightness-[0.75] group-hover:brightness-[0.6] group-hover:scale-105 transition-all duration-500"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Category Info */}
              <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-mono tracking-widest uppercase text-white/80 bg-white/10 backdrop-blur-xs px-2.5 py-1 rounded-xs">
                    {cat.itemCount}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                    <ArrowUpRight size={16} />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white group-hover:translate-x-1 transition-transform">
                    {cat.name}
                  </h3>
                  <span className="text-xs text-neutral-300 font-medium uppercase tracking-wider inline-block mt-1">
                    KHÁM PHÁ NGAY &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
