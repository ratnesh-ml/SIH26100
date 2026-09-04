import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, FileText, Users, Calendar, ArrowRight, Table, Share2 } from 'lucide-react';
import { fetchTenders } from '../api/client';
import { TenderSummary, User } from '../types';
import {
  StatusChip,
  Button,
  EmptyState,
  LoadingState,
  ErrorState,
} from './ui';

interface TenderListViewProps {
  currentUser: User;
  onSelectTender: (tender: TenderSummary) => void;
  onViewMatrix: (tender: TenderSummary) => void;
  onViewGraph?: (tender: TenderSummary) => void;
  onOpenCreateModal: () => void;
}

export const TenderListView: React.FC<TenderListViewProps> = ({
  currentUser,
  onSelectTender,
  onViewMatrix,
  onViewGraph,
  onOpenCreateModal,
}) => {
  const [tenders, setTenders] = useState<TenderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const canCreate = currentUser.role === 'officer' || currentUser.role === 'admin';

  const loadTenders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTenders(1, 50, statusFilter || undefined);
      setTenders(res.items || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve tenders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenders();
  }, [statusFilter]);

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
      val
    );
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e0e0e0]">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f]">
            Active Procurement Contracts
          </h1>
          <p className="text-sm text-[#7a7a7a] mt-1">
            Two-bid tenders published on GeM and CPPP under GFR 2017 statutory evaluation.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={loadTenders}
            isLoading={loading}
            aria-label="Refresh Tenders List"
            className="rounded-full bg-white border-[#e0e0e0] text-[#1d1d1f]"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          {canCreate && (
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-semibold shadow-xs apple-button-press transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create New Tender</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter Status Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[#7a7a7a] font-medium mr-1 uppercase tracking-wider">Filter:</span>
        {[
          { label: 'All Tenders', value: '' },
          { label: 'Goods Tenders (Active)', value: 'ACTIVE' },
          { label: 'Under Evaluation', value: 'EVALUATING' },
          { label: 'Certified / Closed', value: 'CLOSED' },
        ].map((f) => (
          <button
            key={f.value || 'all'}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer select-none ${
              statusFilter === f.value
                ? 'bg-white text-[#0066cc] border-2 border-[#0071e3] font-semibold shadow-xs'
                : 'bg-white border border-[#e0e0e0] text-[#7a7a7a] hover:text-[#1d1d1f]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <LoadingState
          message="Loading procurement tenders from database..."
          size="lg"
          className="rounded-2xl bg-white border border-[#e0e0e0] p-12"
        />
      )}

      {error && !loading && (
        <ErrorState
          title="Failed to load tenders"
          message={error}
          onRetry={loadTenders}
          variant="card"
        />
      )}

      {!loading && !error && tenders.length === 0 && (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-[#0066cc]" />}
          title="No Tenders Found"
          description="There are currently no procurement tenders registered matching your filter criteria."
          action={
            canCreate ? (
              <button
                onClick={onOpenCreateModal}
                className="px-5 py-2.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Create First Tender
              </button>
            ) : undefined
          }
        />
      )}

      {/* 3. Tenders Grid */}
      {!loading && !error && tenders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenders.map((t) => (
            <div
              key={t.id}
              tabIndex={0}
              role="button"
              onClick={() => onSelectTender(t)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectTender(t);
                }
              }}
              className="p-6 rounded-[18px] bg-white border border-[#e0e0e0] hover:border-[#0066cc] transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-[#0066cc] font-bold bg-[#f5f5f7] px-2.5 py-1 rounded-full border border-[#0066cc]/30">
                    {t.nit_no}
                  </span>
                  <StatusChip status={t.status || 'ACTIVE'} size="xs" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors line-clamp-2 leading-snug">
                    {t.title}
                  </h3>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#7a7a7a]">
                    <div className="p-2.5 rounded-xl bg-[#f5f5f7] border border-[#f0f0f0]">
                      <span className="block text-[10px] uppercase font-semibold text-[#7a7a7a]">Est. Value</span>
                      <strong className="text-sm font-semibold text-[#1d1d1f]">{formatCurrency(t.estimated_value)}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#f5f5f7] border border-[#f0f0f0]">
                      <span className="block text-[10px] uppercase font-semibold text-[#7a7a7a]">Portal</span>
                      <strong className="text-sm font-semibold text-[#1d1d1f]">{t.portal}</strong>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-[#f0f0f0] text-[#7a7a7a]">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#0066cc] shrink-0" />
                    <span className="font-medium text-[#1d1d1f]">{t.bidder_count} Bidders</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#0066cc] shrink-0" />
                    <span className="truncate">{t.bid_due_date || 'Ongoing Evaluation'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-[#f0f0f0] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewMatrix(t);
                  }}
                  className="py-1.5 px-3 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Open Compliance Evaluation Matrix"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Compliance Matrix →</span>
                </button>

                {onViewGraph && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewGraph(t);
                    }}
                    className="py-1.5 px-3 rounded-full bg-[#f5f5f7] hover:bg-white border border-[#e0e0e0] text-[#1d1d1f] text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Open Cross-Bidder Link Graph"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Link Graph</span>
                  </button>
                )}

                <div className="flex items-center gap-1 text-xs text-[#0066cc] group-hover:translate-x-1 transition-transform ml-auto font-medium">
                  <span>Filings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
