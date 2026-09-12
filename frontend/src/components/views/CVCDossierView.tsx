import React, { useState } from 'react';
import { procurementService } from '../../services/procurementService';
import { MOCK_BIDDERS } from '../../mockData/bidders';

interface CVCDossierViewProps {
  onNavigate: (view: string, params?: any) => void;
}

export const CVCDossierView: React.FC<CVCDossierViewProps> = ({ onNavigate }) => {
  const [incCitations, setIncCitations] = useState(true);
  const [incMerkle, setIncMerkle] = useState(true);
  const [incCollusion, setIncCollusion] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    procurementService.downloadDossierFile('CPCL-PUMP-217', 'BID-HYD-0419');
    setTimeout(() => setDownloading(false), 800);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col w-full space-y-4 text-slate-800 text-xs">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('scrutiny')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Back to Cockpit"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div className="h-5 w-px bg-slate-200"></div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">CVC Compliance Scrutiny Dossier</h1>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                AUDIT COMPLIANT • GFR 144(xi)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Formal technical-commercial evaluation dossier for Central Vigilance Commission (CVC) submission and audit record.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-white text-slate-700 hover:bg-slate-50 font-medium text-xs rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">print</span>
            <span>Print Official Dossier</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${downloading ? 'animate-spin' : ''}`}>
              {downloading ? 'sync' : 'download'}
            </span>
            <span>{downloading ? 'Generating Signed Package...' : 'Download Dossier (.JSON / .PDF)'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Controls Sidebar (4 Cols) + Printable Dossier Sheet (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Controls Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
            <div className="font-bold text-slate-900 text-xs pb-2 border-b border-slate-100">
              Dossier Manifest Options
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incCitations}
                  onChange={(e) => setIncCitations(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Include Dual Evidence Citations</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incMerkle}
                  onChange={(e) => setIncMerkle(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Include Merkle Block Signatures</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incCollusion}
                  onChange={(e) => setIncCollusion(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Include Collusion Radial Graph Data</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
            <div className="font-bold text-slate-900 text-xs pb-2 border-b border-slate-100">
              Statutory Concurrence Mandates
            </div>

            <div className="space-y-2 text-[11px] text-slate-600">
              <div className="flex items-start gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-emerald-600 shrink-0 mt-0.5">check_circle</span>
                <span>General Financial Rules (GFR) 2017 Rule 144(xi) border country audit satisfied</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-emerald-600 shrink-0 mt-0.5">check_circle</span>
                <span>Public Procurement Policy (Make in India Order 2017) verification completed</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-emerald-600 shrink-0 mt-0.5">check_circle</span>
                <span>CVC Circular 02/05/2022 integrity pact attestation attached</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-900 space-y-2">
            <div className="font-bold text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-blue-600">lock</span>
              <span>Cryptographic Integrity Seal</span>
            </div>
            <p className="text-[11px] leading-relaxed text-blue-800">
              Every section of this dossier is verified against SHA-256 Merkle root in Block #144. Any manual post-issuance
              tampering invalidates the federal cryptographic seal.
            </p>
          </div>
        </div>

        {/* Printable Dossier Sheet (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-300 shadow-md p-8" id="cvc-dossier-sheet">
          {/* Government Emblem / Header */}
          <div className="text-center pb-6 border-b-2 border-slate-900 space-y-1">
            <div className="font-serif font-bold text-sm tracking-wide text-slate-900 uppercase">
              Government of India • Ministry of Petroleum & Natural Gas
            </div>
            <div className="font-bold text-base text-slate-900 tracking-tight">
              CHENNAI PETROLEUM CORPORATION LIMITED (CPCL)
            </div>
            <div className="font-sans text-[11px] text-slate-600">
              Materials & Contracts Directorate • Tender Scrutiny Wing
            </div>
            <div className="pt-2 font-mono text-[10px] text-slate-500 font-semibold uppercase">
              CONFIDENTIAL TECHNICAL-COMMERCIAL SCRUTINY DOSSIER • CVC FILE REF: CVC/DOSSIER/2026/CPCL-PUMP-217
            </div>
          </div>

          {/* Tender Metadata */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-[11px]">
            <div>
              <span className="text-slate-500">Tender Reference ID:</span>{' '}
              <strong className="font-mono text-slate-900">CPCL/MM/2026/PUMP-217</strong>
            </div>
            <div>
              <span className="text-slate-500">Global GeM Bid ID:</span>{' '}
              <strong className="font-mono text-slate-900">GEM/2026/B/892110</strong>
            </div>
            <div>
              <span className="text-slate-500">Procurement Title:</span>{' '}
              <strong className="text-slate-900">API-610 Centrifugal Process Pumps</strong>
            </div>
            <div>
              <span className="text-slate-500">Sanctioned Capex Value:</span>{' '}
              <strong className="font-mono text-slate-900">₹18.40 Crores (INR)</strong>
            </div>
          </div>

          {/* Bidder Evaluation Summary Table */}
          <div className="py-4 border-b border-slate-200">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-2">
              1. Comparative Technical Evaluation Summary
            </div>
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                  <th className="py-1.5 px-2">Bidder Entity</th>
                  <th className="py-1.5 px-2 font-mono">PAN / GSTIN</th>
                  <th className="py-1.5 px-2 text-center">Verdict</th>
                  <th className="py-1.5 px-2 text-center font-mono">Risk Score</th>
                  <th className="py-1.5 px-2">Final Adjudication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {MOCK_BIDDERS.map((b) => (
                  <tr key={b.id}>
                    <td className="py-1.5 px-2">
                      <div className="font-semibold text-slate-900">{b.legalName}</div>
                      <div className="font-mono text-[9px] text-slate-400">{b.code}</div>
                    </td>
                    <td className="py-1.5 px-2 font-mono text-[10px]">
                      <div>{b.pan}</div>
                      <div className="text-slate-400 text-[9px]">{b.gstin}</div>
                    </td>
                    <td className="py-1.5 px-2 text-center font-bold">
                      <span className={b.complianceStatus === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}>
                        {b.complianceStatus}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono font-bold">{b.riskScore}/100</td>
                    <td className="py-1.5 px-2 font-semibold">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 border border-slate-300">
                        {b.officerDecision}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Adjudication Minutes & Written Override */}
          <div className="py-4 border-b border-slate-200 space-y-2">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-900">
              2. Designated Officer Adjudication Minutes & Regulatory Override
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[11px] leading-relaxed text-slate-800">
              <strong>Matter of Bharat Hydrotech Corp (BID-HYD-0419):</strong>
              <p className="mt-1">
                The Tender Evaluation Committee (TEC) reviewed Bharat Hydrotech Corp’s Udyam Registration
                (UDYAM-MH-26-0034912) and affirms that under Public Procurement Policy (MSE Order 2012 Clause 10) & CPCL
                Prequalification relaxation rules, the ₹6.10 Cr turnover is admissible for technical evaluation.
                Regarding the GSTIN state code discordance (33-TN vs 27-MH), the bidder holds an active Tamil Nadu project
                execution branch registration; provisional qualification is granted subject to submission of Form REG-06
                annexure within 5 calendar days.
              </p>
            </div>
          </div>

          {/* Signatures & Merkle Chain Seal */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-[11px]">
            <div>
              <div className="font-bold text-slate-900">Rajesh Verma</div>
              <div className="text-slate-600">Chief Procurement Officer</div>
              <div className="font-mono text-[10px] text-slate-400 mt-1">
                DSC Token: RAJESH_VERMA_CPCL_0942 (Class 3 Valid)
              </div>
            </div>

            <div className="text-right font-mono text-[10px] text-slate-500">
              <div className="font-bold text-slate-900 text-xs">VigilBid Ledger Verification</div>
              <div className="text-emerald-700 font-semibold mt-1">Merkle Block #144 Anchored</div>
              <div className="truncate text-[9px] mt-0.5">Digest: 8f4e229a17c76a91d...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
