'use client';

import React from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  badge?: string | number;
  children?: React.ReactNode;
}

export default function AdminPageHeader({
  title,
  description,
  badge,
  children,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 mb-6 border-b border-slate-200/80">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          {badge !== undefined && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className="flex items-center flex-wrap gap-2.5">
          {children}
        </div>
      )}
    </div>
  );
}
