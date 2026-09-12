import React, { useState } from 'react';

interface EvidenceInspectorViewProps {
  onNavigate: (view: string, params?: any) => void;
  findingId?: string;
}

export const EvidenceInspectorView: React.FC<EvidenceInspectorViewProps> = ({
  onNavigate,
  findingId = 'FND-2026-0042',
}) => {
  const [zoom, setZoom] = useState(100);

  return (
    <div className="flex flex-col w-full space-y-4 text-slate-800 text-xs">
      {/* Top App Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
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
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Evidence Citation Inspector</h1>
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
              <span className="text-[11px] text-slate-500">
                Bidder: <strong className="text-slate-700">Bharat Hydrotech Corp (BID-HYD-0419)</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => setZoom((z) => Math.max(75, z - 10))}
              className="p-1 text-slate-600 hover:bg-white rounded transition-colors"
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-700">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              className="p-1 text-slate-600 hover:bg-white rounded transition-colors"
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>

          <button
            onClick={() => onNavigate('audit-ledger')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>View Audit Trail</span>
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

      {/* Split Document Viewports (Side-by-Side Dual Comparison) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: GST Registration Certificate */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-blue-600">description</span>
              <span className="font-bold text-slate-900 text-xs">Primary Exhibit: FORM_GST_REG_06.pdf</span>
            </div>
            <span className="font-mono text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-bold">
              BOX #1 HIGHLIGHTED
            </span>
          </div>

          <div className="mt-3 flex-1 bg-slate-100 rounded-lg p-5 border border-slate-200 overflow-auto min-h-[460px] flex items-center justify-center">
            <div
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center top' }}
              className="w-full max-w-sm bg-white border border-slate-300 rounded shadow-md p-5 text-slate-800 font-serif leading-relaxed text-[11px] transition-transform"
            >
              <div className="text-center font-bold text-xs uppercase tracking-wider pb-1 border-b border-slate-200">
                Government of India • GST Portal
              </div>
              <div className="text-center text-[10px] font-sans text-slate-500 mb-3">
                Registration Certificate (Rule 10(1))
              </div>

              <div className="space-y-3 font-sans">
                <div className="p-2 rounded bg-rose-50 border-2 border-rose-600 relative ring-2 ring-rose-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-rose-700">1. GSTIN (EXTRACTED CITATION)</span>
                    <span className="px-1.5 py-0.2 bg-rose-600 text-white font-mono text-[8px] rounded font-bold">
                      STATE 33 (TN)
                    </span>
                  </div>
                  <div className="font-mono font-bold text-xs text-rose-950 mt-0.5">33AAACB9999F1Z5</div>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">2. Legal Name</span>
                  <span className="font-bold text-xs text-slate-900">Bharat Hydrotech Corporation Pvt Ltd</span>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">3. Registered Location</span>
                  <span className="text-xs text-slate-800">Ambattur Industrial Estate, Chennai, Tamil Nadu - 600058</span>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-200 text-[9px] font-mono text-slate-400 flex justify-between">
                <span>Tax Office: Range Chennai-North</span>
                <span>SHA-256: 4f8b9e...3d2</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: MCA21 Incorporation Certificate */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-blue-600">verified</span>
              <span className="font-bold text-slate-900 text-xs">Cross-Reference: MCA_COI_Certificate.pdf</span>
            </div>
            <span className="font-mono text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-bold">
              ROC PUNE CONFLICT
            </span>
          </div>

          <div className="mt-3 flex-1 bg-slate-100 rounded-lg p-5 border border-slate-200 overflow-auto min-h-[460px] flex items-center justify-center">
            <div
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center top' }}
              className="w-full max-w-sm bg-white border border-slate-300 rounded shadow-md p-5 text-slate-800 font-serif leading-relaxed text-[11px] transition-transform"
            >
              <div className="text-center font-bold text-xs uppercase tracking-wider pb-1 border-b border-slate-200">
                Ministry of Corporate Affairs • MCA21
              </div>
              <div className="text-center text-[10px] font-sans text-slate-500 mb-3">
                Certificate of Incorporation [Form INC-11]
              </div>

              <div className="space-y-3 font-sans">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Corporate Identity Number (CIN)</span>
                  <span className="font-mono font-bold text-xs text-slate-900">U29100MH2018PTC310244</span>
                </div>

                <div className="p-2 rounded bg-rose-50 border-2 border-rose-600 relative ring-2 ring-rose-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-rose-700">Registered Office Jurisdiction</span>
                    <span className="px-1.5 py-0.2 bg-rose-600 text-white font-mono text-[8px] rounded font-bold">
                      STATE 27 (MH)
                    </span>
                  </div>
                  <div className="font-bold text-xs text-rose-950 mt-0.5">
                    Plot 42, Bhosari MIDC, Pune - 411026, Maharashtra
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Date of Incorporation</span>
                  <span className="text-xs text-slate-800">Fourteenth day of June Two Thousand Eighteen</span>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-200 text-[9px] font-mono text-slate-400 flex justify-between">
                <span>Registrar of Companies, Pune</span>
                <span>Digitally Signed: ROC_PUNE_2018</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forensic Reconciliation Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-rose-600">crisis_alert</span>
            <span>Algorithmic Red-Flag Reconciliation Verdict</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            State code 33 (Tamil Nadu) prefix in GSTIN conflicts with certified incorporation state 27 (Maharashtra).
            Under <strong>GFR 2017 Rule 144(xi)</strong>, bidder must furnish Form REG-06 annexure proving formal
            branch registration in Tamil Nadu for refinery project execution, or officer must record a formal
            regulatory override in the scrutiny minutes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('scrutiny')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Proceed to Officer Adjudication</span>
            <span className="material-symbols-outlined text-[16px]">gavel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
