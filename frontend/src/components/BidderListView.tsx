import React, { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, AlertCircle, Loader2, ShieldAlert, ArrowRight, UserCheck, FileCheck, Table } from 'lucide-react';
import { fetchBidders } from '../api/client';
import { BidderSummary, TenderSummary } from '../types';

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80';
      case 'WARN':
        return 'bg-amber-950/80 text-amber-400 border-amber-800/80';
      case 'REVIEW':
        return 'bg-yellow-950/80 text-yellow-400 border-yellow-800/80';
      case 'FAIL':
        return 'bg-rose-950/80 text-rose-400 border-rose-800/80';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getRiskColor = (band: string) => {
    switch (band) {
      case 'HIGH':
        return 'text-rose-400';
      case 'MEDIUM':
        return 'text-amber-400';
      default:
        return 'text-emerald-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToTenders}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tenders</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              {selectedTender ? `Participating Bidders — ${selectedTender.nit_no}` : 'All Registered Bidders'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedTender ? selectedTender.title : 'Global participating vendor evaluation roster'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadBidders}
            disabled={loading}
            title="Refresh Bidders"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {selectedTender && onViewMatrix && (
            <button
              onClick={onViewMatrix}
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Table className="w-3.5 h-3.5 text-sky-400" />
              <span>Compliance Matrix</span>
            </button>
          )}

          {canUpload && selectedTender && onOpenUploadModal && (
            <button
              onClick={onOpenUploadModal}
              className="py-2 px-3.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-sky-950"
            >
              <span>Upload Bidder Package (ZIP/PDF)</span>
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="p-12 rounded-xl bg-slate-900/40 border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Loading bidder records & risk profiles...</span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 text-xs text-rose-300">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">Failed to load bidders</p>
            <p className="mt-0.5 text-rose-400">{error}</p>
            <button
              onClick={loadBidders}
              className="mt-2.5 px-3 py-1 bg-rose-900/60 hover:bg-rose-900 text-rose-200 rounded font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && bidders.length === 0 && (
        <div className="p-12 rounded-xl bg-slate-900/40 border border-slate-800 text-center">
          <div className="p-3 rounded-full bg-slate-800/80 text-slate-500 inline-block mb-3">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">No bidders found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No participating vendors have submitted documents for this tender yet.
          </p>
        </div>
      )}

      {!loading && !error && bidders.length > 0 && (
        <div className="border border-slate-800 rounded-xl bg-slate-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Bidder Legal Identity</th>
                  <th className="py-3 px-4">Compliance Status</th>
                  <th className="py-3 px-4">Composite Risk</th>
                  <th className="py-3 px-4">Review State</th>
                  <th className="py-3 px-4">Documents</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {bidders.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-100">
                        {b.canonical_name || b.declared_name}
                      </div>
                      {b.canonical_name && b.canonical_name !== b.declared_name && (
                        <div className="text-[11px] text-slate-500 truncate">
                          Declared: {b.declared_name}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(
                          b.overall_status
                        )}`}
                      >
                        {b.overall_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <ShieldAlert className={`w-3.5 h-3.5 ${getRiskColor(b.risk_band)}`} />
                        <span className={getRiskColor(b.risk_band)}>{b.risk_score} / 100</span>
                        <span className="text-[10px] uppercase text-slate-500 font-sans">({b.risk_band})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-medium ${
                          b.review_state === 'REVIEW_COMPLETE' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {b.review_state}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1 text-[11px]">
                        <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>{b.document_count} files</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectBidder(b)}
                        className="px-2.5 py-1 rounded bg-sky-600/15 hover:bg-sky-600 hover:text-white border border-sky-500/30 text-sky-400 transition-colors inline-flex items-center gap-1 font-medium"
                      >
                        <span>Open Cockpit</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
