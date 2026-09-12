import React, { useState } from 'react';
import { procurementService } from '../../services/procurementService';

interface BidderScrutinyViewProps {
  bidderId?: string;
  onNavigate: (view: string, params?: any) => void;
  onDownloadDossier: () => void;
}

export const BidderScrutinyView: React.FC<BidderScrutinyViewProps> = ({
  bidderId = 'BID-HYD-0419',
  onNavigate,
  onDownloadDossier,
}) => {
  const [decision, setDecision] = useState<'QUALIFY' | 'REJECT' | 'OVERRIDE' | 'SEEK CLARIFICATION'>('OVERRIDE');
  const [justification, setJustification] = useState(
    'The Tender Evaluation Committee (TEC) reviewed Bharat Hydrotech Corp’s Udyam Registration (UDYAM-MH-26-0034912) and affirms that under Public Procurement Policy (MSE Order 2012 Clause 10) & CPCL Prequalification relaxation rules, the ₹6.10 Cr turnover is admissible for technical evaluation. Regarding the GSTIN state code discordance (33-TN vs 27-MH), the bidder holds an active Tamil Nadu project execution branch registration; provisional qualification is granted subject to submission of Form REG-06 annexure within 5 calendar days.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<{ blockNumber: number; hash: string } | null>(null);
  const [currentBidderStatus, setCurrentBidderStatus] = useState<string>('PENDING REVIEW');

  const handleCommitDecision = async () => {
    if (!justification.trim() || justification.length < 30) {
      alert('Mandatory written justification of at least 30 characters is required for regulatory audit trail compliance.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await procurementService.submitOfficerDecision(bidderId, decision, justification);
      setCurrentBidderStatus(decision);
      setSuccessToast({
        blockNumber: res.newBlock.blockNumber,
        hash: res.newBlock.hash,
      });
      setTimeout(() => setSuccessToast(null), 6000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full space-y-4 text-slate-800 text-xs">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-18 right-6 z-50 bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-blue-500 max-w-md animate-bounce">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[24px] text-emerald-400 shrink-0">verified</span>
            <div className="flex-1">
              <div className="font-bold text-sm text-emerald-400">Decision Signed & Ledger Block Appended!</div>
              <div className="text-xs text-slate-300 mt-1">
                Adjudication determination committed as <strong>Block #{successToast.blockNumber}</strong> with SHA-256
                digest:
              </div>
              <div className="font-mono text-[10px] text-sky-300 bg-slate-800 p-1.5 rounded mt-1.5 break-all">
                {successToast.hash}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={() => onNavigate('audit-ledger', { blockNumber: successToast.blockNumber })}
                  className="text-xs font-semibold text-sky-400 hover:underline cursor-pointer"
                >
                  View Audit Block #{successToast.blockNumber} →
                </button>
                <button
                  onClick={onDownloadDossier}
                  className="text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
                >
                  Download Dossier →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COCKPIT ENTITY HEADER & TOP STATUS STRIP */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bharat Hydrotech Corp</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                Bidder C
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                ID: {bidderId}
              </span>
            </div>
            <div className="mt-1 flex items-center space-x-3 text-xs text-slate-500">
              <span>
                Tender: <strong className="font-mono text-slate-700">CPCL/MM/2026/PUMP-217</strong>
              </span>
              <span>•</span>
              <span>Category: Mechanical High-Pressure Package</span>
              <span>•</span>
              <span>Packet Value: ₹18.40 Cr ICB</span>
              <span>•</span>
              <span>Jurisdiction: Pune ROC, Maharashtra</span>
            </div>
          </div>

          {/* Top Status Metric Strip */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Compliance Status */}
            <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-md bg-rose-100 flex items-center justify-center text-rose-700">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-rose-600">Compliance</div>
                <div className="text-sm font-bold text-rose-700">FAIL</div>
              </div>
            </div>

            {/* Risk Score */}
            <div className="bg-rose-50/60 border border-rose-200 rounded-lg px-3 py-2 flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-md bg-rose-100 flex items-center justify-center text-rose-700 font-mono font-bold text-xs">
                65
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Risk Score</div>
                <div className="text-sm font-bold text-slate-800 font-mono">
                  65 <span className="text-xs font-normal text-slate-400">/ 100</span>
                </div>
              </div>
            </div>

            {/* Risk Level */}
            <div className="bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2">
              <div className="text-[10px] uppercase font-semibold tracking-wider text-rose-600">Risk Level</div>
              <div className="text-sm font-bold text-rose-700 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                <span>HIGH RISK</span>
              </div>
            </div>

            {/* Officer Decision */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2">
              <div className="text-[10px] uppercase font-semibold tracking-wider text-amber-700">Officer Decision</div>
              <div className="text-sm font-bold text-amber-800 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{currentBidderStatus}</span>
              </div>
            </div>

            {/* Fast Quick Actions */}
            <div className="flex items-center space-x-2 ml-1">
              <button
                onClick={() => onNavigate('audit-ledger')}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px] text-slate-500">receipt_long</span>
                <span>Audit Manifest</span>
              </button>
              <button
                onClick={onDownloadDossier}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px] text-slate-500">download</span>
                <span>Download Dossier</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* THREE-COLUMN EVALUATION LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* COLUMN 1: VERIFIED IDENTITY */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Verified Identity</h2>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              6 Registries Polled
            </span>
          </div>

          <div className="mt-3 space-y-2.5 flex-1 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Legal Entity Name</div>
              <div className="text-xs font-semibold text-slate-800 mt-0.5">Bharat Hydrotech Corporation Pvt Ltd</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Trade Name: Bharat Hydrotech Solutions</div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">
                  Permanent Account Number (PAN)
                </div>
                <div className="text-xs font-bold font-mono text-slate-800 mt-0.5">AAACB1234F</div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  NSDL Active
                </span>
                <div className="text-[10px] text-slate-400 mt-0.5">CBDT Match 99.1%</div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase font-semibold text-amber-700">
                  Goods & Services Tax ID (GSTIN)
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  State Mismatch
                </span>
              </div>
              <div className="text-xs font-bold font-mono text-slate-800 mt-0.5">33AAACB9999F1Z5</div>
              <div className="text-[11px] text-amber-800 mt-1">
                State Code 33 (Tamil Nadu) vs ROC Registered State 27 (Maharashtra).
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">Corporate ID (CIN)</div>
                <div className="text-xs font-bold font-mono text-slate-800 mt-0.5">U29100MH2018PTC310244</div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  MCA21 Active
                </span>
                <div className="text-[10px] text-slate-400 mt-0.5">Inc: 14/06/2018</div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">MSME Udyam Registration</div>
                <div className="text-xs font-bold font-mono text-slate-800 mt-0.5">UDYAM-MH-26-0034912</div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Medium-MSE
                </span>
                <div className="text-[10px] text-slate-400 mt-0.5">Mfg Sector</div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-100/70 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-700">Entity Match Consistency Score</span>
                <span className="font-mono text-xs font-bold text-amber-700">82.1% (Discordant)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '82.1%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: ELIGIBILITY & FINANCIALS */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Eligibility & Financials</h2>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              2 Deficits Triggered
            </span>
          </div>

          <div className="mt-3 space-y-2.5 flex-1 text-xs">
            <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase font-semibold text-rose-700">3-Year Average Turnover</div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  DEFICIT (FAIL)
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-bold font-mono text-slate-900">₹6.10 Cr</span>
                <span className="text-[11px] text-slate-500">
                  Min Required: <strong className="font-mono text-slate-700">₹12.00 Cr</strong>
                </span>
              </div>
              <div className="text-[11px] text-rose-700 mt-0.5">
                Falls short by 49.1%. MSE turnover relaxation evaluated & disallowed.
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">Audited Net Worth (FY24-25)</div>
                <div className="text-xs font-bold font-mono text-slate-800 mt-0.5">₹4.85 Cr</div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  PASS (Min ₹3.00 Cr)
                </span>
                <div className="text-[10px] text-slate-400 mt-0.5">UDIN Certified</div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase font-semibold text-rose-700">Make in India Local Content</div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  NON-COMPLIANT
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-bold font-mono text-slate-900">45.0% (Class-II)</span>
                <span className="text-[11px] text-slate-500">
                  Tender Threshold: <strong className="font-mono text-slate-700">≥ 50.0% (Class-I)</strong>
                </span>
              </div>
              <div className="text-[11px] text-rose-700 mt-0.5">
                Declared value addition lacks Class-I preference entitlement.
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">Earnest Money Deposit (EMD)</div>
                <div className="text-xs font-bold font-mono text-slate-800 mt-0.5">₹36.80 Lakhs (BG)</div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  VERIFIED SFMS
                </span>
                <div className="text-[10px] text-slate-400 mt-0.5">SBI Pune BG-8841</div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">OEM Authorization (MAF)</div>
                <div className="text-xs font-semibold text-slate-800 mt-0.5">Direct Hydrotech Facility</div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  VALIDATED
                </span>
                <div className="text-[10px] text-slate-400 mt-0.5">ISO 9001:2015</div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: CRITICAL FINDINGS */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-rose-600"></div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Critical Findings</h2>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              3 Active Findings
            </span>
          </div>

          <div className="mt-3 space-y-2.5 flex-1 text-xs">
            {/* Finding 1 */}
            <div className="p-3 rounded-lg bg-blue-50/50 border-2 border-blue-500 shadow-xs relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    HIGH SEVERITY
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">RULE #GFR-144-C</span>
                </div>
                <span className="text-[11px] font-medium text-slate-500">4 Evidence Files</span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 mt-2">PAN-GSTIN Identity Inconsistency</h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                GSTIN state code prefix (33-TN) conflicts with registered corporate ROC location in Maharashtra (27-MH).
              </p>
              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-blue-200/60">
                <span className="text-[10px] font-semibold text-blue-700 flex items-center space-x-1">
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  <span>Active in Inspection</span>
                </span>
                <button
                  onClick={() => onNavigate('evidence', { findingId: 'FND-2026-0042' })}
                  className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs cursor-pointer"
                >
                  Inspect Dual Evidence →
                </button>
              </div>
            </div>

            {/* Finding 2 */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    HIGH SEVERITY
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">RULE #MII-PPO-2017</span>
                </div>
                <span className="text-[11px] font-medium text-slate-500">2 Evidence Files</span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 mt-2">Local Content Deficit</h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Declared local value addition is 45.0%, disqualifying bidder from mandatory Class-I local purchase preference.
              </p>
              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-[10px] text-slate-500">Audited Annexure B</span>
                <button
                  onClick={() => onNavigate('evidence', { findingId: 'FND-2026-0089' })}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
                >
                  Inspect
                </button>
              </div>
            </div>

            {/* Finding 3 */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    MEDIUM SEVERITY
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">RULE #DOC-INT-09</span>
                </div>
                <span className="text-[11px] font-medium text-slate-500">1 Evidence File</span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 mt-2">Document Anomaly & Telemetry</h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                PDF author metadata timestamp is discordant with digital signature signing timestamp by 48 minutes.
              </p>
              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-[10px] text-slate-500">NIC-CERT Hash Check</span>
                <button
                  onClick={() => onNavigate('evidence', { findingId: 'FND-2026-0112' })}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
                >
                  Inspect
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LOWER DEEP INSPECTION: EVIDENCE & REASONING AREA */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Evidence & Reasoning Analysis
            </h2>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              Selected Finding: PAN-GSTIN Identity Inconsistency
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span>
              Engine: <strong className="text-slate-700">Deterministic Rule Engine v2.4</strong>
            </span>
            <span>•</span>
            <span className="font-mono text-slate-600">Trace: #EV-7729-PAN-GST</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
          {/* Statutory Rule Explanation */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <span className="material-symbols-outlined text-[16px] text-blue-600">info</span>
                <span>Statutory Rule Explanation</span>
              </div>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                Under <strong>General Financial Rules (GFR) Rule 144(i)</strong> and Public Procurement Policy, a bidding
                legal entity must maintain tax registry concordance across statutory filings. The submitted bid package
                contains a <strong>Goods and Services Tax Identification Number (GSTIN) 33AAACB9999F1Z5</strong> originating
                in Tamil Nadu (State Code 33). However, the bidder’s certified incorporation certificate (MCA21) and Udyam
                certificate record its principal manufacturing plant and registered office in Pune, Maharashtra (State Code 27).
              </p>
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-start space-x-2">
                <span className="material-symbols-outlined text-[16px] text-rose-600 shrink-0 mt-0.5">warning</span>
                <div>
                  <strong>Algorithmic Red-Flag Inference:</strong> Potential inter-state shell entity proxy routing or
                  lack of local tax jurisdiction clearance for contract execution in CPCL Tamil Nadu refinery boundaries.
                </div>
              </div>
            </div>

            {/* Cross-Evidence Discrepancy Matrix */}
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Cross-Evidence Discrepancy Matrix
              </div>
              <div className="mt-2.5 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-[11px] text-slate-500 border-b border-slate-200">
                      <th className="pb-1.5 font-semibold">Data Parameter</th>
                      <th className="pb-1.5 font-semibold">Declared / Registry Value</th>
                      <th className="pb-1.5 font-semibold">Source Record</th>
                      <th className="pb-1.5 font-semibold">Concordance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 font-mono text-[11px]">
                    <tr>
                      <td className="py-1.5 text-slate-600 font-sans">Entity PAN</td>
                      <td className="py-1.5 font-semibold text-slate-800">AAACB1234F</td>
                      <td className="py-1.5 text-slate-500 font-sans">CBDT NSDL Registry</td>
                      <td className="py-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800">
                          MATCH 100%
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-slate-600 font-sans">State Code Prefix</td>
                      <td className="py-1.5 font-semibold text-rose-700">33 (Tamil Nadu)</td>
                      <td className="py-1.5 text-slate-500 font-sans">GST Certificate Reg-06</td>
                      <td className="py-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800">DISCORDANT</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-slate-600 font-sans">ROC Registered Office</td>
                      <td className="py-1.5 font-semibold text-slate-800">State 27 (Maharashtra)</td>
                      <td className="py-1.5 text-slate-500 font-sans">MCA21 Master Data</td>
                      <td className="py-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800">DISCORDANT</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Source Documents */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Primary Source Documents</span>
              <span className="text-[10px] text-slate-400 font-normal">3 cryptographic attestations</span>
            </div>

            <div className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 transition-colors flex items-start justify-between">
              <div className="flex items-start space-x-2.5">
                <div className="w-8 h-8 rounded bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">FORM_GST_REG_06.pdf</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Page 1 • Field: GSTIN 33AAACB9999F1Z5</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">SHA-256: 4f8b9e...3d2</div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('evidence', { doc: 'gst' })}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center cursor-pointer"
              >
                <span>View</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 transition-colors flex items-start justify-between">
              <div className="flex items-start space-x-2.5">
                <div className="w-8 h-8 rounded bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">MCA_COI_Certificate.pdf</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Page 1 • CIN: U29100MH2018PTC310244</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">Jurisdiction: ROC Pune</div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('evidence', { doc: 'mca' })}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center cursor-pointer"
              >
                <span>View</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 transition-colors flex items-start justify-between">
              <div className="flex items-start space-x-2.5">
                <div className="w-8 h-8 rounded bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">CA_Turnover_Certificate.pdf</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Page 2 • UDIN 24049819BCDE1942</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">Declared: ₹6.10 Cr vs Req ₹12.00 Cr</div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('evidence', { doc: 'ca' })}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center cursor-pointer"
              >
                <span>View</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* OFFICER DECISION ADJUDICATION PANEL */}
      <div className="bg-white rounded-xl border-2 border-slate-300 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200 gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-slate-800"></span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Officer Adjudication & Determination
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a statutory determination for <strong>Bharat Hydrotech Corp (Bidder C)</strong> in Tender{' '}
              <strong>CPCL/MM/2026/PUMP-217</strong>.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2 flex items-center space-x-2 text-xs text-amber-900 shadow-xs">
            <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0">info</span>
            <span className="font-medium">
              “AI recommendation is advisory. Final procurement authority remains with the designated officer.”
            </span>
          </div>
        </div>

        {/* Determination Option Selector Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-4">
          <button
            type="button"
            onClick={() => setDecision('QUALIFY')}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              decision === 'QUALIFY'
                ? 'border-2 border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-slate-800">QUALIFY</span>
              <span
                className={`w-4 h-4 rounded-full border ${
                  decision === 'QUALIFY' ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'
                }`}
              ></span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">Approve for Commercial / Price Bid Opening Stage</div>
          </button>

          <button
            type="button"
            onClick={() => setDecision('REJECT')}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              decision === 'REJECT'
                ? 'border-2 border-rose-600 bg-rose-50/50 shadow-xs ring-2 ring-rose-500/20'
                : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-slate-800">REJECT</span>
              <span
                className={`w-4 h-4 rounded-full border ${
                  decision === 'REJECT' ? 'bg-rose-600 border-rose-600' : 'border-slate-300'
                }`}
              ></span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">Disqualify on GFR & Turnover Non-Compliance grounds</div>
          </button>

          <button
            type="button"
            onClick={() => setDecision('OVERRIDE')}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              decision === 'OVERRIDE'
                ? 'border-2 border-blue-600 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/20'
                : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-blue-900 flex items-center space-x-1.5">
                <span>OVERRIDE</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-200 text-blue-800">ACTIVE</span>
              </span>
              <span className="w-4 h-4 rounded-full bg-blue-600 border border-blue-600 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[10px]">check</span>
              </span>
            </div>
            <div className="text-[11px] text-blue-900 font-medium mt-2">
              Override automated disqualification with TEC justification
            </div>
          </button>

          <button
            type="button"
            onClick={() => setDecision('SEEK CLARIFICATION')}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              decision === 'SEEK CLARIFICATION'
                ? 'border-2 border-amber-600 bg-amber-50/50 shadow-xs ring-2 ring-amber-500/20'
                : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-slate-800">SEEK CLARIFICATION</span>
              <span
                className={`w-4 h-4 rounded-full border ${
                  decision === 'SEEK CLARIFICATION' ? 'bg-amber-600 border-amber-600' : 'border-slate-300'
                }`}
              ></span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">Issue formal 48-hr clarification notice via e-Portal</div>
          </button>
        </div>

        {/* Written Justification Text Area */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="override-justification" className="text-xs font-bold text-slate-800 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Mandatory Written Minutes & Statutory Justification</span>
              <span className="text-rose-600">*</span>
            </label>
            <span className="text-[11px] text-slate-500">CVC Audit Log Entry • Min 30 characters required</span>
          </div>

          <textarea
            id="override-justification"
            rows={3}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none leading-relaxed transition-all shadow-inner"
            placeholder="Enter comprehensive statutory rationale justifying your adjudication..."
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 text-xs gap-3">
            <div className="flex items-center space-x-2 text-slate-500">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">lock</span>
              <span>
                DSC Token: <strong className="font-mono text-slate-700">RAJESH_VERMA_CPCL_0942 (Valid)</strong>
              </span>
              <span>•</span>
              <span className="text-slate-400">Timestamp: Live System Clock (IST)</span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => alert('Draft minutes saved locally to officer session.')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
              >
                Save Draft Minutes
              </button>
              <button
                type="button"
                onClick={handleCommitDecision}
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${submitting ? 'animate-spin' : ''}`}>
                  {submitting ? 'sync' : 'check'}
                </span>
                <span>{submitting ? 'Signing Manifest...' : 'Commit Decision & Sign Manifest'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
