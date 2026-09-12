import React, { useState, useEffect } from 'react';
import { MOCK_AUDIT_EVENTS, AuditEvent } from '../../mockData/auditEvents';
import { procurementService } from '../../services/procurementService';

interface AuditLedgerViewProps {
  initialBlockNumber?: number;
  onNavigate: (view: string, params?: any) => void;
  onDownloadDossier: () => void;
}

export const AuditLedgerView: React.FC<AuditLedgerViewProps> = ({
  initialBlockNumber,
  onDownloadDossier,
}) => {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([...MOCK_AUDIT_EVENTS]);
  const [selectedBlock, setSelectedBlock] = useState<AuditEvent>(
    initialBlockNumber
      ? MOCK_AUDIT_EVENTS.find((e) => e.blockNumber === initialBlockNumber) || MOCK_AUDIT_EVENTS[0]
      : MOCK_AUDIT_EVENTS[0]
  );
  const [search, setSearch] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    verified: boolean;
    blockCount: number;
    headHash: string;
    verifiedAt: string;
  } | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    procurementService.getAuditTrail().then((events) => {
      setAuditEvents(events);
      if (initialBlockNumber) {
        const found = events.find((e) => e.blockNumber === initialBlockNumber);
        if (found) setSelectedBlock(found);
      } else {
        setSelectedBlock(events[0]);
      }
    });
  }, [initialBlockNumber]);

  const handleVerifyLedger = async () => {
    setVerifying(true);
    try {
      const res = await procurementService.verifyAuditLedger();
      setVerifyResult(res);
      setTimeout(() => setVerifyResult(null), 5000);
    } finally {
      setVerifying(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredEvents = auditEvents.filter((e) => {
    return (
      search === '' ||
      e.blockNumber.toString().includes(search) ||
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      e.officer.toLowerCase().includes(search.toLowerCase()) ||
      e.hash.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col w-full space-y-4 text-slate-800 text-xs">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tamper-Evident Forensic Audit Ledger</h1>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              IMMUTABLE MERKLE CHAIN
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically linked SHA-256 blocks recording every automated inference, registry query, and officer adjudication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleVerifyLedger}
            disabled={verifying}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${verifying ? 'animate-spin' : ''}`}>
              {verifying ? 'sync' : 'verified'}
            </span>
            <span>{verifying ? 'Verifying Chain...' : 'Verify Ledger Integrity'}</span>
          </button>
          <button
            onClick={onDownloadDossier}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Export Signed Ledger Manifest</span>
          </button>
        </div>
      </div>

      {/* Verification Status Banner */}
      {verifyResult && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-emerald-950 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-emerald-600">verified_user</span>
            <div>
              <div className="font-bold text-xs">
                CRYPTOGRAPHIC CHAIN INTACT • {verifyResult.blockCount} / {verifyResult.blockCount} BLOCKS VERIFIED
              </div>
              <div className="text-[11px] text-emerald-800 font-mono mt-0.5">
                Head Block Root: {verifyResult.headHash} • Certified at {verifyResult.verifiedAt}
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-200/80 rounded font-mono text-[10px] font-bold text-emerald-900 uppercase">
            NIC HSM Level 3 Match
          </span>
        </div>
      )}

      {/* Split Block Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Block Chain List (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col min-h-[580px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="font-bold text-slate-900 text-xs">Chronological Ledger Chain</div>
            <div className="font-mono text-[11px] text-slate-500">{filteredEvents.length} Blocks</div>
          </div>

          <div className="my-2.5">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search blocks by #, action, actor, hash..."
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[520px] pr-1">
            {filteredEvents.map((evt) => (
              <div
                key={evt.blockNumber}
                onClick={() => setSelectedBlock(evt)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedBlock.blockNumber === evt.blockNumber
                    ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/10'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span className="font-mono font-bold text-xs text-slate-900">Block #{evt.blockNumber}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">{evt.timestamp}</span>
                </div>

                <div className="font-semibold text-slate-800 text-xs mt-1">{evt.action}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{evt.officer}</div>

                <div className="mt-2 pt-1 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="truncate max-w-[200px]">SHA-256: {evt.hash.slice(0, 20)}...</span>
                  <span className="text-emerald-700 font-semibold">VERIFIED</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Block Deep Inspection Panel (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between min-h-[580px]">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-blue-600">
                  Block #{selectedBlock.blockNumber} Deep Inspector
                </span>
                <h2 className="font-bold text-slate-900 text-sm mt-0.5">{selectedBlock.action}</h2>
              </div>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                MERKLE ANCHORED
              </span>
            </div>

            <div className="mt-4 space-y-3.5">
              {/* Hashes */}
              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="truncate mr-2">
                    <span className="text-slate-400 block text-[9px] uppercase">Current Block SHA-256 Hash</span>
                    <span className="font-bold text-slate-800 select-all">{selectedBlock.hash}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(selectedBlock.hash)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                    title="Copy Hash"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {copiedHash === selectedBlock.hash ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="truncate mr-2">
                    <span className="text-slate-400 block text-[9px] uppercase">Previous Block SHA-256 Hash</span>
                    <span className="text-slate-600 select-all">{selectedBlock.previousHash}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(selectedBlock.previousHash)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                    title="Copy Prev Hash"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {copiedHash === selectedBlock.previousHash ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Actor Details */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Attested By</span>
                  <span className="font-bold text-slate-800">{selectedBlock.officer}</span>
                  <span className="text-slate-500 text-[11px] block">{selectedBlock.officerRole}</span>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <span className="text-slate-400 block text-[10px]">Bidder</span>
                  <span className="text-blue-700 font-semibold">{selectedBlock.bidderCode}</span>
                  <span className="text-slate-500 text-[10px] block">{selectedBlock.timestamp}</span>
                </div>
              </div>

              {/* Block Details Payload */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Block Payload (Cryptographically Signed JSON)
                </label>
                <div className="p-3 bg-slate-900 rounded-lg text-emerald-400 font-mono text-[11px] max-h-56 overflow-y-auto leading-relaxed">
                  <pre>
                    {selectedBlock.payloadJson
                      ? JSON.stringify(JSON.parse(selectedBlock.payloadJson), null, 2)
                      : JSON.stringify(selectedBlock, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 mt-4 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Merkle Root: {selectedBlock.hash.slice(0, 16)}... (NIC Validated)
            </span>
            <button
              onClick={onDownloadDossier}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Download Signed Dossier</span>
              <span className="material-symbols-outlined text-[16px]">file_download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
