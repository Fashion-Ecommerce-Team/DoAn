'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const LOOKBOOK_ITEMS = [
  {
    id: 1,
    title: 'NIGHT RUNNER HOODIE & CARGO',
    season: 'DROP 01 / SS26',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    link: '/products',
  },
  {
    id: 2,
    title: 'METALLIC BAG & GRAPHIC TEE',
    season: 'CYBER DROP / SS26',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    link: '/products',
  },
  {
    id: 3,
    title: 'ACID WASH VINTAGE LOOK',
    season: 'RAW EDITIONS / SS26',
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
    link: '/products',
  },
  {
    id: 4,
    title: 'RACING LEATHER JACKET',
    season: 'SPECIAL COLLAB / SS26',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
    link: '/products',
  },
];

export default function LookbookSection() {
  return (
    <section id="lookbook" className="py-20 bg-neutral-950 text-white border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400 block mb-1">
              EDITORIAL & LOOKBOOK
            </span>
            <h2 className="text-3xl sm:text-4xl font-black font-sans uppercase tracking-tight text-white">
              SEEME STREET CULTURE
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-lg">
              Không chỉ là trang phục, đây là tuyên ngôn về lối sống tự do, không ngừng phá vỡ giới hạn của thế hệ trẻ.
            </p>
          </div>
          
          <Link
            href="/products"
            className="mt-4 md:mt-0 px-5 py-2.5 bg-neutral-900 border border-neutral-700 hover:border-white text-xs font-bold uppercase tracking-widest text-white transition-all flex items-center gap-2 rounded-xs self-start"
          >
            KHÁM PHÁ CÁC BỘ PHỐI
            <ArrowUpRight size={15} />
          </Link>
        </div>

        {/* Lookbook Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {LOOKBOOK_ITEMS.map((item) => (
            <div 
              key={item.id}
              className="group relative flex flex-col bg-neutral-900 border border-neutral-800 overflow-hidden"
            >
              {/* Image with 4:5 aspect */}
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover object-center filter grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                
                {/* Season Tag */}
                <span className="absolute top-3 left-3 text-[10px] font-mono tracking-widest uppercase bg-black/70 backdrop-blur-xs text-white px-2 py-0.5 border border-white/20">
                  {item.season}
                </span>
              </div>

              {/* Title & Info */}
              <div className="p-4 bg-neutral-950 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  <span className="text-[11px] text-neutral-400 font-medium block mt-1">
                    Xem sản phẩm trong set &rarr;
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Brand Statement Banner */}
        <div className="mt-16 p-8 sm:p-12 border border-neutral-800 bg-neutral-900/50 rounded-xs text-center max-w-3xl mx-auto space-y-4">
          <span className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white">
            &ldquo;SEE ME, SEE MY STYLE, WE DEFINE OURSELVES.&rdquo;
          </span>
          <p className="text-xs text-neutral-400 leading-relaxed">
            SEEME tin rằng giá trị thực sự đến từ cá tính và sự tự do biểu đạt. Hãy tự tin diện những bộ trang phục phản ánh con người bạn nhất.
          </p>
        </div>

      </div>
    </section>
  );
}
