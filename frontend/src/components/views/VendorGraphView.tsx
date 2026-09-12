import React, { useState } from 'react';
import { MOCK_GRAPH_NODES, GraphNode } from '../../mockData/networkGraph';

interface VendorGraphViewProps {
  onNavigate: (view: string, params?: any) => void;
}

export const VendorGraphView: React.FC<VendorGraphViewProps> = ({ onNavigate }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode>(
    MOCK_GRAPH_NODES.find((n) => n.id === 'dir_1') || MOCK_GRAPH_NODES[0]
  );

  return (
    <div className="flex flex-col w-full space-y-4 text-slate-800 text-xs">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('scrutiny')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Back"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div className="h-5 w-px bg-slate-200"></div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Vendor Collusion & Cartelization Topology
              </h1>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                1 HIGH-SEVERITY CLUSTER
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Radial entity relationship graph across participating bidders in Tender{' '}
              <strong className="text-slate-700">CPCL/MM/2026/PUMP-217</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('scrutiny', { bidderId: 'BID-HYD-0419' })}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Bidder Cockpit</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Main Canvas + Side Drawer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Graph Viewport (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col items-center justify-center min-h-[540px] relative overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
          {/* SVG Canvas for Links */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Draw sample edges */}
            <line x1="50%" y1="50%" x2="25%" y2="30%" stroke="#2563eb" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="50%" y1="50%" x2="75%" y2="30%" stroke="#dc2626" strokeWidth="2.5" />
            <line x1="50%" y1="50%" x2="25%" y2="70%" stroke="#2563eb" strokeWidth="2" />
            <line x1="50%" y1="50%" x2="75%" y2="70%" stroke="#dc2626" strokeWidth="2.5" />
            <line x1="75%" y1="30%" x2="75%" y2="70%" stroke="#dc2626" strokeWidth="3" strokeDasharray="6 4" />
          </svg>

          {/* Center Hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-24 h-24 rounded-full bg-blue-50 border-2 border-blue-600 shadow-lg flex flex-col items-center justify-center text-center p-2 text-blue-900">
              <span className="material-symbols-outlined text-[20px] text-blue-600">hub</span>
              <span className="font-bold text-[10px] leading-tight mt-0.5">CPCL Tender PUMP-217</span>
            </div>
          </div>

          {/* Node: Bidder A (Top Left) */}
          <div
            onClick={() => setSelectedNode(MOCK_GRAPH_NODES.find((n) => n.id === 'bidder_meridian')!)}
            className="absolute top-[22%] left-[18%] -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
          >
            <div className="p-3 bg-white border border-slate-300 group-hover:border-blue-600 rounded-xl shadow-md text-center w-36 transition-all hover:scale-105">
              <div className="w-7 h-7 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-700 mb-1">
                <span className="material-symbols-outlined text-[16px]">corporate_fare</span>
              </div>
              <div className="font-bold text-[11px] text-slate-900 leading-tight">Meridian Flow</div>
              <div className="text-[9px] font-mono text-slate-400 mt-0.5">BID-MER-0102</div>
            </div>
          </div>

          {/* Node: Bidder C (Top Right) - Flagged Cluster */}
          <div
            onClick={() => setSelectedNode(MOCK_GRAPH_NODES.find((n) => n.id === 'bidder_hydrotech')!)}
            className="absolute top-[22%] left-[78%] -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
          >
            <div className="p-3 bg-white border-2 border-rose-500 rounded-xl shadow-lg text-center w-40 transition-all hover:scale-105 ring-4 ring-rose-500/10">
              <div className="w-7 h-7 mx-auto rounded-full bg-rose-100 flex items-center justify-center text-rose-700 mb-1">
                <span className="material-symbols-outlined text-[16px]">warning</span>
              </div>
              <div className="font-bold text-[11px] text-slate-900 leading-tight">Bharat Hydrotech</div>
              <div className="text-[9px] font-mono text-rose-600 font-bold mt-0.5">BID-HYD-0419 (65 pts)</div>
            </div>
          </div>

          {/* Node: Bidder D (Bottom Right) - Colluding Node */}
          <div
            onClick={() => setSelectedNode(MOCK_GRAPH_NODES.find((n) => n.id === 'bidder_nova')!)}
            className="absolute top-[75%] left-[78%] -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
          >
            <div className="p-3 bg-white border-2 border-rose-500 rounded-xl shadow-lg text-center w-40 transition-all hover:scale-105 ring-4 ring-rose-500/10">
              <div className="w-7 h-7 mx-auto rounded-full bg-rose-100 flex items-center justify-center text-rose-700 mb-1">
                <span className="material-symbols-outlined text-[16px]">warning</span>
              </div>
              <div className="font-bold text-[11px] text-slate-900 leading-tight">Nova Pumps</div>
              <div className="text-[9px] font-mono text-rose-600 font-bold mt-0.5">BID-NOV-0551 (72 pts)</div>
            </div>
          </div>

          {/* Shared DIN Node (Mid Right Edge) */}
          <div
            onClick={() => setSelectedNode(MOCK_GRAPH_NODES.find((n) => n.id === 'dir_1')!)}
            className="absolute top-[48%] left-[86%] -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer group"
          >
            <div className="px-2.5 py-1.5 bg-rose-600 text-white rounded-lg shadow-md font-mono text-[10px] font-bold flex items-center gap-1.5 hover:scale-105 transition-transform animate-pulse">
              <span className="material-symbols-outlined text-[14px]">person</span>
              <span>DIN: 08492019</span>
            </div>
          </div>

          {/* Node: Bidder B (Bottom Left) */}
          <div
            onClick={() => setSelectedNode(MOCK_GRAPH_NODES.find((n) => n.id === 'bidder_kaveri')!)}
            className="absolute top-[75%] left-[18%] -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
          >
            <div className="p-3 bg-white border border-slate-300 group-hover:border-blue-600 rounded-xl shadow-md text-center w-36 transition-all hover:scale-105">
              <div className="w-7 h-7 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-700 mb-1">
                <span className="material-symbols-outlined text-[16px]">corporate_fare</span>
              </div>
              <div className="font-bold text-[11px] text-slate-900 leading-tight">Sri Kaveri Engg</div>
              <div className="text-[9px] font-mono text-slate-400 mt-0.5">BID-KAV-0284</div>
            </div>
          </div>
        </div>

        {/* Right Drawer / Inspector Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-rose-600">
                  Collusion Vector Inspector
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">{selectedNode.label}</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                {selectedNode.type}
              </span>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900">
                <div className="font-bold flex items-center gap-1.5 text-rose-800">
                  <span className="material-symbols-outlined text-[16px]">crisis_alert</span>
                  <span>Cross-Bidder Collusion Overlap</span>
                </div>
                <p className="text-[11px] text-rose-800 mt-1 leading-relaxed">
                  MCA21 master data confirms that Director <strong>Rajesh M. Patil (DIN 08492019)</strong> holds an
                  active directorship in both <strong>Bharat Hydrotech Corp</strong> and <strong>Nova Pumps</strong>,
                  violating Section 3(3) of Competition Act 2002 and CVC guidelines against proxy cartel bids.
                </p>
              </div>

              <div className="space-y-1 text-xs">
                <div className="text-[10px] uppercase font-bold text-slate-400">Statutory Mandate</div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 leading-relaxed text-[11px]">
                  <strong>GFR 2017 Rule 175(1)(i)(d):</strong> Participating bidders in a single tender packet must not
                  have direct common management, equity shareholding &gt;10%, or common directors without explicit prior
                  disclosure.
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 mt-4 space-y-2">
            <button
              onClick={() => onNavigate('scrutiny', { bidderId: 'BID-HYD-0419' })}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Inspect Bharat Hydrotech in Cockpit</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <button
              onClick={() => onNavigate('audit-ledger')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-2.5 px-4 rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View Collusion Audit Block</span>
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
