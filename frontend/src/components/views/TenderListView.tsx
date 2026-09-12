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
}) => {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [sectorFilter, setSectorFilter] = useState('ALL');

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

  return (
    <div className="flex flex-col w-full space-y-4 text-slate-800 text-xs">
      {/* HEADER AREA */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tender Evaluation</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[11px] font-semibold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              LIVE REGISTER
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active procurement cases and technical-commercial review status across major PSUs.
          </p>
        </div>

        {/* KPI Chips */}
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

      {/* TOOLBAR */}
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
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs border border-slate-200 cursor-pointer focus:outline-none hover:bg-slate-100"
          >
            <option value="ALL">All Lifecycle Stages</option>
            <option value="Techno-Commercial Review">Techno-Commercial Review</option>
            <option value="Financial Bid Opening">Financial Bid Opening</option>
            <option value="Technical Clarification">Technical Clarification</option>
            <option value="Pre-Award Audit">Pre-Award Audit</option>
          </select>

          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs border border-slate-200 cursor-pointer focus:outline-none hover:bg-slate-100"
          >
            <option value="ALL">All PSU Sectors</option>
            <option value="CPCL">CPCL (Refineries)</option>
            <option value="IOCL">IOCL (Petrochemicals)</option>
            <option value="ONGC">ONGC (Upstream E&P)</option>
            <option value="GAIL">GAIL (Natural Gas)</option>
          </select>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>+ New Tender Induction</span>
          </button>
        </div>
      </div>

      {/* PANORAMIC TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-4">Tender ID</th>
                <th className="py-2.5 px-4">Tender Title & Duty Specification</th>
                <th className="py-2.5 px-3 text-center">PSU</th>
                <th className="py-2.5 px-3 text-center">Bidders</th>
                <th className="py-2.5 px-4 w-44">Evaluation Progress</th>
                <th className="py-2.5 px-3 text-center">Risk Flags</th>
                <th className="py-2.5 px-4">Active Stage</th>
                <th className="py-2.5 px-3">Estimated Value</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[12px] text-slate-800">
              {filteredTenders.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="py-2.5 px-4 font-mono text-blue-600 font-semibold whitespace-nowrap">
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
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-slate-900 leading-tight">{t.title}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-sm mt-0.5">{t.description}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                      {t.organization}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 font-mono text-[11px] font-medium text-slate-700">
                      <span className="material-symbols-outlined text-[14px] text-slate-500">group</span>
                      {t.bidderCount} Bidders
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${t.progressPercent}%` }}></div>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 font-medium w-8 text-right">
                        {t.progressPercent}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    {t.riskSummary.high > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-semibold">
                        <span className="material-symbols-outlined text-[13px] text-rose-600">warning</span>
                        {t.riskSummary.high} Flagged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                        <span className="material-symbols-outlined text-[13px] text-emerald-600">check_circle</span>
                        Clear
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {t.stage}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {t.estimatedValue}
                  </td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => onSelectTender(t)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-blue-700 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Evaluate →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
