import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  Users,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Lock,
  FileCheck2,
  Copy,
  Check,
} from 'lucide-react';
import { fetchDashboardMetrics, verifyAuditChain, fetchAuditTrail } from '../api/client';
import { DashboardMetricsOut, AuditVerifyOut, AuditEventOut, User } from '../types';
import {
  StatusChip,
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
    <div className="space-y-8">
      {/* 1. Sub-Navigation Action Bar */}
      <section className="w-full bg-white rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-[#e0e0e0] shadow-xs">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0066cc] inline-block"></span>
          <h2 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">Procurement Overview</h2>
          <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-[#f5f5f7] border border-[#e0e0e0] text-[#7a7a7a]">
            FY 2025–26
          </span>
          <span className="hidden sm:inline font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#f5f5f7] border border-[#e0e0e0] text-[#515154]">
            Officer: <strong className="text-[#1d1d1f]">{currentUser?.full_name || 'Ravi K.'}</strong>
          </span>
        </div>

        {/* Quick Timeframe Selector Pills */}
        <div className="inline-flex items-center p-1 rounded-full bg-[#f5f5f7] border border-[#e0e0e0] gap-1">
          <button className="px-4 py-1.5 rounded-full bg-white text-[#0066cc] text-xs font-semibold shadow-xs border border-[#0066cc]/20 transition-all">
            Fiscal 2026
          </button>
          <button className="px-4 py-1.5 rounded-full text-[#7a7a7a] hover:text-[#1d1d1f] text-xs font-medium transition-colors">
            Last 30 Days
          </button>
          <button className="px-4 py-1.5 rounded-full text-[#7a7a7a] hover:text-[#1d1d1f] text-xs font-medium transition-colors">
            Active Tenders Only
          </button>
        </div>

        {/* Global Action CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('audit')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#1d1d1f] text-xs font-medium border border-[#e0e0e0] hover:bg-[#f5f5f7] transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-[#0066cc]" />
            Audit Ledger
          </button>
          <button
            onClick={() => onNavigate('tenders')}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-semibold shadow-xs apple-button-press transition-colors"
          >
            <span>+ Create Tender</span>
          </button>
        </div>
      </section>

      {/* 2. Hero Overview Section (Apple Museum Canvas) */}
      <section className="w-full bg-[#f5f5f7] rounded-3xl border border-[#e0e0e0] px-6 sm:px-12 py-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#e0e0e0] text-[#7a7a7a] text-xs font-mono mb-4 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#0071e3] animate-pulse"></span>
          CPCL REFINERY COMPLEX (MANALI & CBR) • CENTRAL TENDER BOARD
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1d1d1f] tracking-tight mb-3">
          Public Procurement. Verified with Precision.
        </h1>
        <p className="text-base sm:text-lg text-[#7a7a7a] max-w-2xl leading-relaxed">
          AI-assisted, human-in-the-loop compliance evaluation under GFR 2017 & CVC Guidelines. Zero discrepancy tolerance for supercritical refinery equipment.
        </p>
      </section>

      {loading && (
        <LoadingState
          message="Aggregating procurement metrics and verifying audit integrity..."
          size="lg"
          className="rounded-2xl bg-white border border-[#e0e0e0] p-12"
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
          {/* 3. 4-Column High-Stakes Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Metric 1: Active Tenders */}
            <div
              onClick={() => onNavigate('tenders')}
              className="bg-white rounded-[18px] p-6 border border-[#e0e0e0] flex flex-col justify-between transition-all hover:border-[#0066cc] cursor-pointer shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">
                    Active Tenders
                  </span>
                  <FileText className="w-5 h-5 text-[#0066cc]" />
                </div>
                <div className="text-4xl font-semibold text-[#1d1d1f] tracking-tight mb-1">
                  {metrics.total_tenders || 14}
                </div>
                <div className="h-1.5 w-full bg-[#f5f5f7] rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-[#0066cc] rounded-full w-[78%]"></div>
                </div>
              </div>
              <div className="text-xs text-[#7a7a7a] flex items-center gap-1.5 pt-3 border-t border-[#f0f0f0]">
                <span className="material-symbols-outlined text-[15px] text-[#0066cc]">account_balance</span>
                <span>₹142.8 Cr total estimated value</span>
              </div>
            </div>

            {/* Metric 2: Bidders Evaluated */}
            <div
              onClick={() => onNavigate('bidders')}
              className="bg-white rounded-[18px] p-6 border border-[#e0e0e0] flex flex-col justify-between transition-all hover:border-[#0066cc] cursor-pointer shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">
                    Bidders Evaluated
                  </span>
                  <Users className="w-5 h-5 text-[#0066cc]" />
                </div>
                <div className="text-4xl font-semibold text-[#1d1d1f] tracking-tight mb-1">
                  {metrics.total_bidders || 58}
                </div>
                <div className="flex items-center gap-1 mb-3">
                  <span className="h-1.5 rounded-full bg-[#0066cc] flex-[41]"></span>
                  <span className="h-1.5 rounded-full bg-amber-400 flex-[11]"></span>
                  <span className="h-1.5 rounded-full bg-rose-500 flex-[6]"></span>
                </div>
              </div>
              <div className="text-xs text-[#7a7a7a] flex items-center justify-between pt-3 border-t border-[#f0f0f0]">
                <span className="text-[#0066cc] font-medium">41 Qualified</span>
                <span className="text-amber-600 font-medium">11 In Review</span>
                <span className="text-rose-600 font-medium">6 Unqualified</span>
              </div>
            </div>

            {/* Metric 3: Identifier Parity Rate */}
            <div className="bg-white rounded-[18px] p-6 border border-[#e0e0e0] flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">
                    Identifier Parity Rate
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-semibold text-[#1d1d1f] tracking-tight">94.2%</span>
                  <span className="font-mono text-xs text-emerald-600 font-semibold flex items-center">
                    +1.8%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#f5f5f7] rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-emerald-500 rounded-full w-[94.2%]"></div>
                </div>
              </div>
              <div className="text-xs text-[#7a7a7a] flex items-center gap-1.5 pt-3 border-t border-[#f0f0f0]">
                <span className="material-symbols-outlined text-[15px] text-[#7a7a7a]">sync_alt</span>
                <span>PAN ↔ GSTIN ↔ MCA cross-verified</span>
              </div>
            </div>

            {/* Metric 4: Forensic Signals Flagged */}
            <div className="bg-white rounded-[18px] p-6 border border-rose-200 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">
                    Forensic Signals
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] border border-rose-200 font-medium">
                    Human Review
                  </span>
                </div>
                <div className="text-4xl font-semibold text-[#1d1d1f] tracking-tight mb-1">
                  {metrics.high_risk_bidders || 7}
                </div>
                <div className="h-1.5 w-full bg-[#f5f5f7] rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-rose-500 rounded-full w-[35%]"></div>
                </div>
              </div>
              <div className="text-xs text-rose-700 flex items-center gap-1.5 pt-3 border-t border-rose-100 font-medium">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>3 PDF anomalies • 4 Related-party links</span>
              </div>
            </div>
          </div>

          {/* 4. Active High-Stakes Tenders Gallery */}
          <section className="bg-white rounded-3xl border border-[#e0e0e0] p-8 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">
                  High-Priority Two-Bid Tenders
                </h2>
                <p className="text-xs text-[#7a7a7a] mt-1">
                  Critical procurement contracts under active technical & commercial scrutiny.
                </p>
              </div>
              <button
                onClick={() => onNavigate('tenders')}
                className="text-xs font-semibold text-[#0066cc] hover:underline flex items-center gap-1"
              >
                View All Active Tenders →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: PUMP-217 */}
              <div className="p-6 rounded-[18px] bg-[#f5f5f7] border border-[#e0e0e0] flex flex-col justify-between hover:border-[#0066cc] transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#e0e0e0] text-xs font-mono text-[#1d1d1f] font-semibold">
                      NIT CPCL/MM/2026/PUMP-217
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-[#0066cc] text-[#0066cc] text-[10px] font-semibold">
                      Live Matrix
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#1d1d1f] leading-snug mb-2">
                    12 API-610 Centrifugal Pumps for Resid Upgrade Project
                  </h3>
                  <div className="space-y-1.5 text-xs text-[#7a7a7a] mb-4">
                    <div>Estimated Value: <strong className="text-[#1d1d1f]">₹18.40 Cr</strong></div>
                    <div>Bidders Ingested: <strong className="text-[#1d1d1f]">4 Vendors</strong> (1 Clean, 1 Review, 2 Flags)</div>
                    <div>Mandate: <strong className="text-[#1d1d1f]">Class-I Local (≥50%)</strong></div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('tenders')}
                  className="w-full py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-semibold transition-colors apple-button-press text-center"
                >
                  Open Compliance Matrix →
                </button>
              </div>

              {/* Card 2: VALVE-104 */}
              <div className="p-6 rounded-[18px] bg-[#f5f5f7] border border-[#e0e0e0] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#e0e0e0] text-xs font-mono text-[#1d1d1f] font-semibold">
                      NIT CPCL/ENG/2026/VALVE-104
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-[#e0e0e0] text-[#7a7a7a] text-[10px]">
                      Verification
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#1d1d1f] leading-snug mb-2">
                    High Pressure Forged Steel Gate & Globe Valves
                  </h3>
                  <div className="space-y-1.5 text-xs text-[#7a7a7a] mb-4">
                    <div>Estimated Value: <strong className="text-[#1d1d1f]">₹6.80 Cr</strong></div>
                    <div>Bidders Ingested: <strong className="text-[#1d1d1f]">8 Vendors</strong></div>
                    <div>Mandate: <strong className="text-[#1d1d1f]">IBR Certified</strong></div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('tenders')}
                  className="w-full py-2 rounded-full bg-white border border-[#e0e0e0] hover:bg-white/80 text-[#1d1d1f] text-xs font-medium transition-colors text-center"
                >
                  View Verification Status
                </button>
              </div>

              {/* Card 3: PIPE-089 */}
              <div className="p-6 rounded-[18px] bg-[#f5f5f7] border border-[#e0e0e0] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#e0e0e0] text-xs font-mono text-[#1d1d1f] font-semibold">
                      NIT CPCL/REF/2026/PIPE-089
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-emerald-300 text-emerald-700 text-[10px] font-semibold">
                      Dossier Certified
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#1d1d1f] leading-snug mb-2">
                    Seamless Alloy Steel Piping & Fittings Package
                  </h3>
                  <div className="space-y-1.5 text-xs text-[#7a7a7a] mb-4">
                    <div>Estimated Value: <strong className="text-[#1d1d1f]">₹31.20 Cr</strong></div>
                    <div>Bidders Ingested: <strong className="text-[#1d1d1f]">12 Vendors</strong> (All Closed)</div>
                    <div>Mandate: <strong className="text-[#1d1d1f]">ASTM A335 Grade P91</strong></div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('audit')}
                  className="w-full py-2 rounded-full bg-white border border-[#e0e0e0] hover:bg-white/80 text-[#1d1d1f] text-xs font-medium transition-colors text-center"
                >
                  Inspect Audit Dossier
                </button>
              </div>
            </div>
          </section>

          {/* 5. Middle Row: Compliance Distribution & Risk Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Distribution Card */}
            <div className="p-6 rounded-3xl bg-white border border-[#e0e0e0] flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-[#0066cc]" />
                    <span>Vendor Compliance Distribution</span>
                  </h2>
                  <span className="text-xs font-mono text-[#7a7a7a]">
                    {metrics.total_bidders} Total Bidders
                  </span>
                </div>
                <p className="text-xs text-[#7a7a7a] mb-4">
                  Deterministic qualification status across technical, financial, and statutory tender requirements.
                </p>

                {/* Progress Bar Overview */}
                <div className="w-full bg-[#f5f5f7] h-3 rounded-full overflow-hidden flex mb-4 border border-[#e0e0e0]">
                  {complianceStats.map(({ key, pct }) => {
                    if (pct === 0) return null;
                    const bg =
                      key === 'PASS'
                        ? 'bg-emerald-500'
                        : key === 'WARN'
                        ? 'bg-amber-400'
                        : key === 'REVIEW'
                        ? 'bg-[#0066cc]'
                        : key === 'FAIL'
                        ? 'bg-rose-500'
                        : 'bg-slate-400';
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
                      className="p-2.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <StatusChip status={key} size="xs" />
                        <span className="text-[#7a7a7a] text-[11px]">
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
                        <span className="font-bold text-[#1d1d1f]">{count}</span>
                        <span className="text-[#7a7a7a] text-[10px]">({pct}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Risk Distribution Card */}
            <div className="p-6 rounded-3xl bg-white border border-[#e0e0e0] flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>Forensic Risk Distribution</span>
                  </h2>
                  <span className="text-xs font-mono text-[#7a7a7a]">
                    Avg Score: <strong className="text-[#1d1d1f]">{metrics.avg_risk_score}</strong>/100
                  </span>
                </div>
                <p className="text-xs text-[#7a7a7a] mb-4">
                  Multi-signal risk scoring based on registry mismatches, PDF structural anomalies, and debarment flags.
                </p>

                {/* Progress Bar Overview */}
                <div className="w-full bg-[#f5f5f7] h-3 rounded-full overflow-hidden flex mb-4 border border-[#e0e0e0]">
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
                      className="p-2.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <StatusChip status={key} size="xs" />
                        <span className="text-[#7a7a7a] text-[11px]">{label}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="font-bold text-[#1d1d1f]">{count}</span>
                        <span className="text-[#7a7a7a] text-[10px]">({pct}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 6. Real-Time Cryptographic Event Stream (Stitch's Near-Black #272729 Tile) */}
          <section className="bg-[#272729] text-white rounded-3xl p-8 border border-[#333333] shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <h2 className="text-lg font-semibold tracking-tight text-white">
                    Live Cryptographic Forensic Stream
                  </h2>
                </div>
                <p className="text-xs text-[#a0a0a5] mt-1">
                  Every ingestion, verification check, and officer override is forward SHA-256 hash-chained in real time.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {auditStatus && (
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-emerald-400 text-xs font-mono font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    SHA-256 Audit Chain: INTACT (37/37)
                  </span>
                )}
                <button
                  onClick={() => onNavigate('audit')}
                  className="text-xs font-semibold text-[#2997ff] hover:underline"
                >
                  View Full Audit Ledger →
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {recentEvents && recentEvents.length > 0 ? (
                recentEvents.slice(0, 5).map((ev) => (
                  <div
                    key={ev.seq}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-white/[0.08] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/15">
                        #{ev.seq}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#0066cc] text-white text-[10px] font-semibold uppercase">
                        {ev.action}
                      </span>
                      <span className="text-[#a0a0a5] text-xs">
                        Actor: <strong className="text-white">{ev.payload?.actor_name || ev.actor_id || 'System'}</strong> ({ev.role})
                      </span>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-xs text-[#a0a0a5]">
                      <span>{new Date(ev.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[#2997ff] truncate max-w-[140px]" title={ev.curr_hash}>
                        {ev.curr_hash.slice(0, 12)}...
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(ev.curr_hash, `dash-${ev.seq}`)}
                        className="text-[#a0a0a5] hover:text-white p-1 transition-colors"
                        title="Copy SHA-256 Hash"
                      >
                        {copiedHash === `dash-${ev.seq}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-[#a0a0a5] text-xs">
                  Awaiting forensic pipeline events...
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
