import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Download,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  Search,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { fetchComplianceMatrix } from '../api/client';
import { ComplianceMatrix, FindingStatus, TenderSummary } from '../types';

interface ComplianceMatrixViewProps {
  tender: TenderSummary;
  onBack: () => void;
  onSelectBidder: (bidderId: string) => void;
  onViewGraph?: () => void;
  onOpenUploadModal: () => void;
  canUpload: boolean;
}

type SortField = 'risk' | 'name' | 'status';
type SortOrder = 'asc' | 'desc';

export const ComplianceMatrixView: React.FC<ComplianceMatrixViewProps> = ({
  tender,
  onBack,
  onSelectBidder,
  onViewGraph,
  onOpenUploadModal,
  canUpload,
}) => {
  const [matrix, setMatrix] = useState<ComplianceMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and Sorting State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('risk');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const loadMatrix = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplianceMatrix(tender.id);
      setMatrix(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve tender compliance matrix.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, [tender.id]);

  // Compute status counts across all bidders
  const statusCounts = useMemo(() => {
    const counts = { PASS: 0, WARN: 0, REVIEW: 0, FAIL: 0, PENDING: 0, TOTAL: 0 };
    if (!matrix?.bidders) return counts;
    counts.TOTAL = matrix.bidders.length;
    for (const b of matrix.bidders) {
      const st = b.status as keyof typeof counts;
      if (counts[st] !== undefined) {
        counts[st]++;
      } else {
        counts.PENDING++;
      }
    }
    return counts;
  }, [matrix]);

  // Filtered and Sorted Bidders
  const filteredBidders = useMemo(() => {
    if (!matrix?.bidders) return [];
    return matrix.bidders
      .filter((b) => {
        if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
        if (riskFilter !== 'ALL') {
          if (riskFilter === 'HIGH' && b.risk_score <= 60) return false;
          if (riskFilter === 'MEDIUM' && (b.risk_score <= 30 || b.risk_score > 60)) return false;
          if (riskFilter === 'LOW' && b.risk_score > 30) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (!b.name.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'risk') {
          cmp = a.risk_score - b.risk_score;
        } else if (sortField === 'name') {
          cmp = a.name.localeCompare(b.name);
        } else if (sortField === 'status') {
          cmp = a.status.localeCompare(b.status);
        }
        return sortOrder === 'desc' ? -cmp : cmp;
      });
  }, [matrix, statusFilter, riskFilter, searchQuery, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const renderStatusCell = (status: FindingStatus) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>PASS</span>
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-400 border border-rose-800/80">
            <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
            <span>FAIL</span>
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/80">
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            <span>WARN</span>
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-950/80 text-yellow-400 border border-yellow-800/80">
            <AlertCircle className="w-3 h-3 text-yellow-400 shrink-0" />
            <span>REVIEW</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 text-slate-500 border border-slate-800">
            <Clock className="w-3 h-3 text-slate-600 shrink-0" />
            <span>PENDING</span>
          </span>
        );
    }
  };

  const getRiskColor = (score: number) => {
    if (score > 60) return 'text-rose-400';
    if (score > 30) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getRiskBadge = (score: number) => {
    if (score > 60) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950 text-rose-400 border border-rose-800/60">
          HIGH
        </span>
      );
    }
    if (score > 30) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-400 border border-amber-800/60">
          MEDIUM
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800/60">
        LOW
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tenders</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">Compliance Evaluation Matrix</h2>
              <span className="font-mono text-xs text-sky-400 px-2 py-0.5 bg-sky-950/80 border border-sky-800/80 rounded">
                {tender.nit_no}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xl">{tender.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={`/api/v1/tenders/${tender.id}/report.pdf`}
            target="_blank"
            rel="noreferrer"
            className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export Tender Report (PDF)</span>
          </a>

          {onViewGraph && (
            <button
              onClick={onViewGraph}
              className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Collusion Graph</span>
            </button>
          )}

          {canUpload && (
            <button
              onClick={onOpenUploadModal}
              className="py-1.5 px-3.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors shadow-sm shadow-sky-950"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Bidder Package</span>
            </button>
          )}

          <button
            onClick={loadMatrix}
            disabled={loading}
            title="Refresh Matrix"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400 font-medium">Bidders</span>
          <span className="font-mono font-bold text-slate-200 text-sm">{statusCounts.TOTAL}</span>
        </div>
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PASS</span>
          </div>
          <span className="font-mono font-bold text-emerald-300 text-sm">{statusCounts.PASS}</span>
        </div>
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-amber-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>WARN</span>
          </div>
          <span className="font-mono font-bold text-amber-300 text-sm">{statusCounts.WARN}</span>
        </div>
        <div className="p-3 rounded-xl bg-yellow-950/30 border border-yellow-800/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-yellow-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>REVIEW</span>
          </div>
          <span className="font-mono font-bold text-yellow-300 text-sm">{statusCounts.REVIEW}</span>
        </div>
        <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-rose-400 font-medium">
            <XCircle className="w-3.5 h-3.5" />
            <span>FAIL</span>
          </div>
          <span className="font-mono font-bold text-rose-300 text-sm">{statusCounts.FAIL}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>PENDING</span>
          </div>
          <span className="font-mono font-bold text-slate-400 text-sm">{statusCounts.PENDING}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-medium">Status:</span>
          {['ALL', 'PASS', 'WARN', 'REVIEW', 'FAIL', 'PENDING'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Risk:</span>
            {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((rk) => (
              <button
                key={rk}
                onClick={() => setRiskFilter(rk)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  riskFilter === rk
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {rk}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search bidder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-36 sm:w-44"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="p-16 rounded-xl bg-slate-900/40 border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
          <span className="text-xs text-slate-400 font-medium">
            Building criteria-to-finding compliance heatmap matrix...
          </span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 text-xs text-rose-300">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">Failed to render compliance matrix</p>
            <p className="mt-0.5 text-rose-400">{error}</p>
            <button
              onClick={loadMatrix}
              className="mt-2.5 px-3 py-1 bg-rose-900/60 hover:bg-rose-900 text-rose-200 rounded font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (!matrix?.bidders || matrix.bidders.length === 0) && (
        <div className="p-16 rounded-xl bg-slate-900/40 border border-slate-800 text-center">
          <div className="p-3 rounded-full bg-slate-800/80 text-slate-500 inline-block mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">No bidders in matrix</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Upload bidder packages (ZIP/PDF) to initialize the comparative evaluation matrix.
          </p>
          {canUpload && (
            <button
              onClick={onOpenUploadModal}
              className="mt-4 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload First Bidder Package</span>
            </button>
          )}
        </div>
      )}

      {/* Compliance Heatmap Grid */}
      {!loading && !error && matrix && matrix.bidders.length > 0 && (
        <div className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 font-semibold tracking-wider text-[11px]">
                  {/* Sticky Bidder Column Header */}
                  <th
                    className="py-3 px-4 sticky left-0 bg-slate-950/95 z-20 cursor-pointer hover:text-slate-200 transition-colors min-w-[200px]"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Bidder Legal Identity</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  {/* Status Header */}
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors min-w-[100px]"
                    onClick={() => toggleSort('status')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  {/* Risk Score Header */}
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors min-w-[110px]"
                    onClick={() => toggleSort('risk')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Risk Gauge</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  {/* Criteria Columns Headers */}
                  {matrix.criteria.map((crit) => (
                    <th
                      key={crit.id}
                      title={crit.title}
                      className="py-3 px-3 min-w-[130px] border-l border-slate-800/80 text-center"
                    >
                      <div className="font-mono text-sky-400 font-semibold">{crit.code}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px] mx-auto font-normal">
                        {crit.title}
                      </div>
                    </th>
                  ))}

                  <th className="py-3 px-4 text-right min-w-[90px]">Cockpit</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80">
                {filteredBidders.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => onSelectBidder(b.id)}
                  >
                    {/* Sticky Bidder Column */}
                    <td className="py-3 px-4 sticky left-0 bg-slate-900/95 z-10 font-semibold text-slate-200">
                      <div className="truncate max-w-[180px]" title={b.name}>
                        {b.name}
                      </div>
                    </td>

                    {/* Overall Status */}
                    <td className="py-3 px-3">{renderStatusCell(b.status)}</td>

                    {/* Risk Indicator */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold text-xs ${getRiskColor(b.risk_score)}`}>
                          {b.risk_score}
                        </span>
                        {getRiskBadge(b.risk_score)}
                      </div>
                    </td>

                    {/* Criteria Evaluation Cells */}
                    {matrix.criteria.map((crit) => {
                      const cell = b.cells.find((c) => c.criterion_id === crit.id);
                      const st = cell ? cell.status : 'PENDING';
                      return (
                        <td
                          key={crit.id}
                          className="py-3 px-3 border-l border-slate-800/80 text-center"
                        >
                          {renderStatusCell(st)}
                        </td>
                      );
                    })}

                    {/* Action Column */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBidder(b.id);
                        }}
                        className="p-1 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded transition-colors inline-flex items-center gap-1 text-[11px]"
                        title="Open Cockpit"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compliance Legend */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
          Evaluation Status Key (CVC / GFR 2017):
        </span>
        <div className="flex items-center gap-4 flex-wrap text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">PASS — Requirement Satisfied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300">WARN — Advisory Notice</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="text-slate-300">REVIEW — Discretionary Clarification</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="text-slate-300">FAIL — Disqualifying Non-Compliance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <span className="text-slate-400">PENDING — Pipeline Processing</span>
          </div>
        </div>
      </div>
    </div>
  );
};
