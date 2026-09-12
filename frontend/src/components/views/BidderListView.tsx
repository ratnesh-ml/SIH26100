import React, { useState, useMemo } from 'react';
import { Bidder, MOCK_BIDDERS } from '../../mockData/bidders';

interface BidderListViewProps {
  onSelectBidder: (bidder: Bidder) => void;
  onOpenUploadModal: () => void;
  onNavigate: (view: string, params?: any) => void;
}

interface BidderEvaluationItem {
  id: string;
  name: string;
  badge?: { label: string; bg: string; text: string; border: string };
  gstin: string;
  location: string;
  category: string;
  envelopes: string;
  envelopeDetail: string;
  envelopeAlert?: boolean;
  complianceScore: number;
  complianceLabel: string;
  complianceColor: string;
  riskBand: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  riskScore: number;
  pValue: string;
  criticalFinding: string;
  verifications: Array<{ label: string; icon: string; bg: string; text: string; border: string }>;
  decision: 'DISQUALIFIED' | 'FAIL' | 'REVIEW' | 'PASS';
  isIsolated?: boolean;
}

const EVALUATION_BIDDERS: BidderEvaluationItem[] = [
  {
    id: 'BID-HYD-0419',
    name: 'Bharat Hydrotech Corp',
    badge: { label: 'PROBABLE CARTEL', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' },
    gstin: '27AABCB8899K1Z4',
    location: 'Pune, MH',
    category: 'Non-MSE Entity',
    envelopes: '14/14 Envelopes',
    envelopeDetail: 'Hash Mismatch Alert',
    envelopeAlert: true,
    complianceScore: 32,
    complianceLabel: 'Disqualified',
    complianceColor: 'text-rose-600',
    riskBand: 'CRITICAL',
    riskScore: 94,
    pValue: '<0.001',
    criticalFinding: 'Land Border Violation: Beneficial ownership traced to HK entity without DPIIT clearance (F.No.6/18).',
    verifications: [
      { label: 'DPIIT Non-Compliant', icon: 'cancel', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
      { label: 'Shared Director Match', icon: 'group_off', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
      { label: 'CCI Alert Flagged', icon: 'warning', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    ],
    decision: 'DISQUALIFIED',
  },
  {
    id: 'BID-ZEN-0891',
    name: 'Zenith Infra Tech Pvt Ltd',
    gstin: '07AABCK9923L1ZF',
    location: 'Delhi NCR',
    category: 'Medium Enterprise',
    envelopes: '12/14 Envelopes',
    envelopeDetail: 'Missing Net Worth Cert',
    envelopeAlert: true,
    complianceScore: 41,
    complianceLabel: 'Disqualified',
    complianceColor: 'text-rose-600',
    riskBand: 'HIGH',
    riskScore: 86,
    pValue: '0.012',
    criticalFinding: 'Shared Bidding IP with Bharat Hydrotech Corp (103.21.58.114). Net Worth Deficiency: Audited NW ₹1.12 Cr vs ₹3.68 Cr requirement.',
    verifications: [
      { label: 'Net Worth Deficient', icon: 'trending_down', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
      { label: 'Anti-Cartel Warning', icon: 'device_hub', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    ],
    decision: 'FAIL',
  },
  {
    id: 'BID-NOV-0312',
    name: 'Nova Pumps & Systems Ltd',
    gstin: '24AAGCS4512P1ZM',
    location: 'Vadodara, GJ',
    category: 'Class-I Local Supplier (58%)',
    envelopes: '14/14 Valid',
    envelopeDetail: 'e-Signed Class 3 DSC',
    complianceScore: 78,
    complianceLabel: 'Conditional',
    complianceColor: 'text-amber-600',
    riskBand: 'MEDIUM',
    riskScore: 42,
    pValue: '0.180',
    criticalFinding: 'Warranty clause deviation: Requested 36 months vs tender stipulation of 48 months on impeller casting.',
    verifications: [
      { label: 'MCA21 Active', icon: 'verified', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
      { label: 'CQ Dispatched', icon: 'help_outline', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    ],
    decision: 'REVIEW',
  },
  {
    id: 'BID-KAV-0105',
    name: 'Sri Kaveri Engineering Works',
    gstin: '33AAACA1122Q1Z3',
    location: 'Coimbatore, TN',
    category: 'MSE Micro Enterprise',
    envelopes: '14/14 Valid',
    envelopeDetail: 'e-Signed Class 3 DSC',
    complianceScore: 91,
    complianceLabel: 'Eligible',
    complianceColor: 'text-emerald-700',
    riskBand: 'LOW',
    riskScore: 12,
    pValue: '0.892',
    criticalFinding: 'GFR 161 turnover waiver claimed under valid Udyam registration. Validated past PSU performance certificates.',
    verifications: [
      { label: 'Udyam Cert Valid', icon: 'verified_user', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
      { label: 'MSME API Active', icon: 'cloud_done', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    ],
    decision: 'PASS',
  },
  {
    id: 'BID-MER-0018',
    name: 'Meridian Flow Systems Pvt Ltd',
    gstin: '29AABFT7821H1ZQ',
    location: 'Bengaluru, KA',
    category: 'Class-I Local (72%)',
    envelopes: '14/14 Valid',
    envelopeDetail: 'e-Signed (Valid 2027)',
    complianceScore: 96,
    complianceLabel: 'Optimal',
    complianceColor: 'text-emerald-700',
    riskBand: 'LOW',
    riskScore: 4,
    pValue: '0.984',
    criticalFinding: 'Clean compliance run. Audited financial statements fully reconcilable with MCA21. Solvency certificate verified.',
    verifications: [
      { label: 'UDIN ICAI Verified', icon: 'lock', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
      { label: 'NIC-CERT Valid', icon: 'shield', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    ],
    decision: 'PASS',
  },
];

export const BidderListView: React.FC<BidderListViewProps> = ({
  onSelectBidder,
  onOpenUploadModal,
  onNavigate,
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'PASS' | 'REVIEW' | 'FAIL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'risk' | 'name' | 'compliance'>('risk');
  const [isolatedBidders, setIsolatedBidders] = useState<Record<string, boolean>>({});
  const [scanRunning, setScanRunning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleIsolate = () => {
    setIsolatedBidders((prev) => ({
      ...prev,
      'BID-HYD-0419': true,
      'BID-ZEN-0891': true,
    }));
    setScanMessage('Subnet cluster isolated: Bharat Hydrotech & Zenith envelopes locked for statutory scrutiny.');
    setTimeout(() => setScanMessage(null), 5000);
  };

  const handleRunScan = () => {
    setScanRunning(true);
    setTimeout(() => {
      setScanRunning(false);
      setScanMessage('Automated scan finished: 5 envelopes evaluated, 2 high-risk anomalies reaffirmed.');
      setTimeout(() => setScanMessage(null), 5000);
    }, 1200);
  };

  const filteredBidders = useMemo(() => {
    return EVALUATION_BIDDERS.filter((b) => {
      const matchesSearch =
        searchQuery === '' ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.gstin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterTab === 'PASS') return b.decision === 'PASS';
      if (filterTab === 'REVIEW') return b.decision === 'REVIEW';
      if (filterTab === 'FAIL') return b.decision === 'FAIL' || b.decision === 'DISQUALIFIED';
      return true;
    }).sort((a, b) => {
      if (sortBy === 'risk') return b.riskScore - a.riskScore;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'compliance') return b.complianceScore - a.complianceScore;
      return 0;
    });
  }, [filterTab, searchQuery, sortBy]);

  return (
    <div className="flex flex-col w-full space-y-4 text-slate-800 text-xs">
      {/* Toast alert */}
      {scanMessage && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-md flex items-center justify-between border border-blue-500 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">info</span>
            <span className="text-xs font-semibold">{scanMessage}</span>
          </div>
          <button onClick={() => setScanMessage(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: Page Header & Top Operations Bar */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bidder Evaluation</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              EVALUATION IN PROGRESS
            </span>
            <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              CPCL/MM/2026/PUMP-217
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review bidder compliance, examine cryptographic verifications, and prioritize statutory committee determinations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-1">
            <span className="material-symbols-outlined text-[15px] text-slate-400">sync</span>
            <span>Last synced 2m ago</span>
          </div>
          <button
            onClick={() => onNavigate('dossier')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">file_download</span>
            Export TEC Dossier
          </button>
          <button
            onClick={handleRunScan}
            disabled={scanRunning}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">
              {scanRunning ? 'progress_activity' : 'verified_user'}
            </span>
            {scanRunning ? 'Scanning...' : 'Run Automated Red-Flag Scan'}
          </button>
          <button
            onClick={onOpenUploadModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 shadow-2xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            Ingest Bidder
          </button>
        </div>
      </section>

      {/* SECTION 2: Top Summary KPI Cards (5 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Bidders */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Total Bidders</span>
            <span className="material-symbols-outlined text-blue-500 text-[18px]">inventory_2</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900">5</div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">All envelopes ingested & decrypted</div>
          </div>
        </div>

        {/* Card 2: Pass */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Pass</span>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
              40% POOL
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-700 flex items-center gap-1.5">
              <span>2</span>
              <span className="text-xs font-semibold text-slate-400">PASS</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">Meridian Flow & Sri Kaveri</div>
          </div>
        </div>

        {/* Card 3: Review */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Review</span>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
              PENDING CQ
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-600 flex items-center gap-1.5">
              <span>1</span>
              <span className="text-xs font-semibold text-slate-400">REVIEW</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">Warranty deviation (Nova Pumps)</div>
          </div>
        </div>

        {/* Card 4: Fail */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Fail</span>
            <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">
              INELIGIBLE
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-rose-600 flex items-center gap-1.5">
              <span>2</span>
              <span className="text-xs font-semibold text-slate-400">FAIL</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">Bharat Hydrotech & Zenith Infra</div>
          </div>
        </div>

        {/* Card 5: High Risk */}
        <div className="bg-rose-50/40 border border-rose-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-800 uppercase tracking-wide">
            <span>High Risk</span>
            <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">
              ALERT
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-rose-700 flex items-center gap-1.5">
              <span>2</span>
              <span className="text-xs font-semibold text-rose-600 uppercase">High Risk</span>
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-0.5 truncate">Cartel & Land Border Rule triggers</div>
          </div>
        </div>
      </section>

      {/* SECTION 3: High-Priority Alert Banner */}
      <section className="bg-rose-50 border border-rose-200 rounded-lg p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-rose-600">
              <span className="material-symbols-outlined text-[18px]">warning</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  High Priority Alert: Subnet Clustered Bidding Detected
                </h2>
                <span className="text-[10px] font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded border border-rose-200 uppercase">
                  GFR 144(xi)
                </span>
                <span className="text-[10px] font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded border border-rose-200 uppercase">
                  CCI RULE 3
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                <strong className="font-semibold text-slate-800">Bharat Hydrotech Corp</strong> and{' '}
                <strong className="font-semibold text-slate-800">Zenith Infra Tech Pvt Ltd</strong> submitted encrypted
                commercial envelopes from identical IP subnet{' '}
                <code className="font-mono bg-rose-100 text-rose-800 px-1 py-0.5 rounded text-[11px]">
                  103.21.58.114/29
                </code>{' '}
                within 14 minutes. Immediate statutory scrutiny invoked.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 self-end lg:self-center">
            <button
              onClick={() => onNavigate('graph')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              Audit Subnet Graph
            </button>
            <button
              onClick={handleIsolate}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Isolate Submissions
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 4: Main Bidder Evaluation Table & Controls */}
      <section className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        {/* Table Toolbar & Filters */}
        <div className="p-3 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search & Status Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-64">
              <span className="material-symbols-outlined text-slate-400 absolute left-2.5 top-2 text-[16px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by Name, GSTIN, PAN..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
            {/* Filter Pills */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setFilterTab('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterTab === 'ALL'
                    ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All (5)
              </button>
              <button
                onClick={() => setFilterTab('PASS')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterTab === 'PASS'
                    ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Passed (2)
              </button>
              <button
                onClick={() => setFilterTab('REVIEW')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterTab === 'REVIEW'
                    ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Review (1)
              </button>
              <button
                onClick={() => setFilterTab('FAIL')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterTab === 'FAIL'
                    ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Disqualified (2)
              </button>
            </div>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg py-1 px-2.5 focus:outline-none cursor-pointer"
            >
              <option value="risk">Risk Score (High to Low)</option>
              <option value="name">Bidder Name (A-Z)</option>
              <option value="compliance">Compliance Score (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Bidder Details</th>
                <th className="py-3 px-3">Documents</th>
                <th className="py-3 px-3">Compliance</th>
                <th className="py-3 px-3">Risk Score</th>
                <th className="py-3 px-4 min-w-[280px]">Critical Findings</th>
                <th className="py-3 px-3">Verifications</th>
                <th className="py-3 px-3">Decision</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredBidders.map((b) => {
                const isIsolated = isolatedBidders[b.id];
                return (
                  <tr
                    key={b.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isIsolated ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    {/* 1. Bidder Details */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs hover:text-blue-600 cursor-pointer"
                              onClick={() => onNavigate('scrutiny', { bidderId: b.id })}
                            >
                              {b.name}
                            </span>
                            {b.badge && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border ${b.badge.bg} ${b.badge.text} ${b.badge.border}`}
                              >
                                {b.badge.label}
                              </span>
                            )}
                            {isIsolated && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase bg-red-100 text-red-800 border border-red-300">
                                ISOLATED
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span className="font-mono text-slate-600">GSTIN: {b.gstin}</span>
                            <span>•</span>
                            <span>{b.location}</span>
                            <span>•</span>
                            <span>{b.category}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Documents */}
                    <td className="py-3.5 px-3 align-top whitespace-nowrap">
                      <div className="text-xs font-semibold text-slate-800">{b.envelopes}</div>
                      <div
                        className={`text-[10.5px] mt-0.5 ${
                          b.envelopeAlert ? 'text-rose-600 font-semibold' : 'text-slate-500'
                        }`}
                      >
                        {b.envelopeDetail}
                      </div>
                    </td>

                    {/* 3. Compliance */}
                    <td className="py-3.5 px-3 align-top whitespace-nowrap">
                      <div className={`text-xs font-bold ${b.complianceColor}`}>{b.complianceScore}%</div>
                      <div className="text-[10.5px] text-slate-500 mt-0.5">{b.complianceLabel}</div>
                    </td>

                    {/* 4. Risk Score */}
                    <td className="py-3.5 px-3 align-top whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            b.riskBand === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : b.riskBand === 'HIGH'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : b.riskBand === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {b.riskBand} • {b.riskScore}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">P-Value: {b.pValue}</div>
                    </td>

                    {/* 5. Critical Findings */}
                    <td className="py-3.5 px-4 align-top text-xs text-slate-600 leading-relaxed">
                      {b.criticalFinding}
                    </td>

                    {/* 6. Verifications */}
                    <td className="py-3.5 px-3 align-top">
                      <div className="flex flex-col gap-1">
                        {b.verifications.map((v, vi) => (
                          <span
                            key={vi}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${v.bg} ${v.text} ${v.border}`}
                          >
                            <span className="material-symbols-outlined text-[12px]">{v.icon}</span>
                            <span>{v.label}</span>
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* 7. Decision */}
                    <td className="py-3.5 px-3 align-top whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                          b.decision === 'DISQUALIFIED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : b.decision === 'FAIL'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : b.decision === 'REVIEW'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {b.decision}
                      </span>
                    </td>

                    {/* 8. Action */}
                    <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            const match = MOCK_BIDDERS.find((x) => x.id === b.id) || MOCK_BIDDERS[0];
                            if (onSelectBidder) onSelectBidder(match);
                            onNavigate('scrutiny', { bidderId: b.id });
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => onNavigate('dossier')}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 shadow-2xs transition-colors cursor-pointer"
                        >
                          Review Dossier
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
