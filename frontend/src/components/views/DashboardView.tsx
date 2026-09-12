import React, { useState } from 'react';
import { MOCK_TENDERS } from '../../mockData/tenders';
import { MOCK_BIDDERS } from '../../mockData/bidders';
import { MOCK_AUDIT_EVENTS } from '../../mockData/auditEvents';

interface DashboardViewProps {
  onNavigate: (view: string, params?: any) => void;
  onDownloadDossier: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onDownloadDossier,
}) => {
  const [selectedTenderId] = useState('CPCL-2026-PUMP');
  const [scanRunning, setScanRunning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerScan = () => {
    setScanRunning(true);
    setTimeout(() => {
      setScanRunning(false);
      setToastMessage('Deterministic Red-Flag Scan complete. 3 high-risk anomalies reaffirmed across 5 bidders.');
      setTimeout(() => setToastMessage(null), 4000);
    }, 800);
  };

  const currentTender = MOCK_TENDERS.find((t) => t.id === selectedTenderId) || MOCK_TENDERS[0];
  const activeBidders = MOCK_BIDDERS.filter((b) => b.tenderId === currentTender.id);
  const recentEvents = MOCK_AUDIT_EVENTS.slice(0, 5);

  return (
    <div className="flex flex-col gap-5 text-slate-800 text-xs">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Action & Overview Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Procurement Scrutiny Overview</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] uppercase font-bold border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span> Live Portal
            </span>
          </div>
          <p className="text-[13px] text-slate-600">
            Monitor active CPCL bid evaluations, compliance posture, and pending officer determinations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
            <span className="material-symbols-outlined text-[15px] text-blue-600">sync</span>
            <span>Last synced 4m ago</span>
          </div>
          <button
            onClick={onDownloadDossier}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white text-slate-700 font-medium text-[13px] border border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">file_download</span>
            <span>Export Scrutiny Dossier</span>
          </button>
          <button
            onClick={triggerScan}
            disabled={scanRunning}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-blue-600 text-white font-medium text-[13px] hover:bg-blue-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] text-white ${scanRunning ? 'animate-spin' : ''}`}>
              security_update_good
            </span>
            <span>{scanRunning ? 'Scanning Registries...' : 'Run Automated Red-Flag Scan'}</span>
          </button>
        </div>
      </div>

      {/* 4 Compact Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div
          onClick={() => onNavigate('tenders')}
          className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between h-28 hover:border-blue-400 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Tenders</span>
            <span className="p-1 rounded bg-slate-100 text-slate-600">
              <span className="material-symbols-outlined text-[16px]">gavel</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-slate-900 leading-none">14</span>
            <span className="inline-flex items-center gap-0.5 font-mono text-[11px] text-blue-600 font-medium">
              <span className="material-symbols-outlined text-[13px]">trending_up</span> +2 this week
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-500 truncate">₹384.2 Cr aggregate portfolio value</div>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => onNavigate('bidders')}
          className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between h-28 hover:border-blue-400 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Bidders Under Review
            </span>
            <span className="p-1 rounded bg-blue-50 text-blue-600">
              <span className="material-symbols-outlined text-[16px]">group</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-slate-900 leading-none">48</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 font-mono text-[10px] font-bold text-blue-700 border border-blue-200">
              ACTIVE STAGE
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-500 truncate">Across 8 specialized technical committees</div>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => onNavigate('risk-anomalies')}
          className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between h-28 hover:border-rose-400 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              High-Risk Bidders
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[10px] font-bold uppercase tracking-wider">
              Action Required
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-rose-600 leading-none">3</span>
            <span className="font-mono text-[11px] text-rose-600 font-medium flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">crisis_alert</span> High Severity
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-500 truncate">
            Immediate escalation & ROC/GeM cross-check
          </div>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => onNavigate('bidders')}
          className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between h-28 hover:border-amber-400 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pending Decisions</span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] font-bold uppercase tracking-wider">
              Review
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-slate-900 leading-none">7</span>
            <span className="font-mono text-[11px] text-amber-700 font-medium flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">timer</span> 3 expiring &lt;48h
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-500 truncate">Technical clarification affirmations pending</div>
        </div>
      </div>

      {/* Main Workspace Split-Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Tender Spotlight & Bidder Matrix (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-5">
          {/* Spotlight Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-semibold uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span> ACTIVE SCRUTINY
                </span>
                <span className="font-mono text-[11px] font-semibold text-slate-800 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                  REF: {currentTender.refNo}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('tenders', { tenderId: currentTender.id })}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Tender Details</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </button>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{currentTender.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{currentTender.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold font-mono text-slate-900">{currentTender.estimatedValue}</div>
                  <div className="text-[11px] text-slate-500">Sanctioned Capex (FY26)</div>
                </div>
              </div>

              {/* Bidder List Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-4">Bidder Entity</th>
                      <th className="py-2.5 px-3 text-center">Compliance</th>
                      <th className="py-2.5 px-3 text-center">Risk Score</th>
                      <th className="py-2.5 px-3">Officer Decision</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[12px]">
                    {activeBidders.map((bidder) => (
                      <tr key={bidder.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900">{bidder.legalName}</div>
                          <div className="font-mono text-[11px] text-slate-400">
                            {bidder.code} • GSTIN: {bidder.gstin}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              bidder.complianceStatus === 'PASS'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {bidder.complianceStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`font-mono font-bold text-xs ${
                              bidder.riskScore >= 60
                                ? 'text-rose-600'
                                : bidder.riskScore >= 30
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {bidder.riskScore}/100
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              bidder.officerDecision === 'OVERRIDE'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : bidder.officerDecision === 'QUALIFY'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : bidder.officerDecision === 'REJECT'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                bidder.officerDecision === 'OVERRIDE'
                                  ? 'bg-blue-600'
                                  : bidder.officerDecision === 'QUALIFY'
                                  ? 'bg-emerald-500'
                                  : bidder.officerDecision === 'REJECT'
                                  ? 'bg-rose-500'
                                  : 'bg-amber-500'
                              }`}
                            ></span>
                            {bidder.officerDecision}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => onNavigate('scrutiny', { bidderId: bidder.id })}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-md font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            Scrutiny Cockpit →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Priority Findings & Live Ledger (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-5">
          {/* Priority Findings Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-rose-600">crisis_alert</span>
                <h3 className="font-bold text-slate-900">Priority Findings</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                2 HIGH SEVERITY
              </span>
            </div>

            <div className="mt-3.5 space-y-3">
              <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-200">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-rose-800">PAN-GSTIN State Discordance</span>
                  <span className="font-mono text-rose-700">BID-HYD-0419</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  GSTIN state 33-TN mismatches registered ROC Pune, Maharashtra (27-MH). GFR 144(xi) scrutiny flag.
                </p>
                <div className="mt-2 flex items-center justify-between pt-1 text-[11px]">
                  <button
                    onClick={() => onNavigate('evidence', { findingId: 'FND-2026-0042' })}
                    className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5"
                  >
                    <span>Inspect Dual Evidences</span>
                    <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-800">Collusion / Shared Director Match</span>
                  <span className="font-mono text-amber-700">BID-HYD / BID-NOV</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  Common director DIN #08492019 identified between Bharat Hydrotech and Nova Pumps.
                </p>
                <div className="mt-2 flex items-center justify-between pt-1 text-[11px]">
                  <button
                    onClick={() => onNavigate('vendor-graph')}
                    className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5"
                  >
                    <span>Inspect Collusion Graph</span>
                    <span className="material-symbols-outlined text-[13px]">hub</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Immutable Audit Ledger Snippet */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-slate-600">receipt_long</span>
                <h3 className="font-bold text-slate-900">Live Forensic Ledger</h3>
              </div>
              <button
                onClick={() => onNavigate('audit-ledger')}
                className="text-blue-600 hover:underline font-semibold text-[11px]"
              >
                View Full Chain →
              </button>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {recentEvents.map((evt) => (
                <div
                  key={evt.blockNumber}
                  onClick={() => onNavigate('audit-ledger', { blockNumber: evt.blockNumber })}
                  className="p-2.5 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[11px] text-slate-800">Block #{evt.blockNumber}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{evt.timestamp}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 mt-0.5">{evt.action}</div>
                  <div className="font-mono text-[10px] text-slate-400 truncate mt-1">
                    SHA-256: {evt.hash.substring(0, 24)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
