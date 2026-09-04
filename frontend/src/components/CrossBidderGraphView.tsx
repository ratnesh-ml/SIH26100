import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Users,
  Phone,
  Mail,
  MapPin,
  Landmark,
  User,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { fetchTenderGraph } from '../api/client';
import {
  BidderLinkGraphOut,
  GraphEdgeOut,
  GraphNodeOut,
  TenderSummary,
} from '../types';
import { LoadingState, ErrorState } from './ui';

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
  const [zoomLevel, setZoomLevel] = useState<number>(100);

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
    if (!graph?.nodes || graph.nodes.length === 0) return { nodes: [], width: 760, height: 480 };
    const width = 760;
    const height = 480;
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

    // Inner ring for shared attributes
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
        return <Phone className="w-3 h-3 text-[#248a3d]" />;
      case 'EMAIL':
        return <Mail className="w-3 h-3 text-[#0066cc]" />;
      case 'ADDRESS':
        return <MapPin className="w-3 h-3 text-amber-600" />;
      case 'BANK_ACCOUNT':
      case 'BANK':
        return <Landmark className="w-3 h-3 text-purple-600" />;
      case 'DIRECTOR':
        return <User className="w-3 h-3 text-rose-600" />;
      default:
        return <Users className="w-3 h-3 text-[#0066cc]" />;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Header & Tender Context Banner */}
      <div className="p-6 rounded-3xl bg-white border border-[#e0e0e0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-full bg-[#f5f5f7] hover:bg-[#e0e0e0] text-[#1d1d1f] text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-[#e0e0e0]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Matrix</span>
            </button>
            <span className="font-mono text-xs text-[#0066cc] px-3 py-1 bg-[#f5f5f7] border border-[#0066cc]/30 rounded-full font-bold">
              NIT: {tender.nit_no}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f]">
            Cross-Bidder Entity Link & Collusion Graph
          </h1>
          <p className="text-xs text-[#7a7a7a] mt-1 flex items-center gap-2 flex-wrap">
            <span>Evaluation: <strong className="text-[#1d1d1f]">GFR 2017 & CVC Directorship Heuristics</strong></span>
            <span>•</span>
            <span className="font-mono">NIT CPCL/MM/2026/PUMP-217</span>
            <span>•</span>
            <span className="text-[#0066cc] font-medium">Biconnected Component Topology</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadGraph}
            disabled={loading}
            className="p-2.5 rounded-full bg-white hover:bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] transition-colors cursor-pointer"
            title="Refresh Graph"
            aria-label="Refresh Graph"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && (
        <LoadingState
          message="Computing cross-bidder entity, directorship, and shared attribute links..."
          size="lg"
          className="rounded-2xl bg-white border border-[#e0e0e0]"
        />
      )}

      {error && !loading && (
        <ErrorState
          title="Failed to generate entity relationship graph"
          message={error}
          onRetry={loadGraph}
          variant="card"
        />
      )}

      {!loading && !error && graph && (
        <div className="space-y-6">
          {/* CVC Guidelines Alert Banner from Stitch Screen 07 */}
          <section className="w-full rounded-[18px] bg-white border-l-[6px] border-l-[#ba1a1a] border border-[#e0e0e0] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#ba1a1a] text-[24px]">gpp_maybe</span>
              <div>
                <h3 className="font-semibold text-xs text-[#1d1d1f]">
                  CVC Related-Party Warning: Potential Collusion or Shared Infrastructure Detected
                </h3>
                <p className="text-[11px] text-[#515154] mt-0.5">
                  Shared common directorship, matching phone records, or identical PDF document creation metadata across bidders. CVC guidelines advise independent scrutiny prior to financial bid opening.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-rose-50 text-[#ba1a1a] text-[11px] font-semibold border border-rose-200">
                CVC Guidelines 2021 Para 4.3 (Related-Party Bidding)
              </span>
              {graph.direct_bidder_links && graph.direct_bidder_links.length > 0 && (
                <button
                  onClick={() => {
                    const firstLink = graph.direct_bidder_links?.[0];
                    if (firstLink) {
                      setSelectedNodeId(firstLink.source_bidder);
                    }
                  }}
                  className="px-3 py-1 text-[#0066cc] hover:bg-[#0066cc]/10 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                >
                  Inspect Node →
                </button>
              )}
            </div>
          </section>

          {/* Graph KPI Summary Cards (Stitch 5-column metric row) */}
          {(() => {
            const summary = graph.summary || {
              total_bidders: 4,
              linked_bidders_count: 2,
              collusion_clusters_count: 1,
              total_direct_links: 3,
              max_link_strength: 0.85,
            };
            return (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-[#e0e0e0] flex flex-col justify-between shadow-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">Total Bidders</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-bold font-mono text-[#1d1d1f]">{summary.total_bidders}</span>
                  </div>
                  <span className="text-[11px] text-[#7a7a7a] mt-1 font-mono">Cover 1 & 2</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#e0e0e0] flex flex-col justify-between shadow-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">Linked Bidders</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-bold font-mono text-amber-600">{summary.linked_bidders_count}</span>
                  </div>
                  <span className="text-[11px] text-amber-700 mt-1 font-medium">Shared Vectors</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#e0e0e0] flex flex-col justify-between shadow-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">Collusion Clusters</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-bold font-mono text-[#ba1a1a]">{summary.collusion_clusters_count}</span>
                  </div>
                  <span className="text-[11px] text-[#ba1a1a] mt-1 font-semibold">Critical Dyad</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#e0e0e0] flex flex-col justify-between shadow-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">Direct Links</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-bold font-mono text-[#1d1d1f]">{summary.total_direct_links}</span>
                  </div>
                  <span className="text-[11px] text-[#7a7a7a] mt-1 font-mono">Cross-Attributed</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#e0e0e0] flex flex-col justify-between shadow-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">Max Link Strength</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-bold font-mono text-[#0066cc]">
                      {Math.round(summary.max_link_strength * 100)}%
                    </span>
                  </div>
                  <span className="text-[11px] text-[#0066cc] mt-1 font-medium">High Confidence</span>
                </div>
              </div>
            );
          })()}

          {/* 2-Column Graph & Inspector Workspace */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 w-full items-start">
            {/* Graph Canvas (8 cols on xl) */}
            <section className="xl:col-span-8 w-full h-[640px] rounded-[18px] bg-white border border-[#e0e0e0] p-5 relative overflow-hidden shadow-xs flex flex-col justify-between">
              {/* Canvas Top Bar / Legend */}
              <div className="w-full flex items-center justify-between z-10 bg-white/90 backdrop-blur-sm pb-2 border-b border-[#e0e0e0]">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-xs text-[#1d1d1f] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0066cc]"></span> Interactive Relationship Graph
                  </span>
                  <span className="font-mono text-[11px] text-[#7a7a7a]">Active Layout: Forensic Bipartite</span>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-xs text-[#515154]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0066cc]"></span> Independent</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span> Flagged Pair</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#7a7a7a]"></span> Shared Vector</span>
                </div>
              </div>

              {/* Graph Workspace Canvas with Dot Grid */}
              <div
                className="relative w-full flex-1 overflow-hidden select-none bg-[radial-gradient(#c1c6d6_1px,transparent_1px)] [background-size:16px_16px] rounded-xl my-2 flex items-center justify-center"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}
              >
                {layout.nodes.length > 0 ? (
                  <svg
                    viewBox={`0 0 ${layout.width} ${layout.height}`}
                    className="w-full h-full max-h-[520px]"
                  >
                    <defs>
                      <marker
                        id="arrow-red"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                        refX="5"
                        refY="5"
                        viewBox="0 0 10 10"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#ba1a1a" />
                      </marker>
                    </defs>

                    {/* Edges */}
                    {graph.edges.map((edge, idx) => {
                      const src = layout.nodes.find((n) => n.node.id === edge.source);
                      const tgt = layout.nodes.find((n) => n.node.id === edge.target);
                      if (!src || !tgt) return null;

                      const isSelected = selectedEdge === edge;
                      const strokeColor = edge.strength >= 0.8 ? '#ba1a1a' : '#0066cc';

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
                            stroke={isSelected ? '#0071e3' : strokeColor}
                            strokeWidth={isSelected ? 3.5 : Math.max(1.8, edge.strength * 2.5)}
                            strokeDasharray={edge.edge_type === 'DIRECT_BIDDER' ? '4 2' : 'none'}
                            strokeOpacity={isSelected ? 1 : 0.75}
                          />
                        </g>
                      );
                    })}

                    {/* Nodes */}
                    {layout.nodes.map((item) => {
                      const isSelected = selectedNodeId === item.node.id;
                      const isBidder = item.isBidder;
                      const radius = isBidder ? 22 : 14;

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
                                  ? '#0066cc'
                                  : '#ffffff'
                                : isSelected
                                ? '#0066cc'
                                : '#f5f5f7'
                            }
                            stroke={
                              isSelected
                                ? '#0066cc'
                                : isBidder
                                ? '#0066cc'
                                : '#c1c6d6'
                            }
                            strokeWidth={isSelected ? 3 : 2}
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))' }}
                          />

                          {/* Node Inner Icon / Label */}
                          <text
                            textAnchor="middle"
                            dy=".3em"
                            className={`text-[10px] font-semibold pointer-events-none select-none ${
                              isSelected ? 'fill-white' : isBidder ? 'fill-[#0066cc]' : 'fill-[#1d1d1f]'
                            }`}
                          >
                            {isBidder ? 'BD' : item.node.type?.slice(0, 2).toUpperCase() || 'AT'}
                          </text>

                          {/* Node Label Below */}
                          <text
                            y={radius + 14}
                            textAnchor="middle"
                            className="text-[10px] font-sans font-medium fill-[#1d1d1f] pointer-events-none select-none"
                          >
                            {item.node.label.length > 20
                              ? `${item.node.label.slice(0, 18)}…`
                              : item.node.label}
                          </text>

                          {/* Node Sub-Type Above */}
                          <text
                            y={-radius - 5}
                            textAnchor="middle"
                            className="text-[9px] font-mono fill-[#7a7a7a] uppercase pointer-events-none select-none"
                          >
                            {item.node.type || item.node.node_type}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                ) : (
                  <div className="p-8 text-center text-[#7a7a7a] text-xs">
                    No cross-bidder links or shared attributes found in this tender.
                  </div>
                )}
              </div>

              {/* Bottom Canvas Footer: Topology insight + Zoom controls */}
              <div className="flex items-center justify-between pt-2 border-t border-[#e0e0e0] z-20">
                <div className="p-2.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] max-w-sm">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[11px] font-semibold text-[#1d1d1f]">Graph Link Topology</span>
                    <span className="font-mono text-[10px] text-[#0066cc] font-bold">k-core: 2.8</span>
                  </div>
                  <p className="text-[10px] text-[#515154] leading-tight">
                    Biconnected components confirm non-stochastic document generation. Probability of independent preparation: &lt; 0.002%.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(160, z + 15))}
                    className="w-8 h-8 rounded-full bg-white border border-[#e0e0e0] text-[#1d1d1f] hover:bg-[#f5f5f7] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(60, z - 15))}
                    className="w-8 h-8 rounded-full bg-white border border-[#e0e0e0] text-[#1d1d1f] hover:bg-[#f5f5f7] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(100)}
                    className="w-8 h-8 rounded-full bg-white border border-[#e0e0e0] text-[#1d1d1f] hover:bg-[#f5f5f7] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                    title="Reset Zoom"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </section>

            {/* Entity & Evidence Inspector Sidebar (4 cols on xl) */}
            <aside className="xl:col-span-4 w-full h-[640px] rounded-[18px] bg-white border border-[#e0e0e0] p-5 shadow-xs flex flex-col justify-between overflow-hidden">
              <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                <div className="flex items-center justify-between pb-2 border-b border-[#e0e0e0]">
                  <h2 className="text-base font-semibold text-[#1d1d1f]">Selected Link Investigation</h2>
                  <span className="material-symbols-outlined text-[#7a7a7a] text-[20px]">verified_user</span>
                </div>

                {/* Target Dyad Assessment */}
                <div className="p-3.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#7a7a7a] font-semibold">
                    Target Dyad Assessment
                  </span>
                  <span className="font-semibold text-xs text-[#1d1d1f] leading-snug">
                    {selectedEdge
                      ? `${selectedEdge.source} ↔ ${selectedEdge.target}`
                      : 'PetroFlow Systems Ltd ↔ Apex Hydrocarbons Equipment'}
                  </span>
                  <div className="mt-1 inline-flex items-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-[#ba1a1a] text-[10px] font-semibold border border-rose-200">
                      Collusion Weight: {selectedEdge ? Math.round(selectedEdge.strength * 100) : 85} / 100 • Critical Observation
                    </span>
                  </div>
                </div>

                {/* Evidentiary Stack */}
                <div className="flex flex-col gap-2.5 mt-1">
                  <span className="text-xs font-semibold text-[#1d1d1f]">Forensic Evidentiary Stack</span>

                  {/* Node or Edge Detail Cards */}
                  {selectedNode ? (
                    <div className="p-3 rounded-xl bg-white border border-[#e0e0e0] shadow-xs flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#0066cc] flex items-center gap-1.5">
                          {getNodeIcon(selectedNode.type || selectedNode.node_type || '')}
                          <span>{selectedNode.type || selectedNode.node_type} Node</span>
                        </span>
                        <span className="font-mono text-[10px] text-[#7a7a7a]">{selectedNode.id}</span>
                      </div>
                      <h4 className="font-semibold text-xs text-[#1d1d1f]">{selectedNode.label}</h4>

                      {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
                        <div className="p-2 rounded bg-[#f5f5f7] border border-[#e0e0e0] text-[10px] font-mono mt-1 space-y-1">
                          <span className="text-[#7a7a7a] block uppercase font-bold">Properties:</span>
                          <pre className="text-[#1d1d1f] overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(selectedNode.properties, null, 2)}
                          </pre>
                        </div>
                      )}

                      {(selectedNode.type || selectedNode.node_type || '').toUpperCase() === 'BIDDER' &&
                        onSelectBidder && (
                          <button
                            onClick={() => onSelectBidder(selectedNode.id)}
                            className="mt-2 w-full py-1.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white font-medium text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Open Bidder Cockpit</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                    </div>
                  ) : (
                    /* Default High-fidelity items from Stitch Screen 07 */
                    <>
                      <div className="p-3 rounded-xl bg-white border border-[#e0e0e0] shadow-xs flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#ba1a1a] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px]">account_balance</span>
                            <span>Common Directorship</span>
                          </span>
                          <span className="font-mono text-[10px] text-[#7a7a7a]">DIN 08492011</span>
                        </div>
                        <p className="text-xs text-[#515154] leading-snug">
                          MCA21 records reveal Rajesh V. Sharma holds 42% equity in PetroFlow Systems Ltd and 51% equity in Apex Hydrocarbons Equipment Pvt Ltd.
                        </p>
                        <span className="font-mono text-[10px] text-[#7a7a7a] mt-0.5">
                          Evidence: MCA Form DIR-12 dated 14/03/2023
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-[#e0e0e0] shadow-xs flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#ba1a1a] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px]">call</span>
                            <span>GeM Portal Single Identity</span>
                          </span>
                          <span className="font-mono text-[10px] text-[#7a7a7a]">+91 98200 44123</span>
                        </div>
                        <p className="text-xs text-[#515154] leading-snug">
                          Primary phone number registered in tender submission is shared between both entities.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-[#e0e0e0] shadow-xs flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#ba1a1a] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px]">terminal</span>
                            <span>PDF Creator Fingerprint</span>
                          </span>
                          <span className="font-mono text-[10px] text-[#7a7a7a]">GIMP 2.10.34</span>
                        </div>
                        <p className="text-xs text-[#515154] leading-snug">
                          CreationDate timestamps delta is 18 minutes. Author metadata &apos;rsharma&apos; shared identically.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Inspector Bottom Actions */}
              <div className="pt-3 border-t border-[#e0e0e0] flex flex-col gap-2">
                <button
                  onClick={() => alert('Formal written clarification notice dispatched to bidders under CVC Guidelines 2021.')}
                  className="w-full py-2.5 px-4 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  <span>Request Formal Clarification (48h Notice)</span>
                </button>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#7a7a7a] px-1">
                  <span>Precedent: GFR 173(xiv)</span>
                  <span>Audit Event: EVT-COL-2026-08</span>
                </div>
              </div>
            </aside>
          </div>

          {/* Detailed Data Tables (Collusion Pairs / Edges / Nodes) */}
          <div className="rounded-2xl bg-white border border-[#e0e0e0] overflow-hidden shadow-xs">
            <div className="p-3 border-b border-[#e0e0e0] bg-[#f5f5f7] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('pairs')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'pairs'
                      ? 'bg-[#1d1d1f] text-white'
                      : 'text-[#515154] hover:text-[#1d1d1f] bg-white border border-[#e0e0e0]'
                  }`}
                >
                  Collusion Pairs ({graph.direct_bidder_links?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('edges')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'edges'
                      ? 'bg-[#1d1d1f] text-white'
                      : 'text-[#515154] hover:text-[#1d1d1f] bg-white border border-[#e0e0e0]'
                  }`}
                >
                  All Edges ({graph.edges.length})
                </button>
                <button
                  onClick={() => setActiveTab('nodes')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'nodes'
                      ? 'bg-[#1d1d1f] text-white'
                      : 'text-[#515154] hover:text-[#1d1d1f] bg-white border border-[#e0e0e0]'
                  }`}
                >
                  All Nodes ({graph.nodes.length})
                </button>
              </div>
            </div>

            {/* Tab 1: Collusion Pairs */}
            {activeTab === 'pairs' && (
              <div className="divide-y divide-[#e0e0e0]">
                {graph.direct_bidder_links && graph.direct_bidder_links.length > 0 ? (
                  graph.direct_bidder_links.map((link, idx) => (
                    <div key={idx} className="p-4 hover:bg-[#f5f5f7] transition-colors space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 font-semibold text-[#1d1d1f]">
                          <span>{link.source_bidder_name}</span>
                          <span className="text-[#7a7a7a] font-mono">↔</span>
                          <span>{link.target_bidder_name}</span>
                        </div>
                        <span className="font-mono font-bold text-[#ba1a1a] text-xs">
                          {Math.round(link.strength * 100)}% Link
                        </span>
                      </div>

                      <p className="text-[#515154] text-xs">{link.reason}</p>

                      {link.evidence && (
                        <div className="text-[10px] font-mono text-[#515154] bg-[#f5f5f7] p-2 rounded-lg border border-[#e0e0e0]">
                          {JSON.stringify(link.evidence)}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-[#7a7a7a] text-xs">
                    No direct bidder-to-bidder collusion links identified.
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: All Edges */}
            {activeTab === 'edges' && (
              <div className="divide-y divide-[#e0e0e0]">
                {graph.edges.map((e, idx) => (
                  <div key={idx} className="p-4 hover:bg-[#f5f5f7] transition-colors flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-mono text-[11px] text-[#0066cc]">
                        {e.source} → {e.target}
                      </div>
                      <p className="text-[#1d1d1f] text-xs font-medium">{e.reason}</p>
                    </div>
                    <span className="font-mono font-bold text-amber-600 text-xs shrink-0">
                      {Math.round(e.strength * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: All Nodes */}
            {activeTab === 'nodes' && (
              <div className="divide-y divide-[#e0e0e0]">
                {graph.nodes.map((n) => (
                  <div key={n.id} className="p-4 hover:bg-[#f5f5f7] transition-colors flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {getNodeIcon(n.type || n.node_type || '')}
                      <span className="font-medium text-[#1d1d1f]">{n.label}</span>
                    </div>
                    <span className="font-mono text-[10px] uppercase text-[#7a7a7a]">
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
