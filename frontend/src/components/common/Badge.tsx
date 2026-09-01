import React from 'react';
import { FileType } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
}) => {
  const variantStyles = {
    brand: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
};

export const FileTypeBadge: React.FC<{ type: FileType }> = ({ type }) => {
  const typeMap: Record<FileType, { label: string; variant: BadgeProps['variant'] }> = {
    IMAGE: { label: 'Image', variant: 'brand' },
    VIDEO: { label: 'Video', variant: 'danger' },
    AUDIO: { label: 'Audio', variant: 'warning' },
    PDF: { label: 'PDF', variant: 'danger' },
    DOCUMENT: { label: 'Doc', variant: 'brand' },
    SPREADSHEET: { label: 'Sheet', variant: 'success' },
    PRESENTATION: { label: 'Slides', variant: 'warning' },
    ARCHIVE: { label: 'Archive', variant: 'neutral' },
    OTHER: { label: 'File', variant: 'neutral' },
  };

  const config = typeMap[type] || { label: type, variant: 'neutral' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};
