import React, { useState, useMemo } from 'react';
import { MOCK_TENDERS, Tender } from '../../mockData/tenders';

interface TenderListViewProps {
  onSelectTender: (tender: Tender) => void;
  onOpenCreateModal: () => void;
  onNavigate: (view: string, params?: any) => void;
}

export const TenderListView: React.FC<TenderListViewProps> = ({
  onSelectTender,
  onOpenCreateModal,
  onNavigate,
}) => {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [density, setDensity] = useState<'standard' | 'compact'>('standard');
  const [activePage, setActivePage] = useState(1);

  const filteredTenders = useMemo(() => {
    return MOCK_TENDERS.filter((t) => {
      const matchesSearch =
        search === '' ||
        t.refNo.toLowerCase().includes(search.toLowerCase()) ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.organization.toLowerCase().includes(search.toLowerCase());

      const matchesStage = stageFilter === 'ALL' || t.stage === stageFilter;
      const matchesSector = sectorFilter === 'ALL' || t.organization === sectorFilter;

      return matchesSearch && matchesStage && matchesSector;
    });
  }, [search, stageFilter, sectorFilter]);

  const handleExportCSV = () => {
    const headers = ['Tender ID', 'Title', 'PSU', 'Bidders', 'Progress', 'Risk High', 'Stage', 'Value'];
    const rows = filteredTenders.map((t) => [
      t.refNo,
      `"${t.title.replace(/"/g, '""')}"`,
      t.organization,
      t.bidderCount,
      `${t.progressPercent}%`,
      t.riskSummary.high,
      t.stage,
      `"${t.estimatedValue}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'VigilBid_Tenders_Register.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col w-full space-y-4 text-slate-800 text-xs">
      {/* HEADER AREA: Landscape-optimized top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tender Evaluation</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              LIVE REGISTER
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active procurement cases and technical-commercial review status across major PSUs.
          </p>
        </div>

        {/* Right KPI chips in a strict horizontal line */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800">
            <span className="text-[11px] font-medium text-slate-500">Total Cases</span>
            <span className="font-mono text-sm font-bold text-slate-900">28</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span className="text-[11px] font-medium">In Technical Review</span>
            <span className="font-mono text-sm font-bold">12</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-900 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span className="text-[11px] font-medium">High Risk Flagged</span>
            <span className="font-mono text-sm font-bold">4</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-medium">Awarded</span>
            <span className="font-mono text-sm font-bold">9</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR: Single consolidated horizontal row */}
      <div className="flex items-center justify-between gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Tender ID, title, organization, or equipment..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="appearance-none bg-slate-50 text-slate-700 px-3 py-1.5 pr-7 rounded-lg text-xs border border-slate-200 cursor-pointer focus:outline-none hover:bg-slate-100"
            >
              <option value="ALL">All Lifecycle Stages</option>
              <option value="Techno-Commercial Review">Techno-Commercial Review</option>
              <option value="Financial Bid Opening">Financial Bid Opening</option>
              <option value="Technical Clarification">Technical Clarification</option>
              <option value="Pre-Award Audit">Pre-Award Audit</option>
              <option value="Integrity & Collusion Check">Integrity & Collusion</option>
              <option value="Prequalification / Eligibility">Prequalification / Eligibility</option>
            </select>
            <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[16px]">
              expand_more
            </span>
          </div>

          <div className="relative">
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="appearance-none bg-slate-50 text-slate-700 px-3 py-1.5 pr-7 rounded-lg text-xs border border-slate-200 cursor-pointer focus:outline-none hover:bg-slate-100"
            >
              <option value="ALL">All PSU Sectors</option>
              <option value="CPCL">CPCL (Refineries)</option>
              <option value="IOCL">IOCL (Petrochemicals)</option>
              <option value="ONGC">ONGC (Upstream E&P)</option>
              <option value="GAIL">GAIL (Natural Gas)</option>
              <option value="BPCL">BPCL (Downstream)</option>
              <option value="NTPC">NTPC (Thermal Power)</option>
            </select>
            <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[16px]">
              expand_more
            </span>
          </div>

          <div className="relative">
            <select className="appearance-none bg-slate-50 text-slate-700 px-3 py-1.5 pr-7 rounded-lg text-xs border border-slate-200 cursor-pointer focus:outline-none hover:bg-slate-100">
              <option>FY 2025-26 Active</option>
              <option>FY 2024-25 Archive</option>
            </select>
            <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[16px]">
              expand_more
            </span>
          </div>

          <button
            onClick={() => onNavigate('matrix')}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">view_column</span>
            <span>Columns</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>+ New Tender Induction</span>
          </button>
        </div>
      </div>

      {/* MAIN EVALUATION MATRIX: Wide panoramic tabular viewport */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className={`${density === 'compact' ? 'py-1.5' : 'py-2.5'} px-4`}>Tender ID</th>
                <th className={`${density === 'compact' ? 'py-1.5' : 'py-2.5'} px-4`}>Tender Title & Duty Specification</th>
                <th className={`${density === 'compact' ? 'py-1.5' : 'py-2.5'} px-3 text-center`}>PSU</th>
                <th className={`${density === 'compact' ? 'py-1.5' : 'py-2.5'} px-3 text-center`}>Bidders</th>
                <th className={`${density === 'compact' ? 'py-1.5' : 'py-2.5'} px-4 w-44`}>Evaluation Progress</th>
                <th className={`${density === 'compact' ? 'py-1.5' : 'py-2.5'} px-3 text-center`}>Risk Flags</th>
                <th className={`${density === 'compact' ? 'py-1.5' : 'py-2.5'} px-4`}>Active Stage</th>
                <th className={`${density === 'compact' ? 'py-1.5' : 'py-2.5'} px-3`}>Last Audit</th>
                <th className={`${density === 'compact' ? 'py-1.5' : 'py-2.5'} px-4 text-right`}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[12px] text-slate-800">
              {filteredTenders.map((t) => (
                <tr key={t.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className={`${density === 'compact' ? 'py-1.5' : 'py-2.5'} px-4 font-mono text-blue-600 font-semibold whitespace-nowrap`}>
                    <button
                      onClick={() => onSelectTender(t)}
                      className="hover:underline flex items-center gap-1 text-left cursor-pointer"
                    >
                      {t.refNo}
                      <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">
                        open_in_new
                      </span>
                    </button>
                  </td>
                  <td className={`${density === 'compact' ? 'py-1.5' : 'py-2.5'} px-4`}>
                    <div className="font-semibold text-slate-900 leading-tight">{t.title}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-sm mt-0.5">{t.description}</div>
                  </td>
                  <td className={`${density === 'compact' ? 'py-1.5' : 'py-2.5'} px-3 text-center`}>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                      {t.organization}
                    </span>
                  </td>
                  <td className={`${density === 'compact' ? 'py-1.5' : 'py-2.5'} px-3 text-center whitespace-nowrap`}>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 font-mono text-[11px] font-medium text-slate-700">
                      <span className="material-symbols-outlined text-[14px] text-slate-500">group</span>
                      {t.bidderCount} Bidders
                    </span>
                  </td>
                  <td className={`${density === 'compact' ? 'py-1.5' : 'py-2.5'} px-4`}>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${t.progressPercent}%` }}></div>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 font-medium w-8 text-right">
                        {t.progressPercent}%
                      </span>
                    </div>
                  </td>
                  <td className={`${density === 'compact' ? 'py-1.5' : 'py-2.5'} px-3 text-center whitespace-nowrap`}>
                    {t.riskSummary.high > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-semibold">
                        <span className="material-symbols-outlined text-[13px] text-rose-600">warning</span>
                        {t.riskSummary.high} Flagged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                        <span className="material-symbols-outlined text-[13px] text-emerald-600">verified</span>
                        0 Clear
                      </span>
                    )}
                  </td>
                  <td className={`${density === 'compact' ? 'py-1.5' : 'py-2.5'} px-4 whitespace-nowrap`}>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {t.stage}
                    </span>
                  </td>
                  <td className={`${density === 'compact' ? 'py-1.5' : 'py-2.5'} px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap`}>
                    Today, 14:20
                  </td>
                  <td className={`${density === 'compact' ? 'py-1.5' : 'py-2.5'} px-4 text-right whitespace-nowrap`}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectTender(t)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Evaluate →
                      </button>
                      <button
                        onClick={() => onNavigate('scrutiny')}
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                        title="More options"
                      >
                        <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white border-t border-slate-200 text-slate-500 text-xs">
          <div className="flex items-center gap-4">
            <span>
              Showing <strong className="text-slate-900 font-medium">1-{filteredTenders.length}</strong> of{' '}
              <strong className="text-slate-900 font-medium">28</strong> active tenders
            </span>
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => setDensity('standard')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  density === 'standard' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setDensity('compact')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  density === 'compact' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Compact
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                disabled={activePage === 1}
                onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
              >
                ‹
              </button>
              {[1, 2, 3, 4].map((page) => (
                <button
                  key={page}
                  onClick={() => setActivePage(page)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg font-mono text-xs font-semibold cursor-pointer ${
                    activePage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={activePage === 4}
                onClick={() => setActivePage((p) => Math.min(4, p + 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
              >
                ›
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                onClick={handleExportCSV}
                className="px-2.5 py-1 hover:bg-white hover:shadow-xs rounded-md text-xs font-medium text-slate-700 flex items-center gap-1 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">download</span> CSV
              </button>
              <button
                onClick={handleExportCSV}
                className="px-2.5 py-1 hover:bg-white hover:shadow-xs rounded-md text-xs font-medium text-slate-700 flex items-center gap-1 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">table_view</span> XLSX
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM STATUS CARDS: 3 horizontal enterprise intelligence blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: CVC Guidelines */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">policy</span>
                <h3 className="text-sm font-bold text-slate-900">CVC Guideline Compliance</h3>
              </div>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] px-2 py-0.5 rounded font-bold">
                2026 AUDIT OK
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Automated screening active against General Financial Rules (GFR Rule 144(xi)) and Make-in-India minimum local supplier Class-I (50%) thresholds.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-mono text-[11px] text-slate-500">Class-I Margin: ≥ 50%</span>
            <button
              onClick={() => onNavigate('matrix')}
              className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <span>Ruleset 4.1.9</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Card 2: Collusion & Rigging */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[20px]">hub</span>
                <h3 className="text-sm font-bold text-slate-900">Bid Rigging & GSTIN Detection</h3>
              </div>
              <span className="bg-rose-50 text-rose-800 border border-rose-200 text-[10.5px] px-2 py-0.5 rounded font-bold">
                1 COLLUSION RISK
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              VigilBid Graph Engine flagged shared IP ranges and common authorized signatories across 2 bidders in the BPCL Heat Exchanger package.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-mono text-[11px] text-rose-700 font-semibold">BPCL/REF/HEAT-509 Flag</span>
            <button
              onClick={() => onNavigate('vendor-graph')}
              className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <span>Inspect Submissions</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Card 3: Cryptographic Integrity */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">verified_user</span>
                <h3 className="text-sm font-bold text-slate-900">Digital Signature & NIC-CERT</h3>
              </div>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] px-2 py-0.5 rounded font-bold">
                38/38 SEALED
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              All 38 submitted bid envelopes cryptographically time-stamped and sealed under SHA-256 e-Token infrastructure with uncompromised checksums.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-mono text-[11px] text-slate-500">e-Token Cert ID: 9021-NIC</span>
            <button
              onClick={() => onNavigate('audit-ledger')}
              className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <span>View Audit Hashes</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
