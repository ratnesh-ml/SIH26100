import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Activity,
  HelpCircle,
} from 'lucide-react';

export type ChipStatus =
  | 'PASS'
  | 'QUALIFIED'
  | 'FAIL'
  | 'NOT_QUALIFIED'
  | 'WARN'
  | 'REVIEW'
  | 'UNDER_EVALUATION'
  | 'PENDING'
  | 'RUNNING'
  | 'DONE'
  | 'FAILED'
  | 'QUEUED'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | string;

export interface StatusChipProps {
  status: ChipStatus;
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  score?: number;
  className?: string;
  showIcon?: boolean;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  label,
  size = 'sm',
  score,
  className = '',
  showIcon = true,
}) => {
  const normalized = (status || 'PENDING').toUpperCase();

  let bgClass = 'bg-slate-900/90 text-slate-400 border-slate-700/80';
  let IconComponent: React.ElementType = HelpCircle;
  let defaultLabel = label || normalized;

  switch (normalized) {
    case 'PASS':
    case 'QUALIFIED':
    case 'DONE':
      bgClass = 'bg-emerald-950/90 text-emerald-300 border-emerald-800/80';
      IconComponent = CheckCircle2;
      defaultLabel = label || (normalized === 'QUALIFIED' ? 'QUALIFIED' : 'PASS');
      break;

    case 'FAIL':
    case 'NOT_QUALIFIED':
    case 'FAILED':
      bgClass = 'bg-rose-950/90 text-rose-300 border-rose-800/80';
      IconComponent = XCircle;
      defaultLabel = label || (normalized === 'NOT_QUALIFIED' ? 'NOT QUALIFIED' : 'FAIL');
      break;

    case 'WARN':
      bgClass = 'bg-amber-950/90 text-amber-300 border-amber-800/80';
      IconComponent = AlertTriangle;
      defaultLabel = label || 'WARN';
      break;

    case 'REVIEW':
    case 'UNDER_EVALUATION':
      bgClass = 'bg-yellow-950/90 text-yellow-300 border-yellow-800/80';
      IconComponent = AlertCircle;
      defaultLabel = label || (normalized === 'UNDER_EVALUATION' ? 'UNDER EVAL' : 'REVIEW');
      break;

    case 'PENDING':
    case 'QUEUED':
      bgClass = 'bg-slate-900/90 text-slate-400 border-slate-800';
      IconComponent = Clock;
      defaultLabel = label || normalized;
      break;

    case 'RUNNING':
      bgClass = 'bg-sky-950/90 text-sky-300 border-sky-800/80';
      IconComponent = Activity;
      defaultLabel = label || 'PROCESSING';
      break;

    case 'LOW':
      bgClass = 'bg-emerald-950/90 text-emerald-300 border-emerald-800/80';
      IconComponent = ShieldCheck;
      defaultLabel = label || (score !== undefined ? `LOW RISK (${score})` : 'LOW RISK');
      break;

    case 'MEDIUM':
      bgClass = 'bg-amber-950/90 text-amber-300 border-amber-800/80';
      IconComponent = AlertTriangle;
      defaultLabel = label || (score !== undefined ? `MEDIUM RISK (${score})` : 'MEDIUM RISK');
      break;

    case 'HIGH':
      bgClass = 'bg-rose-950/90 text-rose-300 border-rose-800/80';
      IconComponent = ShieldAlert;
      defaultLabel = label || (score !== undefined ? `HIGH RISK (${score})` : 'HIGH RISK');
      break;

    default:
      bgClass = 'bg-slate-900/90 text-slate-400 border-slate-800';
      IconComponent = HelpCircle;
      defaultLabel = label || normalized;
      break;
  }

  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-[9px] gap-1',
    sm: 'px-2 py-0.5 text-[11px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-2',
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  }[size];

  return (
    <span
      role="status"
      aria-label={`Status: ${defaultLabel}`}
      className={`inline-flex items-center font-bold font-mono tracking-tight uppercase rounded-md border shadow-xs transition-colors shrink-0 ${bgClass} ${sizeStyles} ${className}`}
    >
      {showIcon && <IconComponent className={`${iconSizes} shrink-0`} aria-hidden="true" />}
      <span>{defaultLabel}</span>
    </span>
  );
};
