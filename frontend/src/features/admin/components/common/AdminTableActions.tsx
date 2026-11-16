'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, Pencil, Trash2, Power, PowerOff, Shield } from 'lucide-react';

interface BaseActionProps {
  className?: string;
  disabled?: boolean;
  title?: string;
}

interface ActionButtonProps extends BaseActionProps {
  onClick?: () => void;
  href?: string;
  label?: string;
}

interface ToggleButtonProps extends BaseActionProps {
  active: boolean;
  onToggle: () => void;
  activeLabel?: string;
  inactiveLabel?: string;
}

export function AdminViewButton({ href, onClick, label = 'Chi tiết', className = '', disabled, title }: ActionButtonProps) {
  const content = (
    <>
      <Eye className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </>
  );

  const baseClasses = `h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all border border-sky-200 text-[#0077cc] bg-white hover:bg-sky-50 hover:text-[#005fa3] hover:border-sky-300 shadow-xs cursor-pointer ${
    disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
  } ${className}`;

  if (href) {
    return (
      <Link href={href} className={baseClasses} title={title}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={baseClasses} title={title}>
      {content}
    </button>
  );
}

export function AdminEditButton({ onClick, label = 'Sửa', className = '', disabled, title }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-xs cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
      } ${className}`}
    >
      <Pencil className="w-3.5 h-3.5 shrink-0 text-slate-500" />
      <span>{label}</span>
    </button>
  );
}

export function AdminDeleteButton({ onClick, label = 'Xóa', className = '', disabled, title }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
      } ${className}`}
    >
      <Trash2 className="w-3.5 h-3.5 shrink-0 text-white/90" />
      <span>{label}</span>
    </button>
  );
}

export function AdminToggleButton({
  active,
  onToggle,
  activeLabel = 'Tạm dừng',
  inactiveLabel = 'Kích hoạt',
  className = '',
  disabled,
  title,
}: ToggleButtonProps) {
  if (active) {
    return (
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        title={title}
        className={`h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all border border-amber-200 text-amber-700 bg-amber-50/70 hover:bg-amber-100 hover:text-amber-800 hover:border-amber-300 shadow-xs cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
        } ${className}`}
      >
        <PowerOff className="w-3.5 h-3.5 shrink-0" />
        <span>{activeLabel}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      title={title}
      className={`h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all border border-emerald-200 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300 shadow-xs cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
      } ${className}`}
    >
      <Power className="w-3.5 h-3.5 shrink-0" />
      <span>{inactiveLabel}</span>
    </button>
  );
}

export function AdminRoleButton({
  onClick,
  label = 'Đổi quyền',
  className = '',
  disabled,
  title,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all border border-blue-200 text-[#0077cc] bg-white hover:bg-sky-50 hover:text-[#005fa3] hover:border-blue-300 shadow-xs cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
      } ${className}`}
    >
      <Shield className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
