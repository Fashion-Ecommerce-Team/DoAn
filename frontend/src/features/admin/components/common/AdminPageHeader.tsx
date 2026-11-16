'use client';

import React from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  badge?: string | number;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export default function AdminPageHeader({
  title,
  description,
  badge,
  action,
  children,
}: AdminPageHeaderProps) {
  const actionsContent = action || children;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 mb-6 border-b border-slate-200/70">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            {title}
          </h1>
          {badge !== undefined && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-[#0077cc] border border-sky-200/80 shadow-xs">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl font-medium">
            {description}
          </p>
        )}
      </div>

      {actionsContent && (
        <div className="flex items-center flex-wrap gap-2.5">
          {actionsContent}
        </div>
      )}
    </div>
  );
}
