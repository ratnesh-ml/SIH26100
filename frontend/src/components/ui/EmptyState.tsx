import React from 'react';
import { HelpCircle } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      role="region"
      aria-label={title}
      className={`p-12 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}
    >
      <div className="p-3.5 rounded-2xl bg-slate-850/80 border border-slate-750/80 text-slate-400 mb-3.5 shadow-inner">
        {icon || <HelpCircle className="w-6 h-6 text-slate-500" />}
      </div>
      <h3 className="text-sm font-bold text-slate-200 tracking-tight">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
