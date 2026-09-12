import React, { useState } from 'react';
import { MOCK_TENDERS } from '../../mockData/tenders';
import { MOCK_BIDDERS } from '../../mockData/bidders';

interface DashboardViewProps {
  onNavigate: (view: string, params?: any) => void;
  onDownloadDossier: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onDownloadDossier,
}) => {
  const [scanRunning, setScanRunning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerScan = () => {
    setScanRunning(true);
    setTimeout(() => {
      setScanRunning(false);
      setToastMessage('Deterministic Red-Flag Scan complete. 4 high-risk anomalies reaffirmed across 5 bidders.');
      setTimeout(() => setToastMessage(null), 4000);
    }, 800);
  };

  const currentTender = MOCK_TENDERS.find((t) => t.id === 'CPCL-PUMP-217') || MOCK_TENDERS[0];
  const primaryBidder = MOCK_BIDDERS.find((b) => b.id === 'BID-HYD-0419') || MOCK_BIDDERS[0];

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
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
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
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white text-slate-700 font-medium text-[13px] border border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">file_download</span>
            <span>Export Scrutiny Dossier</span>
          </button>
          <button
            onClick={triggerScan}
            disabled={scanRunning}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-blue-600 text-white font-medium text-[13px] hover:bg-blue-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            type="button"
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
          className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between h-28 hover:border-blue-300 cursor-pointer transition-colors"
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
          className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between h-28 hover:border-blue-300 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Bidders Under Review</span>
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
          onClick={() => onNavigate('scrutiny', { bidderId: 'BID-HYD-0419' })}
          className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between h-28 hover:border-rose-300 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">High-Risk Bidders</span>
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
          <div className="font-mono text-[11px] text-slate-500 truncate">Immediate escalation & ROC/GeM cross-check</div>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => onNavigate('bidders')}
          className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between h-28 hover:border-amber-300 cursor-pointer transition-colors"
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

      {/* Main Workspace Split-Grid (8 cols / 4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Tender Spotlight & Bidder Matrix (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-5">
          {/* Current Tender Spotlight Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-semibold uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span> ACTIVE SCRUTINY
                </span>
                <span className="font-mono text-[11px] font-semibold text-slate-800 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                  REF: {currentTender.refNo}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                <span className="material-symbols-outlined text-[15px]">event</span> Closing: <strong className="text-slate-800">18 Mar 2026, 17:00 IST</strong>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  API-610 Centrifugal Process Pumps for Crude Distillation Unit-III
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Procuring Entity: <span className="font-medium text-slate-800">Chennai Petroleum Corporation Ltd (CPCL)</span> • Mechanical Maintenance Division
                </p>
              </div>

              {/* Metadata Pills Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-md border border-slate-200">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Estimated Value</span>
                  <span className="font-mono text-[13px] font-bold text-slate-900">₹18.40 Cr</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Bidders Participating</span>
                  <span className="font-mono text-[13px] font-bold text-slate-900">5 Formal Submissions</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Procurement Route</span>
                  <span className="font-mono text-[13px] font-bold text-slate-900">Open ICB (Domestic)</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Security Deposit / EMD</span>
                  <span className="font-mono text-[13px] font-bold text-emerald-700">₹36.80 Lakhs (Verified)</span>
                </div>
              </div>

              {/* Evaluation Stage Stepper Progress */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-slate-800">Technical &amp; Integrity Scrutiny (Step 3 of 5)</span>
                  <span className="font-mono text-[11px] font-bold text-blue-700">68% Phase Completion</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: '68%' }}></div>
                </div>

                {/* Workflow Stage Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-1">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
                    <span className="font-mono text-[10px] font-semibold leading-none">1. Prequal</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
                    <span className="font-mono text-[10px] font-semibold leading-none">2. Collusion</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                    <span className="material-symbols-outlined text-[15px] text-blue-600 animate-spin">autorenew</span>
                    <span className="font-mono text-[10px] leading-none">3. Tech Review</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-100 text-slate-400 border border-slate-200">
                    <span className="material-symbols-outlined text-[15px]">lock</span>
                    <span className="font-mono text-[10px] font-medium leading-none">4. Price Open</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-100 text-slate-400 border border-slate-200">
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                    <span className="font-mono text-[10px] font-medium leading-none">5. Final Award</span>
                  </div>
                </div>
              </div>

              {/* Risk Distribution Bar */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Bidder Risk Profile Distribution</span>
                  <span className="font-mono text-[11px] text-slate-500">N=5 Vendors Assessed</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden flex gap-0.5 bg-slate-100">
                  <div className="bg-emerald-500 h-full" style={{ width: '40%' }} title="Low Risk: 40%"></div>
                  <div className="bg-amber-400 h-full" style={{ width: '40%' }} title="Medium Risk: 40%"></div>
                  <div className="bg-rose-500 h-full" style={{ width: '20%' }} title="High Risk: 20%"></div>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> LOW RISK: 2 (40%)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> MEDIUM RISK: 2 (40%)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 font-mono text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> HIGH RISK: 1 (20%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bidder Progress & Evaluation Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-slate-900">Bidder Scrutiny Matrix</span>
                <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {currentTender.refNo}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[11px] text-slate-500">5 of 5 Audited</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500 select-none">
                    <th className="py-2.5 px-4">Bidder Entity &amp; GSTIN</th>
                    <th className="py-2.5 px-3 text-right">Compliance</th>
                    <th className="py-2.5 px-3 text-center">Risk Tier</th>
                    <th className="py-2.5 px-4">Algorithmic Scrutiny Findings</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  {/* Row 1 */}
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-slate-900">Apex Industrial Flow Ltd</span>
                        <span className="font-mono text-[11px] text-slate-500">GST: 33AAACA1122Q1Z3</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">94%</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> LOW
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs">
                      <span className="truncate block" title="All certificates validated via MCA & GSTN">All certificates validated via MCA &amp; GSTN registry</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-medium whitespace-nowrap">
                        Clearance Rec.
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigate('evidence', { findingId: 'FND-APX-01' })}
                        className="text-[12px] text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                        type="button"
                      >
                        View File
                      </button>
                    </td>
                  </tr>

                  {/* Row 2 */}
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-slate-900">Bharat Heavy Turbotech Corp</span>
                        <span className="font-mono text-[11px] text-slate-500">GST: 27AABCB8899K1Z4</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">88%</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> LOW
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs">
                      <span className="truncate block" title="Minor specification deviation on casing alloy (MOC-11)">Minor specification deviation on casing alloy (MOC-11)</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-medium whitespace-nowrap">
                        Clarified
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigate('evidence', { findingId: 'FND-BHT-02' })}
                        className="text-[12px] text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                        type="button"
                      >
                        View File
                      </button>
                    </td>
                  </tr>

                  {/* Row 3 */}
                  <tr className="hover:bg-slate-50/70 transition-colors bg-amber-50/30">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-slate-900">Synergy Fluid Dynamics Pvt</span>
                        <span className="font-mono text-[11px] text-slate-500">GST: 24AAGCS4512P1ZM</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-700">74%</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> MEDIUM
                      </span>
                    </td>
                    <td className="py-3 px-4 text-amber-900 max-w-xs">
                      <span className="truncate block" title="Local content declaration shows 48% vs 50% mandated threshold">Local content 48% vs 50% threshold</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[11px] font-medium whitespace-nowrap">
                        Affidavit Pend.
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigate('scrutiny', { bidderId: 'BID-HYD-0419' })}
                        className="text-[12px] text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                        type="button"
                      >
                        Review
                      </button>
                    </td>
                  </tr>

                  {/* Row 4 */}
                  <tr className="hover:bg-slate-50/70 transition-colors bg-amber-50/30">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-slate-900">Trishul Heavy Engineering LLP</span>
                        <span className="font-mono text-[11px] text-slate-500">GST: 29AABFT7821H1ZQ</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-700">69%</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> MEDIUM
                      </span>
                    </td>
                    <td className="py-3 px-4 text-amber-900 max-w-xs">
                      <span className="truncate block" title="PDF author metadata matches competitor subcontractor">PDF author metadata matches competitor subcontractor</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[11px] font-medium whitespace-nowrap">
                        Collusion Inquiry
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigate('graph')}
                        className="text-[12px] text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                        type="button"
                      >
                        Review
                      </button>
                    </td>
                  </tr>

                  {/* Row 5 - Primary Scrutiny Target */}
                  <tr className="hover:bg-rose-50/50 transition-colors bg-rose-50/20">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-rose-700">{primaryBidder.legalName}</span>
                        <span className="font-mono text-[11px] text-slate-500">GST: {primaryBidder.gstin}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">38%</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> HIGH
                      </span>
                    </td>
                    <td className="py-3 px-4 text-rose-800 max-w-xs">
                      <span className="truncate block font-medium" title="PAN-GSTIN mismatch; GeM exclusion match">
                        PAN-GSTIN mismatch (33-TN vs 27-MH); Turn. relaxation
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[11px] font-bold whitespace-nowrap">
                        Disqualify Drafted
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigate('scrutiny', { bidderId: primaryBidder.id })}
                        className="text-[12px] text-rose-600 hover:text-rose-800 hover:underline font-semibold px-2 py-1 rounded transition-colors cursor-pointer"
                        type="button"
                      >
                        Resolve
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Matrix Footer */}
            <div className="p-3 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between px-4 text-slate-500 font-mono text-[11px]">
              <span>Algorithm Confidence: 99.4% (NIC-CERT Rule Pack 2026.1)</span>
              <button
                onClick={() => onNavigate('matrix')}
                className="text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer"
              >
                Export Compliance Matrix (XLSX) →
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Priority Findings & Audit Ledger (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-5">
          {/* Priority Findings Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-rose-600">notification_important</span>
                <h3 className="text-[14px] font-bold text-slate-900">Priority Findings</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[10px] font-bold">
                4 ANOMALIES
              </span>
            </div>

            <div className="divide-y divide-slate-100 flex flex-col">
              {/* Finding 1 */}
              <div className="p-3.5 hover:bg-slate-50/60 transition-colors flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-rose-700 uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> CRITICAL ANOMALY
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">Tender #217</span>
                </div>
                <div className="text-[13px] font-bold text-slate-900 leading-snug mt-0.5">
                  PAN-GSTIN Identity Inconsistency
                </div>
                <p className="text-[12px] text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">Bharat Hydrotech Corp:</strong> Characters 3–12 of Form REG-06 mismatch declared PAN (State prefix 33-TN vs Pune ROC 27-MH).
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <button
                    onClick={() => onNavigate('scrutiny', { bidderId: 'BID-HYD-0419' })}
                    className="text-blue-600 font-semibold text-[11px] hover:underline flex items-center gap-0.5 cursor-pointer"
                    type="button"
                  >
                    View Discrepancy <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </button>
                  <span className="font-mono text-[10px] text-slate-400">ROC ID: U29100MH2018</span>
                </div>
              </div>

              {/* Finding 2 */}
              <div className="p-3.5 hover:bg-slate-50/60 transition-colors flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-rose-700 uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> DEBARMENT MATCH
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">GeM Blacklist</span>
                </div>
                <div className="text-[13px] font-bold text-slate-900 leading-snug mt-0.5">
                  Debarment Record (GeM Portal Match)
                </div>
                <p className="text-[12px] text-slate-600 leading-relaxed">
                  Director DIN-08492014 matched against MoF 2024 exclusion circular OM-F.1/2/2023-PPD.
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <button
                    onClick={() => onNavigate('registry')}
                    className="text-blue-600 font-semibold text-[11px] hover:underline flex items-center gap-0.5 cursor-pointer"
                    type="button"
                  >
                    Inspect Sanction <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </button>
                  <span className="font-mono text-[10px] text-slate-400">Exp: 14 Dec 2026</span>
                </div>
              </div>

              {/* Finding 3 */}
              <div className="p-3.5 hover:bg-slate-50/60 transition-colors flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-amber-800 uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> POLICY COMPLIANCE
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">Make In India</span>
                </div>
                <div className="text-[13px] font-bold text-slate-900 leading-snug mt-0.5">
                  Local Content Deficit (Class-I Criteria)
                </div>
                <p className="text-[12px] text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">Synergy Fluid Dynamics:</strong> Declared 48.2% local value addition; mandatory CPCL threshold is 50.0%.
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <button
                    onClick={onDownloadDossier}
                    className="text-blue-600 font-semibold text-[11px] hover:underline flex items-center gap-0.5 cursor-pointer"
                    type="button"
                  >
                    Download CA Cert <span className="material-symbols-outlined text-[13px]">file_open</span>
                  </button>
                  <span className="font-mono text-[10px] text-amber-700 font-bold">-1.8% Gap</span>
                </div>
              </div>

              {/* Finding 4 */}
              <div className="p-3.5 hover:bg-slate-50/60 transition-colors flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-amber-800 uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> FORENSIC ANOMALY
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">Collusion Engine</span>
                </div>
                <div className="text-[13px] font-bold text-slate-900 leading-snug mt-0.5">
                  PDF Metadata &amp; Author Overlap
                </div>
                <p className="text-[12px] text-slate-600 leading-relaxed">
                  Identical author GUID <code className="bg-slate-100 px-1 py-0.5 rounded">XeroxWorkCentre-7845</code> between Trishul LLP and competitor proposal.
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <button
                    onClick={() => onNavigate('graph')}
                    className="text-blue-600 font-semibold text-[11px] hover:underline flex items-center gap-0.5 cursor-pointer"
                    type="button"
                  >
                    Examine Forensic Graph <span className="material-symbols-outlined text-[13px]">hub</span>
                  </button>
                  <span className="font-mono text-[10px] text-slate-400">Δt = 11 mins</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Ledger Integrity & Stream Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-slate-900 leading-tight">Audit Ledger Integrity</span>
                  <span className="font-mono text-[10px] text-emerald-700 font-bold uppercase">Immutable &amp; Verified</span>
                </div>
              </div>
              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Block #19,402
              </span>
            </div>

            <div className="px-3.5 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-500 truncate max-w-[220px]">
                SHA: 0x8f2d4e7a091b...c94b
              </span>
              <span className="font-mono text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Synced
              </span>
            </div>

            {/* Activity Stream */}
            <div className="p-4 flex flex-col gap-3.5">
              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-slate-900">Clarification Dispatched</span>
                    <span className="font-mono text-[10px] text-slate-400">10:42 AM</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    Official letter dispatched to Synergy Fluid Dynamics regarding Class-I local value shortfall.
                  </p>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 mt-0.5">
                    <span className="material-symbols-outlined text-[12px]">person</span> R. Verma (Officer-in-Charge)
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-slate-800 mt-1.5 flex-shrink-0"></span>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-slate-900">Forensic Scan Finished</span>
                    <span className="font-mono text-[10px] text-slate-400">09:15 AM</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    Comprehensive automated red-flag report generated for Tender Ref: CPCL/MM/2026/PUMP-217.
                  </p>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 mt-0.5">
                    <span className="material-symbols-outlined text-[12px]">smart_toy</span> Automated Engine v2.4
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 mt-1.5 flex-shrink-0"></span>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-rose-700">Disqualification Drafted</span>
                    <span className="font-mono text-[10px] text-slate-400">Yest, 16:30</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    Recommendation drafted for Kestrel Heavy Pumps Infra (ROC Dormancy &amp; MoF Debarment overlap).
                  </p>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 mt-0.5">
                    <span className="material-symbols-outlined text-[12px]">person</span> R. Verma
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0"></span>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-slate-900">Tech Compliance Approved</span>
                    <span className="font-mono text-[10px] text-slate-400">Yest, 14:10</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    Cleared technical compliance specification for Apex Industrial Flow Ltd without caveats.
                  </p>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 mt-0.5">
                    <span className="material-symbols-outlined text-[12px]">groups</span> Evaluation Committee (3/3)
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
              <button
                onClick={() => onNavigate('audit')}
                className="text-[12px] text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer"
                type="button"
              >
                View Complete Audit Trail (64 entries) →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
