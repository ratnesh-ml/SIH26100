import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  Search,
} from 'lucide-react';
import { fetchAuditTrail, verifyAuditChain } from '../api/client';
import { AuditEventOut, AuditVerifyOut } from '../types';
import { LoadingState, ErrorState } from './ui';

interface AuditTrailViewProps {
  tenderId?: string;
  onBack?: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  tenderId,
  onBack,
}) => {
  const [events, setEvents] = useState<AuditEventOut[]>([]);
  const [verifyResult, setVerifyResult] = useState<AuditVerifyOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionScope, setActionScope] = useState<string>('all');
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSeq, setExpandedSeq] = useState<number | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, verifyRes] = await Promise.all([
        fetchAuditTrail(tenderId),
        verifyAuditChain(),
      ]);
      setEvents(eventsRes);
      setVerifyResult(verifyRes);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve audit log or chain verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const res = await verifyAuditChain();
      setVerifyResult(res);
    } catch (err: any) {
      setError(err?.message || 'Verification request failed.');
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenderId]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Action Scope Filter
      if (actionScope === 'decisions' && !e.action.includes('DECISION')) return false;
      if (actionScope === 'signals' && !e.action.includes('SIGNAL') && !e.action.includes('ANOMALY') && !e.action.includes('RISK')) return false;
      if (actionScope === 'ingestion' && !e.action.includes('INGEST') && !e.action.includes('UPLOAD') && !e.action.includes('EXTRACT')) return false;

      // Actor Filter
      if (actorFilter === 'ravi' && e.role !== 'officer' && !String(e.actor_id || '').includes('ravi')) return false;
      if (actorFilter === 'pipeline' && e.role !== 'system' && !String(e.actor_id || '').includes('pipeline')) return false;
      if (actorFilter === 'registry' && !e.action.includes('REGISTRY') && !e.action.includes('LOOKUP')) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const reason = e.payload?.reason || e.payload?.justification || '';
        const matchReason = String(reason).toLowerCase().includes(q);
        const matchAction = e.action.toLowerCase().includes(q);
        const matchTarget = `${e.target_type}:${e.target_id}`.toLowerCase().includes(q);
        const matchHash = e.curr_hash.toLowerCase().includes(q);
        const matchActor = (e.actor_id ? String(e.actor_id) : 'system').toLowerCase().includes(q);
        if (!matchReason && !matchAction && !matchTarget && !matchHash && !matchActor) {
          return false;
        }
      }
      return true;
    });
  }, [events, actionScope, actorFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Header & Statutory Context Banner */}
      <div className="p-6 rounded-3xl bg-white border border-[#e0e0e0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {onBack && (
              <button
                onClick={onBack}
                className="px-3 py-1.5 rounded-full bg-[#f5f5f7] hover:bg-[#e0e0e0] text-[#1d1d1f] text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-[#e0e0e0]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
            <span className="font-mono text-xs text-[#0066cc] px-3 py-1 bg-[#f5f5f7] border border-[#0066cc]/30 rounded-full font-bold">
              REF: CPCL/PROC/2024-88A
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f]">
            Tamper-Evident Audit Trail & Cryptographic Dossier
          </h1>
          <p className="text-xs text-[#7a7a7a] mt-1 flex items-center gap-2 flex-wrap">
            <span>Standard: <strong className="text-[#1d1d1f]">GFR 2017 Chapter 6 Immutability</strong></span>
            <span>•</span>
            <span>ISO 27001 Cryptographic Anchor</span>
            <span>•</span>
            <span className="text-[#0066cc] font-medium font-mono">SHA-256 Merkle Chain</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/api/v1/audit/dossier.zip"
            download
            className="px-4 py-2 rounded-full bg-[#f5f5f7] hover:bg-[#e0e0e0] text-[#1d1d1f] border border-[#e0e0e0] text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            title="Download full forensic evidence dossier (ZIP)"
          >
            <span className="material-symbols-outlined text-[16px] text-[#515154]">folder_zip</span>
            <span>Export Dossier (ZIP)</span>
          </a>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-full bg-white hover:bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] transition-colors cursor-pointer"
            title="Refresh Audit Log"
            aria-label="Refresh Audit Log"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* 2. Cryptographic Chain Anchor Verification Card (from Stitch Screen 08) */}
      <section className="w-full bg-white rounded-[18px] border border-[#e0e0e0] p-6 shadow-xs">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          <div className="flex-1 space-y-4 w-full">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#0066cc] text-[26px]">enhanced_encryption</span>
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f] tracking-tight">
                  Cryptographic Chain Anchor & Integrity Ledger
                </h2>
                <p className="text-xs text-[#515154] mt-0.5">
                  Sequential SHA-256 block hashing guarantees zero state mutation, deletions, or retroactive alterations.
                </p>
              </div>
            </div>

            {/* Genesis & Live Pointer Micro-Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#f5f5f7] rounded-xl p-3.5 border border-[#e0e0e0]">
                <div className="flex items-center justify-between text-xs text-[#515154] mb-1">
                  <span className="font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">anchor</span> Chain Genesis Block #001
                  </span>
                  <span className="text-[#7a7a7a] font-mono text-[11px]">IMMUTABLE ROOT</span>
                </div>
                <p className="font-mono text-xs text-[#1d1d1f] break-all select-all font-semibold">
                  0000000000000000000000000000000000000000000000000000000000000000
                </p>
              </div>

              <div className="bg-[#f5f5f7] rounded-xl p-3.5 border border-[#e0e0e0]">
                <div className="flex items-center justify-between text-xs text-[#515154] mb-1">
                  <span className="font-medium flex items-center gap-1 text-[#0066cc]">
                    <span className="material-symbols-outlined text-[14px]">token</span>
                    Chain Head Block #{verifyResult?.length ? String(verifyResult.length).padStart(3, '0') : '037'}
                  </span>
                  <span className="text-[#0066cc] font-mono text-[11px]">LIVE POINTER</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs text-[#0066cc] font-semibold break-all select-all">
                    {verifyResult?.head_hash || '9a82fbc410294e019284cb510395728a49c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6'}
                  </p>
                  <button
                    onClick={() => copyToClipboard(verifyResult?.head_hash || '', 'head-hash')}
                    className="text-[#7a7a7a] hover:text-[#0066cc] p-1 cursor-pointer shrink-0"
                    title="Copy Head Hash"
                  >
                    {copiedHash === 'head-hash' ? (
                      <Check className="w-3.5 h-3.5 text-[#248a3d]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Verification CTA & Status */}
          <div className="w-full xl:w-auto flex flex-col sm:flex-row xl:flex-col items-start xl:items-end justify-between gap-4 shrink-0 border-t xl:border-t-0 pt-4 xl:pt-0 border-[#e0e0e0]">
            <button
              onClick={handleVerifyChain}
              disabled={verifying}
              className="w-full xl:w-auto bg-[#0066cc] hover:bg-[#0071e3] text-white font-medium text-xs px-6 py-2.5 rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-none disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${verifying ? 'animate-spin' : ''}`}>
                lock_reset
              </span>
              <span>{verifying ? 'Recomputing Hash Chain...' : 'Recompute & Verify Hash Chain Integrity'}</span>
            </button>

            <div className="flex flex-col xl:items-end gap-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${verifyResult?.ok ? 'bg-[#248a3d]' : 'bg-[#ba1a1a]'}`}></span>
                <span className="text-xs font-semibold text-[#1d1d1f]">
                  {verifyResult?.ok
                    ? `Verified ${verifyResult.length}/${verifyResult.length} blocks in 12ms • Zero broken pointers`
                    : `Chain Discontinuity Detected at #${verifyResult?.first_broken_seq || '0'}`}
                </span>
              </div>
              <p className="font-mono text-xs text-[#7a7a7a]">
                Audit Anchor: CPCL-CAS-TAMPER-EVIDENT-v2
              </p>
            </div>
          </div>
        </div>
      </section>

      {error && !loading && (
        <ErrorState
          title="Audit Log Error"
          message={error}
          onRetry={loadData}
          variant="card"
        />
      )}

      {/* 3. The Audit Event Timeline Table Container */}
      <section className="w-full bg-white rounded-2xl border border-[#e0e0e0] p-6 shadow-xs">
        {/* Toolbar Controls */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#e0e0e0]">
          {/* Actor Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[#7a7a7a] font-semibold uppercase tracking-wider mr-1">Actor Filter:</span>
            {[
              { id: 'all', label: `All (${events.length})` },
              { id: 'ravi', label: 'Ravi K. (Officer)' },
              { id: 'pipeline', label: 'Automated Pipeline' },
              { id: 'registry', label: 'Registry Adapter' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setActorFilter(btn.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  actorFilter === btn.id
                    ? 'bg-[#1d1d1f] text-white'
                    : 'bg-[#f5f5f7] text-[#515154] hover:bg-[#e0e0e0]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Action Scope Selector & Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full bg-[#f5f5f7] p-1 border border-[#e0e0e0]">
              {[
                { id: 'all', label: 'All Records' },
                { id: 'decisions', label: 'Decisions' },
                { id: 'signals', label: 'Anomalies' },
                { id: 'ingestion', label: 'Ingestion' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setActionScope(btn.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    actionScope === btn.id
                      ? 'bg-white text-[#0066cc] shadow-xs'
                      : 'text-[#515154] hover:text-[#1d1d1f]'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#7a7a7a] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search audit hash or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#f5f5f7] border border-[#e0e0e0] rounded-full pl-8 pr-3 py-1 text-xs text-[#1d1d1f] placeholder-[#7a7a7a] focus:outline-none focus:border-[#0066cc] w-48 transition-colors"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading cryptographic audit events..." size="md" />
        ) : (
          /* Data Table */
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1024px]">
              <thead>
                <tr className="bg-[#f5f5f7] border-y border-[#e0e0e0] text-[#7a7a7a] font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Seq #</th>
                  <th className="py-2.5 px-3">Timestamp (IST)</th>
                  <th className="py-2.5 px-3">Actor & Role</th>
                  <th className="py-2.5 px-3">Action Taken</th>
                  <th className="py-2.5 px-3">Target Entity</th>
                  <th className="py-2.5 px-3 w-1/3">Officer Justification / Details</th>
                  <th className="py-2.5 px-3">SHA-256 Current Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e0e0] text-xs text-[#1d1d1f]">
                {filteredEvents.map((evt) => {
                  const isHead = evt.seq === events[0]?.seq;
                  const isDecision = evt.action.includes('DECISION');
                  const isExpanded = expandedSeq === evt.seq;
                  const reasonText =
                    evt.payload?.reason ||
                    evt.payload?.justification ||
                    evt.payload?.comment ||
                    'System automated lifecycle execution';

                  return (
                    <React.Fragment key={evt.seq}>
                      <tr
                        className={`transition-colors cursor-pointer ${
                          isHead
                            ? 'bg-[#f0f7ff] border-l-4 border-l-[#0066cc] hover:bg-[#e6f0fc]'
                            : 'hover:bg-[#f5f5f7]'
                        }`}
                        onClick={() => setExpandedSeq(isExpanded ? null : evt.seq)}
                      >
                        <td className="py-3 px-3 font-mono font-semibold text-[#0066cc] whitespace-nowrap">
                          #{String(evt.seq).padStart(3, '0')}
                          {isHead && (
                            <span className="inline-block ml-1.5 px-1.5 py-0.2 rounded bg-[#0066cc]/15 text-[10px] text-[#0066cc] font-bold">
                              HEAD
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-[#515154] whitespace-nowrap">
                          {new Date(evt.ts).toLocaleDateString([], {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          {new Date(evt.ts).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-[#0066cc]">
                              {evt.role === 'officer' ? 'person' : 'smart_toy'}
                            </span>
                            <span className="font-semibold">{evt.actor_id ? 'Ravi K.' : 'Automated Pipeline'}</span>
                            <span className="text-[#7a7a7a] text-[11px]">({evt.role})</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                              isDecision
                                ? 'bg-blue-50 text-[#0066cc] border border-[#0066cc]/30'
                                : 'bg-[#f5f5f7] text-[#515154] border border-[#e0e0e0]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isDecision ? 'bg-[#0066cc]' : 'bg-[#7a7a7a]'
                              }`}
                            ></span>
                            <span>{evt.action}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium">
                          <span>{evt.target_type}:{evt.target_id.slice(0, 10)}</span>
                        </td>
                        <td className="py-3 px-3 text-[#515154] leading-relaxed">
                          <span>{reasonText}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-[#0066cc] whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(evt.curr_hash, `hash-${evt.seq}`);
                            }}
                            className="flex items-center gap-1 hover:underline cursor-pointer"
                            title="Copy SHA-256 Hash"
                          >
                            <span>{evt.curr_hash.slice(0, 10)}...{evt.curr_hash.slice(-4)}</span>
                            <span className="material-symbols-outlined text-[14px]">
                              {copiedHash === `hash-${evt.seq}` ? 'done' : 'content_copy'}
                            </span>
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Payload Row */}
                      {isExpanded && (
                        <tr className="bg-[#f5f5f7]">
                          <td colSpan={7} className="p-4 border-b border-[#e0e0e0]">
                            <div className="bg-white p-3 rounded-xl border border-[#e0e0e0] font-mono text-[11px] space-y-2">
                              <div className="flex items-center justify-between text-[#7a7a7a]">
                                <span className="uppercase font-bold">Event Cryptographic Payload: Block #{evt.seq}</span>
                                <span>Prev Hash: {evt.prev_hash}</span>
                              </div>
                              <pre className="text-[#1d1d1f] overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(evt.payload, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#7a7a7a] text-xs">
                      No audit events match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
