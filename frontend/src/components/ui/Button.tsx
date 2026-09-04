import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'sm',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary:
        'bg-sky-600 hover:bg-sky-500 text-white shadow-xs shadow-sky-950/50 border border-sky-500/80 focus-visible:ring-2 focus-visible:ring-sky-400',
      secondary:
        'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 focus-visible:ring-2 focus-visible:ring-sky-400',
      outline:
        'bg-transparent hover:bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 focus-visible:ring-2 focus-visible:ring-sky-400',
      ghost:
        'bg-transparent hover:bg-slate-850 text-slate-400 hover:text-white border border-transparent',
      destructive:
        'bg-rose-600 hover:bg-rose-500 text-white shadow-xs shadow-rose-950/50 border border-rose-500/80 focus-visible:ring-2 focus-visible:ring-rose-400',
      success:
        'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs shadow-emerald-950/50 border border-emerald-500/80 focus-visible:ring-2 focus-visible:ring-emerald-400',
      link:
        'bg-transparent text-sky-400 hover:underline p-0 border-0 shadow-none hover:text-sky-300',
    }[variant];

    const sizeStyles = {
      xs: 'px-2 py-1 text-[11px] gap-1 rounded',
      sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
      md: 'px-4 py-2 text-sm gap-2 rounded-lg',
      lg: 'px-5 py-2.5 text-base gap-2.5 rounded-xl',
      icon: 'p-1.5 rounded-lg shrink-0',
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-medium transition-colors select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
