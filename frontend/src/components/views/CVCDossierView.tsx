import React, { useState } from 'react';
import { procurementService } from '../../services/procurementService';

interface CVCDossierViewProps {
  onNavigate: (view: string, params?: any) => void;
}

interface ChecklistSection {
  id: string;
  name: string;
  count: string;
  status: 'clean' | 'adverse' | 'neutral';
  checked: boolean;
}

export const CVCDossierView: React.FC<CVCDossierViewProps> = ({ onNavigate }) => {
  const [sections, setSections] = useState<ChecklistSection[]>([
    { id: 'sec-1', name: '1. Tender Information', count: '2 params', status: 'clean', checked: true },
    { id: 'sec-2', name: '2. Bidder Profile', count: 'CIN, PAN, GSTIN', status: 'clean', checked: true },
    { id: 'sec-3', name: '3. Submitted Documents', count: '14 envelopes', status: 'clean', checked: true },
    { id: 'sec-4', name: '4. Document Extraction', count: '3 exhibits parsed', status: 'clean', checked: true },
    { id: 'sec-5', name: '5. Govt Registry Verification', count: 'MCA/GSTN/GeM', status: 'clean', checked: true },
    { id: 'sec-6', name: '6. Compliance Results', count: '14 rules eval', status: 'clean', checked: true },
    { id: 'sec-7', name: '7. Critical Findings', count: '2 ADVERSE', status: 'adverse', checked: true },
    { id: 'sec-8', name: '8. Evidence References', count: '3 source PDFs', status: 'clean', checked: true },
  ]);

  const [downloading, setDownloading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s))
    );
  };

  const handleSelectAll = (val: boolean) => {
    setSections((prev) => prev.map((s) => ({ ...s, checked: val })));
  };

  const handleDownload = () => {
    setDownloading(true);
    procurementService.downloadDossierFile('CPCL-PUMP-217', 'BID-HYD-0419');
    setTimeout(() => {
      setDownloading(false);
      setToastMsg('Statutory CVC Compliance Dossier downloaded successfully.');
      setTimeout(() => setToastMsg(null), 4000);
    }, 900);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col w-full space-y-4 text-slate-800 text-xs">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-md flex items-center justify-between border border-blue-500">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
            <span className="text-xs font-semibold">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* TOP SUB-HEADER BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              Return to Audit Ledger
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500 font-mono">CPCL/MM/2026/PUMP-217</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-blue-600">CVC Compliance Dossier</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">CVC Compliance Dossier</h1>
            <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              GAZETTE COMPLIANT • NIC L3 SECURED
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive statutory procurement verification &amp; technical adjudication dossier for Central Vigilance Commission.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">print</span>
            <span>Print Official Record</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${downloading ? 'animate-spin' : ''}`}>
              {downloading ? 'sync' : 'download'}
            </span>
            <span>{downloading ? 'Compiling Dossier...' : 'Download PDF / Signed Package'}</span>
          </button>
        </div>
      </div>

      {/* TWO-PANEL WORKSPACE: LEFT CONTROLS (4 cols) + RIGHT PAPER DOCKET (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PANEL: PREPARE DOSSIER (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Prepare Dossier</h2>
                <p className="text-[11px] text-slate-500">Select sections to compile into statutory record.</p>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => handleSelectAll(true)}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => handleSelectAll(false)}
                  className="text-slate-500 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2">
              {sections.map((sec) => (
                <label
                  key={sec.id}
                  className="flex items-center justify-between p-2 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sec.checked}
                      onChange={() => toggleSection(sec.id)}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="font-medium text-xs text-slate-800">{sec.name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                      sec.status === 'adverse'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    {sec.count}
                  </span>
                </label>
              ))}
            </div>

            {/* Re-compile button */}
            <button
              onClick={() => {
                setToastMsg('Dossier re-compiled with active statutory sections.');
                setTimeout(() => setToastMsg(null), 3000);
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Re-compile CVC Dossier</span>
            </button>
          </div>

          {/* Quick Context Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-2.5">
            <div className="font-bold text-slate-900 text-xs">Attestation Metadata</div>
            <div className="space-y-1.5 text-[11px] font-mono text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Dossier Ref:</span>
                <span className="font-semibold text-slate-800">CVC-CPCL-2026-BHT-042</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tender Ref:</span>
                <span className="font-semibold text-slate-800">CPCL/MM/2026/PUMP-217</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Evaluation Officer:</span>
                <span className="font-semibold text-slate-800">Rajesh Verma (CPCL)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">DSC Key Serial:</span>
                <span className="font-semibold text-emerald-700">SHA256-EMUDHRA-99410</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Merkle Anchor Block:</span>
                <span className="font-semibold text-blue-700">Block #142</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: A4 LEGAL PAPER SHEET CANVAS (8 cols) */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {/* Sticky Document Toolbar */}
          <div className="w-full bg-white border border-slate-200 rounded-t-xl px-5 py-2.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
                <span>Document Status: Audit Verified</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-[11px] text-slate-600 font-mono">Page 1 of 4</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center border border-slate-200 rounded-md bg-slate-50 text-slate-700 text-xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 10, 80))}
                  className="px-2 py-0.5 hover:bg-slate-200 rounded-l cursor-pointer"
                  title="Zoom Out"
                >
                  -
                </button>
                <span className="px-2 py-0.5 font-mono text-[10px] border-x border-slate-200 bg-white">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 10, 130))}
                  className="px-2 py-0.5 hover:bg-slate-200 rounded-r cursor-pointer"
                  title="Zoom In"
                >
                  +
                </button>
              </div>

              <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                <span className="material-symbols-outlined text-[12px] text-slate-400">shield</span>
                <span>NIC Watermark: Official Record</span>
              </div>
            </div>
          </div>

          {/* THE FORMAL LEGAL PAPER SHEET */}
          <article
            id="cvc-dossier-sheet"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            className="w-full bg-white border-x border-b border-slate-200 rounded-b-xl shadow-sm p-8 sm:p-10 space-y-7 relative transition-transform"
          >
            {/* Subtle Diagonal Watermark */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] select-none overflow-hidden">
              <div className="text-slate-900 font-black text-6xl rotate-[-25deg] tracking-widest text-center leading-tight">
                OFFICIAL RECORD<br />CVC COMPLIANCE
              </div>
            </div>

            {/* 1. OFFICIAL DOSSIER HEADER */}
            <div className="border-b-2 border-slate-800 pb-5 text-center relative space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest pb-1 border-b border-slate-100">
                <span>FORM CVC-PROC-04</span>
                <span className="font-bold text-slate-700">CONFIDENTIAL • FOR STATUTORY AUDIT ONLY</span>
                <span>GAZETTE NOTIFIED</span>
              </div>

              <div className="py-1">
                <div className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                  Government of India
                </div>
                <div className="text-sm font-black tracking-tight text-slate-900 uppercase">
                  Chennai Petroleum Corporation Limited (CPCL)
                </div>
                <div className="text-xs font-bold text-blue-900 tracking-wide uppercase mt-1">
                  Central Vigilance Commission (CVC) Statutory Compliance Dossier
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                  Comprehensive Procurement Verification &amp; Technical Adjudication Dossier
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-700 border-t border-slate-200">
                <div>
                  <span className="text-slate-400">Dossier Ref No: </span>
                  <strong className="text-slate-900">CVC-CPCL-2026-BHT-042</strong>
                </div>
                <div>
                  <span className="text-slate-400">Date of Attestation: </span>
                  <strong className="text-slate-900">26 March 2026</strong>
                </div>
              </div>
            </div>

            {/* SECTION 1: Executive Summary */}
            <div className="space-y-2">
              <div className="font-bold text-xs text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>Section 1: Executive Summary &amp; Procurement Scope</span>
                <span className="font-mono text-[10px] text-slate-500">Tender: CPCL/MM/2026/PUMP-217</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                This statutory dossier records the technical-commercial evaluation for{' '}
                <strong>API-610 Centrifugal Process Pumps</strong> at CPCL Manali Refinery (Packet ₹18.40 Cr ICB). Five
                responsive envelopes were ingested, decrypted, and evaluated against GFR 2017, PPP-MII Order 2017, and
                NIC-CERT forensic telemetry.
              </p>
            </div>

            {/* SECTION 2: Critical Statutory Findings */}
            <div className="space-y-2.5">
              <div className="font-bold text-xs text-rose-800 uppercase tracking-wide border-b border-rose-200 pb-1 flex items-center justify-between">
                <span>Section 2: Critical Statutory Findings (2 Adverse Determinations)</span>
                <span className="font-mono text-[10px] bg-rose-100 text-rose-800 px-2 py-0.2 rounded border border-rose-200">
                  DISQUALIFICATION GROUNDS
                </span>
              </div>

              <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg space-y-1.5 text-xs">
                <div className="font-bold text-rose-900">
                  1. GFR Rule 144(i) &amp; GSTIN State Discordance (FND-2026-0042)
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Bidder C (Bharat Hydrotech Corp) submitted an envelope declaring GSTIN with State Code 33 (Tamil Nadu),
                  whereas official MCA-21 filings confirm registered office in Maharashtra (State 27). The embedded PAN
                  was found discordant with CBDT records.
                </p>
              </div>

              <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg space-y-1.5 text-xs">
                <div className="font-bold text-rose-900">
                  2. Land Border Restriction Non-Compliance (GFR 144(xi) F.No.6/18/2019-PPD)
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Beneficial ownership investigation revealed corporate shareholding traced to a foreign entity without
                  mandatory DPIIT registration clearance.
                </p>
              </div>
            </div>

            {/* SECTION 3: Evidentiary Exhibit References */}
            <div className="space-y-2">
              <div className="font-bold text-xs text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                Section 3: Evidentiary Exhibit References &amp; Rules
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[10.5px]">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <div className="font-bold text-slate-800">Exhibit A: gst_reg06.pdf</div>
                  <div className="text-slate-500 mt-0.5">Page 1 • State 33 Discordance</div>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <div className="font-bold text-slate-800">Exhibit B: pan_card.pdf</div>
                  <div className="text-slate-500 mt-0.5">Page 1 • CBDT Validation Fail</div>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <div className="font-bold text-slate-800">Exhibit C: turnover_ca.pdf</div>
                  <div className="text-slate-500 mt-0.5">Page 2 • ₹6.10 Cr Turnover Deficit</div>
                </div>
              </div>
            </div>

            {/* SECTION 4: Explainable Risk Attribution Engine */}
            <div className="space-y-2">
              <div className="font-bold text-xs text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>Section 4: Explainable Risk Attribution Engine</span>
                <span className="font-mono text-rose-700 font-bold">COMPOSITE RISK: 65 / 100</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                NIC-CERT Heuristics v2.4 decomposed risk into Identity Discordance (42%), Cartel/Subnet Clustering (31%),
                Turnover Deficit (18%), and Document Timestamp Discrepancy (9%). Confidence index is verified at 94.2%.
              </p>
            </div>

            {/* SECTION 5: Human Officer Decision & Statutory Minute */}
            <div className="space-y-2">
              <div className="font-bold text-xs text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                Section 5: Human Officer Decision &amp; Statutory Minute
              </div>
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed font-mono">
                <div className="text-slate-500 mb-1">DETERMINATION COMMITTED:</div>
                <div className="text-slate-900 font-semibold">
                  “The Tender Evaluation Committee (TEC) reviewed Bharat Hydrotech Corp’s Udyam Registration
                  (UDYAM-MH-26-0034912) and affirms that under Public Procurement Policy (MSE Order 2012 Clause 10), provisional
                  qualification is granted subject to submission of Form REG-06 annexure within 5 calendar days.”
                </div>
                <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Adjudicating Officer: Rajesh Verma (Sr. Procurement Officer, CPCL)</span>
                  <span>DSC: Verified Valid Class-3 Token</span>
                </div>
              </div>
            </div>

            {/* SECTION 6: Cryptographic Audit Ledger Integrity */}
            <div className="space-y-2 border-t-2 border-slate-800 pt-4">
              <div className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center justify-between">
                <span>Section 6: Cryptographic Audit Ledger Integrity</span>
                <span className="font-mono text-emerald-700 font-bold">ANCHOR BLOCK #142</span>
              </div>
              <div className="p-3 bg-slate-900 text-slate-300 rounded-lg font-mono text-[10.5px] space-y-1">
                <div>
                  <span className="text-slate-500">BLOCK_HASH: </span>
                  <span className="text-emerald-400 font-bold">
                    3c7e1d54b899a1f2e3d4c5b6a7890123456789abcdef0123456789abcdef912f
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">MERKLE_ROOT: </span>
                  <span className="text-sky-400">
                    d8c4b2a19f0e3d5c7b9a1e3f5a7c9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">TIMESTAMP: </span>
                  <span>2026-03-26 15:45:10 IST • Nonce: 48921 • Consensus: NIC-DELHI-04</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};
