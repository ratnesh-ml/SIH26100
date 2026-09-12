import React, { useState } from 'react';

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
  const [tenderId, setTenderId] = useState('CPCL/MM/2026/PUMP-218');
  const [title, setTitle] = useState('API-610 Centrifugal Process Pumps for CDU-III');
  const [org, setOrg] = useState('Chennai Petroleum Corporation Limited (CPCL)');
  const [category, setCategory] = useState('Mechanical & Heavy Process Machinery (Capex)');
  const [estimatedValue, setEstimatedValue] = useState('₹18,40,00,000');
  const [minTurnover, setMinTurnover] = useState('₹5,52,00,000');
  const [minNetWorth, setMinNetWorth] = useState('₹1,84,00,000');
  const [deadline, setDeadline] = useState('2026-03-25 15:00 IST');

  const [rules, setRules] = useState({
    gfr144: true,
    gfr161: true,
    ppMii: true,
    fNo618: true,
    cvcList: true,
    mca21: true,
  });

  const [enclosures, setEnclosures] = useState([
    'EMD / e-PBG Nic-eSeal',
    'Audited Balance Sheets (3 FYs)',
    'Form-I MII Local Content Affidavit',
    'GFR 144(xi) Undertaking',
  ]);

  if (!isOpen) return null;

  const handleToggleRule = (key: keyof typeof rules) => {
    setRules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRemoveEnclosure = (enc: string) => {
    setEnclosures((prev) => prev.filter((e) => e !== enc));
  };

  const handleAddEnclosure = () => {
    const name = prompt('Enter name of required statutory enclosure:');
    if (name && name.trim()) {
      setEnclosures((prev) => [...prev, name.trim()]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess({
      id: `TND-${Date.now().toString().slice(-4)}`,
      refNo: tenderId,
      gemId: 'GEM/2026/B/892118',
      title,
      estimatedValue: '₹18.40 Cr',
      organization: 'CPCL',
      bidderCount: 0,
      stage: 'Prequalification / Eligibility',
      progressPercent: 5,
      riskSummary: { high: 0, medium: 0, low: 0 },
      description: 'API-610 Centrifugal Process Pumps for Crude Distillation Unit-III • Heavy Duty Process',
      scope: 'API-610 Centrifugal Process Pumps • Heavy Duty Process',
    });
    onClose();
  };

  const activeRuleCount = Object.values(rules).filter(Boolean).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl my-auto bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Create New Tender</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                NIC-CPPP Form v4.8
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Secure Induction
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Enter procurement parameters, statutory oversight rules, and qualifying baseline criteria.
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-slate-800 text-xs flex-1">
          {/* Section 1: Basic Information */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-slate-900">1. Basic Information</h3>
                <span className="text-[11px] text-slate-500">Primary identification and financial estimate</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">verified</span> NIC Auto-generated
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              <div className="md:col-span-4 flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Tender ID</label>
                <input
                  className="h-9 px-3 rounded-lg border border-slate-300 bg-white font-mono text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                  type="text"
                  value={tenderId}
                  onChange={(e) => setTenderId(e.target.value)}
                />
              </div>
              <div className="md:col-span-8 flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Tender Title</label>
                <input
                  className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter tender subject and equipment specifications..."
                  required
                />
              </div>
              <div className="md:col-span-5 flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Organization / Procuring Entity</label>
                <select
                  className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                >
                  <option value="Chennai Petroleum Corporation Limited (CPCL)">Chennai Petroleum Corporation Limited (CPCL)</option>
                  <option value="Indian Oil Corporation Limited (IOCL)">Indian Oil Corporation Limited (IOCL)</option>
                  <option value="Oil and Natural Gas Corporation (ONGC)">Oil and Natural Gas Corporation (ONGC)</option>
                  <option value="Bharat Petroleum Corporation Limited (BPCL)">Bharat Petroleum Corporation Limited (BPCL)</option>
                  <option value="GAIL (India) Limited">GAIL (India) Limited</option>
                </select>
              </div>
              <div className="md:col-span-4 flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Procurement Category</label>
                <select
                  className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>Mechanical & Heavy Process Machinery (Capex)</option>
                  <option>Electrical & Instrumentation Packages</option>
                  <option>Civil Infrastructure & Foundation Works</option>
                  <option>Technical Maintenance & Turnaround Services</option>
                </select>
              </div>
              <div className="md:col-span-3 flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Estimated Value</span>
                  <span className="text-[10px] text-blue-600 font-bold">(Approx. ₹18.40 Cr)</span>
                </label>
                <input
                  className="h-9 w-full px-3 rounded-lg border border-slate-300 bg-white font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  type="text"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Statutory Directives & Compliance Screening */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-slate-900">2. Statutory Directives & Compliance Screening</h3>
                <span className="text-[11px] text-slate-500">Automated scrutinies applied to participating bidder envelopes</span>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
                {activeRuleCount} Rules Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <label
                onClick={() => handleToggleRule('gfr144')}
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  rules.gfr144 ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white'
                }`}
              >
                <input
                  checked={rules.gfr144}
                  onChange={() => {}}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  type="checkbox"
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-mono">
                      GFR 144
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">Border Country Protocol</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Mandatory Land border registration & competent authority clearance check.
                  </p>
                </div>
              </label>

              <label
                onClick={() => handleToggleRule('gfr161')}
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  rules.gfr161 ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white'
                }`}
              >
                <input
                  checked={rules.gfr161}
                  onChange={() => {}}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  type="checkbox"
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-mono">
                      GFR 161
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">MSE / Startup Exemption</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Prior turnover & experience waiver criteria for registered micro & small units.
                  </p>
                </div>
              </label>

              <label
                onClick={() => handleToggleRule('ppMii')}
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  rules.ppMii ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white'
                }`}
              >
                <input
                  checked={rules.ppMii}
                  onChange={() => {}}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  type="checkbox"
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-mono">
                      PPP-MII
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">Class-I Local Content</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Make in India mandate: Minimum 50% domestic value add with 20% margin.
                  </p>
                </div>
              </label>

              <label
                onClick={() => handleToggleRule('fNo618')}
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  rules.fNo618 ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white'
                }`}
              >
                <input
                  checked={rules.fNo618}
                  onChange={() => {}}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  type="checkbox"
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 font-mono">
                      F.No.6/18
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">Beneficial Ownership</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Real-time screening of ultimate beneficiaries across multinational consortiums.
                  </p>
                </div>
              </label>

              <label
                onClick={() => handleToggleRule('cvcList')}
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  rules.cvcList ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white'
                }`}
              >
                <input
                  checked={rules.cvcList}
                  onChange={() => {}}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  type="checkbox"
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 font-mono">
                      CVC-LIST
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">Debarment Cross-Check</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Central automated verification against CVC, GeM, and PSU blacklist ledgers.
                  </p>
                </div>
              </label>

              <label
                onClick={() => handleToggleRule('mca21')}
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  rules.mca21 ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white'
                }`}
              >
                <input
                  checked={rules.mca21}
                  onChange={() => {}}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  type="checkbox"
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 font-mono">
                      MCA-21
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">Financial Qualification</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Automated balance sheet, UDIN, and MCA registry audit reconciliation.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Tender Requirements & Enclosures */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-slate-900">3. Tender Requirements & Enclosures</h3>
                <span className="text-[11px] text-slate-500">Bidding eligibility criteria and envelope submission deadline</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Minimum Annual Turnover</label>
                <input
                  className="h-9 px-3 rounded-lg border border-slate-300 bg-white font-mono text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  type="text"
                  value={minTurnover}
                  onChange={(e) => setMinTurnover(e.target.value)}
                />
                <span className="text-[10.5px] text-slate-500">30% Capex baseline over past 3 financial years</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Minimum Net Worth</label>
                <input
                  className="h-9 px-3 rounded-lg border border-slate-300 bg-white font-mono text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  type="text"
                  value={minNetWorth}
                  onChange={(e) => setMinNetWorth(e.target.value)}
                />
                <span className="text-[10.5px] text-slate-500">10% Positive net worth check as per audited CA report</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Bid Submission Deadline</span>
                  <span className="text-[10.5px] text-slate-500 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[13px]">lock</span> Encrypted Lock
                  </span>
                </label>
                <input
                  className="h-9 px-3 rounded-lg border border-slate-300 bg-white font-mono text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  type="text"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
                <span className="text-[10.5px] text-slate-500">All submissions sealed until TEC decrypts session</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <label className="text-xs font-semibold text-slate-700">Required Mandatory Enclosures</label>
              <div className="flex items-center flex-wrap gap-2">
                {enclosures.map((enc) => (
                  <span
                    key={enc}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white border border-slate-300 text-slate-800 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[15px] text-blue-600">task_alt</span>
                    {enc}
                    <button
                      onClick={() => handleRemoveEnclosure(enc)}
                      className="hover:text-rose-600 ml-0.5 text-slate-400 font-bold cursor-pointer"
                      type="button"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  onClick={handleAddEnclosure}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-blue-600 border border-dashed border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  Add Enclosure
                </button>
              </div>
            </div>
          </div>

          {/* Security Callout */}
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs">
            <span className="material-symbols-outlined text-[20px] text-blue-600 shrink-0">security</span>
            <p className="leading-relaxed">
              <strong>NIC-CERT e-Token Security:</strong> Once created, this tender will be cryptographically locked with
              SHA-256 hash tracking and automated CVC compliance screening on all incoming submissions.
            </p>
          </div>

          {/* Footer inside form */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>
                Status: <strong className="text-slate-900 font-semibold">Draft Ready</strong> ({activeRuleCount} rules
                active, 0 validation errors)
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                type="button"
              >
                Save Draft
              </button>
              <button
                type="submit"
                className="rounded-lg px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Create Tender</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
