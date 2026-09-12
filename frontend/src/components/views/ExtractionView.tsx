import React, { useState } from 'react';

interface ExtractionViewProps {
  onNavigate: (view: string, params?: any) => void;
  bidderId?: string;
}

export const ExtractionView: React.FC<ExtractionViewProps> = ({
  onNavigate,
  bidderId = 'BID-HYD-0419',
}) => {
  const [activeDoc, setActiveDoc] = useState<'gst' | 'pan' | 'udyam' | 'turnover' | 'local_content'>('gst');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-5rem)] text-slate-800 text-xs bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* TOP HEADER BAR */}
      <header className="h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('pipeline')}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Back to Pipeline"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="h-5 w-px bg-slate-200"></div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400">Tender:</span>
            <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              CPCL/MM/2026/PUMP-217
            </span>
            <span className="text-slate-500 truncate max-w-xs font-medium">API-610 Centrifugal Pumps</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-400">Bidder:</span>
            <span className="font-bold text-slate-900">Bharat Hydrotech Corp ({bidderId})</span>
          </div>
        </div>

        {/* Stage and User Info */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="font-mono text-[10.5px] text-blue-700 font-bold">STAGE 04 OF 11</span>
            <span className="text-blue-300">•</span>
            <span className="font-bold text-blue-900">Structured Extraction</span>
          </div>
          <div className="h-5 w-px bg-slate-200"></div>
          <span className="font-mono text-[11px] text-slate-500 font-semibold">OCR ENGINE v5.2</span>
        </div>
      </header>

      {/* MAIN 3-PANEL WORKSPACE */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        {/* LEFT COLUMN: DOCUMENT NAVIGATOR (Width: 280px) */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Document Navigator</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">5 statutory bidder documents</p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              5 / 5 Parsed
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* Doc 1: GST Registration (ACTIVE) */}
            <div
              onClick={() => setActiveDoc('gst')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                activeDoc === 'gst'
                  ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    activeDoc === 'gst' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 truncate">GST Registration</p>
                    {activeDoc === 'gst' && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">FORM GST REG-06 • 3 pgs</p>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">4 fields keyed</span>
                    <span className="font-mono text-blue-700 font-bold text-[10px]">98.8% Conf.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Doc 2: PAN Card */}
            <div
              onClick={() => setActiveDoc('pan')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                activeDoc === 'pan'
                  ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    activeDoc === 'pan' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">credit_card</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 truncate">PAN Card</p>
                    {activeDoc === 'pan' && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Income Tax Dept • 1 pg</p>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">2 fields keyed</span>
                    <span className="font-mono text-emerald-700 font-bold text-[10px]">99.2% Conf.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Doc 3: Udyam Certificate */}
            <div
              onClick={() => setActiveDoc('udyam')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                activeDoc === 'udyam'
                  ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    activeDoc === 'udyam' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 truncate">Udyam Certificate</p>
                    {activeDoc === 'udyam' && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">MSME Portal • 2 pgs</p>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">5 fields keyed</span>
                    <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-amber-200">
                      Medium-MSE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Doc 4: Turnover Certificate */}
            <div
              onClick={() => setActiveDoc('turnover')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                activeDoc === 'turnover'
                  ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    activeDoc === 'turnover' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">account_balance</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 truncate">Turnover Certificate</p>
                    {activeDoc === 'turnover' && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">CA Audited (UDIN) • 4 pgs</p>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">4 fields keyed</span>
                    <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-amber-200">
                      Deficit Flag
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Doc 5: Local Content Declaration */}
            <div
              onClick={() => setActiveDoc('local_content')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                activeDoc === 'local_content'
                  ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    activeDoc === 'local_content' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 truncate">Local Content Declaration</p>
                    {activeDoc === 'local_content' && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Make in India • 2 pgs</p>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">3 fields keyed</span>
                    <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-rose-200">
                      Class-II (45%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick status footer in navigator */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Verified Active Form:</span>
            <span className="font-mono text-slate-800 font-bold">GST REG-06</span>
          </div>
        </aside>

        {/* CENTER COLUMN: CLEAN DOCUMENT PREVIEW */}
        <section className="flex-1 bg-slate-100/70 flex flex-col border-r border-slate-200 min-w-0">
          {/* Preview Header Toolbar */}
          <div className="h-11 bg-white border-b border-slate-200 px-5 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-800">Preview:</span>
              <span className="text-xs font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-medium">
                FORM_GST_REG_06_BHARAT_HYDROTECH.pdf
              </span>
              <span className="text-xs text-slate-400 font-mono">Page 1 of 3</span>
            </div>

            <div className="flex items-center space-x-3">
              {/* Zoom Controls */}
              <div className="flex items-center border border-slate-200 rounded-lg bg-white p-0.5 text-xs shadow-2xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                  className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <span className="material-symbols-outlined text-[14px]">remove</span>
                </button>
                <span className="px-2 font-mono text-[11px] text-slate-700">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                  className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                </button>
              </div>

              <div className="h-4 w-px bg-slate-200"></div>

              {/* Bounding Boxes Indicator */}
              <div className="flex items-center space-x-1.5 text-xs text-blue-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>4 Bounding Boxes Highlighted</span>
              </div>
            </div>
          </div>

          {/* Document Sheet Canvas */}
          <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
            {/* Rendered A4 PDF Page Replica */}
            <div
              className="w-full max-w-[640px] bg-white rounded-lg border border-slate-300 shadow-xl p-8 relative font-sans text-slate-800 text-[11px] leading-relaxed transition-transform origin-top"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              {/* Government Form Header */}
              <div className="border-b border-slate-300 pb-3 mb-5 text-center">
                <div className="w-7 h-7 mx-auto mb-1 flex items-center justify-center text-slate-700">
                  <span className="material-symbols-outlined text-[24px]">account_balance</span>
                </div>
                <p className="text-[9px] font-bold tracking-widest uppercase text-slate-500">Government of India</p>
                <p className="text-xs font-black uppercase tracking-wide text-slate-900 mt-0.5">Form GST REG-06</p>
                <p className="text-[9px] text-slate-500 font-medium">[See Rule 10(1)] • Registration Certificate</p>
              </div>

              {/* Table of Registration Details */}
              <div className="border border-slate-200 rounded-lg overflow-hidden mb-5">
                <div className="bg-slate-50 px-3.5 py-2 text-[10px] font-bold border-b border-slate-200 text-slate-700 uppercase tracking-wider">
                  Registration Details
                </div>

                {/* Row 1: GSTIN with bounding box */}
                <div className="p-3 border-b border-slate-100 grid grid-cols-12 gap-3 relative bg-blue-50/20">
                  <div className="absolute inset-x-2 inset-y-1.5 border-2 border-blue-500 rounded bg-blue-500/10 pointer-events-none"></div>
                  <div className="col-span-4 font-semibold text-slate-600">1. Registration Number (GSTIN)</div>
                  <div className="col-span-8 font-mono font-bold text-blue-700 text-xs">
                    33AAACB9999F1Z5
                  </div>
                </div>

                {/* Row 2: Legal Name */}
                <div className="p-3 border-b border-slate-100 grid grid-cols-12 gap-3">
                  <div className="col-span-4 font-semibold text-slate-600">2. Legal Name</div>
                  <div className="col-span-8 font-bold text-slate-900">BHARAT HYDROTECH CORP</div>
                </div>

                {/* Row 3: Trade Name */}
                <div className="p-3 border-b border-slate-100 grid grid-cols-12 gap-3">
                  <div className="col-span-4 font-semibold text-slate-600">3. Trade Name, if any</div>
                  <div className="col-span-8 text-slate-700">BHARAT HYDROTECH SOLUTIONS</div>
                </div>

                {/* Row 4: Constitution & PAN with bounding box */}
                <div className="p-3 border-b border-slate-100 grid grid-cols-12 gap-3 relative bg-blue-50/20">
                  <div className="absolute inset-x-2 inset-y-1.5 border-2 border-blue-500 rounded bg-blue-500/10 pointer-events-none"></div>
                  <div className="col-span-4 font-semibold text-slate-600">4. Constitution / PAN</div>
                  <div className="col-span-8 text-slate-800">
                    Private Limited Company • PAN: <span className="font-mono font-bold text-blue-700">AAACB1234F</span>
                  </div>
                </div>

                {/* Row 5: Principal Place */}
                <div className="p-3 border-b border-slate-100 grid grid-cols-12 gap-3">
                  <div className="col-span-4 font-semibold text-slate-600">5. Principal Place of Business</div>
                  <div className="col-span-8 text-slate-700 leading-snug">
                    Plot No. 42-B, Industrial Area, Phase-II, Hadapsar, Pune, Maharashtra - 411028
                  </div>
                </div>

                {/* Row 6: Validity */}
                <div className="p-3 grid grid-cols-12 gap-3">
                  <div className="col-span-4 font-semibold text-slate-600">6. Registration Validity</div>
                  <div className="col-span-8 text-slate-700 font-mono text-[10px]">
                    From 14/06/2018 to Regular (Active)
                  </div>
                </div>
              </div>

              {/* Cross-referenced Statutory Annexures */}
              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Associated Annexure Extracts
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Pages 2 & 3 Cross-match</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-white border-2 border-dashed border-amber-400 rounded-lg relative bg-amber-50/20">
                    <p className="text-[10px] text-slate-500 font-medium">Declared FY24-25 Turnover</p>
                    <p className="font-bold text-slate-900 text-sm font-mono mt-0.5">₹6.10 Cr</p>
                    <p className="text-[10px] text-amber-700 mt-0.5 font-bold">Below ₹12.00 Cr requirement</p>
                  </div>
                  <div className="p-2.5 bg-white border-2 border-dashed border-rose-400 rounded-lg relative bg-rose-50/20">
                    <p className="text-[10px] text-slate-500 font-medium">Local Content Declaration</p>
                    <p className="font-bold text-slate-900 text-sm font-mono mt-0.5">45.0% (Class-II)</p>
                    <p className="text-[10px] text-rose-700 mt-0.5 font-bold">Below 50.0% Class-I requirement</p>
                  </div>
                </div>
              </div>

              {/* Official Stamp & Verification */}
              <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>NIC-CERT HASH: VALID • SHA-256</span>
                <span>Digital Signature Verified</span>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: EXTRACTED FIELDS INSPECTOR (Width: 360px) */}
        <aside className="w-88 bg-white flex flex-col shrink-0">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Extracted Fields</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Model verified parameters</p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              4 Statutory Core
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {/* CARD 1: GSTIN */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">GSTIN</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified Active
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 mb-2.5 flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-slate-900 tracking-wide">33AAACB9999F1Z5</span>
                <button
                  onClick={() => handleCopy('33AAACB9999F1Z5', 'gstin')}
                  className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                  title="Copy"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedField === 'gstin' ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
              <div className="space-y-1 text-[11px] text-slate-500 pt-1">
                <div className="flex justify-between items-center">
                  <span>Confidence:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '99.4%' }}></div>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 text-[10px]">99.4%</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Source Document:</span>
                  <span className="font-medium text-slate-800">GST Registration</span>
                </div>
                <div className="flex justify-between">
                  <span>Page Number:</span>
                  <span className="font-mono text-slate-700 font-semibold">Page 1</span>
                </div>
              </div>
            </div>

            {/* CARD 2: PAN */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">PAN</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Valid Entity
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 mb-2.5 flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-slate-900 tracking-wide">AAACB1234F</span>
                <button
                  onClick={() => handleCopy('AAACB1234F', 'pan')}
                  className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                  title="Copy"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedField === 'pan' ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
              <div className="space-y-1 text-[11px] text-slate-500 pt-1">
                <div className="flex justify-between items-center">
                  <span>Confidence:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '99.1%' }}></div>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 text-[10px]">99.1%</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Source Document:</span>
                  <span className="font-medium text-slate-800">PAN Card & GST</span>
                </div>
                <div className="flex justify-between">
                  <span>Page Number:</span>
                  <span className="font-mono text-slate-700 font-semibold">Page 1</span>
                </div>
              </div>
            </div>

            {/* CARD 3: TURNOVER (Deficit) */}
            <div className="p-3.5 rounded-xl border border-amber-200 bg-white hover:border-amber-300 transition-all shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Turnover</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Deficit vs ₹12.00 Cr req
                </span>
              </div>
              <div className="p-2.5 bg-amber-50/40 rounded-lg border border-amber-200 mb-2.5 flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-slate-900">₹6.10 Cr</span>
                <span className="text-[10px] text-amber-800 font-bold font-mono">Min: ₹12.00 Cr</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-500 pt-1">
                <div className="flex justify-between items-center">
                  <span>Confidence:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '94.6%' }}></div>
                    </div>
                    <span className="font-mono font-bold text-amber-800 text-[10px]">94.6%</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Source Document:</span>
                  <span className="font-medium text-slate-800">CA Turnover Certificate</span>
                </div>
                <div className="flex justify-between">
                  <span>Page Number:</span>
                  <span className="font-mono text-slate-700 font-semibold">Page 2</span>
                </div>
              </div>
            </div>

            {/* CARD 4: LOCAL CONTENT (Deficit) */}
            <div className="p-3.5 rounded-xl border border-rose-200 bg-white hover:border-rose-300 transition-all shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Local Content</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Class-II &lt; 50%
                </span>
              </div>
              <div className="p-2.5 bg-rose-50/40 rounded-lg border border-rose-200 mb-2.5 flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-slate-900">45.0%</span>
                <span className="text-[10px] text-rose-700 font-bold font-mono">Req Class-I: ≥ 50%</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-500 pt-1">
                <div className="flex justify-between items-center">
                  <span>Confidence:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: '92.4%' }}></div>
                    </div>
                    <span className="font-mono font-bold text-rose-700 text-[10px]">92.4%</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Source Document:</span>
                  <span className="font-medium text-slate-800">Local Content Declaration</span>
                </div>
                <div className="flex justify-between">
                  <span>Page Number:</span>
                  <span className="font-mono text-slate-700 font-semibold">Page 1</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50/60 flex justify-between items-center text-[11px] text-slate-500">
            <span>Deterministic Rule Sync</span>
            <span className="font-semibold text-emerald-700 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Ready for evaluation</span>
            </span>
          </div>
        </aside>
      </main>

      {/* BOTTOM STATUTORY NOTICE & ACTIONS DOCKED BAR */}
      <footer className="h-14 bg-white border-t border-slate-200 px-5 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-2 text-xs max-w-2xl">
          <span className="material-symbols-outlined text-[18px] text-slate-500">info</span>
          <p className="text-slate-600 leading-snug">
            <strong className="font-bold text-slate-900">Statutory Notice:</strong> “AI extraction produces evidence
            and structured data. Statutory compliance is determined by deterministic rules.”
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => onNavigate('evidence')}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-400">visibility</span>
            <span>View Source</span>
          </button>
          <button
            onClick={() => onNavigate('evidence')}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-400">open_in_new</span>
            <span>Open Evidence</span>
          </button>
          <button
            onClick={() => onNavigate('registry-verify')}
            className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span>Continue to Verification</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
