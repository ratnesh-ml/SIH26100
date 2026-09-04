import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  Users,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Flame,
  RefreshCw,
  ArrowRight,
  Lock,
  FileCheck2,
  Cpu,
  Copy,
  Check,
} from 'lucide-react';
import { fetchDashboardMetrics, verifyAuditChain, fetchAuditTrail } from '../api/client';
import { DashboardMetricsOut, AuditVerifyOut, AuditEventOut, User } from '../types';
import {
  StatusChip,
  Button,
  LoadingState,
  ErrorState,
} from './ui';

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
  const [recentEvents, setRecentEvents] = useState<AuditEventOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, a, e] = await Promise.all([
        fetchDashboardMetrics(),
        verifyAuditChain(),
        fetchAuditTrail(undefined, undefined, undefined, undefined, 1, 5).catch(() => []),
      ]);
      setMetrics(m);
      setAuditStatus(a);
      setRecentEvents(e);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

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
      {/* 1. Header Banner */}
      <div className="px-5 py-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Executive Procurement & Vigilance Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-sky-950 text-sky-300 border border-sky-800">
              {currentUser.full_name} ({currentUser.role})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real-time decision support, compliance heatmaps, forensic risk telemetry, and SHA-256 cryptographic verification for CPCL tender evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('tenders')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Tenders
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('audit')}
            leftIcon={<Lock className="w-3.5 h-3.5 text-sky-400" />}
          >
            Audit Trail
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={loadData}
            isLoading={loading}
            aria-label="Refresh Dashboard Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading && (
        <LoadingState
          message="Aggregating procurement metrics and verifying audit integrity..."
          size="lg"
          className="rounded-2xl bg-slate-900/40 border border-slate-800"
        />
      )}

      {error && !loading && (
        <ErrorState
          title="Failed to load dashboard metrics"
          message={error}
          onRetry={loadData}
          variant="card"
        />
      )}

      {!loading && !error && metrics && (
        <>
          {/* 2. Top Row: 5 Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Total Tenders */}
            <div
              tabIndex={0}
              role="button"
              onClick={() => onNavigate('tenders')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate('tenders');
                }
              }}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm focus-visible:ring-2 focus-visible:ring-sky-400 outline-none"
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
              tabIndex={0}
              role="button"
              onClick={() => onNavigate('bidders')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate('bidders');
                }
              }}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm focus-visible:ring-2 focus-visible:ring-sky-400 outline-none"
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
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm">
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
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm">
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
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm">
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

          {/* 3. Middle Row: Compliance Distribution & Risk Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Compliance Distribution Card */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-sky-400" />
                    <span>Vendor Compliance Distribution</span>
                  </h2>
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
                        ? 'bg-yellow-500'
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
                  {complianceStats.map(({ key, count, pct }) => (
                    <div
                      key={key}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <StatusChip status={key} size="xs" />
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
                  ))}
                </div>
              </div>
            </div>

            {/* Risk Distribution Card */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Forensic Risk Distribution</span>
                  </h2>
                  <span className="text-[10px] font-mono text-slate-400">
                    Avg Score: <strong className="text-amber-300">{metrics.avg_risk_score}</strong>/100
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Multi-signal risk scoring based on registry mismatches, PDF structural anomalies, and debarment flags.
                </p>

                {/* Progress Bar Overview */}
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden flex mb-4 border border-slate-800">
                  {riskStats.map(({ key, color, pct }) => {
                    if (pct === 0) return null;
                    return (
                      <div
                        key={key}
                        className={`h-full ${color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                        title={`${key}: ${pct}%`}
                      />
                    );
                  })}
                </div>

                {/* Detailed Risk Breakdown Rows */}
                <div className="space-y-2 text-xs">
                  {riskStats.map(({ key, label, count, pct }) => (
                    <div
                      key={key}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <StatusChip status={key} size="xs" />
                        <span className="text-slate-400 text-[11px]">{label}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="font-bold text-slate-200">{count}</span>
                        <span className="text-slate-500 text-[10px]">({pct}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Bottom Row: Cryptographic Chain Health & Processing Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Pipeline Performance Card */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Cpu className="w-4 h-4 text-sky-400" />
                <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Automated Pipeline Health
                </h2>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/70">
                  <span className="text-slate-400">Total Jobs Executed:</span>
                  <span className="font-mono font-bold text-white">
                    {metrics.processing_performance?.total_jobs || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/70">
                  <span className="text-slate-400">Completed Successfully:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {metrics.processing_performance?.completed_jobs || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/70">
                  <span className="text-slate-400">Active / Queued Jobs:</span>
                  <span className="font-mono font-bold text-sky-400">
                    {metrics.processing_performance?.active_jobs || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/70">
                  <span className="text-slate-400">Execution Success Rate:</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {metrics.processing_performance?.success_rate_percent || 100}%
                  </span>
                </div>
              </div>

              {/* Cryptographic Chain Quick Widget */}
              {auditStatus && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      {auditStatus.ok ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      <span>SHA-256 Audit Chain:</span>
                    </span>
                    <span className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      auditStatus.ok ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}>
                      {auditStatus.ok ? 'INTACT' : 'TAMPERED'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Cryptographic Audit Activity */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-sky-400" />
                  <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Recent Cryptographic Audit Trail
                  </h2>
                </div>
                <Button
                  variant="link"
                  size="xs"
                  onClick={() => onNavigate('audit')}
                  rightIcon={<ArrowRight className="w-3 h-3" />}
                >
                  View Full Trail
                </Button>
              </div>

              <div className="space-y-2">
                {recentEvents && recentEvents.length > 0 ? (
                  recentEvents.slice(0, 4).map((ev) => (
                    <div
                      key={ev.seq}
                      className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          #{ev.seq}
                        </span>
                        <StatusChip status={ev.action} size="xs" showIcon={false} />
                        <span className="text-slate-400 text-[11px]">
                          by <strong className="text-slate-200">{ev.payload?.actor_name || ev.actor_id || 'System'}</strong> ({ev.role})
                        </span>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
                        <span>{new Date(ev.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-slate-400 truncate max-w-[130px]" title={ev.curr_hash}>
                          Hash: {ev.curr_hash.slice(0, 10)}...
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(ev.curr_hash, `dash-${ev.seq}`)}
                          className="text-slate-500 hover:text-sky-400 p-0.5 transition-colors cursor-pointer"
                          title="Copy Full SHA-256 Hash"
                        >
                          {copiedHash === `dash-${ev.seq}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    No recent audit events logged.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
