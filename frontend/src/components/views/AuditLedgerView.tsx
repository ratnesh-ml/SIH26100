import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_AUDIT_EVENTS, AuditEvent } from '../../mockData/auditEvents';
import { procurementService } from '../../services/procurementService';

interface AuditLedgerViewProps {
  initialBlockNumber?: number;
  onNavigate: (view: string, params?: any) => void;
  onDownloadDossier: () => void;
}

export const AuditLedgerView: React.FC<AuditLedgerViewProps> = ({
  initialBlockNumber,
  onNavigate,
  onDownloadDossier,
}) => {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([...MOCK_AUDIT_EVENTS]);
  const [selectedBlockNumber, setSelectedBlockNumber] = useState<number>(
    initialBlockNumber || 142
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DISQ' | 'DETECT' | 'ADJUDICATE'>('ALL');
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    procurementService.getAuditTrail().then((events) => {
      setAuditEvents(events);
      if (initialBlockNumber) {
        setSelectedBlockNumber(initialBlockNumber);
      } else if (events.length > 0) {
        setSelectedBlockNumber(events[0].blockNumber);
      }
    });
  }, [initialBlockNumber]);

  const selectedEvent = useMemo(() => {
    return (
      auditEvents.find((e) => e.blockNumber === selectedBlockNumber) ||
      auditEvents[0] ||
      MOCK_AUDIT_EVENTS[0]
    );
  }, [auditEvents, selectedBlockNumber]);

  const handleVerifyLedger = async () => {
    setVerifying(true);
    try {
      const res = await procurementService.verifyAuditLedger();
      setVerifyStatus(
        `Ledger Verified: ${res.blockCount} blocks cryptographically intact. Head SHA-256: ${res.headHash.slice(0, 16)}...`
      );
      setTimeout(() => setVerifyStatus(null), 5000);
    } finally {
      setVerifying(false);
    }
  };

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedText(txt);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const filteredEvents = useMemo(() => {
    return auditEvents.filter((e) => {
      const matchesSearch =
        searchQuery === '' ||
        e.blockNumber.toString().includes(searchQuery) ||
        e.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.officer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.hash.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterType === 'DISQ') return e.action.includes('DISQUALIF') || e.action.includes('REJECT');
      if (filterType === 'DETECT') return e.action.includes('DETECTION') || e.action.includes('COLLUSION') || e.action.includes('ANOMALY');
      if (filterType === 'ADJUDICATE') return e.action.includes('ADJUDICATION') || e.action.includes('OVERRIDE') || e.action.includes('DECISION');
      return true;
    });
  }, [auditEvents, searchQuery, filterType]);

  return (
    <div className="flex flex-col w-full space-y-4 text-slate-800 text-xs">
      {/* Toast Alert */}
      {verifyStatus && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-md flex items-center justify-between border border-emerald-500">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">verified</span>
            <span className="text-xs font-semibold">{verifyStatus}</span>
          </div>
          <button onClick={() => setVerifyStatus(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* TOP SCREEN HEADER & INTEGRITY BANNER SECTION */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        {/* Breadcrumb & Primary Actions Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <nav className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium mb-1">
              <button
                onClick={() => onNavigate('tenders')}
                className="hover:text-slate-600 cursor-pointer"
              >
                Tenders
              </button>
              <span>/</span>
              <span className="font-mono text-slate-600">CPCL/MM/2026/PUMP-217</span>
              <span>/</span>
              <span className="text-blue-600 font-semibold">Audit Ledger</span>
            </nav>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Ledger</h1>
              <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                IMMUTABLE SHA-256 MERKLE LEDGER
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cryptographically anchored, tamper-evident chronological ledger of scrutiny and adjudication events.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              onClick={handleVerifyLedger}
              disabled={verifying}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              type="button"
            >
              <span className={`material-symbols-outlined text-[16px] text-emerald-600 ${verifying ? 'animate-spin' : ''}`}>
                {verifying ? 'sync' : 'verified'}
              </span>
              <span>{verifying ? 'Verifying...' : 'Verify Ledger'}</span>
            </button>

            <button
              onClick={onDownloadDossier}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Export Record</span>
            </button>
          </div>
        </div>

        {/* Top Cryptographic Integrity Banner */}
        <div className="rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-sky-50/50 to-slate-50 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-emerald-100/90 border border-emerald-300 text-emerald-800 font-bold text-[10px]">
              <span className="material-symbols-outlined text-[14px] text-emerald-600">check_circle</span>
              <span>Ledger Integrity: VERIFIED</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[10px] text-slate-700 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>SHA-256 Chain: VALID</span>
            </div>
            <div className="text-slate-600 text-[11px] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-slate-400">cloud_done</span>
              <span>Anchored to NIC-DELHI-04 Node • Cryptographic consensus synced 2m ago</span>
            </div>
          </div>
          <button
            onClick={handleVerifyLedger}
            className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
          >
            Re-compute Merkle Tree →
          </button>
        </div>
      </div>

      {/* TWO-COLUMN EXPLORER LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Chronological Block Stream (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col overflow-hidden">
          {/* Stream Toolbar & Filters */}
          <div className="p-3 border-b border-slate-200 space-y-2.5">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-[16px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blocks, SHA-256, officer signatures..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  filterType === 'ALL'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                All Events ({auditEvents.length})
              </button>
              <button
                onClick={() => setFilterType('DISQ')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  filterType === 'DISQ'
                    ? 'bg-rose-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Disqualifications (1)
              </button>
              <button
                onClick={() => setFilterType('DETECT')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  filterType === 'DETECT'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Detections (4)
              </button>
              <button
                onClick={() => setFilterType('ADJUDICATE')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  filterType === 'ADJUDICATE'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Adjudications (7)
              </button>
            </div>
          </div>

          {/* Block Stream Items */}
          <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
            {filteredEvents.map((evt) => {
              const isSelected = evt.blockNumber === selectedBlockNumber;
              const isDisq = evt.action.includes('DISQUALIF') || evt.action.includes('REJECT');
              const isDet = evt.action.includes('DETECTION') || evt.action.includes('COLLUSION');

              return (
                <div
                  key={evt.blockNumber}
                  onClick={() => setSelectedBlockNumber(evt.blockNumber)}
                  className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-50 ${
                    isSelected ? 'bg-blue-50/50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        Block #{evt.blockNumber}
                      </span>
                      <span
                        className={`text-[9.5px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                          isDisq
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : isDet
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }`}
                      >
                        {evt.action.slice(0, 24)}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 mt-1 font-medium line-clamp-1">{evt.description}</p>

                  <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500 font-mono">
                    <span className="truncate max-w-[180px]">Hash: {evt.hash.slice(0, 14)}...</span>
                    <span>Officer: {evt.officer.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Block Forensic Event Payload & Statutory Dossier (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-2xs p-6 space-y-6">
          {/* Payload Header */}
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Block #{selectedEvent.blockNumber} Forensic Event Payload &amp; Statutory Dossier
                </h2>
                <div className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-2">
                  <span>UUID: blk_in_2026_09_{selectedEvent.blockNumber}</span>
                  <span>•</span>
                  <span>{new Date(selectedEvent.timestamp).toLocaleString()} IST</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  Verified &amp; Immutable
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                  NIC-CA #CPCL-8821 Active
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Adjudicating Authority */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              1. Adjudicating Authority &amp; Officer Determination
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Authorized Signatory</div>
                <div className="font-bold text-xs text-slate-900 mt-0.5">{selectedEvent.officer}</div>
                <div className="text-[10.5px] text-slate-500 font-mono">Sr. Procurement Officer, CPCL • Emp ID: IND-GOV-99410</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Statutory Ruling &amp; Attestation</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-bold text-xs text-rose-700 uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {selectedEvent.action}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">DSC Class-3 eMudhra Token</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Officer Justification & Statutory Basis */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              2. Written Minutes &amp; Statutory Directives
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 leading-relaxed text-slate-700 text-xs font-mono">
              {selectedEvent.description}
            </div>
          </div>

          {/* Section 3: Cryptographic Manifest */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              3. Cryptographic Manifest &amp; SHA-256 Ledger Anchor
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              {/* Previous Hash */}
              <div className="p-2.5 rounded-lg bg-slate-900 text-slate-300 flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="text-slate-500">PREV_HASH: </span>
                  <span className="text-amber-400">{selectedEvent.previousHash}</span>
                </div>
                <button
                  onClick={() => handleCopy(selectedEvent.previousHash)}
                  className="text-[10px] px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded shrink-0 cursor-pointer"
                >
                  {copiedText === selectedEvent.previousHash ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Current Hash */}
              <div className="p-2.5 rounded-lg bg-slate-900 text-slate-300 flex items-center justify-between gap-2 border border-blue-600/50">
                <div className="truncate">
                  <span className="text-slate-500">BLOCK_HASH: </span>
                  <span className="text-emerald-400 font-bold">{selectedEvent.hash}</span>
                </div>
                <button
                  onClick={() => handleCopy(selectedEvent.hash)}
                  className="text-[10px] px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded shrink-0 cursor-pointer"
                >
                  {copiedText === selectedEvent.hash ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Merkle Root */}
              <div className="p-2.5 rounded-lg bg-slate-900 text-slate-300 flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="text-slate-500">MERKLE_ROOT: </span>
                  <span className="text-sky-400">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Nonce: 48921</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="border-t border-slate-200 pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleVerifyLedger}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                <span>Verify Block Hash</span>
              </button>
              <button
                onClick={onDownloadDossier}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Download Signed Manifest</span>
              </button>
            </div>

            <button
              onClick={() => onNavigate('dossier')}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Open CVC Statutory Dossier</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
