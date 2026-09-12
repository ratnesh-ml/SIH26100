import React, { useState } from 'react';
import { Modal } from '../common/Modal';

interface BidderUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (jobData: any) => void;
}

export const BidderUploadModal: React.FC<BidderUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
}) => {
  const [legalName, setLegalName] = useState('Apex Valves & Hydro Solutions Pvt Ltd');
  const [code, setCode] = useState('BID-APX-0992');
  const [fileName, setFileName] = useState('APEX_VALVES_BID_PACKAGE_2026.zip');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onUploadComplete({
        jobId: `job_${Date.now()}`,
        bidderId: code,
        legalName,
      });
      onClose();
    }, 700);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ingest Bidder Submission Package" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-800">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-blue-600">verified_user</span>
          <div>
            <div className="font-bold text-xs text-slate-900">Cryptographic CAS Pre-Flight Inspection</div>
            <div className="text-[11px] text-slate-500">
              Uploaded files are unpacked in memory, scanned with ClamAV, and hashed to prevent tamper and repudiation.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Bidder Legal Entity Name *</label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Assigned Bidder Code *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">Bid Submission Bundle (.ZIP / .PDF) *</label>
          <label className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer block">
            <input
              type="file"
              accept=".zip,.pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) setFileName(e.target.files[0].name);
              }}
            />
            <span className="material-symbols-outlined text-[32px] text-blue-600 mb-1 block">archive</span>
            <div className="font-semibold text-slate-900">{fileName}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Contains Technical Bid, Balance Sheets, Integrity Pact, EMD BG • 18.4 MB (Click to browse)
            </div>
          </label>
        </div>

        {/* Preflight Checkbox */}
        <div className="space-y-1.5 p-3 rounded-lg bg-emerald-50/50 border border-emerald-200 text-[11px] text-emerald-900">
          <div className="flex items-center gap-1.5 font-semibold">
            <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
            <span>Pre-flight Checks Ready:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
            <li>ZIP structure conforms to CPPP e-Procurement XML schema</li>
            <li>Digitally signed with DSC Class 3 Token</li>
            <li>No virus signatures detected</li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${submitting ? 'animate-spin' : ''}`}>
              {submitting ? 'sync' : 'play_arrow'}
            </span>
            <span>{submitting ? 'Unpacking & Running Pipeline...' : 'Start Ingestion & Run AI Pipeline'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
