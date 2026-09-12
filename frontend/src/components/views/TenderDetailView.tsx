import React, { useState } from 'react';
import { Tender } from '../../mockData/tenders';

interface TenderDetailViewProps {
  tender: Tender;
  onNavigate: (view: string, params?: any) => void;
  onDownloadDossier: () => void;
}

export const TenderDetailView: React.FC<TenderDetailViewProps> = ({
  tender,
  onNavigate,
  onDownloadDossier,
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'ANOMALIES' | 'CLASS_I'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const biddersData = [
    {
      id: 'BID-KSB-01',
      name: 'KSB Limited',
      registry: 'GSTIN: 27AAACK1290P1ZV • Pune, MH',
      submissionDate: '04 Feb 2026, 16:45',
      hash: '#7f83b165...9069',
      fullHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      miiLocal: '68%',
      miiClass: 'Class-I',
      techScore: 'Passed (28/28)',
      anomalies: 0,
      status: 'Recommended',
      statusType: 'success',
      isAnomaly: false,
      isClassI: true,
    },
    {
      id: 'BID-SLZ-02',
      name: 'Sulzer India Ltd',
      registry: 'GSTIN: 27AAACS4309M1ZR • Navi Mumbai, MH',
      submissionDate: '05 Feb 2026, 11:20',
      hash: '#4a25e119...986e',
      fullHash: '4a25e119f8a3d5377f0d0e74f8f4a1329c2ef72f913d8544a0e41712a14b986e',
      miiLocal: '72%',
      miiClass: 'Class-I',
      techScore: 'Clarification (1 Query)',
      anomalies: 1,
      status: 'Under Query',
      statusType: 'warning',
      isAnomaly: true,
      isClassI: true,
    },
    {
      id: 'BID-FLW-03',
      name: 'Flowserve India Controls Pvt Ltd',
      registry: 'GSTIN: 29AABCF3310J1ZK • Bengaluru, KA',
      submissionDate: '05 Feb 2026, 13:05',
      hash: '#9b2d8f76...8744',
      fullHash: '9b2d8f7632cc744e803a649ef901239aa8e45cc235d64811a2f4512e9b048744',
      miiLocal: '54%',
      miiClass: 'Class-I',
      techScore: 'Passed (28/28)',
      anomalies: 0,
      status: 'Recommended',
      statusType: 'success',
      isAnomaly: false,
      isClassI: true,
    },
    {
      id: 'BID-HYD-0419',
      name: 'Bharat Hydrotech Corp',
      registry: 'GSTIN: 07AAACE9841B1ZR • Pune, MH',
      submissionDate: '05 Feb 2026, 14:58',
      hash: '#3c92e105...3d41',
      fullHash: '3c92e105da556ef3824bc892648574100e4827fb562c129e928a3f5a2b163d41',
      miiLocal: '48%',
      miiClass: 'Class-II',
      techScore: 'Deviation (Impeller Spec)',
      anomalies: 2,
      status: 'Review Required',
      statusType: 'danger',
      isAnomaly: true,
      isClassI: false,
    },
    {
      id: 'BID-KBL-05',
      name: 'Kirloskar Brothers Ltd',
      registry: 'GSTIN: 27AAACK0981G1Z4 • Kirloskarvadi, MH',
      submissionDate: '05 Feb 2026, 14:15',
      hash: '#82a176d6...c255',
      fullHash: '82a176d6541f5379e49c7161bb7d90e21a440182ecbf8159b3438914c6e1c255',
      miiLocal: '61%',
      miiClass: 'Class-I',
      techScore: 'Passed (28/28)',
      anomalies: 0,
      status: 'Recommended',
      statusType: 'success',
      isAnomaly: false,
      isClassI: true,
    },
  ];

  const filteredBidders = biddersData.filter((b) => {
    const matchesFilter =
      filterTab === 'ALL' ||
      (filterTab === 'ANOMALIES' && b.isAnomaly) ||
      (filterTab === 'CLASS_I' && b.isClassI);

    const matchesSearch =
      searchQuery === '' ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.registry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.hash.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full gap-5 text-slate-800 text-xs">
      {/* Top Hero & Breadcrumb Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <button
              onClick={() => onNavigate('tenders')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Tenders
            </button>
            <span className="material-symbols-outlined text-[14px] text-slate-400">chevron_right</span>
            <span className="hover:text-blue-600 transition-colors cursor-pointer">CPCL Refineries</span>
            <span className="material-symbols-outlined text-[14px] text-slate-400">chevron_right</span>
            <span className="font-mono text-blue-600 font-semibold">{tender.refNo || 'CPCL/MM/2026/PUMP-217'}</span>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap mt-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API-610 Centrifugal Process Pumps</h1>
            <div className="flex items-center gap-1.5 px-3 py-0.5 bg-slate-100 rounded-full border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="font-mono text-[10.5px] text-slate-700 uppercase font-semibold">
                Global Tender ID: GEM/2026/B/892110
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="h-8.5 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Print Summary</span>
          </button>
          <button
            onClick={onDownloadDossier}
            className="h-8.5 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export Dossier</span>
          </button>
          <button
            onClick={() => onNavigate('bidders', { tenderId: tender.id })}
            className="h-8.5 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">groups</span>
            <span>Review Bidders</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* 5 Horizontal Metric Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Estimated Value</span>
            <span className="p-1.5 rounded bg-blue-50 text-blue-600 material-symbols-outlined text-[16px]">payments</span>
          </div>
          <div className="my-1.5">
            <div className="text-xl font-bold font-mono text-slate-900">
              ₹18.40 <span className="text-sm font-semibold text-slate-500">Cr</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-blue-600">verified</span>
            <span>Sanctioned Capex (FY 25-26)</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Procurement Scope</span>
            <span className="p-1.5 rounded bg-blue-50 text-blue-600 material-symbols-outlined text-[16px]">
              precision_manufacturing
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-xl font-bold text-slate-900">
              12 <span className="text-sm font-semibold text-slate-500">Units</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 truncate">Heavy Duty Process (BB2/OH2)</div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Submitted Bids</span>
            <span className="p-1.5 rounded bg-blue-50 text-blue-600 material-symbols-outlined text-[16px]">
              inventory_2
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-xl font-bold text-slate-900">
              5 <span className="text-sm font-semibold text-slate-500">Bidders</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="truncate">All EMD & Bonds Verified</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Evaluation Matrix</span>
            <span className="p-1.5 rounded bg-blue-50 text-blue-600 material-symbols-outlined text-[16px]">
              checklist_rtl
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-xl font-bold text-slate-900">
              34 <span className="text-sm font-semibold text-slate-500">Criteria</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 truncate">26 Technical • 8 Commercial</div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Current Stage</span>
            <span className="px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              IN SCRUTINY
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-sm font-bold text-slate-900 truncate">Techno-Commercial</div>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-slate-400">event</span>
            <span>Target: 15 Mar 2026</span>
          </div>
        </div>
      </div>

      {/* Main Split Section: Left Information & Right Directives */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Tender Information & Parameters (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-blue-600">description</span>
              <h2 className="text-sm font-bold text-slate-900">Tender Information & Parameters</h2>
            </div>
            <span className="font-mono text-[10.5px] text-slate-500 font-semibold">REV-04 • SECURE_LEDGER</span>
          </div>

          <div className="p-4 flex flex-col divide-y divide-slate-100 text-xs">
            {/* Item 1 */}
            <div className="py-2.5 grid grid-cols-12 gap-2 items-center">
              <span className="col-span-4 text-slate-500 font-medium">Procuring Entity</span>
              <div className="col-span-8 font-medium text-slate-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-blue-600">apartment</span>
                <span>Chennai Petroleum Corporation Limited (CPCL) • Manali Refinery</span>
              </div>
            </div>

            {/* Item 2 */}
            <div className="py-2.5 grid grid-cols-12 gap-2 items-center">
              <span className="col-span-4 text-slate-500 font-medium">Procurement Platform</span>
              <div className="col-span-8 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900">GeM / CPPP Portal</span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  CPPP ID: 2026_CPCL_892110_1
                </span>
              </div>
            </div>

            {/* Item 3 */}
            <div className="py-2.5 grid grid-cols-12 gap-2 items-center">
              <span className="col-span-4 text-slate-500 font-medium">Procurement Stage</span>
              <div className="col-span-8 text-slate-800 font-medium">
                Techno-Commercial Evaluation (Pre-Price Opening)
              </div>
            </div>

            {/* Item 4 */}
            <div className="py-2.5 grid grid-cols-12 gap-2 items-center">
              <span className="col-span-4 text-slate-500 font-medium">Tender Scrutiny Status</span>
              <div className="col-span-8">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                  Live • Under Active TEC Scrutiny
                </span>
              </div>
            </div>

            {/* Item 5 */}
            <div className="py-2.5 grid grid-cols-12 gap-2 items-center">
              <span className="col-span-4 text-slate-500 font-medium">Bidding Classification</span>
              <div className="col-span-8 text-slate-800">
                <span className="font-medium text-slate-900">Domestic Competitive Bidding</span>
                <span className="text-slate-500 ml-1">(ICB Exempted under GFR Rule 161)</span>
              </div>
            </div>

            {/* Item 6 */}
            <div className="py-2.5 grid grid-cols-12 gap-2 items-center">
              <span className="col-span-4 text-slate-500 font-medium">EMD / Bid Security</span>
              <div className="col-span-8 flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900">₹36,80,000</span>
                  <span className="text-slate-500">(2.0% of Capex Estimate)</span>
                </div>
                <span className="font-mono text-[10.5px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  e-PBG Verified (NIC eSeal)
                </span>
              </div>
            </div>

            {/* Item 7 */}
            <div className="pt-2.5 grid grid-cols-12 gap-2 items-center">
              <span className="col-span-4 text-slate-500 font-medium">Contract Type</span>
              <div className="col-span-8 text-slate-800 font-medium">
                Item Rate EPC Contract with 24-Month Defect Liability Period
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Statutory Directives & Rules (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-blue-600">policy</span>
              <h2 className="text-sm font-bold text-slate-900">Statutory Directives & Rules</h2>
            </div>
            <span className="text-xs text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              CVC COMPLIANT
            </span>
          </div>

          <div className="p-4 flex flex-col gap-2.5 flex-1 justify-between">
            {/* Mandate Card 1 */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-700">GFR 144(xi)</span>
                  <span className="font-semibold text-slate-900">Border Country Protocol</span>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[10.5px] bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[13px]">check_circle</span> 100% Passed
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Mandatory registration & security clearance check for sharing land borders. All 5 entities cleared.
              </p>
            </div>

            {/* Mandate Card 2 */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-700">PPP-MII Class-I</span>
                  <span className="font-semibold text-slate-900">Local Value Add ≥ 50%</span>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[10.5px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  Active Clause
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Preference to Make in India Order. Class-I suppliers get 20% margin of purchase preference over Class-II.
              </p>
            </div>

            {/* Mandate Card 3 */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-700">GFR 161(iv)</span>
                  <span className="font-semibold text-slate-900">MSE / Startup Exemption</span>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[10.5px] bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                  1 MSE Claimed
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Relaxation of prior turnover & prior experience criteria granted for registered micro/small enterprises.
              </p>
            </div>

            {/* Mandate Card 4 */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-700">ATO Minimum</span>
                  <span className="font-semibold text-slate-900">₹5.52 Cr (Last 3 FYs)</span>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[10.5px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  Reconciled (MCA)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Average annual financial turnover validated against audited balance sheets and MCA data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Procurement Lifecycle & Audit Stepper */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-blue-600">timeline</span>
            <h2 className="text-sm font-bold text-slate-900">Procurement Lifecycle & Audit Stepper</h2>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <span className="material-symbols-outlined text-[15px] text-slate-400">history</span>
            <span>
              Stage Logged: <strong className="text-slate-800 font-semibold">24 Feb 2026, 14:32 IST</strong> by TEC
              Member Sec.
            </span>
          </div>
        </div>

        {/* Stepper Pipeline */}
        <div className="pt-6 pb-2 overflow-x-auto">
          <div className="min-w-[860px] flex items-center justify-between relative px-4">
            {/* Connecting Line Bar */}
            <div className="absolute left-8 right-8 top-4 h-1 bg-slate-200 z-0"></div>
            <div className="absolute left-8 w-[64%] top-4 h-1 bg-emerald-500 z-0"></div>

            {/* Step 1: Published */}
            <div className="flex flex-col items-center text-center relative z-10 w-28">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 border-2 border-emerald-600 flex items-center justify-center font-mono text-xs font-bold shadow-xs">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </div>
              <span className="text-xs font-semibold text-slate-900 mt-2">Published</span>
              <span className="font-mono text-[10.5px] text-slate-500">10 Jan 2026</span>
              <span className="text-[10px] text-emerald-700 font-medium mt-0.5">GeM Tender Live</span>
            </div>

            {/* Step 2: Bids Received */}
            <div className="flex flex-col items-center text-center relative z-10 w-28">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 border-2 border-emerald-600 flex items-center justify-center font-mono text-xs font-bold shadow-xs">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </div>
              <span className="text-xs font-semibold text-slate-900 mt-2">Bids In</span>
              <span className="font-mono text-[10.5px] text-slate-500">05 Feb 2026</span>
              <span className="text-[10px] text-emerald-700 font-medium mt-0.5">5 Envelopes Locked</span>
            </div>

            {/* Step 3: Document Scrutiny */}
            <div className="flex flex-col items-center text-center relative z-10 w-28">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 border-2 border-emerald-600 flex items-center justify-center font-mono text-xs font-bold shadow-xs">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </div>
              <span className="text-xs font-semibold text-slate-900 mt-2">Doc Scrutiny</span>
              <span className="font-mono text-[10.5px] text-slate-500">18 Feb 2026</span>
              <span className="text-[10px] text-emerald-700 font-medium mt-0.5">Fee & EMD Valid</span>
            </div>

            {/* Step 4: Compliance Review */}
            <div className="flex flex-col items-center text-center relative z-10 w-28">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 border-2 border-emerald-600 flex items-center justify-center font-mono text-xs font-bold shadow-xs">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </div>
              <span className="text-xs font-semibold text-slate-900 mt-2">Compliance</span>
              <span className="font-mono text-[10.5px] text-slate-500">24 Feb 2026</span>
              <span className="text-[10px] text-emerald-700 font-medium mt-0.5">GFR / MII Audited</span>
            </div>

            {/* Step 5: TEC Review (Active) */}
            <div className="flex flex-col items-center text-center relative z-10 w-32">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white ring-4 ring-blue-100 flex items-center justify-center font-mono text-xs font-bold shadow-sm">
                5
              </div>
              <span className="text-xs font-bold text-blue-700 mt-2">TEC Review</span>
              <span className="font-mono text-[10.5px] text-slate-900 font-semibold">Active Session</span>
              <span className="text-[10px] text-blue-700 font-bold mt-0.5 px-1.5 py-0.2 bg-blue-50 border border-blue-200 rounded">
                Stage 5 of 7
              </span>
            </div>

            {/* Step 6: Price Bid */}
            <div className="flex flex-col items-center text-center relative z-10 w-28 opacity-60">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 border border-slate-300 flex items-center justify-center font-mono text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">lock</span>
              </div>
              <span className="text-xs font-medium text-slate-600 mt-2">Price Bid Opening</span>
              <span className="font-mono text-[10.5px] text-slate-500">Pending TEC</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Envelopes Encrypted</span>
            </div>

            {/* Step 7: Award */}
            <div className="flex flex-col items-center text-center relative z-10 w-28 opacity-60">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 border border-slate-300 flex items-center justify-center font-mono text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">military_tech</span>
              </div>
              <span className="text-xs font-medium text-slate-600 mt-2">Final Award</span>
              <span className="font-mono text-[10.5px] text-slate-500">TBD</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Contract & LOA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Bidder Scrutiny Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
        {/* Table Controls Header */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-blue-600">table_chart</span>
              <h2 className="text-sm font-bold text-slate-900">Participating Bidders Overview</h2>
            </div>
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              5 Verified Submissions
            </span>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-2.5 text-slate-400 text-[16px]">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by bidder, GSTIN or hash..."
                className="h-8 w-56 lg:w-64 pl-8 pr-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                type="text"
              />
            </div>

            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              <button
                onClick={() => setFilterTab('ALL')}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  filterTab === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                type="button"
              >
                All (5)
              </button>
              <button
                onClick={() => setFilterTab('ANOMALIES')}
                className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                  filterTab === 'ANOMALIES'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                type="button"
              >
                Anomalies (2)
              </button>
              <button
                onClick={() => setFilterTab('CLASS_I')}
                className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                  filterTab === 'CLASS_I'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                type="button"
              >
                Class-I Only (4)
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 h-9 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                <th className="px-4">Bidder Name & Registry</th>
                <th className="px-4">Submission & Hash</th>
                <th className="px-4">MII Local Value</th>
                <th className="px-4">Technical Score</th>
                <th className="px-4">Risk / Anomaly</th>
                <th className="px-4">Scrutiny Status</th>
                <th className="px-4 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredBidders.map((b) => (
                <tr key={b.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-[13px]">{b.name}</span>
                      <span className="font-mono text-[11px] text-slate-500">{b.registry}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-slate-800">{b.submissionDate}</span>
                      <span
                        className="font-mono text-[11px] text-slate-400 truncate max-w-[130px] hover:text-slate-700 cursor-pointer"
                        title={`SHA256: ${b.fullHash}`}
                      >
                        {b.hash}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{b.miiLocal}</span>
                      <span
                        className={`px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold border ${
                          b.miiClass === 'Class-I'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {b.miiClass}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`material-symbols-outlined text-[16px] ${
                          b.statusType === 'success'
                            ? 'text-emerald-600'
                            : b.statusType === 'warning'
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {b.statusType === 'success'
                          ? 'check_circle'
                          : b.statusType === 'warning'
                          ? 'help_outline'
                          : 'cancel'}
                      </span>
                      <span className="font-semibold text-slate-900">{b.techScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {b.anomalies === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[10.5px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                        <span className="material-symbols-outlined text-[13px]">shield</span> 0 Anomalies
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[10.5px] bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                        <span className="material-symbols-outlined text-[13px] text-rose-600">report</span> Subnet IP Match
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                        b.statusType === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : b.statusType === 'warning'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onNavigate('scrutiny', { bidderId: b.id })}
                      className="px-2.5 py-1 rounded-md border border-slate-300 hover:border-blue-600 text-blue-700 hover:bg-blue-50 font-semibold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                      type="button"
                    >
                      <span>Inspect</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Action Ribbon */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-slate-600 text-xs">
            <span className="flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span> 4 of 5 Bidders
              Recommended for Price Bid
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1 text-rose-700 font-medium">
              <span className="material-symbols-outlined text-[16px] text-rose-600">warning</span> 1 Bidder requires
              TEC Committee Disposition
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('matrix')}
              className="h-8 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 hover:text-slate-900 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              Open Compliance Matrix
            </button>
            <button
              onClick={() => onNavigate('scrutiny', { bidderId: 'BID-HYD-0419' })}
              className="h-8 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Complete TEC Evaluation</span>
              <span className="material-symbols-outlined text-[16px]">done_all</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
