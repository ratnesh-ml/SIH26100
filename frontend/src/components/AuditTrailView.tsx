import React, { useEffect, useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Search,
  Filter,
  ArrowLeft,
  Clock,
  User,
  Hash,
  FileCode,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import { fetchAuditTrail, verifyAuditChain } from '../api/client';
import { AuditEventOut, AuditVerifyOut } from '../types';
import {
  StatusChip,
  Button,
  EmptyState,
  LoadingState,
  ErrorState,
} from './ui';

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
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
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

  // Distinct Actions for Filter
  const distinctActions = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => set.add(e.action));
    return Array.from(set).sort();
  }, [events]);

  // Distinct Roles for Filter
  const distinctRoles = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => set.add(e.role));
    return Array.from(set).sort();
  }, [events]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (actionFilter !== 'ALL' && e.action !== actionFilter) return false;
      if (roleFilter !== 'ALL' && e.role.toLowerCase() !== roleFilter.toLowerCase()) return false;
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
  }, [events, actionFilter, roleFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* 1. Top Bar with Navigation & Actions */}
      <header className="px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          {onBack && (
            <>
              <Button
                variant="outline"
                size="xs"
                onClick={onBack}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                aria-label="Back to previous view"
              >
                Back
              </Button>
              <div className="h-4 w-px bg-slate-800" aria-hidden="true" />
            </>
          )}

          <div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-400" />
              <h1 className="text-lg font-bold text-white tracking-tight">
                Cryptographic Audit Trail
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {tenderId
                ? `Tender-specific tamper-evident SHA-256 hash-chain timeline`
                : `Global system-wide tamper-evident SHA-256 hash-chain log`}
            </p>
          </div>
        </div>

        {/* Action Controls: Verify Chain & Refresh */}
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleVerifyChain}
            isLoading={verifying}
            disabled={loading}
            leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
            title="Verify complete SHA-256 hash continuity across all events"
          >
            {verifying ? 'Verifying Chain...' : 'Verify Chain Continuity'}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={loadData}
            isLoading={loading}
            aria-label="Refresh Audit Log"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* 2. Chain Status Verification Banner */}
      {verifyResult && (
        <div
          role="status"
          className={`p-4 rounded-xl border transition-all shadow-lg ${
            verifyResult.ok
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
              : 'bg-rose-950/70 border-rose-600 text-rose-100 ring-2 ring-rose-500/50'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              {verifyResult.ok ? (
                <div className="p-2 rounded-lg bg-emerald-900/60 text-emerald-300 shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-rose-900/90 text-rose-200 shrink-0 mt-0.5 animate-pulse">
                  <ShieldAlert className="w-5 h-5" aria-hidden="true" />
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-sm tracking-wide">
                    {verifyResult.ok
                      ? 'AUDIT CHAIN STATUS: CRYPTOGRAPHICALLY VALID & INTACT'
                      : 'AUDIT CHAIN STATUS: CRITICAL DISCONTINUITY / TAMPERING DETECTED'}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      verifyResult.ok
                        ? 'bg-emerald-900 text-emerald-200 border border-emerald-700'
                        : 'bg-rose-900 text-rose-100 border border-rose-600'
                    }`}
                  >
                    {verifyResult.ok ? 'VALID AUDIT CHAIN' : 'INVALID / TAMPERED CHAIN'}
                  </span>
                </div>

                <p className="text-xs opacity-90 leading-relaxed">
                  {verifyResult.ok
                    ? `Verified continuous forward SHA-256 hash sequence across all ${verifyResult.length} historical events without any pointer gaps, payload mutations, or deleted records.`
                    : `Discontinuity detected at sequence #${verifyResult.first_broken_seq}! The current hash does not link to the preceding event hash. Events at or after #${verifyResult.first_broken_seq} have been compromised or altered.`}
                </p>
              </div>
            </div>

            {/* Chain Metadata Badges */}
            <div className="flex flex-row sm:flex-col items-end gap-1.5 text-xs font-mono shrink-0 pl-11 sm:pl-0">
              <div className="flex items-center gap-1.5">
                <span className="opacity-75">Chain Length:</span>
                <span className="font-bold">{verifyResult.length} events</span>
              </div>
              {verifyResult.head_hash && (
                <div className="flex items-center gap-1.5">
                  <span className="opacity-75">Head Hash:</span>
                  <span className="bg-black/30 px-1.5 py-0.5 rounded border border-white/10 text-[10px]">
                    {verifyResult.head_hash.slice(0, 10)}…{verifyResult.head_hash.slice(-6)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Filters & Search Toolbar */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5" aria-hidden="true" />
            <label htmlFor="audit-action-filter" className="font-medium">Action:</label>
          </div>
          <select
            id="audit-action-filter"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
          >
            <option value="ALL">All Actions ({events.length})</option>
            {distinctActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" aria-hidden="true" />

          <div className="flex items-center gap-1.5 text-slate-400">
            <User className="w-3.5 h-3.5" aria-hidden="true" />
            <label htmlFor="audit-role-filter" className="font-medium">Role:</label>
          </div>
          <select
            id="audit-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            {distinctRoles.map((r) => (
              <option key={r} value={r}>
                {r.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search reason, actor, hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-56 sm:w-64 transition-colors"
          />
        </div>
      </div>

      {loading && (
        <LoadingState
          message="Loading audit trail events and verifying cryptographic chain..."
          size="lg"
          className="rounded-xl bg-slate-900/40 border border-slate-800"
        />
      )}

      {error && !loading && (
        <ErrorState
          title="Failed to load audit events"
          message={error}
          onRetry={loadData}
          variant="card"
        />
      )}

      {/* 4. Events Timeline / List */}
      {!loading && !error && (
        <div className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden shadow-lg">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-sky-400" />
              <span>Audit Log Entries ({filteredEvents.length})</span>
            </span>
            <span className="text-[10px] text-slate-500">
              Ordered by Sequence (Most Recent First)
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((evt) => {
                const isBroken =
                  verifyResult &&
                  !verifyResult.ok &&
                  verifyResult.first_broken_seq !== null &&
                  evt.seq >= (verifyResult.first_broken_seq ?? 0);

                const isExpanded = expandedSeq === evt.seq;
                const reasonText =
                  evt.payload?.reason ||
                  evt.payload?.justification ||
                  evt.payload?.comment ||
                  'System automated lifecycle execution';

                return (
                  <div
                    key={evt.seq}
                    className={`p-4 transition-colors ${
                      isBroken
                        ? 'bg-rose-950/30 border-l-4 border-l-rose-500'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                      {/* Left: Seq, Action, Entity, Reason */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-400 text-xs bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            #{evt.seq}
                          </span>

                          <StatusChip status={evt.action} size="xs" showIcon={false} />

                          <span className="text-slate-400 font-mono text-[11px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            {evt.target_type}:{evt.target_id.slice(0, 12)}…
                          </span>

                          {isBroken && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                              BROKEN LINK
                            </span>
                          )}
                        </div>

                        {/* Reason / Narrative */}
                        <div className="text-slate-200 font-medium leading-relaxed">
                          <span className="text-slate-400 font-normal">Reason: </span>
                          {reasonText}
                        </div>

                        {/* Actor & Role */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-500" />
                            <span>
                              {evt.actor_id ? `User (${evt.actor_id.slice(0, 8)}…)` : 'System'}
                            </span>
                          </span>
                          <span>•</span>
                          <span className="capitalize font-medium text-slate-300">
                            {evt.role}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500 font-mono">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(evt.ts).toLocaleString()}</span>
                          </span>
                        </div>
                      </div>

                      {/* Right: Cryptographic Hashes & Expand */}
                      <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0 text-[10px] font-mono">
                        {/* Current Hash */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Hash:</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(evt.curr_hash, `curr-${evt.seq}`)}
                            className="bg-slate-950 hover:bg-slate-850 text-sky-400 px-2 py-0.5 rounded border border-slate-800 transition-colors inline-flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400"
                            title="Click to copy full SHA-256 hash"
                            aria-label={`Copy current hash for event ${evt.seq}`}
                          >
                            <span>{evt.curr_hash.slice(0, 8)}…</span>
                            {copiedHash === `curr-${evt.seq}` ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-slate-500" />
                            )}
                          </button>
                        </div>

                        {/* Previous Hash */}
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <span>Prev:</span>
                          <span className="text-slate-400">
                            {evt.prev_hash.slice(0, 8)}…
                          </span>
                        </div>

                        {/* Expand Details Button */}
                        <button
                          type="button"
                          onClick={() => setExpandedSeq(isExpanded ? null : evt.seq)}
                          className="mt-1 text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <FileCode className="w-3 h-3 text-slate-500" />
                          <span>{isExpanded ? 'Hide Payload' : 'View Payload'}</span>
                          {isExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable JSON Payload Panel */}
                    {isExpanded && (
                      <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-2 shadow-inner">
                        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-slate-300">
                            Event Cryptographic Payload:
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(JSON.stringify(evt, null, 2), `full-${evt.seq}`)
                            }
                            className="hover:text-white inline-flex items-center gap-1 text-[10px] cursor-pointer"
                          >
                            <Copy className="w-2.5 h-2.5" />
                            <span>Copy Event JSON</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="text-slate-500">Full Curr Hash:</span>
                            <div className="text-sky-300 break-all select-all">{evt.curr_hash}</div>
                          </div>
                          <div>
                            <span className="text-slate-500">Full Prev Hash:</span>
                            <div className="text-slate-400 break-all select-all">{evt.prev_hash}</div>
                          </div>
                        </div>

                        {evt.payload && (
                          <div className="pt-1">
                            <span className="text-slate-500 block mb-1">State & Metadata:</span>
                            <pre className="text-slate-300 text-[10px] overflow-x-auto whitespace-pre-wrap leading-tight bg-slate-900/80 p-2.5 rounded border border-slate-800/80">
                              {JSON.stringify(evt.payload, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={<ShieldCheck className="w-6 h-6 text-slate-500" />}
                title="No Audit Events Matched"
                description="No audit trail events matched your search and filter criteria."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
