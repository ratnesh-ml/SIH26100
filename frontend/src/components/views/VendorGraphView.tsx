import React, { useState } from 'react';
import { MOCK_GRAPH_NODES, GraphNode } from '../../mockData/networkGraph';

interface VendorGraphViewProps {
  onNavigate: (view: string, params?: any) => void;
}

export const VendorGraphView: React.FC<VendorGraphViewProps> = ({ onNavigate }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode>(
    MOCK_GRAPH_NODES.find((n) => n.id === 'bidder_hydrotech') || MOCK_GRAPH_NODES[0]
  );
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeLayer, setActiveLayer] = useState<'all' | 'collusion' | 'corporate'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleExportDossier = () => {
    setToastMsg('Exporting Radial Entity Relationship & Collusion Forensic Dossier...');
    setTimeout(() => {
      onNavigate('dossier');
    }, 800);
  };

  const handleGenerateNotice = () => {
    setToastMsg('Generating Statutory Cartel Adjudication Notice (Competition Act Sec 3)...');
    setTimeout(() => {
      onNavigate('scrutiny', { bidderId: 'BID-HYD-0419' });
    }, 900);
  };

  return (
    <div className="flex flex-col w-full space-y-4 text-slate-800 text-xs">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-md flex items-center justify-between border border-blue-500">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
            <span className="text-xs font-semibold">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
            <button onClick={() => onNavigate('tenders')} className="hover:text-slate-600 cursor-pointer">
              Tenders
            </button>
            <span>/</span>
            <span className="font-mono text-slate-600">CPCL/MM/2026/PUMP-217</span>
            <span>/</span>
            <span>Intelligence Suite</span>
            <span>/</span>
            <span className="text-blue-600 font-semibold">Vendor Trust Graph</span>
          </nav>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Investigation Cockpit &amp; Radial Topology
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              Radial Cluster Matrix
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
              Forensic Scan: 100% Complete
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportDossier}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-300 rounded-lg shadow-2xs transition-colors text-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">download</span>
            <span>Export Forensic Dossier</span>
          </button>
          <button
            onClick={() => setActiveLayer((l) => (l === 'all' ? 'collusion' : 'all'))}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold border rounded-lg shadow-2xs transition-colors text-xs cursor-pointer ${
              activeLayer === 'collusion'
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">filter_alt</span>
            <span>{activeLayer === 'collusion' ? 'Collusion Isolated' : 'Graph Layers'}</span>
          </button>
          <button
            onClick={handleGenerateNotice}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition-colors text-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">gavel</span>
            <span>Generate Adjudication Notice</span>
          </button>
        </div>
      </div>

      {/* SEGMENTED RIBBON STATS BAR (4 Columns) */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Stat 1 */}
          <div className="p-3.5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-xl">account_balance</span>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tender Bidders</div>
              <div className="text-base font-bold text-slate-900">5 Evaluated</div>
              <p className="text-[10.5px] text-slate-500">4 Compliant • 1 Collusion Entity</p>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="p-3.5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-xl">bubble_chart</span>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Graph Nodes</div>
              <div className="text-base font-bold text-slate-900">28 Nodes Active</div>
              <p className="text-[10.5px] text-purple-700 font-medium">MCA-21, DIN, Subnets, GSTN</p>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="p-3.5 flex items-center gap-3.5 bg-amber-50/40">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-xl">sync_problem</span>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Collusion Nexus</div>
              <div className="text-base font-bold text-amber-700">1 Active Hub</div>
              <p className="text-[10.5px] text-amber-800 font-medium">Cluster γ-04: Bharat ↔ Zenith</p>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="p-3.5 flex items-center gap-3.5 bg-rose-50/40">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-xl">flag</span>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-rose-800 tracking-wider">Risk Edges</div>
              <div className="text-base font-bold text-rose-700">3 Flagged Vectors</div>
              <p className="text-[10.5px] text-rose-700 font-medium">CVC Scrutiny • GFR-144(i)</p>
            </div>
          </div>
        </div>
      </section>

      {/* GRAPH CANVAS & DETAILS DRAWER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Graph Viewport (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden min-h-[560px] relative">
          {/* Canvas Toolbar & Zoom */}
          <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 z-20">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-800">Topology Canvas</span>
              <span className="text-[10px] text-slate-400 font-mono">Radial Force Layout</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-slate-200 rounded-md bg-white text-xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 15, 60))}
                  className="px-2 py-0.5 hover:bg-slate-100 rounded-l cursor-pointer"
                >
                  -
                </button>
                <span className="px-2 py-0.5 font-mono text-[10.5px] border-x border-slate-200">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 15, 150))}
                  className="px-2 py-0.5 hover:bg-slate-100 rounded-r cursor-pointer"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => setZoomLevel(100)}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Interactive Topology Surface */}
          <div className="flex-1 relative flex items-center justify-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] p-8 overflow-hidden min-h-[500px]">
            {/* SVG Connecting Links */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Edges from Center Tender to Bidders */}
              <line x1="50%" y1="50%" x2="22%" y2="28%" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="22%" y2="72%" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="50%" y2="18%" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="78%" y2="28%" stroke="#e11d48" strokeWidth="2.5" />
              <line x1="50%" y1="50%" x2="78%" y2="72%" stroke="#e11d48" strokeWidth="2.5" />

              {/* Collusion Cross-Edge between Bharat Hydrotech & Zenith Infra */}
              <line
                x1="78%"
                y1="28%"
                x2="78%"
                y2="72%"
                stroke="#dc2626"
                strokeWidth="3.5"
                strokeDasharray="6 4"
                className="animate-pulse"
              />

              {/* Edge to Subnet Hub */}
              <line x1="78%" y1="28%" x2="92%" y2="50%" stroke="#d97706" strokeWidth="2" />
              <line x1="78%" y1="72%" x2="92%" y2="50%" stroke="#d97706" strokeWidth="2" />
            </svg>

            {/* Central Node: CPCL Tender */}
            <div
              style={{ transform: `scale(${zoomLevel / 100})` }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 transition-transform"
            >
              <div className="w-24 h-24 rounded-full bg-blue-50 border-2 border-blue-600 shadow-xl flex flex-col items-center justify-center text-center p-2 text-blue-900 cursor-pointer hover:scale-105 transition-all">
                <span className="material-symbols-outlined text-[22px] text-blue-600">account_balance</span>
                <span className="font-bold text-[10px] leading-tight mt-0.5">CPCL Tender PUMP-217</span>
                <span className="text-[8px] font-mono text-blue-600">₹18.40 Cr ICB</span>
              </div>
            </div>

            {/* Node 1: Meridian Flow Systems (Top Left) */}
            <div
              style={{ transform: `scale(${zoomLevel / 100})` }}
              onClick={() =>
                setSelectedNode(
                  MOCK_GRAPH_NODES.find((n) => n.id === 'b_mer') || MOCK_GRAPH_NODES[0]
                )
              }
              className="absolute top-[28%] left-[22%] -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all hover:scale-105"
            >
              <div className="p-3 bg-white border border-slate-200 hover:border-blue-500 rounded-xl shadow-sm text-center w-36">
                <div className="w-7 h-7 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                </div>
                <div className="font-bold text-[11px] text-slate-900 leading-tight">Meridian Flow</div>
                <div className="text-[9px] font-mono text-emerald-700 font-semibold mt-0.5">PASS (Risk 04)</div>
              </div>
            </div>

            {/* Node 2: Sri Kaveri Engineering Works (Bottom Left) */}
            <div
              style={{ transform: `scale(${zoomLevel / 100})` }}
              onClick={() =>
                setSelectedNode(
                  MOCK_GRAPH_NODES.find((n) => n.id === 'b_kav') || MOCK_GRAPH_NODES[0]
                )
              }
              className="absolute top-[72%] left-[22%] -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all hover:scale-105"
            >
              <div className="p-3 bg-white border border-slate-200 hover:border-blue-500 rounded-xl shadow-sm text-center w-36">
                <div className="w-7 h-7 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                </div>
                <div className="font-bold text-[11px] text-slate-900 leading-tight">Sri Kaveri Eng.</div>
                <div className="text-[9px] font-mono text-emerald-700 font-semibold mt-0.5">PASS (Risk 12)</div>
              </div>
            </div>

            {/* Node 3: Nova Pumps & Systems (Top Center) */}
            <div
              style={{ transform: `scale(${zoomLevel / 100})` }}
              onClick={() =>
                setSelectedNode(
                  MOCK_GRAPH_NODES.find((n) => n.id === 'b_nov') || MOCK_GRAPH_NODES[0]
                )
              }
              className="absolute top-[18%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all hover:scale-105"
            >
              <div className="p-3 bg-white border border-slate-200 hover:border-amber-500 rounded-xl shadow-sm text-center w-36">
                <div className="w-7 h-7 mx-auto rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mb-1">
                  <span className="material-symbols-outlined text-[16px]">help_outline</span>
                </div>
                <div className="font-bold text-[11px] text-slate-900 leading-tight">Nova Pumps</div>
                <div className="text-[9px] font-mono text-amber-700 font-semibold mt-0.5">REVIEW (Risk 42)</div>
              </div>
            </div>

            {/* Node 4: Bharat Hydrotech Corp (Top Right - Flagged Nexus) */}
            <div
              style={{ transform: `scale(${zoomLevel / 100})` }}
              onClick={() =>
                setSelectedNode(
                  MOCK_GRAPH_NODES.find((n) => n.id === 'b_hyd') || MOCK_GRAPH_NODES[0]
                )
              }
              className="absolute top-[28%] left-[78%] -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all hover:scale-105"
            >
              <div className="p-3 bg-white border-2 border-rose-500 rounded-xl shadow-lg text-center w-40 ring-4 ring-rose-500/10">
                <div className="w-7 h-7 mx-auto rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-1">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                </div>
                <div className="font-bold text-[11px] text-slate-900 leading-tight">Bharat Hydrotech</div>
                <div className="text-[9px] font-mono text-rose-600 font-bold mt-0.5">DISQUALIFIED (94)</div>
              </div>
            </div>

            {/* Node 5: Zenith Infra Tech (Bottom Right - Flagged Nexus) */}
            <div
              style={{ transform: `scale(${zoomLevel / 100})` }}
              onClick={() =>
                setSelectedNode(
                  MOCK_GRAPH_NODES.find((n) => n.id === 'b_zen') || MOCK_GRAPH_NODES[0]
                )
              }
              className="absolute top-[72%] left-[78%] -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all hover:scale-105"
            >
              <div className="p-3 bg-white border-2 border-rose-500 rounded-xl shadow-lg text-center w-40 ring-4 ring-rose-500/10">
                <div className="w-7 h-7 mx-auto rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-1">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                </div>
                <div className="font-bold text-[11px] text-slate-900 leading-tight">Zenith Infra Tech</div>
                <div className="text-[9px] font-mono text-rose-600 font-bold mt-0.5">FAIL (Risk 86)</div>
              </div>
            </div>

            {/* Node 6: Shared Subnet Cluster Hub (Far Right) */}
            <div
              style={{ transform: `scale(${zoomLevel / 100})` }}
              onClick={() =>
                setSelectedNode(
                  MOCK_GRAPH_NODES.find((n) => n.id === 'ip_subnet') || MOCK_GRAPH_NODES[0]
                )
              }
              className="absolute top-[50%] left-[92%] -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all hover:scale-105"
            >
              <div className="p-2 bg-amber-50 border border-amber-300 rounded-lg shadow-md text-center w-32">
                <span className="material-symbols-outlined text-[16px] text-amber-700">wifi_tethering</span>
                <div className="font-bold text-[10px] text-amber-900 leading-tight mt-0.5">Shared Subnet</div>
                <div className="text-[8.5px] font-mono text-amber-800">103.21.58.114/29</div>
              </div>
            </div>
          </div>

          {/* Legend Bottom Bar */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-4">
              <span className="font-bold text-slate-800">Legend:</span>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Compliant Bidder</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Collusion Bidder</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-400"></span>
                <span>Shared Network / DIN</span>
              </div>
            </div>
            <div className="font-mono text-slate-400">Competition Act 2002 • Section 3(3) Cartel Rule</div>
          </div>
        </div>

        {/* RIGHT DRAWER: Node Details & Investigation Findings (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-4 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Inspected Node
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                    selectedNode.category === 'SUSPICIOUS'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {selectedNode.category === 'SUSPICIOUS' ? 'COLLUSION HUB' : 'VERIFIED'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">{selectedNode.label}</h3>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5 uppercase">
                Type: {selectedNode.type} {selectedNode.bidderCode ? `• ${selectedNode.bidderCode}` : ''}
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Node Category:</span>
                <span className="font-mono font-bold text-rose-600">{selectedNode.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Topology Coordinates:</span>
                <span className="font-mono font-semibold text-slate-800">
                  X: {selectedNode.x}, Y: {selectedNode.y}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs leading-relaxed text-slate-700">
              <div className="font-bold text-slate-900 mb-1">Forensic Finding:</div>
              {selectedNode.details || 'Entity relationship and cluster telemetry analyzed.'}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => onNavigate('scrutiny', { bidderId: 'BID-HYD-0419' })}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Open Bidder Scrutiny Cockpit</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
              <button
                onClick={() => onNavigate('evidence', { findingId: 'FND-2026-0089' })}
                className="w-full py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-[16px] text-slate-500">visibility</span>
                <span>Inspect Subnet Evidence</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
