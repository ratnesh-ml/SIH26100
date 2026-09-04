import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  size = 'md',
  className = '',
}) => {
  const spinnerSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  }[size];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`p-12 text-center flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <Loader2 className={`${spinnerSizes} text-sky-400 animate-spin`} aria-hidden="true" />
      <span className="text-xs text-slate-400 font-medium tracking-wide">
        {message}
      </span>
      <span className="sr-only">{message}</span>
    </div>
  );
};

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-slate-800/70 ${className}`}
      {...props}
    />
  );
};
