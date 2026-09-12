import React, { useState } from 'react';
import { Modal } from '../common/Modal';

interface TenderUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tenderData: any) => void;
}

export const TenderUploadModal: React.FC<TenderUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [refNo, setRefNo] = useState('CPCL/MM/2026/HYDRO-901');
  const [gemId, setGemId] = useState('GEM/2026/B/914022');
  const [title, setTitle] = useState('High Pressure Hydrocracker Feed Pumps');
  const [value, setValue] = useState('24.50');
  const [psu, setPsu] = useState('CPCL');
  const [fileName, setFileName] = useState('NIT_SPEC_HYDRO_2026.pdf');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onSuccess({
        id: `TND-${Date.now().toString().slice(-4)}`,
        refNo,
        gemId,
        title,
        estimatedValue: `₹${value} Cr`,
        psu,
        biddersCount: 0,
        flaggedCount: 0,
        stage: 'Prequalification / Eligibility',
        progress: 10,
        scope: 'Critical Refinery Hydrocracker Package • API-610 BB5 Heavy Duty',
      });
      onClose();
    }, 600);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Induct New Public Tender Package" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-800">
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center gap-2.5 text-blue-900">
          <span className="material-symbols-outlined text-[20px] text-blue-700">verified</span>
          <div>
            <div className="font-bold text-xs">Statutory CPPP / GeM 4.0 Integration Gateway</div>
            <div className="text-[11px] text-blue-700">
              New tender metadata is automatically signed with Class 3 DSC token and anchored to the forensic Merkle ledger.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Tender Reference ID *</label>
            <input
              type="text"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Global GeM Bid ID *</label>
            <input
              type="text"
              value={gemId}
              onChange={(e) => setGemId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">Tender Title & Duty Specification *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Estimated Value (₹ Crores) *</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">PSU / Sponsoring Agency *</label>
            <select
              value={psu}
              onChange={(e) => setPsu(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-blue-600"
            >
              <option value="CPCL">Chennai Petroleum Corporation Ltd (CPCL)</option>
              <option value="IOCL">Indian Oil Corporation Ltd (IOCL)</option>
              <option value="ONGC">Oil & Natural Gas Corporation (ONGC)</option>
              <option value="GAIL">GAIL (India) Limited</option>
              <option value="BPCL">Bharat Petroleum Corporation Ltd (BPCL)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">Notice Inviting Tender (NIT) Document *</label>
          <label className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer block">
            <input
              type="file"
              accept=".pdf,.zip,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) setFileName(e.target.files[0].name);
              }}
            />
            <span className="material-symbols-outlined text-[28px] text-blue-600 mb-1 block">upload_file</span>
            <div className="font-semibold text-slate-800">{fileName}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">PDF/A • SHA-256 Calculated • 4.2 MB (Click to browse)</div>
          </label>
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
              {submitting ? 'sync' : 'add_task'}
            </span>
            <span>{submitting ? 'Initializing Ledger...' : 'Induct Tender & Initialize Pipeline'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
