import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`animate-pulse bg-slate-800/80 rounded-lg ${className}`} />;
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse flex flex-col gap-3">
      <div className="w-full aspect-video bg-slate-800 rounded-xl" />
      <div className="h-4 bg-slate-800 rounded w-3/4" />
      <div className="h-3 bg-slate-800/60 rounded w-1/2" />
    </div>
  );
};
