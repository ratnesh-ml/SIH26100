import React, { useState } from 'react';
import { X, Plus, AlertCircle, Loader2, FilePlus } from 'lucide-react';
import { createTender } from '../api/client';
import { TenderCreate, TenderDetail } from '../types';

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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create New Procurement Tender</h3>
              <p className="text-xs text-slate-400">Notice Inviting Tender (NIT) & Pre-Qualification Initialization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">NIT Number *</label>
              <input
                type="text"
                required
                value={nitNo}
                onChange={(e) => setNitNo(e.target.value)}
                placeholder="CPCL/PROC/2026/042"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Procurement Portal *</label>
              <select
                value={portal}
                onChange={(e: any) => setPortal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="CPPP">CPPP (Central Public Procurement)</option>
                <option value="GeM">GeM (Government e-Marketplace)</option>
                <option value="CPCL_PORTAL">CPCL In-house Portal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Tender Title / Scope of Work *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Supply of Heavy-Duty Catalyst Flow Valves for Manali Refinery"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Estimated Value (INR)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="15000000"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Bid Submission Due Date</label>
              <input
                type="date"
                value={bidDueDate}
                onChange={(e) => setBidDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">MII Local Content Class</label>
              <select
                value={miiClass}
                onChange={(e) => setMiiClass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="Class-I">Class-I Local Supplier (50% or more)</option>
                <option value="Class-II">Class-II Local Supplier (20% to 50%)</option>
                <option value="Non-Local Supplier">Non-Local Supplier</option>
              </select>
            </div>

            <div className="space-y-2 pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={mseApplicable}
                  onChange={(e) => setMseApplicable(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500"
                />
                <span>MSE Preference Applicable (Order 2012)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={requiresOem}
                  onChange={(e) => setRequiresOem(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500"
                />
                <span>Mandatory OEM Authorization Required</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Tender</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
