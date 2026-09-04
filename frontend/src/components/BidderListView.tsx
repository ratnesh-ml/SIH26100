import React, { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, ArrowRight, UserCheck, FileCheck, Table, Users, UploadCloud } from 'lucide-react';
import { fetchBidders } from '../api/client';
import { BidderSummary, TenderSummary } from '../types';
import {
  StatusChip,
  Button,
  EmptyState,
  LoadingState,
  ErrorState,
} from './ui';

interface BidderListViewProps {
  selectedTender: TenderSummary | null;
  onBackToTenders: () => void;
  onSelectBidder: (bidder: BidderSummary) => void;
  onViewMatrix?: () => void;
  onOpenUploadModal?: () => void;
  canUpload?: boolean;
}

export const BidderListView: React.FC<BidderListViewProps> = ({
  selectedTender,
  onBackToTenders,
  onSelectBidder,
  onViewMatrix,
  onOpenUploadModal,
  canUpload,
}) => {
  const [bidders, setBidders] = useState<BidderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBidders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchBidders(selectedTender?.id, 1, 50);
      setBidders(res.items || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve bidders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBidders();
  }, [selectedTender]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="xs"
            onClick={onBackToTenders}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            aria-label="Back to Tenders list"
          >
            Tenders
          </Button>

          <div className="h-5 w-px bg-slate-800" aria-hidden="true" />

          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {selectedTender ? `Participating Bidders — ${selectedTender.nit_no}` : 'All Registered Bidders'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedTender ? selectedTender.title : 'Global participating vendor evaluation roster'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {selectedTender && onViewMatrix && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewMatrix}
              leftIcon={<Table className="w-3.5 h-3.5 text-sky-400" />}
            >
              Compliance Matrix
            </Button>
          )}

          {canUpload && selectedTender && onOpenUploadModal && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenUploadModal}
              leftIcon={<UploadCloud className="w-4 h-4" />}
            >
              Upload Bidder Package
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={loadBidders}
            isLoading={loading}
            aria-label="Refresh Bidders"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {error && (
        <ErrorState
          title="Failed to load bidders roster"
          message={error}
          onRetry={loadBidders}
        />
      )}

      {loading && (
        <LoadingState
          message="Loading participating bidders and evaluation summaries..."
          size="lg"
          className="rounded-xl bg-slate-900/40 border border-slate-800"
        />
      )}

      {!loading && !error && bidders.length === 0 && (
        <EmptyState
          icon={<Users className="w-7 h-7 text-sky-400" />}
          title="No Bidders Enrolled"
          description="No participating vendors found for this tender. Upload bidder packages to begin evaluation."
          action={
            canUpload && onOpenUploadModal ? (
              <Button
                variant="primary"
                onClick={onOpenUploadModal}
                leftIcon={<UploadCloud className="w-4 h-4" />}
              >
                Upload First Bidder Package
              </Button>
            ) : undefined
          }
        />
      )}

      {/* 2. Bidders Card Grid */}
      {!loading && !error && bidders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bidders.map((b) => (
            <div
              key={b.id}
              tabIndex={0}
              role="button"
              onClick={() => onSelectBidder(b)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectBidder(b);
                }
              }}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-sky-400 outline-none"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <StatusChip status={b.overall_status} size="sm" />
                  <StatusChip status={b.risk_band} score={b.risk_score} size="sm" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors tracking-tight">
                    {b.canonical_name || b.declared_name}
                  </h3>
                  {b.canonical_name && b.canonical_name !== b.declared_name && (
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      Declared: &ldquo;{b.declared_name}&rdquo;
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <FileCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{b.document_count} Filings</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="capitalize">{b.review_state?.toLowerCase().replace('_', ' ') || 'Pending'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Open Cockpit</span>
                <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
