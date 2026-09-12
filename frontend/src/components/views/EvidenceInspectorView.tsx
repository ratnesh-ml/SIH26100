import React, { useState } from 'react';

interface EvidenceInspectorViewProps {
  onNavigate: (view: string, params?: any) => void;
  findingId?: string;
}

export const EvidenceInspectorView: React.FC<EvidenceInspectorViewProps> = ({
  onNavigate,
  findingId = 'FND-2026-0042',
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'overlay' | 'fit'>('split');
  const [zoom, setZoom] = useState(100);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleExportPDF = () => {
    setToastMsg('Exporting Evidence Inspection Docket (PDF)...');
    setTimeout(() => {
      setToastMsg('Forensic evidence PDF generated with cryptographic verification proof.');
      setTimeout(() => setToastMsg(null), 4000);
    }, 1000);
  };

  return (
    <div className="flex flex-col w-full space-y-4 text-slate-800 text-xs">
      {/* Toast */}
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

      {/* TOP APP BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('scrutiny')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Back to Scrutiny Cockpit"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Evidence Inspector</h1>
              <span className="text-slate-400">/</span>
              <span className="text-xs font-semibold text-slate-700">PAN-GSTIN Identity Inconsistency</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse"></span>
                Finding ID: {findingId}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                HIGH SEVERITY
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Bidder: <strong className="text-slate-700">Bharat Hydrotech Corp (Bidder C)</strong> • Tender:{' '}
                <strong className="text-slate-700">CPCL/MM/2026/PUMP-217</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'split' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'
              }`}
            >
              Dual Split-Screen
            </button>
            <button
              onClick={() => setViewMode('overlay')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'overlay' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'
              }`}
            >
              Overlay Diff
            </button>
            <button
              onClick={() => setViewMode('fit')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'fit' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'
              }`}
            >
              Fit to Screen
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 text-xs">
            <button
              onClick={() => setZoom((z) => Math.max(75, z - 10))}
              className="px-2 py-1 hover:bg-slate-200 rounded-l cursor-pointer"
            >
              -
            </button>
            <span className="px-2 py-1 font-mono text-[10px] border-x border-slate-200 bg-white">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              className="px-2 py-1 hover:bg-slate-200 rounded-r cursor-pointer"
            >
              +
            </button>
          </div>

          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">picture_as_pdf</span>
            <span>Export Forensic PDF</span>
          </button>
          <button
            onClick={() => onNavigate('scrutiny')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Return to Cockpit</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* DUAL SPLIT-SCREEN VIEWPORTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT VIEWPORT: Primary Submitted Bid Document */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-blue-600">picture_as_pdf</span>
              <div>
                <div className="font-bold text-slate-900 text-xs">Primary Exhibit: gst_reg06.pdf</div>
                <div className="text-[10px] text-slate-500 font-mono">Page 1 of 3 • SHA-256: 8f4e221b09dc...</div>
              </div>
            </div>
            <span className="text-[10px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">
              BOUNDING BOX #1 (CONFIDENCE: 98.6%)
            </span>
          </div>

          {/* Document Canvas with Bounding Box Overlay */}
          <div className="p-6 bg-slate-100 flex items-center justify-center min-h-[460px] overflow-auto">
            <div
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              className="w-full max-w-[480px] bg-white border border-slate-300 rounded-lg shadow-md p-6 space-y-4 transition-transform font-sans"
            >
              {/* Form Header */}
              <div className="text-center border-b border-slate-200 pb-3">
                <div className="text-[10px] font-bold uppercase text-slate-500">Government of India / State Government</div>
                <div className="text-xs font-black text-slate-900 uppercase mt-0.5">Form GST REG-06</div>
                <div className="text-[10px] text-slate-600 font-medium">[See Rule 10(1)] Registration Certificate</div>
              </div>

              {/* Bounding Box Highlighted Field */}
              <div className="border-2 border-rose-500 rounded-lg p-3 bg-rose-50/40 relative">
                <span className="absolute -top-2.5 right-2 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                  DISCORDANCE DETECTED
                </span>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Registration Number (GSTIN)</div>
                <div className="text-sm font-mono font-bold text-rose-900 tracking-wider mt-0.5">
                  33AABCB8899K1Z4
                </div>
                <div className="text-[10px] text-rose-700 mt-1 font-sans">
                  ⚠️ State Code 33 denotes Tamil Nadu, while Corporate ROC CIN indicates Pune, Maharashtra (27).
                </div>
              </div>

              {/* Other Document Fields */}
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-400">Legal Name:</span>
                  <span className="font-semibold text-slate-900">Bharat Hydrotech Corp</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-400">Trade Name:</span>
                  <span className="font-semibold text-slate-900">Bharat Hydrotech Systems</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-400">Constitution of Business:</span>
                  <span className="font-semibold text-slate-900">Private Limited Company</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-400">Principal Place of Business:</span>
                  <span className="font-semibold text-slate-900 text-right max-w-[240px]">
                    Plot 18, Phase II, Ambattur Industrial Estate, Chennai 600058
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date of Issue:</span>
                  <span className="font-mono text-slate-800">14/08/2019</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
                Digital Signature Verified • CCA CA-NIC-2022
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT VIEWPORT: Official Registry Ground Truth */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">verified_user</span>
              <div>
                <div className="font-bold text-slate-900 text-xs">Official Registry Ground Truth</div>
                <div className="text-[10px] text-slate-500 font-mono">GSTN API v2.4 + CBDT PAN Live Gateway</div>
              </div>
            </div>
            <span className="text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
              SYNCED TODAY • 100% AUTHORITATIVE
            </span>
          </div>

          <div className="p-5 space-y-4 flex-1">
            {/* Field-by-Field Diff Comparison Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-semibold text-slate-600 uppercase">
                    <th className="py-2.5 px-3">Field</th>
                    <th className="py-2.5 px-3">Submitted Value</th>
                    <th className="py-2.5 px-3">Registry Truth (MCA / GSTN)</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-slate-600">Legal Name</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">Bharat Hydrotech Corp</td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-700">Bharat Hydrotech Corp</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">MATCH</td>
                  </tr>
                  <tr className="bg-rose-50/30">
                    <td className="py-2.5 px-3 font-medium text-slate-600">State Jurisdiction</td>
                    <td className="py-2.5 px-3 font-mono text-rose-700 font-bold">State 33 (Tamil Nadu)</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800 font-bold">State 27 (Maharashtra)</td>
                    <td className="py-2.5 px-3 font-bold text-rose-700">DISCORD</td>
                  </tr>
                  <tr className="bg-rose-50/30">
                    <td className="py-2.5 px-3 font-medium text-slate-600">Corporate PAN</td>
                    <td className="py-2.5 px-3 font-mono text-rose-700 font-bold">AAACB9999F</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800 font-bold">AAACB1234F</td>
                    <td className="py-2.5 px-3 font-bold text-rose-700">MISMATCH</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-slate-600">MCA CIN</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">U29100MH2012PTC139882</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">U29100MH2012PTC139882</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">VALID</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-slate-600">ROC Jurisdiction</td>
                    <td className="py-2.5 px-3 text-slate-800">ROC Pune</td>
                    <td className="py-2.5 px-3 text-slate-800">ROC Pune</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">VALID</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Registry Response JSON Snippet */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Cryptographic Evidence Hash Digest
              </div>
              <div className="p-3 bg-slate-900 text-slate-300 font-mono text-[10.5px] rounded-lg leading-relaxed">
                <div>// CBDT NSDL API v3.2 Gateway Response</div>
                <div>"status": "VALID",</div>
                <div>"pan": "AAACB1234F",</div>
                <div>"pan_holder_name": "BHARAT HYDROTECH CORP",</div>
                <div>"last_updated": "2026-03-26T09:12:00Z",</div>
                <div>"sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM STATUTORY DETERMINATION BOX */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-rose-600">gavel</span>
            <h2 className="text-sm font-bold text-slate-900">Why this finding exists &amp; Statutory Determination</h2>
          </div>
          <span className="font-mono text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
            Mandatory Action Required
          </span>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          Rule 144(i) of General Financial Rules (GFR 2017) mandates that all participating bidders possess unambiguous
          tax and corporate identity alignment across all submitted tenders. The discrepancy between State 33 (Tamil
          Nadu) on the submitted Form GST REG-06 and State 27 (Maharashtra) on official MCA21 records indicates a
          branch or proxy entity execution structure. CVC Manual Clause 4.2 requires official written justification
          before technical qualification can be approved.
        </p>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            Referenced Guideline: CVC Manual 2021 Clause 4.2 • GFR 2017 Rule 144(i)
          </div>
          <button
            onClick={() => onNavigate('scrutiny')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>Proceed to Adjudication</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
