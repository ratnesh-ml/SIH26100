import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Flame,
  Activity,
  Layers,
  Search,
} from 'lucide-react';
import { fetchBidder, fetchBidderRisk } from '../api/client';
import { BidderDetail, RiskProfileOut } from '../types';

interface RiskAnomalyViewProps {
  bidderId: string;
  onBack: () => void;
  onNavigateToCockpit?: (bidderId: string) => void;
}

export const RiskAnomalyView: React.FC<RiskAnomalyViewProps> = ({
  bidderId,
  onBack,
  onNavigateToCockpit,
}) => {
  const [activeTab, setActiveTab] = useState<'risk' | 'anomalies'>('risk');
  const [bidder, setBidder] = useState<BidderDetail | null>(null);
  const [risk, setRisk] = useState<RiskProfileOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bidderRes, riskRes] = await Promise.all([
        fetchBidder(bidderId),
        fetchBidderRisk(bidderId),
      ]);
      setBidder(bidderRes);
      setRisk(riskRes);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve bidder risk and anomaly profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [bidderId]);

  const score = risk?.risk_score ?? risk?.score ?? 0;
  const band = risk?.risk_band ?? risk?.band ?? 'LOW';

  // Filtered Anomalies
  const filteredAnomalies = useMemo(() => {
    if (!risk?.anomalies) return [];
    return risk.anomalies.filter((a) => {
      if (severityFilter !== 'ALL' && a.severity.toUpperCase() !== severityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          a.code.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [risk?.anomalies, severityFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {bidder?.canonical_name || bidder?.declared_name || 'Bidder Forensic Profile'}
              </h2>
              {onNavigateToCockpit && (
                <button
                  onClick={() => onNavigateToCockpit(bidderId)}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-400 border border-sky-800/80 hover:bg-sky-900 transition-colors inline-flex items-center gap-1"
                >
                  <span>Open Cockpit</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              PAN: {bidder?.pan || 'N/A'} • GSTIN: {bidder?.gstin || 'N/A'}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs & Refresh */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('risk')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'risk'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Risk Composite</span>
            </button>
            <button
              onClick={() => setActiveTab('anomalies')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'anomalies'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Document Anomalies ({risk?.anomalies?.length || 0})</span>
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-16 rounded-xl bg-slate-900/40 border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
          <span className="text-xs text-slate-400 font-medium">
            Loading forensic risk drivers and document anomaly signals...
          </span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">Failed to load risk profile</p>
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

      {!loading && !error && activeTab === 'risk' && (
        <div className="space-y-4">
          {/* Risk Score KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Composite Risk Score</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-white">{score}</span>
                <span className="text-xs text-slate-500 font-mono">/ 100</span>
              </div>
              <div className="mt-3 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    score > 60 ? 'bg-rose-500' : score > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Risk Band Classification</span>
                {band === 'HIGH' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                ) : band === 'MEDIUM' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div className="mt-2">
                <span
                  className={`px-2.5 py-1 rounded text-sm font-bold tracking-wider inline-block ${
                    band === 'HIGH'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800/80'
                      : band === 'MEDIUM'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800/80'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                  }`}
                >
                  {band} RISK
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {band === 'HIGH'
                  ? 'Mandatory heightened scrutiny & verification required before qualification.'
                  : band === 'MEDIUM'
                  ? 'Clarification recommended on flagged drivers prior to award.'
                  : 'Satisfactory risk posture within normal procurement thresholds.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Entity Resolution Confidence</span>
                <Activity className="w-4 h-4 text-sky-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-sky-400">
                  {risk?.entity_confidence !== undefined
                    ? `${Math.round(risk.entity_confidence * 100)}%`
                    : '100%'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                Fuzzy identity correlation between declared and canonical trade names.
              </p>
            </div>
          </div>

          {/* Risk Point Drivers Table */}
          <div className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden shadow-lg">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Risk Point Drivers & Evidentiary Attribution ({risk?.drivers?.length || 0})</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Deterministic point additions contributing to composite risk score.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-800">
              {risk?.drivers && risk.drivers.length > 0 ? (
                risk.drivers.map((d, idx) => (
                  <div key={idx} className="p-3.5 hover:bg-slate-800/30 transition-colors flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-xs">{d.driver}</span>
                      </div>
                      {d.source_ref && (
                        <div className="text-[10px] font-mono text-slate-400 bg-slate-950/80 p-1.5 rounded border border-slate-800 max-w-xl">
                          <span className="text-slate-500">Evidence Reference:</span>{' '}
                          {typeof d.source_ref === 'string'
                            ? d.source_ref
                            : JSON.stringify(d.source_ref)}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-amber-400 text-sm">+{d.points} pts</span>
                      <div className="text-[10px] text-slate-500">Score Impact</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-500 text-xs">
                  No adverse risk drivers recorded for this vendor.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Anomalies View Tab */}
      {!loading && !error && activeTab === 'anomalies' && (
        <div className="space-y-4">
          {/* Anomaly Filters Bar */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 font-medium">Severity:</span>
              {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    severityFilter === sev
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search anomalies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-48 sm:w-56"
              />
            </div>
          </div>

          {/* Anomalies List */}
          <div className="space-y-2.5">
            {filteredAnomalies.length > 0 ? (
              filteredAnomalies.map((anom, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/80">
                        {anom.code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          anom.severity === 'HIGH'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800/80'
                            : anom.severity === 'MEDIUM'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/80'
                            : 'bg-slate-950 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {anom.severity} SEVERITY
                      </span>
                    </div>

                    <span className="font-mono font-bold text-rose-400 text-xs">
                      +{anom.points} risk pts
                    </span>
                  </div>

                  <p className="text-slate-200 text-xs leading-relaxed font-medium">
                    {anom.description}
                  </p>

                  {/* Evidence Metadata Panel */}
                  {anom.evidence && Object.keys(anom.evidence).length > 0 && (
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1 text-[11px] font-mono">
                      <div className="text-[10px] uppercase font-bold text-slate-500">
                        Technical Evidence & Forensic Metadata:
                      </div>
                      <pre className="text-slate-300 text-[10px] overflow-x-auto whitespace-pre-wrap leading-tight">
                        {JSON.stringify(anom.evidence, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-16 rounded-xl bg-slate-900/40 border border-slate-800 text-center">
                <div className="p-3 rounded-full bg-slate-800/80 text-slate-500 inline-block mb-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <h4 className="text-xs font-semibold text-slate-300">No document anomalies detected</h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  {severityFilter !== 'ALL'
                    ? `No anomalies found with ${severityFilter} severity.`
                    : 'Vendor filings show clean PDF metadata without modification markers, hidden layers, or injection instructions.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
