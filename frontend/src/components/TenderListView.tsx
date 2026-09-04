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
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Procurement Tenders</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Notice Inviting Tenders (NIT) under Two-Bid System (GFR 2017 Rule 161)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={loadTenders}
            isLoading={loading}
            aria-label="Refresh Tenders List"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenCreateModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Tender
            </Button>
          )}
        </div>
      </div>

      {/* 2. Filter Status Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400 font-medium mr-1">Filter Status:</span>
        {['', 'ACTIVE', 'EVALUATING', 'CLOSED'].map((st) => (
          <button
            key={st || 'all'}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              statusFilter === st
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 font-semibold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {st || 'All Tenders'}
          </button>
        ))}
      </div>

      {loading && (
        <LoadingState
          message="Loading procurement tenders from database..."
          size="lg"
          className="rounded-xl bg-slate-900/40 border border-slate-800"
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
          icon={<FileText className="w-7 h-7 text-sky-400" />}
          title="No Tenders Found"
          description="There are currently no procurement tenders registered matching your filter criteria."
          action={
            canCreate ? (
              <Button
                variant="primary"
                onClick={onOpenCreateModal}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create First Tender
              </Button>
            ) : undefined
          }
        />
      )}

      {/* 3. Tenders Grid */}
      {!loading && !error && tenders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-sky-400 outline-none"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-sky-400 font-bold bg-sky-950/80 px-2.5 py-0.5 rounded-md border border-sky-800/80">
                    {t.nit_no}
                  </span>
                  <StatusChip status={t.status || 'ACTIVE'} size="xs" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-2 leading-snug">
                    {t.title}
                  </h3>
                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Est: {formatCurrency(t.estimated_value)}</span>
                    <span className="text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                      {t.portal}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80 text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{t.bidder_count} Bidders</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">{t.bid_due_date || 'Ongoing'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewMatrix(t);
                  }}
                  className="py-1 px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Open Compliance Evaluation Matrix"
                >
                  <Table className="w-3.5 h-3.5 text-sky-400" />
                  <span>Matrix</span>
                </button>

                {onViewGraph && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewGraph(t);
                    }}
                    className="py-1 px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Open Cross-Bidder Link Graph"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Graph</span>
                  </button>
                )}

                <div className="flex items-center gap-1 text-xs text-sky-400 group-hover:translate-x-1 transition-transform ml-auto">
                  <span>Roster</span>
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
