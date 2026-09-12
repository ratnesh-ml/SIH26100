import React, { useState } from 'react';

interface BidderUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (bidder: any) => void;
  onUploadComplete?: (jobData: any) => void;
}

export const BidderUploadModal: React.FC<BidderUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  onUploadComplete,
}) => {
  const [selectedFile, setSelectedFile] = useState<string>('Bharat_Hydrotech_Bid_Package.zip');
  const [fileSize, setFileSize] = useState<string>('48.2 MB');
  const [sha256] = useState<string>('9b8f2d8a4e12bc7801aa48c89b27d410');
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleStartIngestion = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      const newBidder = {
        id: `BID-NEW-${Date.now().toString().slice(-4)}`,
        name: 'Apex Petrochem Engineering Ltd',
        code: 'BIDDER-F',
        legalName: 'Apex Petrochem Engineering Ltd',
        cin: 'U29100MH2020PTC345678',
        pan: 'AAACE4567K',
        gstin: '27AAACE4567K1Z8',
        tenderId: 'CPCL/MM/2026/PUMP-217',
        complianceStatus: 'PASS',
        riskScore: 18,
        riskLevel: 'LOW',
        officerDecision: 'QUALIFY',
        ipAddress: '103.21.58.140',
        sha256Hash: '9b8f2d8a4e12bc7801aa48c89b27d4109b8f2d8a4e12bc7801aa48c89b27d410',
        timestamp: new Date().toISOString(),
      };
      if (onUploadSuccess) onUploadSuccess(newBidder);
      if (onUploadComplete) onUploadComplete(newBidder);
      onClose();
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl my-auto bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Upload Bidder Package</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                CPCL/MM/2026/PUMP-217
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Securely ingest encrypted tender bids into the VigilBid forensic processing pipeline.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer"
            title="Close Dialog"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-800 text-xs">
          {/* File Selected Card / Drop Zone */}
          <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 bg-blue-50/20 hover:bg-blue-50/40 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">folder_zip</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 text-xs">{selectedFile}</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {fileSize} • SHA-256: {sha256}...
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedFile('Sri_Kaveri_Turbines_Bid.zip');
                  setFileSize('36.4 MB');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

          {/* Security Validation Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[18px]">verified_user</span>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Automated Pre-Ingestion Security Gates
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                5 Protocols Configured
              </span>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              {/* Item 1: Magic-byte validation */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Magic-byte validation</div>
                  <div className="text-[11px] text-slate-500 leading-tight">
                    Header binary signature check (<span className="font-mono">PK\x03\x04</span> match)
                  </div>
                </div>
              </div>

              {/* Item 2: Archive expansion protection */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Archive expansion protection</div>
                  <div className="text-[11px] text-slate-500 leading-tight">
                    Zip bomb prevention & max ratio threshold limit (10:1)
                  </div>
                </div>
              </div>

              {/* Item 3: Path traversal protection */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Path traversal protection</div>
                  <div className="text-[11px] text-slate-500 leading-tight">
                    Relative directory traversal (<span className="font-mono">../</span>) neutralization
                  </div>
                </div>
              </div>

              {/* Item 4: Malware scan */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Malware scan</div>
                  <div className="text-[11px] text-slate-500 leading-tight">
                    ClamAV & heuristic macro engine definitions up to date
                  </div>
                </div>
              </div>

              {/* Item 5: SHA-256 fingerprinting */}
              <div className="md:col-span-2 flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                </div>
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-800">SHA-256 fingerprinting</div>
                    <span className="text-[10px] text-emerald-700 font-bold">Tamper-Proof Audit Anchor</span>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Cryptographic envelope hash generated & pinned to immutable audit ledger
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Small Security Notice Card */}
          <div className="flex items-start gap-3 p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
            <span className="material-symbols-outlined text-[20px] text-blue-600 shrink-0 mt-0.5">info</span>
            <div className="text-xs text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-800">Isolation Guarantee:</span> “Bidder documents are treated as
              untrusted input and isolated before processing.” Sanitization runs inside an ephemeral gVisor
              zero-privilege micro-sandbox.
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
            <span>NIC-CERT Sandbox Ready • Policy v4.2 Enforced</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleStartIngestion}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">security</span>
              <span>{uploading ? 'Ingesting & Fingerprinting...' : 'Start Secure Ingestion'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
