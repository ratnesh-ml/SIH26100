import React from 'react';

export type StatusType =
  | 'PASS'
  | 'FAIL'
  | 'WARN'
  | 'REVIEW'
  | 'QUALIFY'
  | 'REJECT'
  | 'OVERRIDE'
  | 'SEEK CLARIFICATION'
  | 'PENDING'
  | 'VERIFIED'
  | 'FLAGGED'
  | 'DISCORDANT'
  | 'ACTIVE';

interface StatusChipProps {
  status: StatusType | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  size = 'md',
  showDot = true,
  className = '',
}) => {
  const norm = (status || '').toUpperCase().trim();

  let colors = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (['PASS', 'QUALIFY', 'COMPLIANT', 'VERIFIED', 'ACTIVE'].includes(norm)) {
    colors = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (['FAIL', 'REJECT', 'DISQUALIFIED', 'CRITICAL'].includes(norm)) {
    colors = 'bg-rose-50 text-rose-800 border-rose-200';
    dotColor = 'bg-rose-500';
  } else if (['WARN', 'REVIEW', 'PENDING', 'FLAGGED', 'DISCORDANT'].includes(norm)) {
    colors = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (norm === 'OVERRIDE') {
    colors = 'bg-blue-50 text-blue-800 border-blue-200';
    dotColor = 'bg-blue-600';
  } else if (norm.includes('CLARIFICATION')) {
    colors = 'bg-purple-50 text-purple-800 border-purple-200';
    dotColor = 'bg-purple-600';
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-1.5 py-0.2 text-[10px]'
      : size === 'lg'
      ? 'px-3 py-1 text-xs'
      : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-mono font-semibold uppercase tracking-wider border shadow-2xs ${colors} ${sizeClasses} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`}></span>}
      <span>{status}</span>
    </span>
  );
};
