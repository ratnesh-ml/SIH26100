import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Share2,
  Users,
  Phone,
  Mail,
  MapPin,
  Landmark,
  User,
  Info,
  ExternalLink,
} from 'lucide-react';
import { fetchTenderGraph } from '../api/client';
import {
  BidderLinkGraphOut,
  GraphEdgeOut,
  GraphNodeOut,
  TenderSummary,
} from '../types';

interface CrossBidderGraphViewProps {
  tender: TenderSummary;
  onBack: () => void;
  onSelectBidder?: (bidderId: string) => void;
}

export const CrossBidderGraphView: React.FC<CrossBidderGraphViewProps> = ({
  tender,
  onBack,
  onSelectBidder,
}) => {
  const [graph, setGraph] = useState<BidderLinkGraphOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inspector selection
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdgeOut | null>(null);
  const [activeTab, setActiveTab] = useState<'pairs' | 'edges' | 'nodes'>('pairs');

  const loadGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTenderGraph(tender.id);
      setGraph(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve cross-bidder link graph.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [tender.id]);

  // Node lookup map
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNodeOut>();
    if (!graph?.nodes) return map;
    for (const n of graph.nodes) {
      map.set(n.id, n);
    }
    return map;
  }, [graph?.nodes]);

  // Selected Node Details
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodeMap.get(selectedNodeId) || null;
  }, [selectedNodeId, nodeMap]);

  // SVG Coordinates Computation for 2D Layout
  const layout = useMemo(() => {
    if (!graph?.nodes || graph.nodes.length === 0) return { nodes: [], width: 700, height: 450 };
    const width = 700;
    const height = 450;
    const centerX = width / 2;
    const centerY = height / 2;

    const bidderNodes = graph.nodes.filter(
      (n) => (n.type || n.node_type || '').toUpperCase() === 'BIDDER'
    );
    const attrNodes = graph.nodes.filter(
      (n) => (n.type || n.node_type || '').toUpperCase() !== 'BIDDER'
    );

    const positionedNodes: Array<{
      node: GraphNodeOut;
      x: number;
      y: number;
      isBidder: boolean;
    }> = [];

    // Outer circle for bidders
    const bidderRadius = Math.min(width, height) * 0.38;
    bidderNodes.forEach((node, idx) => {
      const angle = (2 * Math.PI * idx) / Math.max(1, bidderNodes.length) - Math.PI / 2;
      positionedNodes.push({
        node,
        x: centerX + bidderRadius * Math.cos(angle),
        y: centerY + bidderRadius * Math.sin(angle),
        isBidder: true,
      });
    });

    // Inner circle or center for shared attributes
    const attrRadius = Math.min(width, height) * 0.18;
    attrNodes.forEach((node, idx) => {
      const angle = (2 * Math.PI * idx) / Math.max(1, attrNodes.length) - Math.PI / 4;
      positionedNodes.push({
        node,
        x: centerX + attrRadius * Math.cos(angle),
        y: centerY + attrRadius * Math.sin(angle),
        isBidder: false,
      });
    });

    return { nodes: positionedNodes, width, height };
  }, [graph?.nodes]);

  const getNodeIcon = (type: string) => {
    const t = type.toUpperCase();
    switch (t) {
      case 'PHONE':
        return <Phone className="w-3 h-3 text-emerald-400" />;
      case 'EMAIL':
        return <Mail className="w-3 h-3 text-sky-400" />;
      case 'ADDRESS':
        return <MapPin className="w-3 h-3 text-amber-400" />;
      case 'BANK_ACCOUNT':
      case 'BANK':
        return <Landmark className="w-3 h-3 text-purple-400" />;
      case 'DIRECTOR':
        return <User className="w-3 h-3 text-pink-400" />;
      default:
        return <Users className="w-3 h-3 text-sky-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Cross-Bidder Collusion & Link Graph
              </h2>
              <span className="font-mono text-xs text-sky-400 px-2 py-0.5 bg-sky-950/80 border border-sky-800/80 rounded">
                {tender.nit_no}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{tender.title}</p>
          </div>
        </div>

        <button
          onClick={loadGraph}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Refresh Graph"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && (
        <div className="p-16 rounded-xl bg-slate-900/40 border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
          <span className="text-xs text-slate-400 font-medium">
            Computing cross-bidder entity and attribute links...
          </span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">Failed to render collusion graph</p>
            <p className="mt-0.5 text-rose-400">{error}</p>
            <button
              onClick={loadGraph}
              className="mt-2 px-3 py-1 bg-rose-900 text-rose-200 rounded font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && graph && (
        <div className="space-y-4">
          {/* Collusion Clusters & CVC Warning Alert Banner */}
          {graph.direct_bidder_links && graph.direct_bidder_links.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 flex items-start gap-3 text-xs text-rose-200 shadow-md">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-rose-100 uppercase tracking-wider text-[11px]">
                    CVC Related-Party Warning: Potential Collusion or Shared Infrastructure Detected
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-900/80 text-rose-200 border border-rose-700">
                    {graph.direct_bidder_links.length} Flagged Pair{graph.direct_bidder_links.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-rose-300 text-[11px] leading-relaxed">
                  Multiple bidders in this tender share common statutory attributes (e.g. identical contact phone numbers, common bank account details, shared registered premises, or identical PDF document creation metadata). CVC procurement guidelines advise independent scrutiny prior to financial bid opening.
                </p>
              </div>
            </div>
          )}

          {/* Graph KPI Summary Cards */}
          {(() => {
            const summary = graph.summary || {
              total_bidders: 0,
              linked_bidders_count: 0,
              collusion_clusters_count: 0,
              total_direct_links: 0,
              max_link_strength: 0,
            };
            return (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Total Bidders</span>
                  <span className="font-mono font-bold text-slate-200 text-sm">
                    {summary.total_bidders}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Linked Bidders</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {summary.linked_bidders_count}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Collusion Clusters</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    {summary.collusion_clusters_count}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Direct Links</span>
                  <span className="font-mono font-bold text-slate-200 text-sm">
                    {summary.total_direct_links}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Max Link Strength</span>
                  <span className="font-mono font-bold text-sky-400 text-sm">
                    {Math.round(summary.max_link_strength * 100)}%
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Interactive Graph Canvas & Inspector Grid */}
          <div className="grid grid-cols-12 gap-3 min-h-[460px]">
            {/* SVG Visual Graph Canvas */}
            <div className="col-span-12 lg:col-span-8 rounded-xl bg-slate-900/70 border border-slate-800 p-3 flex flex-col justify-between overflow-hidden shadow-lg">
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Entity Relationship Topology</span>
                </span>
                <span className="text-[10px] text-slate-500 italic">
                  Click any node or edge to inspect evidentiary relationships
                </span>
              </div>

              {/* Responsive SVG Canvas */}
              <div className="flex-1 bg-slate-950/80 rounded-lg border border-slate-800/80 flex items-center justify-center p-2 relative overflow-hidden">
                {layout.nodes.length > 0 ? (
                  <svg
                    viewBox={`0 0 ${layout.width} ${layout.height}`}
                    className="w-full h-full max-h-[420px]"
                  >
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="6"
                        markerHeight="4"
                        refX="14"
                        refY="2"
                        orient="auto"
                      >
                        <polygon points="0 0, 6 2, 0 4" fill="#64748b" />
                      </marker>
                    </defs>

                    {/* Edges */}
                    {graph.edges.map((edge, idx) => {
                      const src = layout.nodes.find((n) => n.node.id === edge.source);
                      const tgt = layout.nodes.find((n) => n.node.id === edge.target);
                      if (!src || !tgt) return null;

                      const isSelected = selectedEdge === edge;
                      const strokeColor = edge.strength >= 0.8 ? '#f43f5e' : '#f59e0b';

                      return (
                        <g
                          key={idx}
                          className="cursor-pointer group"
                          onClick={() => {
                            setSelectedEdge(edge);
                            setSelectedNodeId(null);
                          }}
                        >
                          <line
                            x1={src.x}
                            y1={src.y}
                            x2={tgt.x}
                            y2={tgt.y}
                            stroke={isSelected ? '#38bdf8' : strokeColor}
                            strokeWidth={isSelected ? 3.5 : Math.max(1.5, edge.strength * 2.5)}
                            strokeDasharray={edge.edge_type === 'DIRECT_BIDDER' ? '4 2' : 'none'}
                            strokeOpacity={isSelected ? 1 : 0.65}
                          />
                        </g>
                      );
                    })}

                    {/* Nodes */}
                    {layout.nodes.map((item) => {
                      const isSelected = selectedNodeId === item.node.id;
                      const isBidder = item.isBidder;
                      const radius = isBidder ? 20 : 13;

                      return (
                        <g
                          key={item.node.id}
                          className="cursor-pointer group"
                          transform={`translate(${item.x}, ${item.y})`}
                          onClick={() => {
                            setSelectedNodeId(item.node.id);
                            setSelectedEdge(null);
                          }}
                        >
                          <circle
                            r={radius}
                            fill={
                              isBidder
                                ? isSelected
                                  ? '#0284c7'
                                  : '#0f172a'
                                : isSelected
                                ? '#38bdf8'
                                : '#1e293b'
                            }
                            stroke={
                              isSelected
                                ? '#38bdf8'
                                : isBidder
                                ? '#38bdf8'
                                : '#64748b'
                            }
                            strokeWidth={isSelected ? 3 : 1.5}
                            className="transition-transform group-hover:scale-110"
                          />

                          {/* Node Label Text */}
                          <text
                            y={radius + 12}
                            textAnchor="middle"
                            className="text-[9px] font-sans font-medium fill-slate-300 pointer-events-none select-none"
                          >
                            {item.node.label.length > 18
                              ? `${item.node.label.slice(0, 16)}…`
                              : item.node.label}
                          </text>

                          {/* Type Pill */}
                          <text
                            y={-radius - 4}
                            textAnchor="middle"
                            className="text-[8px] font-mono fill-slate-500 uppercase pointer-events-none select-none"
                          >
                            {item.node.type || item.node.node_type}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
                    No cross-bidder links or shared attributes found in this tender.
                  </div>
                )}
              </div>

              {/* Legend Bar */}
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 px-1">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                    <span>Bidder Node</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
                    <span>Shared Attribute Node</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-rose-500 inline-block" />
                    <span>High-Strength Link (&ge;80%)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Inspector Sidebar */}
            <div className="col-span-12 lg:col-span-4 rounded-xl bg-slate-900/70 border border-slate-800 p-3 flex flex-col justify-between overflow-hidden shadow-lg text-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-sky-400" />
                    <span>Inspector Panel</span>
                  </span>
                  {(selectedNode || selectedEdge) && (
                    <button
                      onClick={() => {
                        setSelectedNodeId(null);
                        setSelectedEdge(null);
                      }}
                      className="text-[10px] text-slate-500 hover:text-slate-300"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Node Inspector */}
                {selectedNode && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-sky-400 uppercase font-bold">
                        {selectedNode.type || selectedNode.node_type} Node
                      </span>
                      {getNodeIcon(selectedNode.type || selectedNode.node_type || '')}
                    </div>

                    <h4 className="font-bold text-sm text-white">{selectedNode.label}</h4>

                    {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
                      <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[10px] font-mono space-y-1">
                        <span className="text-slate-500 block uppercase">Properties:</span>
                        <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(selectedNode.properties, null, 2)}
                        </pre>
                      </div>
                    )}

                    {(selectedNode.type || selectedNode.node_type || '').toUpperCase() === 'BIDDER' &&
                      onSelectBidder && (
                        <button
                          onClick={() => onSelectBidder(selectedNode.id)}
                          className="w-full py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <span>Open Bidder Cockpit</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                  </div>
                )}

                {/* Edge Inspector */}
                {selectedEdge && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-amber-400 uppercase font-bold">
                        Relationship Edge
                      </span>
                      <span className="font-mono font-bold text-sky-400 text-xs">
                        {Math.round(selectedEdge.strength * 100)}% Strength
                      </span>
                    </div>

                    <p className="font-semibold text-xs text-slate-200">{selectedEdge.reason}</p>

                    <div className="text-[10px] font-mono text-slate-400 space-y-1">
                      <div>
                        Source: <span className="text-slate-200">{selectedEdge.source}</span>
                      </div>
                      <div>
                        Target: <span className="text-slate-200">{selectedEdge.target}</span>
                      </div>
                    </div>

                    {selectedEdge.evidence && Object.keys(selectedEdge.evidence).length > 0 && (
                      <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[10px] font-mono space-y-1">
                        <span className="text-slate-500 block uppercase">Evidence Details:</span>
                        <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(selectedEdge.evidence, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {!selectedNode && !selectedEdge && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Click any node or link in the topology canvas to inspect forensic properties and evidence.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Data Tables (Pairs / Edges / Nodes) */}
          <div className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden shadow-lg">
            <div className="p-2.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('pairs')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    activeTab === 'pairs'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Collusion Pairs ({graph.direct_bidder_links?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('edges')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    activeTab === 'edges'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Edges ({graph.edges.length})
                </button>
                <button
                  onClick={() => setActiveTab('nodes')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    activeTab === 'nodes'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Nodes ({graph.nodes.length})
                </button>
              </div>
            </div>

            {/* Tab 1: Collusion Pairs */}
            {activeTab === 'pairs' && (
              <div className="divide-y divide-slate-800">
                {graph.direct_bidder_links && graph.direct_bidder_links.length > 0 ? (
                  graph.direct_bidder_links.map((link, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-800/30 transition-colors space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 font-bold text-slate-200">
                          <span>{link.source_bidder_name}</span>
                          <span className="text-slate-500 font-mono">↔</span>
                          <span>{link.target_bidder_name}</span>
                        </div>
                        <span className="font-mono font-bold text-rose-400 text-xs">
                          {Math.round(link.strength * 100)}% Link
                        </span>
                      </div>

                      <p className="text-slate-300 text-xs">{link.reason}</p>

                      {link.evidence && (
                        <div className="text-[10px] font-mono text-slate-400 bg-slate-950 p-1.5 rounded border border-slate-800">
                          {JSON.stringify(link.evidence)}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No direct bidder-to-bidder collusion links identified.
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: All Edges */}
            {activeTab === 'edges' && (
              <div className="divide-y divide-slate-800">
                {graph.edges.map((e, idx) => (
                  <div key={idx} className="p-3 hover:bg-slate-800/30 transition-colors flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-mono text-[11px] text-sky-400">
                        {e.source} → {e.target}
                      </div>
                      <p className="text-slate-200 text-xs">{e.reason}</p>
                    </div>
                    <span className="font-mono font-bold text-amber-400 text-xs shrink-0">
                      {Math.round(e.strength * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: All Nodes */}
            {activeTab === 'nodes' && (
              <div className="divide-y divide-slate-800">
                {graph.nodes.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-800/30 transition-colors flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {getNodeIcon(n.type || n.node_type || '')}
                      <span className="font-medium text-slate-200">{n.label}</span>
                    </div>
                    <span className="font-mono text-[10px] uppercase text-slate-500">
                      {n.type || n.node_type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
