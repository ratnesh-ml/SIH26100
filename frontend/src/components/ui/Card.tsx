import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'interactive' | 'alert';
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-900/70 border-slate-800/80 shadow-md',
    subtle: 'bg-slate-950/50 border-slate-850/60',
    interactive:
      'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90 transition-all cursor-pointer shadow-md',
    alert: 'bg-rose-950/40 border-rose-800/80 text-rose-200',
  }[variant];

  return (
    <div
      className={`rounded-xl border backdrop-blur-xs text-slate-100 ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`p-4 border-b border-slate-800/60 flex items-center justify-between gap-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <h3 className={`text-sm font-bold text-white tracking-tight leading-snug ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <p className={`text-xs text-slate-400 mt-0.5 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`p-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`p-3.5 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between gap-3 ${className}`} {...props}>
    {children}
  </div>
);
