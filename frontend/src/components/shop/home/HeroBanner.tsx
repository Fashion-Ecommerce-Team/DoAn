'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroBannerProps {
  onOpenAiSearch?: () => void;
}

const SLIDES = [
  {
    id: 1,
    tag: 'SEEME SS26 COLLECTION',
    title: 'STREET CULTURE REVOLUTION',
    subtitle: 'Nổi loạn, tự do và tiên phong. Định hình phong cách thời trang đường phố thế hệ mới.',
    ctaText: 'KHÁM PHÁ NGAY',
    ctaLink: '/products',
    secondaryCtaText: 'TẤT CẢ SẢN PHẨM',
    bgImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 2,
    tag: 'NEW DROP THIS WEEK',
    title: 'Y2K CYBER MONOGRAM',
    subtitle: 'Họa tiết Monogram kinh điển kết hợp chất liệu nỉ bông định lượng cao 420GSM.',
    ctaText: 'XEM BỘ SƯU TẬP',
    ctaLink: '/products?category=hoodie-jacket',
    secondaryCtaText: 'TẤT CẢ SẢN PHẨM',
    bgImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 3,
    tag: 'CONTEMPORARY STREETWEAR',
    title: 'TIMELESS URBAN ESSENTIALS',
    subtitle: 'Những thiết kế tối giản, phom dáng rộng rãi mang đậm dấu ấn cá nhân của SEEME.',
    ctaText: 'MUA NGAY',
    ctaLink: '/products',
    secondaryCtaText: 'XEM SẢN PHẨM MỚI',
    bgImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=85',
  },
];

export default function HeroBanner({ onOpenAiSearch }: HeroBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (onOpenAiSearch) {
      // prop registered
    }
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentSlide];

  return (
    <div className="relative w-full h-[75vh] min-h-[500px] max-h-[800px] bg-neutral-950 overflow-hidden">
      {SLIDES.map((s, idx) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            } transition-transform duration-[7000ms]`}
        >
          <img
            src={s.bgImage}
            alt={s.title}
            className="w-full h-full object-cover object-center filter brightness-[0.65]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/40" />
        </div>
      ))}

      <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 sm:pb-20">
        <div className="max-w-2xl space-y-4">

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono tracking-widest uppercase rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {slide.tag}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-sans uppercase tracking-tight text-white leading-none">
            {slide.title}
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 font-normal leading-relaxed max-w-lg">
            {slide.subtitle}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href={slide.ctaLink}
              className="px-6 py-3.5 bg-white text-black hover:bg-neutral-200 text-xs font-black uppercase tracking-widest transition-all rounded-xs flex items-center gap-2 group shadow-lg"
            >
              {slide.ctaText}
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            {slide.secondaryCtaText && (
              <Link
                href="/products"
                className="px-5 py-3.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/30 text-xs font-black uppercase tracking-widest transition-all rounded-xs"
              >
                {slide.secondaryCtaText}
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* SLIDE NAVIGATION CONTROLS */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
          className="w-9 h-9 rounded-full bg-black/50 hover:bg-black border border-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex gap-1.5 px-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 transition-all duration-300 rounded-full ${i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40'
                }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}
          className="w-9 h-9 rounded-full bg-black/50 hover:bg-black border border-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight size={18} />
        </button>
      </div>

    </div>
  );
}
