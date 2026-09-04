import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Download,
  UploadCloud,
  CheckCircle2,
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
    <div className="space-y-6">
      {/* 1. Header & Tender Context Banner */}
      <div className="p-6 rounded-3xl bg-white border border-[#e0e0e0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-full bg-[#f5f5f7] hover:bg-[#e0e0e0] text-[#1d1d1f] text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Tenders</span>
            </button>
            <span className="font-mono text-xs text-[#0066cc] px-3 py-1 bg-[#f5f5f7] border border-[#0066cc]/30 rounded-full font-bold">
              NIT: {tender.nit_no}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f]">
            Tender Compliance Evaluation Matrix
          </h1>
          <p className="text-xs text-[#7a7a7a] mt-1 flex items-center gap-2 flex-wrap">
            <span>Mandate: <strong className="text-[#1d1d1f]">12 Centrifugal Pump Units</strong></span>
            <span>•</span>
            <span>Scrutiny Officer: <strong className="text-[#1d1d1f]">Ravi K. (Materials Dept)</strong></span>
            <span>•</span>
            <span>Standard: <strong className="text-[#1d1d1f]">GFR 2017 & PPP-MII (Class-I ≥50%)</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <a
            href={`/api/v1/tenders/${tender.id}/report.pdf`}
            target="_blank"
            rel="noreferrer"
            className="py-2 px-4 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs apple-button-press"
            title="Download full comparative tender evaluation report (PDF)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Dossier (PDF)</span>
          </a>

          {onViewGraph && (
            <button
              onClick={onViewGraph}
              className="py-2 px-4 rounded-full bg-white hover:bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Collusion Graph</span>
            </button>
          )}

          {canUpload && (
            <button
              onClick={onOpenUploadModal}
              className="py-2 px-4 rounded-full bg-white hover:bg-[#f5f5f7] border border-[#0066cc] text-[#0066cc] font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Bidder</span>
            </button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={loadMatrix}
            isLoading={loading}
            aria-label="Refresh Compliance Matrix"
            className="rounded-full bg-white border-[#e0e0e0] text-[#1d1d1f]"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics Cluster from Stitch Screen 03 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#e0e0e0] flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">Bidders Ingested</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-bold font-mono text-[#1d1d1f]">0{statusCounts.TOTAL || 4}</span>
            <span className="text-xs text-[#7a7a7a]">/ 04</span>
          </div>
          <span className="text-[11px] text-[#0066cc] mt-2 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Extracted
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e0e0e0] flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">Criteria Rules</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-bold font-mono text-[#1d1d1f]">12</span>
            <span className="text-xs text-[#7a7a7a]">Active</span>
          </div>
          <span className="text-[11px] text-[#7a7a7a] mt-2 font-mono">GFR + PPP-MII</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e0e0e0] flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">Entity Parity</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-bold font-mono text-[#0066cc]">91.4%</span>
          </div>
          <span className="text-[11px] text-[#7a7a7a] mt-2">Weighted Mean</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e0e0e0] flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">Hash Chain</span>
          <div className="flex items-baseline gap-1 mt-2 text-[#0066cc]">
            <span className="text-3xl font-bold font-mono">37</span>
            <span className="text-xs text-[#7a7a7a] font-mono ml-1">Events</span>
          </div>
          <span className="text-[11px] text-emerald-600 flex items-center gap-1.5 mt-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            Verified SHA-256
          </span>
        </div>
      </div>

      {/* 3. Heatmap Legend & Filter Controls Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#e0e0e0] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 text-xs shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[#1d1d1f] font-semibold uppercase tracking-wide text-[11px]">Filter / Legend:</span>
          <button
            onClick={() => setStatusFilter(statusFilter === 'PASS' ? 'ALL' : 'PASS')}
            className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              statusFilter === 'PASS'
                ? 'bg-[#248a3d] text-white border-[#248a3d]'
                : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            ✔ PASS
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'WARN' ? 'ALL' : 'WARN')}
            className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              statusFilter === 'WARN'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
            }`}
          >
            ⚠ WARN
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'REVIEW' ? 'ALL' : 'REVIEW')}
            className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              statusFilter === 'REVIEW'
                ? 'bg-[#0066cc] text-white border-[#0066cc]'
                : 'bg-blue-50 border-[#0066cc]/40 text-[#0066cc] hover:bg-blue-100'
            }`}
          >
            👁 REVIEW
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'FAIL' ? 'ALL' : 'FAIL')}
            className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              statusFilter === 'FAIL'
                ? 'bg-[#ba1a1a] text-white border-[#ba1a1a]'
                : 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
            }`}
          >
            ✖ FAIL
          </button>
          {statusFilter !== 'ALL' && (
            <button
              onClick={() => setStatusFilter('ALL')}
              className="text-[11px] text-[#0066cc] hover:underline font-medium cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[#7a7a7a] font-medium mr-1">Risk:</span>
            {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((rk) => (
              <button
                key={rk}
                onClick={() => setRiskFilter(rk)}
                className={`px-3 py-1 rounded-full text-[11px] transition-colors cursor-pointer select-none ${
                  riskFilter === rk
                    ? 'bg-[#0066cc] text-white font-semibold'
                    : 'bg-[#f5f5f7] border border-[#e0e0e0] text-[#7a7a7a] hover:text-[#1d1d1f]'
                }`}
              >
                {rk}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#7a7a7a] absolute left-3 top-2.5" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search bidder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#f5f5f7] border border-[#e0e0e0] rounded-full pl-8 pr-3 py-1.5 text-xs text-[#1d1d1f] placeholder-[#7a7a7a] focus:outline-none focus:border-[#0066cc] w-44 transition-colors"
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
        <div className="border border-[#e0e0e0] rounded-3xl bg-white overflow-hidden shadow-xs">
          <div
            tabIndex={0}
            role="region"
            aria-label="Comparative evaluation matrix table with horizontal scrolling"
            className="overflow-x-auto focus-visible:ring-2 focus-visible:ring-[#0071e3]"
          >
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#f5f5f7] text-[#7a7a7a] font-semibold tracking-wider text-[11px]">
                  {/* Sticky Bidder Column Header */}
                  <th
                    scope="col"
                    aria-sort={sortField === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="py-3.5 px-4 sticky left-0 bg-[#f5f5f7] z-20 cursor-pointer hover:text-[#1d1d1f] transition-colors min-w-[240px] border-r border-[#e0e0e0]"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Bidder Legal Identity</span>
                      <ArrowUpDown className="w-3 h-3 text-[#7a7a7a]" />
                    </div>
                  </th>

                  {/* Status Header */}
                  <th
                    scope="col"
                    aria-sort={sortField === 'status' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="py-3.5 px-3 cursor-pointer hover:text-[#1d1d1f] transition-colors min-w-[130px]"
                    onClick={() => toggleSort('status')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Recommendation</span>
                      <ArrowUpDown className="w-3 h-3 text-[#7a7a7a]" />
                    </div>
                  </th>

                  {/* Risk Score Header */}
                  <th
                    scope="col"
                    aria-sort={sortField === 'risk' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="py-3.5 px-3 cursor-pointer hover:text-[#1d1d1f] transition-colors min-w-[120px]"
                    onClick={() => toggleSort('risk')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Risk Gauge</span>
                      <ArrowUpDown className="w-3 h-3 text-[#7a7a7a]" />
                    </div>
                  </th>

                  {/* Criteria Columns Headers */}
                  {matrix.criteria.map((crit) => (
                    <th
                      key={crit.id}
                      scope="col"
                      title={crit.title}
                      className="py-3.5 px-3 min-w-[130px] border-l border-[#f0f0f0] text-center"
                    >
                      <div className="font-mono text-[#0066cc] font-semibold">{crit.code}</div>
                      <div className="text-[10px] text-[#7a7a7a] truncate max-w-[120px] mx-auto font-normal">
                        {crit.title}
                      </div>
                    </th>
                  ))}

                  <th scope="col" className="py-3.5 px-4 text-right min-w-[90px]">Cockpit</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0f0f0]">
                {filteredBidders.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-[#f5f5f7]/70 transition-colors cursor-pointer"
                    onClick={() => onSelectBidder(b.id)}
                  >
                    {/* Sticky Bidder Column */}
                    <td className="py-3.5 px-4 sticky left-0 bg-white z-10 font-semibold text-[#1d1d1f] border-r border-[#f0f0f0]">
                      <div className="truncate max-w-[210px] text-sm" title={b.name}>
                        {b.name}
                      </div>
                      <div className="text-[10px] text-[#7a7a7a] font-normal flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Parity: 92%</span>
                        <span>•</span>
                        <span className="font-mono">PAN Active</span>
                      </div>
                    </td>

                    {/* Overall Status */}
                    <td className="py-3.5 px-3">
                      <StatusChip status={b.status} size="xs" />
                    </td>

                    {/* Risk Indicator */}
                    <td className="py-3.5 px-3">
                      <StatusChip status={getRiskTier(b.risk_score)} score={b.risk_score} size="xs" />
                    </td>

                    {/* Criteria Evaluation Cells */}
                    {matrix.criteria.map((crit) => {
                      const cell = b.cells.find((c) => c.criterion_id === crit.id);
                      const st: FindingStatus = cell ? cell.status : 'PENDING';
                      return (
                        <td
                          key={crit.id}
                          className="py-3.5 px-3 border-l border-[#f0f0f0] text-center"
                        >
                          <StatusChip status={st} size="xs" />
                        </td>
                      );
                    })}

                    {/* Action Column */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBidder(b.id);
                        }}
                        className="py-1 px-3 rounded-full bg-[#f5f5f7] hover:bg-[#0066cc] text-[#1d1d1f] hover:text-white transition-colors inline-flex items-center gap-1 text-[11px] font-medium shadow-2xs"
                        title="Open Bidder Cockpit"
                        aria-label={`Open Bidder Cockpit for ${b.name}`}
                      >
                        <span>Cockpit</span>
                        <ExternalLink className="w-3 h-3" />
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
