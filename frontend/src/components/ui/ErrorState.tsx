import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'banner' | 'card';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An error occurred',
  message,
  onRetry,
  onDismiss,
  className = '',
  variant = 'banner',
}) => {
  if (variant === 'card') {
    return (
      <div
        role="alert"
        className={`p-8 rounded-2xl bg-rose-950/30 border border-rose-800/80 text-center flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}
      >
        <div className="p-3 rounded-2xl bg-rose-900/40 border border-rose-700/60 text-rose-400 mb-3">
          <AlertCircle className="w-6 h-6" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-bold text-rose-200 tracking-tight">{title}</h3>
        <p className="text-xs text-rose-400/90 mt-1 max-w-sm mx-auto leading-relaxed">
          {message}
        </p>
        {onRetry && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="mt-4"
          >
            Retry Action
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={`p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-xs text-rose-200 flex items-start justify-between gap-3 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          {title && <span className="font-semibold text-rose-300 mr-1">{title}:</span>}
          <span className="text-rose-200/90 break-words">{message}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            aria-label="Retry action"
            className="p-1 rounded text-rose-300 hover:text-white hover:bg-rose-900/60 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss error alert"
            className="p-1 rounded text-rose-400 hover:text-white hover:bg-rose-900/60 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
