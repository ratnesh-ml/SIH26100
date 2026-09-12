import React, { useState, useMemo } from 'react';
import { MOCK_COMPLIANCE_CRITERIA } from '../../mockData/complianceMatrix';
import { StatusChip } from '../common/StatusChip';

interface ComplianceMatrixViewProps {
  onNavigate: (view: string, params?: any) => void;
  onDownloadDossier: () => void;
}

export const ComplianceMatrixView: React.FC<ComplianceMatrixViewProps> = ({
  onNavigate,
  onDownloadDossier,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const categories = [
    { id: 'ALL', label: 'All Criteria (34)' },
    { id: 'Identity & Tax', label: 'Identity & Registration (6)' },
    { id: 'Financial Capacity', label: 'Financial & Eligibility (8)' },
    { id: 'Statutory Directives', label: 'Statutory & CVC (6)' },
    { id: 'Technical Capability', label: 'Technical Specifications (8)' },
    { id: 'Document Integrity', label: 'Document Integrity & Forensics (6)' },
  ];

  const filteredCriteria = useMemo(() => {
    return MOCK_COMPLIANCE_CRITERIA.filter((c) => {
      const matchesCat = selectedCategory === 'ALL' || c.category === selectedCategory;
      const matchesSearch =
        search === '' ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.gfrCitation.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, search]);

  return (
    <div className="flex flex-col w-full space-y-4 text-slate-800 text-xs">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Compliance & Eligibility Matrix</h1>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              34 EVALUATED CLAUSES
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Comparative clause-by-clause scrutiny of all 5 participating bidders against GFR 2017 & CPCL NIT mandates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDownloadDossier}
            className="px-3.5 py-1.5 bg-white text-slate-700 hover:bg-slate-50 font-medium text-xs rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">file_download</span>
            <span>Export Matrix</span>
          </button>
          <button
            onClick={() => onNavigate('scrutiny', { bidderId: 'BID-HYD-0419' })}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Bidder Cockpit</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Filter Row & Categories */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-64">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clause or mandate..."
            className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-blue-600"
          />
        </div>
      </div>

      {/* Comparative Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-4 w-72">Statutory Clause & Mandate</th>
                <th className="py-2.5 px-3 text-center w-36">Bidder A (Meridian)</th>
                <th className="py-2.5 px-3 text-center w-36">Bidder B (Sri Kaveri)</th>
                <th className="py-2.5 px-3 text-center w-36 bg-blue-50/40 text-blue-900 border-x border-blue-100">
                  Bidder C (Bharat Hydro)
                </th>
                <th className="py-2.5 px-3 text-center w-36">Bidder D (Nova)</th>
                <th className="py-2.5 px-3 text-center w-36">Bidder E (Zenith)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[12px] text-slate-800">
              {filteredCriteria.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 leading-tight">{c.title}</div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>{c.code}</span>
                      <span>•</span>
                      <span>{c.gfrCitation}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusChip status={c.evaluations['BID-MER-0102']?.status || 'PASS'} />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusChip status={c.evaluations['BID-KAV-0211']?.status || 'PASS'} />
                  </td>
                  <td className="py-3 px-3 text-center bg-blue-50/20 border-x border-blue-50">
                    <StatusChip status={c.evaluations['BID-HYD-0419']?.status || 'FAIL'} />
                    {c.evaluations['BID-HYD-0419']?.note && (
                      <div className="font-mono text-[10px] text-slate-500 mt-1 truncate max-w-[120px] mx-auto">
                        {c.evaluations['BID-HYD-0419'].note}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusChip status={c.evaluations['BID-NOV-0654']?.status || 'PASS'} />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusChip status={c.evaluations['BID-ZEN-0899']?.status || 'PASS'} />
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
