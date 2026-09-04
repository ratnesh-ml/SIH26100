import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  Users,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Activity,
  Layers,
  RefreshCw,
  ArrowRight,
  Lock,
  Loader2,
  AlertCircle,
  FileCheck2,
  Cpu,
} from 'lucide-react';
import { fetchDashboardMetrics, verifyAuditChain } from '../api/client';
import { DashboardMetricsOut, AuditVerifyOut, User } from '../types';

interface DashboardViewProps {
  currentUser: User;
  onNavigate: (view: 'tenders' | 'bidders' | 'audit' | 'matrix') => void;
  onSelectTender?: (tenderId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [metrics, setMetrics] = useState<DashboardMetricsOut | null>(null);
  const [auditStatus, setAuditStatus] = useState<AuditVerifyOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, a] = await Promise.all([
        fetchDashboardMetrics(),
        verifyAuditChain(),
      ]);
      setMetrics(m);
      setAuditStatus(a);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute percentages for Compliance Distribution
  const complianceStats = useMemo(() => {
    if (!metrics) return [];
    const dist = metrics.compliance_distribution || {};
    const total = metrics.total_bidders || 1;
    const order = ['PASS', 'WARN', 'REVIEW', 'FAIL', 'PENDING'];
    return order.map((key) => {
      const count = dist[key] || 0;
      const pct = Math.round((count / total) * 100);
      return { key, count, pct };
    });
  }, [metrics]);

  // Compute percentages for Risk Distribution
  const riskStats = useMemo(() => {
    if (!metrics) return [];
    const dist = metrics.risk_distribution || {};
    const total = metrics.total_bidders || 1;
    const order = [
      { key: 'LOW', label: 'Low Risk (0–30)', color: 'bg-emerald-500', text: 'text-emerald-400' },
      { key: 'MEDIUM', label: 'Medium Risk (31–60)', color: 'bg-amber-500', text: 'text-amber-400' },
      { key: 'HIGH', label: 'High Risk (>60)', color: 'bg-rose-500', text: 'text-rose-400' },
    ];
    return order.map((item) => {
      const count = dist[item.key] || 0;
      const pct = Math.round((count / total) * 100);
      return { ...item, count, pct };
    });
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="px-5 py-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Executive Procurement & Vigilance Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-sky-950 text-sky-300 border border-sky-800">
              {currentUser.full_name} ({currentUser.role})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time decision support, compliance heatmaps, forensic risk telemetry, and SHA-256 cryptographic verification for CPCL tender evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onNavigate('tenders')}
            className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors shadow-sm shadow-sky-950"
          >
            <span>Tenders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onNavigate('audit')}
            className="px-3.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span>Audit Trail</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh Dashboard Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-20 rounded-2xl bg-slate-900/40 border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <span className="text-xs text-slate-400 font-medium">
            Aggregating procurement metrics and verifying audit integrity...
          </span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">Failed to load dashboard metrics</p>
            <p className="mt-0.5 text-rose-400">{error}</p>
            <button
              onClick={loadData}
              className="mt-2 px-3 py-1 bg-rose-900 text-rose-200 rounded font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && metrics && (
        <>
          {/* 1. Top Row: 5 Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Total Tenders */}
            <div
              onClick={() => onNavigate('tenders')}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total Tenders</span>
                <FileText className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-bold text-white">{metrics.total_tenders}</span>
                <span className="text-[10px] text-slate-500">active</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 truncate">
                Under active evaluation
              </p>
            </div>

            {/* Total Bidders */}
            <div
              onClick={() => onNavigate('bidders')}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total Bidders</span>
                <Users className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-bold text-white">{metrics.total_bidders}</span>
                <span className="text-[10px] text-slate-500">vendors</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 truncate">
                Across all tender filings
              </p>
            </div>

