import React, { useState } from 'react';
import { Tender } from '../../mockData/tenders';
import { MOCK_BIDDERS } from '../../mockData/bidders';

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
  const [activeTab, setActiveTab] = useState<'bidders' | 'matrix' | 'timeline'>('bidders');
  const bidders = MOCK_BIDDERS.filter((b) => b.tenderId === tender.id || tender.id.includes('PUMP'));

  return (
    <div className="flex flex-col w-full gap-5 text-slate-800 text-xs">
      {/* Top Hero & Breadcrumb Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1 text-slate-500">
            <button
              onClick={() => onNavigate('tenders')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Tenders
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-slate-600 font-medium">{tender.organization} Refineries</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-mono text-blue-600 font-semibold">{tender.refNo}</span>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap mt-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{tender.title}</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 rounded-full border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="font-mono text-[10px] text-slate-700 uppercase font-semibold">
                Global Tender ID: GEM/2026/B/892110
              </span>
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">{tender.description}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">print</span>
            <span>Print Summary</span>
          </button>
          <button
            onClick={onDownloadDossier}
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">download</span>
            <span>Export Dossier</span>
          </button>
          <button
            onClick={() => onNavigate('bidders', { tenderId: tender.id })}
            className="h-8 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">groups</span>
            <span>Review Bidders</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* 5 Horizontal Metric Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Estimated Value</span>
            <span className="p-1 rounded bg-blue-50 text-blue-600 material-symbols-outlined text-[16px]">payments</span>
          </div>
          <div className="my-1">
            <div className="text-xl font-bold font-mono text-slate-900">{tender.estimatedValue}</div>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-emerald-600">verified</span>
            <span>Sanctioned Capex (FY 25-26)</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Procurement Scope</span>
            <span className="p-1 rounded bg-blue-50 text-blue-600 material-symbols-outlined text-[16px]">
              precision_manufacturing
            </span>
          </div>
          <div className="my-1">
            <div className="text-xl font-bold text-slate-900">12 Units</div>
          </div>
          <div className="text-[11px] text-slate-500 truncate">Heavy Duty Process (BB2/OH2)</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Submitted Bids</span>
            <span className="p-1 rounded bg-blue-50 text-blue-600 material-symbols-outlined text-[16px]">
              inventory_2
            </span>
          </div>
          <div className="my-1">
            <div className="text-xl font-bold text-slate-900">{tender.bidderCount} Bidders</div>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>All EMD & Bonds Verified</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Evaluation Matrix
            </span>
            <span className="p-1 rounded bg-blue-50 text-blue-600 material-symbols-outlined text-[16px]">
              checklist_rtl
            </span>
          </div>
          <div className="my-1">
            <div className="text-xl font-bold text-slate-900">34 Criteria</div>
          </div>
          <div className="text-[11px] text-slate-500 truncate">26 Technical • 8 Commercial</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Current Stage</span>
            <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              IN SCRUTINY
            </span>
          </div>
          <div className="my-1">
            <div className="text-sm font-bold text-amber-900 truncate">{tender.stage}</div>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Closes in 4d 18h</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 px-4 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('bidders')}
              className={`py-3 px-3 font-semibold text-xs border-b-2 transition-colors cursor-pointer ${
                activeTab === 'bidders'
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Submitted Bidders ({bidders.length})
            </button>
            <button
              onClick={() => onNavigate('matrix', { tenderId: tender.id })}
              className="py-3 px-3 font-medium text-xs text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Compliance Matrix (34)</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </button>
            <button
              onClick={() => onNavigate('pipeline', { tenderId: tender.id })}
              className="py-3 px-3 font-medium text-xs text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Forensic Pipeline (11 Steps)</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </button>
            <button
              onClick={() => onNavigate('vendor-graph')}
              className="py-3 px-3 font-medium text-xs text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Collusion Radial Graph</span>
              <span className="material-symbols-outlined text-[14px]">hub</span>
            </button>
            <button
              onClick={() => onNavigate('audit-ledger')}
              className="py-3 px-3 font-medium text-xs text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Audit Trail (144 Blocks)</span>
              <span className="material-symbols-outlined text-[14px]">receipt_long</span>
            </button>
          </div>
        </div>

        {/* Tab Content: Bidders List */}
        <div className="p-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-4">Bidder Packet</th>
                <th className="py-2.5 px-3 text-center">PAN / GSTIN</th>
                <th className="py-2.5 px-3 text-center">Compliance Verdict</th>
                <th className="py-2.5 px-3 text-center">Composite Risk</th>
                <th className="py-2.5 px-3">Officer Adjudication</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[12px]">
              {bidders.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{b.legalName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {b.code} • {b.cin}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-[11px]">
                    <div>{b.pan}</div>
                    <div className="text-slate-400 text-[10px]">{b.gstin}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.complianceStatus === 'PASS'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {b.complianceStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold">
                    <span
                      className={
                        b.riskScore >= 60 ? 'text-rose-600' : b.riskScore >= 30 ? 'text-amber-600' : 'text-emerald-600'
                      }
                    >
                      {b.riskScore}/100
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        b.officerDecision === 'OVERRIDE'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : b.officerDecision === 'QUALIFY'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : b.officerDecision === 'REJECT'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {b.officerDecision}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => onNavigate('scrutiny', { bidderId: b.id })}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md font-semibold text-xs hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Open Cockpit →
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
