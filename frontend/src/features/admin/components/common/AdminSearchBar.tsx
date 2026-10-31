'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/features/admin/components/ui/input';
import { Button } from '@/features/admin/components/ui/button';

interface AdminSearchBarProps {
  placeholder?: string;
  defaultValue?: string;
  onSearch: (value: string) => void;
  className?: string;
  showButton?: boolean;
  buttonText?: string;
}

export default function AdminSearchBar({
  placeholder = 'Tìm kiếm...',
  defaultValue = '',
  onSearch,
  className = '',
  showButton = true,
  buttonText = 'Tìm kiếm',
}: AdminSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(defaultValue);

  useEffect(() => {
    setSearchTerm(defaultValue);
  }, [defaultValue]);

  const handleSearch = () => {
    onSearch(searchTerm.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex-1 min-w-[200px]">
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pr-8 bg-slate-50 focus:bg-white border-slate-200 text-slate-900 rounded-xl text-xs sm:text-sm"
        />
        {searchTerm ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60 transition-colors"
            title="Xóa tìm kiếm"
            aria-label="Xóa nội dung tìm kiếm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0099FF] p-0.5 transition-colors"
            title="Nhấn để tìm kiếm"
            aria-label="Tìm kiếm"
          >
            <Search className="w-4 h-4" />
          </button>
        )}
      </div>

      {showButton && (
        <Button
          type="button"
          onClick={handleSearch}
          className="font-bold flex items-center gap-1.5 px-3.5 py-2 text-xs h-10 rounded-xl flex-shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{buttonText}</span>
        </Button>
      )}
    </div>
  );
}