            {/* Verified Bidders */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Verified Bidders</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-bold text-emerald-400">
                  {metrics.verified_bidders}
                </span>
                <span className="text-[10px] text-slate-500">
                  ({Math.round((metrics.verified_bidders / Math.max(1, metrics.total_bidders)) * 100)}%)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 truncate">
                Officer review finalized
              </p>
            </div>

            {/* Pending Bidders */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Pending Review</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-bold text-amber-400">
                  {metrics.pending_bidders}
                </span>
                <span className="text-[10px] text-slate-500">vendors</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 truncate">
                Awaiting officer adjudication
              </p>
            </div>

            {/* High Risk Bidders */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>High Risk</span>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-bold text-rose-400">
                  {metrics.high_risk_bidders}
                </span>
                <span className="text-[10px] text-slate-500">flagged</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 truncate">
                Score &gt;60 or hard anomaly
              </p>
            </div>
          </div>

          {/* 2. Middle Row: Compliance Distribution & Risk Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Compliance Distribution Card */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-sky-400" />
                    <span>Vendor Compliance Distribution</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">
                    {metrics.total_bidders} Total
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Deterministic qualification status across technical, financial, and statutory tender requirements.
                </p>

                {/* Progress Bar Overview */}
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden flex mb-4 border border-slate-800">
                  {complianceStats.map(({ key, pct }) => {
                    if (pct === 0) return null;
                    const bg =
                      key === 'PASS'
                        ? 'bg-emerald-500'
                        : key === 'WARN'
                        ? 'bg-amber-500'
                        : key === 'REVIEW'
                        ? 'bg-sky-500'
                        : key === 'FAIL'
                        ? 'bg-rose-500'
                        : 'bg-slate-700';
                    return (
                      <div
                        key={key}
                        className={`h-full ${bg} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                        title={`${key}: ${pct}%`}
                      />
                    );
                  })}
                </div>

                {/* Detailed Status Breakdown Rows */}
                <div className="space-y-2 text-xs">
                  {complianceStats.map(({ key, count, pct }) => {
                    const badgeClass =
                      key === 'PASS'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : key === 'WARN'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : key === 'REVIEW'
                        ? 'bg-sky-950 text-sky-300 border-sky-800'
                        : key === 'FAIL'
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : 'bg-slate-950 text-slate-400 border-slate-800';

                    return (
                      <div
                        key={key}
                        className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${badgeClass}`}
                          >
                            {key}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {key === 'PASS'
                              ? 'Fully Compliant with all criteria'
                              : key === 'WARN'
                              ? 'Minor discrepancy or advisory flag'
                              : key === 'REVIEW'
                              ? 'Requires officer clarification'
                              : key === 'FAIL'
                              ? 'Non-compliant with mandatory benchmark'
                              : 'Pending automated ingestion pipeline'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="font-bold text-slate-200">{count}</span>
                          <span className="text-slate-500 text-[10px]">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Risk Distribution Card */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Forensic Risk Distribution</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">
                    Avg Risk: {metrics.avg_risk_score} / 100
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Transparent composite risk score reflecting statutory tax mismatches, debarment hits, and PDF tampering signals.
                </p>

                {/* Average Risk Banner */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-sky-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        System Average Risk Score
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Across all registered vendors in active tenders
                      </div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-xl font-bold text-white">{metrics.avg_risk_score}</span>
                    <span className="text-xs text-slate-500">/ 100</span>
                  </div>
                </div>

                {/* Risk Bands Breakdown */}
                <div className="space-y-3 text-xs">
                  {riskStats.map(({ key, label, color, text, count, pct }) => (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${text}`}>{label}</span>
                        <div className="font-mono text-[11px] text-slate-300">
                          <span className="font-bold">{count}</span> vendors ({pct}%)
                        </div>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full ${color} transition-all duration-500`}
                          style={{ width: `${Math.min(100, Math.max(count > 0 ? 5 : 0, pct))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 italic">
                * Risk scores never disqualify autonomously. High risk vendors trigger mandatory heightened scrutiny under CVC guidelines.
              </div>
            </div>
          </div>

          {/* 3. Bottom Row: Finding Counts & Processing Telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Finding Counts Panel */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Requirement Findings Evaluated</span>
                </h3>
                <span className="text-[10px] font-mono text-sky-400">
                  {metrics.finding_counts?.TOTAL || 0} Total Checks
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Aggregate compliance findings evaluated across GFR 2017, Make-in-India, MSE, Land Border, and technical criteria.
              </p>

              {/* Status Chips Row */}
              <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60">
                  <div className="font-mono font-bold text-emerald-400 text-sm">
                    {metrics.finding_counts?.PASS || 0}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase mt-0.5">PASS</div>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60">
                  <div className="font-mono font-bold text-amber-400 text-sm">
                    {metrics.finding_counts?.WARN || 0}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase mt-0.5">WARN</div>
                </div>
                <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-800/60">
                  <div className="font-mono font-bold text-sky-400 text-sm">
                    {metrics.finding_counts?.REVIEW || 0}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase mt-0.5">REVIEW</div>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60">
                  <div className="font-mono font-bold text-rose-400 text-sm">
                    {metrics.finding_counts?.FAIL || 0}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase mt-0.5">FAIL</div>
                </div>
              </div>

              {/* Top Flagged Rules */}
              {metrics.finding_counts?.top_flagged_rules &&
                Object.keys(metrics.finding_counts.top_flagged_rules).length > 0 && (
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">
                      Most Frequently Flagged Rules:
                    </span>
                    {Object.entries(metrics.finding_counts.top_flagged_rules).map(([rule, count]) => (
                      <div
                        key={rule}
                        className="px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <span className="font-mono text-sky-400 text-xs font-semibold">{rule}</span>
                        <span className="text-slate-400 text-[11px]">
                          <span className="font-mono font-bold text-amber-400">{count as number}</span>{' '}
                          flags
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* Processing Performance Telemetry Panel */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>Processing Engine & Audit Telemetry</span>
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {metrics.processing_performance?.success_rate_percent || 100}% Success
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  End-to-end background ingestion, OCR fallback, forensic scanning, and hash-chain audit logging performance.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Total Ingest Jobs</span>
                    <span className="text-sm font-bold text-slate-200">
                      {metrics.processing_performance?.total_jobs || 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Completed Jobs</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {metrics.processing_performance?.completed_jobs || 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Active / Queued</span>
                    <span className="text-sm font-bold text-sky-400">
                      {metrics.processing_performance?.active_jobs || 0}
                    </span>
                  </div>
                </div>

                {/* Audit Integrity Status Banner */}
                {auditStatus && (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                      auditStatus.ok
                        ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {auditStatus.ok ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold">
                          {auditStatus.ok ? 'Audit Chain Cryptographically Intact' : 'Audit Chain Compromised!'}
                        </div>
                        <div className="text-[10px] opacity-80">
                          {auditStatus.length} events verified sequentially
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('audit')}
                      className="px-2.5 py-1 bg-black/40 hover:bg-black/60 rounded text-[10px] font-mono border border-white/10 transition-colors"
                    >
                      View Trail
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Architecture: Deterministic Rules + PyMuPDF / Tesseract OCR</span>
                <span className="font-mono">SHA-256 Chained</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
