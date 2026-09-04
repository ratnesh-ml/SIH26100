import React, { useState } from 'react';
import { FilePlus } from 'lucide-react';
import { createTender } from '../api/client';
import { TenderCreate, TenderDetail } from '../types';
import { Modal, Button, ErrorState } from './ui';

interface TenderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTenderCreated: (newTender: TenderDetail) => void;
}

export const TenderCreateModal: React.FC<TenderCreateModalProps> = ({
  isOpen,
  onClose,
  onTenderCreated,
}) => {
  const [nitNo, setNitNo] = useState('');
  const [title, setTitle] = useState('');
  const [portal, setPortal] = useState<'GeM' | 'CPPP' | 'CPCL_PORTAL'>('CPPP');
  const [estimatedValue, setEstimatedValue] = useState<string>('15000000');
  const [bidDueDate, setBidDueDate] = useState('2026-11-30');
  const [mseApplicable, setMseApplicable] = useState(true);
  const [miiClass, setMiiClass] = useState('Class-I');
  const [requiresOem, setRequiresOem] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nitNo.trim() || !title.trim()) {
      setError('NIT Number and Contract Title are required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload: TenderCreate = {
      nit_no: nitNo.trim(),
      title: title.trim(),
      portal,
      estimated_value: estimatedValue ? parseFloat(estimatedValue) : undefined,
      bid_due_date: bidDueDate || undefined,
      mse_applicable: mseApplicable,
      mii_class_required: miiClass,
      requires_oem: requiresOem,
      template: 'cpcl_goods_v1',
    };

    try {
      const created = await createTender(payload);
      onTenderCreated(created);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize tender.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Procurement Tender"
      description="Notice Inviting Tender (NIT) & Pre-Qualification Initialization"
      icon={<FilePlus className="w-5 h-5" />}
      maxWidth="xl"
    >
      {error && (
        <ErrorState
          message={error}
          onDismiss={() => setError(null)}
          className="mb-4"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tender-nit-no" className="block font-semibold text-slate-200 mb-1">
              NIT Reference Number <span className="text-rose-400">*</span>
            </label>
            <input
              id="tender-nit-no"
              type="text"
              required
              value={nitNo}
              onChange={(e) => setNitNo(e.target.value)}
              placeholder="e.g. CPCL/PROC/PUMP/2026/04"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono transition-colors"
            />
          </div>

          <div>
            <label htmlFor="tender-portal" className="block font-semibold text-slate-200 mb-1">
              Procurement Portal <span className="text-rose-400">*</span>
            </label>
            <select
              id="tender-portal"
              value={portal}
              onChange={(e) => setPortal(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
            >
              <option value="CPPP">Central Public Procurement Portal (CPPP)</option>
              <option value="GeM">Government e-Marketplace (GeM)</option>
              <option value="CPCL_PORTAL">CPCL In-House Portal</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="tender-title" className="block font-semibold text-slate-200 mb-1">
            Contract Scope & Description <span className="text-rose-400">*</span>
          </label>
          <input
            id="tender-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Supply, Installation, and Commissioning of API-610 Process Pumps"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tender-estimated-value" className="block font-semibold text-slate-200 mb-1">
              Estimated Tender Value (INR)
            </label>
            <input
              id="tender-estimated-value"
              type="number"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              placeholder="e.g. 15000000"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono transition-colors"
            />
          </div>

          <div>
            <label htmlFor="tender-bid-due-date" className="block font-semibold text-slate-200 mb-1">
              Bid Submission Due Date
            </label>
            <input
              id="tender-bid-due-date"
              type="date"
              value={bidDueDate}
              onChange={(e) => setBidDueDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
        </div>

        {/* Statutory Policy Preferences */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider block">
            Statutory Evaluation Mandates (GFR 2017 & CVC 2021)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mseApplicable}
                onChange={(e) => setMseApplicable(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-950 cursor-pointer"
              />
              <span className="text-slate-300 text-xs">MSE Preference (PP Policy)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresOem}
                onChange={(e) => setRequiresOem(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-950 cursor-pointer"
              />
              <span className="text-slate-300 text-xs">OEM Auth Required</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs shrink-0">MII Class:</span>
              <select
                aria-label="Make in India Local Content Class"
                value={miiClass}
                onChange={(e) => setMiiClass(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="Class-I">Class-I (≥50%)</option>
                <option value="Class-II">Class-II (≥20%)</option>
                <option value="Non-Local">Non-Local</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            leftIcon={<FilePlus className="w-4 h-4" />}
          >
            Create Tender
          </Button>
        </div>
      </form>
    </Modal>
  );
};
