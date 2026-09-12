import React, { useState } from 'react';

interface ExtractionViewProps {
  onNavigate: (view: string, params?: any) => void;
  bidderId?: string;
}

export const ExtractionView: React.FC<ExtractionViewProps> = ({
  onNavigate,
  bidderId = 'BID-HYD-0419',
}) => {
  const [selectedField, setSelectedField] = useState<string>('gstin');
  const [confirmed, setConfirmed] = useState<boolean>(false);

  const fields = [
    {
      id: 'entity_name',
      label: 'Legal Entity Name',
      value: 'Bharat Hydrotech Corporation Pvt Ltd',
      source: 'FORM_GST_REG_06.pdf (Page 1)',
      confidence: '99.8%',
      status: 'verified',
    },
    {
      id: 'trade_name',
      label: 'Trade Name',
      value: 'Bharat Hydrotech Solutions',
      source: 'FORM_GST_REG_06.pdf (Page 1)',
      confidence: '98.2%',
      status: 'verified',
    },
    {
      id: 'gstin',
      label: 'GST Identification Number (GSTIN)',
      value: '33AAACB9999F1Z5',
      source: 'FORM_GST_REG_06.pdf (Box 1)',
      confidence: '99.9%',
      status: 'warning',
      warning: 'State Code 33 (Tamil Nadu) conflicts with ROC registered office in Maharashtra (27).',
    },
    {
      id: 'pan',
      label: 'Permanent Account Number (PAN)',
      value: 'AAACB1234F',
      source: 'PAN_Card_Certified.pdf (Page 1)',
      confidence: '99.9%',
      status: 'verified',
    },
    {
      id: 'cin',
      label: 'Corporate Identity Number (CIN)',
      value: 'U29100MH2018PTC310244',
      source: 'MCA_COI_Certificate.pdf (Page 1)',
      confidence: '99.4%',
      status: 'verified',
    },
    {
      id: 'turnover',
      label: '3-Year Average Turnover',
      value: '₹6.10 Cr',
      source: 'CA_Turnover_Certificate.pdf (Page 2)',
      confidence: '99.1%',
      status: 'fail',
      warning: 'Shortfall: Required minimum is ₹12.00 Cr (49.1% deficit).',
    },
    {
      id: 'local_content',
      label: 'Make in India Local Content',
      value: '45.0%',
      source: 'MII_Self_Declaration.pdf (Page 1)',
      confidence: '97.5%',
      status: 'fail',
      warning: 'Non-compliant with Class-I requirement (≥50.0%).',
    },
  ];

  return (
    <div className="flex flex-col w-full space-y-4 text-slate-800 text-xs">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('pipeline')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Back to Pipeline"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div className="h-5 w-px bg-slate-200"></div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Structured Document Extraction</h1>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                OCR ENGINE v5.2
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Bidder: <strong className="text-slate-700">{bidderId}</strong> • Tender:{' '}
              <strong className="text-slate-700">CPCL/MM/2026/PUMP-217</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfirmed(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">check</span>
            <span>{confirmed ? 'Extractions Confirmed' : 'Confirm Extractions'}</span>
          </button>
          <button
            onClick={() => onNavigate('registry')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>Proceed to Registry Verification</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Split Dual-Viewport Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Document Viewport with Bounding Boxes (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-blue-600">picture_as_pdf</span>
              <span className="font-semibold text-slate-900">FORM_GST_REG_06.pdf</span>
              <span className="font-mono text-[10px] text-slate-400">Page 1 of 3</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">SHA-256: 4f8b9e...3d2</span>
          </div>

          <div className="mt-3 flex-1 bg-slate-100 rounded-lg p-4 border border-slate-200 relative overflow-hidden flex flex-col items-center justify-center min-h-[440px]">
            {/* Simulated Document Sheet */}
            <div className="w-full max-w-md bg-white border border-slate-300 rounded shadow-md p-6 relative font-serif text-[11px] leading-relaxed text-slate-800">
              <div className="text-center font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-200">
                Government of India • Central Board of Indirect Taxes & Customs
              </div>
              <div className="text-center text-[10px] font-sans text-slate-500 my-1">
                Form GST REG-06 [See Rule 10(1)] • Registration Certificate
              </div>

              <div className="mt-4 space-y-3 font-sans">
                <div
                  className={`p-1.5 rounded transition-all ${
                    selectedField === 'gstin' ? 'bg-amber-100 border-2 border-amber-500 shadow-xs' : 'border border-blue-200 bg-blue-50/50'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">1. GSTIN</span>
                  <span className="font-mono font-bold text-xs text-slate-900">33AAACB9999F1Z5</span>
                </div>

                <div
                  className={`p-1.5 rounded transition-all ${
                    selectedField === 'entity_name' ? 'bg-blue-100 border-2 border-blue-600' : 'border border-slate-200'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">2. Legal Name</span>
                  <span className="font-bold text-xs text-slate-900">Bharat Hydrotech Corporation Pvt Ltd</span>
                </div>

                <div
                  className={`p-1.5 rounded transition-all ${
                    selectedField === 'trade_name' ? 'bg-blue-100 border-2 border-blue-600' : 'border border-slate-200'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">3. Trade Name</span>
                  <span className="text-xs text-slate-800">Bharat Hydrotech Solutions</span>
                </div>

                <div className="p-1.5 rounded border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">4. Constitution of Business</span>
                  <span className="text-xs text-slate-800">Private Limited Company</span>
                </div>

                <div className="p-1.5 rounded border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">5. Address of Principal Place</span>
                  <span className="text-xs text-slate-800">Plot 42, Bhosari MIDC, Pune - 411026, Maharashtra</span>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-200 flex justify-between items-center text-[9px] font-mono text-slate-400">
                <span>DSC Valid: 14/06/2018</span>
                <span>Issuing Authority: Range-II Pune</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Extracted Parameters Table (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="font-bold text-slate-900 text-sm">Extracted Parameters & OCR Confidence</h2>
            <span className="font-mono text-xs text-emerald-700 font-semibold">Overall: 98.4%</span>
          </div>

          <div className="mt-3 space-y-2 flex-1">
            {fields.map((f) => (
              <div
                key={f.id}
                onClick={() => setSelectedField(f.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedField === f.id
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">{f.label}</span>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className="text-slate-400">Conf:</span>
                    <span className="font-bold text-emerald-700">{f.confidence}</span>
                  </div>
                </div>

                <div className="font-bold font-mono text-slate-900 text-sm mt-1">{f.value}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{f.source}</div>

                {f.warning && (
                  <div className="mt-2 p-2 rounded bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-rose-600 shrink-0">warning</span>
                    <span>{f.warning}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
