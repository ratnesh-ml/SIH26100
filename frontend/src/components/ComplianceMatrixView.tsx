import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Download,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  ArrowUpDown,
  Search,
  ExternalLink,
  Share2,
  FileSpreadsheet,
} from 'lucide-react';
import { fetchComplianceMatrix } from '../api/client';
import { ComplianceMatrix, FindingStatus, TenderSummary } from '../types';
import {
  StatusChip,
  Button,
  EmptyState,
  LoadingState,
  ErrorState,
} from './ui';

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

  const getRiskTier = (score: number) => {
    if (score > 60) return 'HIGH';
    if (score > 30) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="xs"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            aria-label="Back to Tenders list"
          >
            Tenders
          </Button>

          <div className="h-5 w-px bg-slate-800" aria-hidden="true" />

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Compliance Evaluation Matrix
              </h1>
              <span className="font-mono text-xs text-sky-400 px-2 py-0.5 bg-sky-950/80 border border-sky-800/80 rounded-md">
                NIT: {tender.nit_no}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xl">
              {tender.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={`/api/v1/tenders/${tender.id}/report.pdf`}
            target="_blank"
            rel="noreferrer"
            className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-sky-400"
            title="Download full comparative tender evaluation report (PDF)"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export Report (PDF)</span>
          </a>

          {onViewGraph && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewGraph}
              leftIcon={<Share2 className="w-3.5 h-3.5 text-amber-400" />}
            >
              Collusion Graph
            </Button>
          )}

          {canUpload && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenUploadModal}
              leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
            >
              Upload Bidder Package
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={loadMatrix}
            isLoading={loading}
            aria-label="Refresh Compliance Matrix"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 2. Status Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between shadow-xs">
          <span className="text-slate-400 font-medium">Bidders</span>
          <span className="font-mono font-bold text-slate-200 text-sm">{statusCounts.TOTAL}</span>
        </div>
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PASS</span>
          </div>
          <span className="font-mono font-bold text-emerald-300 text-sm">{statusCounts.PASS}</span>
        </div>
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>WARN</span>
          </div>
          <span className="font-mono font-bold text-amber-300 text-sm">{statusCounts.WARN}</span>
        </div>
        <div className="p-3 rounded-xl bg-yellow-950/30 border border-yellow-800/40 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-1.5 text-yellow-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>REVIEW</span>
          </div>
          <span className="font-mono font-bold text-yellow-300 text-sm">{statusCounts.REVIEW}</span>
        </div>
        <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-1.5 text-rose-400 font-medium">
            <XCircle className="w-3.5 h-3.5" />
            <span>FAIL</span>
          </div>
          <span className="font-mono font-bold text-rose-300 text-sm">{statusCounts.FAIL}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>PENDING</span>
          </div>
          <span className="font-mono font-bold text-slate-400 text-sm">{statusCounts.PENDING}</span>
        </div>
      </div>

      {/* 3. Filter and Search Bar */}
      <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-medium mr-1">Status:</span>
          {['ALL', 'PASS', 'WARN', 'REVIEW', 'FAIL', 'PENDING'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                statusFilter === st
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 font-semibold'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium mr-1">Risk:</span>
            {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((rk) => (
              <button
                key={rk}
                onClick={() => setRiskFilter(rk)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  riskFilter === rk
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 font-semibold'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {rk}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search bidder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-36 sm:w-48 transition-colors"
            />
          </div>
        </div>
      </div>

      {loading && (
        <LoadingState
          message="Building criteria-to-finding compliance heatmap matrix..."
          size="lg"
          className="rounded-xl bg-slate-900/40 border border-slate-800"
        />
      )}

      {error && !loading && (
        <ErrorState
          title="Failed to render compliance matrix"
          message={error}
          onRetry={loadMatrix}
          variant="card"
        />
      )}

      {!loading && !error && (!matrix?.bidders || matrix.bidders.length === 0) && (
        <EmptyState
          icon={<FileSpreadsheet className="w-7 h-7 text-sky-400" />}
          title="No Bidders In Matrix"
          description="Upload bidder submission packages (ZIP or statutory PDFs) to initialize the comparative compliance matrix."
          action={
            canUpload ? (
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

      {/* 4. Compliance Heatmap Grid */}
      {!loading && !error && matrix && matrix.bidders.length > 0 && (
        <div className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden shadow-xl">
          <div
            tabIndex={0}
            role="region"
            aria-label="Comparative evaluation matrix table with horizontal scrolling"
            className="overflow-x-auto focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/95 text-slate-400 font-semibold tracking-wider text-[11px]">
                  {/* Sticky Bidder Column Header */}
                  <th
                    scope="col"
                    aria-sort={sortField === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="py-3 px-4 sticky left-0 bg-slate-950 z-20 cursor-pointer hover:text-slate-200 transition-colors min-w-[200px]"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Bidder Legal Identity</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  {/* Status Header */}
                  <th
                    scope="col"
                    aria-sort={sortField === 'status' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors min-w-[110px]"
                    onClick={() => toggleSort('status')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Overall Status</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  {/* Risk Score Header */}
                  <th
                    scope="col"
                    aria-sort={sortField === 'risk' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors min-w-[120px]"
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
                      scope="col"
                      title={crit.title}
                      className="py-3 px-3 min-w-[130px] border-l border-slate-800/80 text-center"
                    >
                      <div className="font-mono text-sky-400 font-semibold">{crit.code}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px] mx-auto font-normal">
                        {crit.title}
                      </div>
                    </th>
                  ))}

                  <th scope="col" className="py-3 px-4 text-right min-w-[90px]">Cockpit</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80">
                {filteredBidders.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => onSelectBidder(b.id)}
                  >
                    {/* Sticky Bidder Column */}
                    <td className="py-3 px-4 sticky left-0 bg-slate-900/95 z-10 font-semibold text-slate-200 border-r border-slate-800/50">
                      <div className="truncate max-w-[180px]" title={b.name}>
                        {b.name}
                      </div>
                    </td>

                    {/* Overall Status */}
                    <td className="py-3 px-3">
                      <StatusChip status={b.status} size="xs" />
                    </td>

                    {/* Risk Indicator */}
                    <td className="py-3 px-3">
                      <StatusChip status={getRiskTier(b.risk_score)} score={b.risk_score} size="xs" />
                    </td>

                    {/* Criteria Evaluation Cells */}
                    {matrix.criteria.map((crit) => {
                      const cell = b.cells.find((c) => c.criterion_id === crit.id);
                      const st: FindingStatus = cell ? cell.status : 'PENDING';
                      return (
                        <td
                          key={crit.id}
                          className="py-3 px-3 border-l border-slate-800/80 text-center"
                        >
                          <StatusChip status={st} size="xs" />
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
                        className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-md transition-colors inline-flex items-center gap-1 text-[11px] cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400"
                        title="Open Bidder Cockpit"
                        aria-label={`Open Bidder Cockpit for ${b.name}`}
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

      {/* 5. Compliance Legend */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
          Evaluation Status Key (CVC / GFR 2017 Compliant):
        </span>
        <div className="flex items-center gap-4 flex-wrap text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
            <span className="text-slate-300">PASS — Requirement Fully Satisfied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" aria-hidden="true" />
            <span className="text-slate-300">WARN — Advisory Notice</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" aria-hidden="true" />
            <span className="text-slate-300">REVIEW — Officer Clarification Needed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" aria-hidden="true" />
            <span className="text-slate-300">FAIL — Disqualifying Non-Compliance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" aria-hidden="true" />
            <span className="text-slate-400">PENDING — Ingestion Processing</span>
          </div>
        </div>
      </div>
    </div>
  );
};
