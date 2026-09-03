import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, FileText, Users, Calendar, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { fetchTenders } from '../api/client';
import { TenderSummary, User } from '../types';

interface TenderListViewProps {
  currentUser: User;
  onSelectTender: (tender: TenderSummary) => void;
  onOpenCreateModal: () => void;
}

export const TenderListView: React.FC<TenderListViewProps> = ({
  currentUser,
  onSelectTender,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Procurement Tenders</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Notice Inviting Tenders (NIT) under Two-Bid System (GFR 2017 Rule 161)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTenders}
            disabled={loading}
            title="Refresh List"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canCreate && (
            <button
              onClick={onOpenCreateModal}
              className="py-2 px-3.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-sky-950"
            >
              <Plus className="w-4 h-4" />
              <span>Create Tender</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Filter Status:</span>
        {['', 'ACTIVE', 'EVALUATING', 'CLOSED'].map((st) => (
          <button
            key={st || 'all'}
            onClick={() => setStatusFilter(st)}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              statusFilter === st
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-semibold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {st || 'All'}
          </button>
        ))}
      </div>

      {loading && (
        <div className="p-12 rounded-xl bg-slate-900/40 border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Loading procurement tenders...</span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 text-xs text-rose-300">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">Failed to load tenders</p>
            <p className="mt-0.5 text-rose-400">{error}</p>
            <button
              onClick={loadTenders}
              className="mt-2.5 px-3 py-1 bg-rose-900/60 hover:bg-rose-900 text-rose-200 rounded font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && tenders.length === 0 && (
        <div className="p-12 rounded-xl bg-slate-900/40 border border-slate-800 text-center">
          <div className="p-3 rounded-full bg-slate-800/80 text-slate-500 inline-block mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">No tenders found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            There are currently no procurement tenders registered in the database.
          </p>
          {canCreate && (
            <button
              onClick={onOpenCreateModal}
              className="mt-4 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Tender</span>
            </button>
          )}
        </div>
      )}

      {!loading && !error && tenders.length > 0 && (
        <div className="border border-slate-800 rounded-xl bg-slate-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">NIT Number & Title</th>
                  <th className="py-3 px-4">Portal</th>
                  <th className="py-3 px-4">Estimated Value</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Bidders</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {tenders.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <div className="font-mono text-sky-400 font-semibold">{t.nit_no}</div>
                      <div className="text-slate-200 font-medium truncate mt-0.5">{t.title}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {t.portal}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-200">
                      {formatCurrency(t.estimated_value)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{t.bid_due_date || 'Not set'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-300 font-medium">
                        <Users className="w-3.5 h-3.5 text-sky-400" />
                        <span>{t.bidder_count}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          t.status === 'ACTIVE'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                            : t.status === 'EVALUATING'
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectTender(t)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 transition-colors inline-flex items-center gap-1 font-medium"
                      >
                        <span>View Bidders</span>
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
