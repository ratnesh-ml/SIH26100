import React, { useState } from 'react';

interface RegistryVerifyViewProps {
  onNavigate: (view: string, params?: any) => void;
  bidderId?: string;
}

export const RegistryVerifyView: React.FC<RegistryVerifyViewProps> = ({
  onNavigate,
  bidderId = 'BID-HYD-0419',
}) => {
  const [polling, setPolling] = useState(false);
  const [pollSuccess, setPollSuccess] = useState(false);

  const handleRepoll = () => {
    setPolling(true);
    setTimeout(() => {
      setPolling(false);
      setPollSuccess(true);
      setTimeout(() => setPollSuccess(false), 3500);
    }, 900);
  };

  const registries = [
    {
      name: 'Ministry of Corporate Affairs (MCA21)',
      identifier: 'CIN: U29100MH2018PTC310244',
      status: 'VERIFIED',
      statusType: 'success',
      latency: '240ms',
      lastPolled: '14 mins ago',
      data: [
        { label: 'Company Status', value: 'Active' },
        { label: 'Incorporation Date', value: '14/06/2018' },
        { label: 'Registered Jurisdiction', value: 'ROC Pune, Maharashtra (State 27)' },
        { label: 'Authorized Capital', value: '₹5.00 Cr' },
        { label: 'Paid Up Capital', value: '₹3.20 Cr' },
      ],
    },
    {
      name: 'Central Board of Direct Taxes (CBDT / NSDL)',
      identifier: 'PAN: AAACB1234F',
      status: 'VERIFIED',
      statusType: 'success',
      latency: '180ms',
      lastPolled: '14 mins ago',
      data: [
        { label: 'PAN Card Status', value: 'Valid / Operative' },
        { label: 'Name Match Score', value: '99.1% Exact Concordance' },
        { label: 'Aadhaar Seeding', value: 'Compliant' },
        { label: 'Tax Category', value: 'Domestic Company (Pvt Ltd)' },
      ],
    },
    {
      name: 'Goods & Services Tax Network (GSTN)',
      identifier: 'GSTIN: 33AAACB9999F1Z5',
      status: 'DISCORDANT',
      statusType: 'danger',
      latency: '310ms',
      lastPolled: '14 mins ago',
      data: [
        { label: 'Registration Status', value: 'Active (Regular)' },
        { label: 'State Code Prefix', value: '33 (Tamil Nadu)' },
        { label: 'ROC Location Conflict', value: 'Registered ROC is State 27 (Maharashtra)' },
        { label: 'Filing Track Record', value: 'GSTR-3B filed up to Jan 2026' },
      ],
      alert: 'State Code prefix 33 conflicts with MCA21 registered corporate headquarters state 27. Cross-check branch REG-06.',
    },
    {
      name: 'Ministry of MSME (Udyam Portal)',
      identifier: 'Udyam: UDYAM-MH-26-0034912',
      status: 'VERIFIED',
      statusType: 'success',
      latency: '290ms',
      lastPolled: '14 mins ago',
      data: [
        { label: 'Enterprise Type', value: 'Medium Enterprise' },
        { label: 'Major Activity', value: 'Manufacturing (Pumps & Compressors)' },
        { label: 'Manufacturing Plant Location', value: 'Bhosari MIDC, Pune, Maharashtra' },
      ],
    },
    {
      name: 'ICAI UDIN Registry (Statutory Audit)',
      identifier: 'UDIN: 24049819BCDE1942',
      status: 'VERIFIED',
      statusType: 'success',
      latency: '210ms',
      lastPolled: '14 mins ago',
      data: [
        { label: 'Signing Chartered Accountant', value: 'CA Ramesh Gokhale (M.No 049819)' },
        { label: '3-Year Average Turnover', value: '₹6.10 Cr (Deficit against tender ₹12.00 Cr)' },
        { label: 'Audited Net Worth', value: '₹4.85 Cr (Compliant)' },
      ],
    },
    {
      name: 'Structured Financial Messaging System (SFMS)',
      identifier: 'EMD BG: BG-8841 (SBI Pune)',
      status: 'VERIFIED',
      statusType: 'success',
      latency: '150ms',
      lastPolled: '14 mins ago',
      data: [
        { label: 'Issuing Bank', value: 'State Bank of India (Pune Main Branch)' },
        { label: 'Bank Guarantee Value', value: '₹36.80 Lakhs' },
        { label: 'Validity Date', value: 'Valid up to 31/12/2026' },
      ],
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
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Source-of-Truth Registry Verification</h1>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                6 REGISTRIES POLLED
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Bidder: <strong className="text-slate-700">Bharat Hydrotech Corp ({bidderId})</strong> • Tender:{' '}
              <strong className="text-slate-700">CPCL/MM/2026/PUMP-217</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRepoll}
            disabled={polling}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] text-slate-600 ${polling ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{polling ? 'Querying Registries...' : 'Re-Poll Registries'}</span>
          </button>
          <button
            onClick={() => onNavigate('scrutiny', { bidderId })}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>Proceed to Scrutiny Cockpit</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {pollSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-900 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
          <span>All 6 official registries re-polled successfully. Cryptographic response hashes recorded in ledger.</span>
        </div>
      )}

      {/* Grid of 6 Registries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {registries.map((r, idx) => (
          <div
            key={idx}
            className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between ${
              r.statusType === 'danger'
                ? 'border-rose-300 ring-2 ring-rose-500/10'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs">{r.name}</h3>
                  <div className="font-mono text-[10px] text-slate-500 mt-0.5">{r.identifier}</div>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    r.statusType === 'danger'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {r.status}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs">
                {r.data.map((d, dIdx) => (
                  <div key={dIdx} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-50">
                    <span className="text-slate-500">{d.label}:</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[160px]">{d.value}</span>
                  </div>
                ))}
              </div>

              {r.alert && (
                <div className="mt-3 p-2.5 rounded bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-rose-600 shrink-0 mt-0.5">warning</span>
                  <span>{r.alert}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Response: {r.latency}</span>
              <span>Polled: {r.lastPolled}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
