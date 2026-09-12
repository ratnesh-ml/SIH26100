import React, { useState, useMemo } from 'react';
import { MOCK_BIDDERS, Bidder } from '../../mockData/bidders';
import { MOCK_TENDERS } from '../../mockData/tenders';
import { StatusChip } from '../common/StatusChip';
import { RiskGauge } from '../common/RiskGauge';

interface BidderListViewProps {
  onSelectBidder: (bidder: Bidder) => void;
  onOpenUploadModal: () => void;
  onNavigate: (view: string, params?: any) => void;
}

export const BidderListView: React.FC<BidderListViewProps> = ({
  onSelectBidder,
  onOpenUploadModal,
  onNavigate,
}) => {
  const selectedTenderId = 'CPCL-PUMP-217';
  const [search, setSearch] = useState('');
  const [complianceFilter, setComplianceFilter] = useState('ALL');

  const currentTender = MOCK_TENDERS.find((t) => t.id === selectedTenderId) || MOCK_TENDERS[0];

  const filteredBidders = useMemo(() => {
    return MOCK_BIDDERS.filter((b) => {
      const matchesSearch =
        search === '' ||
        b.legalName.toLowerCase().includes(search.toLowerCase()) ||
        b.code.toLowerCase().includes(search.toLowerCase()) ||
        b.pan.toLowerCase().includes(search.toLowerCase()) ||
        b.gstin.toLowerCase().includes(search.toLowerCase());

      const matchesCompliance =
        complianceFilter === 'ALL' || b.complianceStatus === complianceFilter;

      return matchesSearch && matchesCompliance;
    });
  }, [search, complianceFilter]);

  return (
    <div className="flex flex-col w-full space-y-4 text-slate-800 text-xs">
      {/* Header Area */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bidder Evaluation & Scrutiny</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[11px] font-semibold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              ACTIVE TENDER COCKPIT
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-slate-500">
            <span>Tender:</span>
            <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {currentTender.refNo}
            </span>
            <span>•</span>
            <span className="font-medium text-slate-700 truncate max-w-sm">{currentTender.title}</span>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800">
            <span className="text-[11px] font-medium text-slate-500">Packets Ingested</span>
            <span className="font-mono text-sm font-bold text-slate-900">{filteredBidders.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-medium">Qualified</span>
            <span className="font-mono text-sm font-bold">2</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-900 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span className="text-[11px] font-medium">Non-Compliant</span>
            <span className="font-mono text-sm font-bold">2</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span className="text-[11px] font-medium">Under Scrutiny</span>
            <span className="font-mono text-sm font-bold">1</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bidders by legal name, ID, PAN, GSTIN..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value)}
            className="bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs border border-slate-200 cursor-pointer focus:outline-none hover:bg-slate-100"
          >
            <option value="ALL">All Compliance Statuses</option>
            <option value="PASS">Compliant (PASS)</option>
            <option value="FAIL">Non-Compliant (FAIL)</option>
          </select>

          <button
            onClick={() => onNavigate('matrix')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">fact_check</span>
            <span>Compliance Matrix</span>
          </button>

          <button
            onClick={() => onNavigate('vendor-graph')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">hub</span>
            <span>Collusion Graph</span>
          </button>

          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            <span>+ Ingest Bidder Packet</span>
          </button>
        </div>
      </div>

      {/* Panoramic Bidder Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-4">Bidder Packet</th>
                <th className="py-2.5 px-3">Statutory Registries</th>
                <th className="py-2.5 px-3 text-center">Compliance</th>
                <th className="py-2.5 px-3 text-center">Risk Gauge</th>
                <th className="py-2.5 px-3">Officer Decision</th>
                <th className="py-2.5 px-3">Red Flags</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[12px] text-slate-800">
              {filteredBidders.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onSelectBidder(b)}
                      className="font-semibold text-slate-900 hover:text-blue-600 text-left cursor-pointer block leading-tight"
                    >
                      {b.legalName}
                    </button>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {b.code} • {b.tradeName}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px]">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">PAN:</span>
                      <span className="text-slate-700 font-semibold">{b.pan}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <span>GST:</span>
                      <span>{b.gstin}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusChip status={b.complianceStatus} />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex justify-center">
                      <RiskGauge score={b.riskScore} size={32} strokeWidth={4} />
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <StatusChip status={b.officerDecision} />
                  </td>
                  <td className="py-3 px-3">
                    {b.findings.length > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold">
                        <span className="material-symbols-outlined text-[13px] text-rose-600">warning</span>
                        {b.findings.length} Active
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                        None
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectBidder(b)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Scrutiny Cockpit →
                      </button>
                      <button
                        onClick={() => onNavigate('evidence', { bidderId: b.id })}
                        className="p-1 hover:bg-slate-100 text-slate-500 rounded-md transition-colors"
                        title="Inspect Evidence"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                      </button>
                    </div>
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
