import React, { useState, useMemo } from 'react';

interface ComplianceMatrixViewProps {
  onNavigate: (view: string, params?: any) => void;
  onDownloadDossier: () => void;
}

interface MatrixRule {
  id: string;
  code: string;
  title: string;
  authority: string;
  category: string;
  groupId: string;
  groupName: string;
  bidders: {
    meridian: { status: 'PASS' | 'WARN' | 'REVIEW' | 'FAIL'; note: string };
    kaveri: { status: 'PASS' | 'WARN' | 'REVIEW' | 'FAIL'; note: string };
    bharat: { status: 'PASS' | 'WARN' | 'REVIEW' | 'FAIL'; note: string };
    nova: { status: 'PASS' | 'WARN' | 'REVIEW' | 'FAIL'; note: string };
    zenith: { status: 'PASS' | 'WARN' | 'REVIEW' | 'FAIL'; note: string };
  };
}

const MATRIX_GROUPS = [
  {
    id: 'grp-1',
    title: '1. Identity & Statutory Registry Verification',
    ruleCount: '6 verification rules',
    authority: 'Authority: GFR 144(i) & MCA21',
  },
  {
    id: 'grp-2',
    title: '2. Financial Eligibility & PQC Qualification',
    ruleCount: '7 financial rules',
    authority: 'Threshold: Min ₹12.00 Cr 3-Yr Avg Turnover',
  },
  {
    id: 'grp-3',
    title: '3. Statutory & Public Procurement Policy Mandates',
    ruleCount: '8 statutory rules',
    authority: 'Standards: Make-in-India PPO & GFR 144(xi) Land Border',
  },
  {
    id: 'grp-4',
    title: '4. Technical Specifications & Engineering Compliance',
    ruleCount: '7 technical criteria',
    authority: 'Standard: API-610 12th Edition Centrifugal Pumps',
  },
  {
    id: 'grp-5',
    title: '5. Forensic Document Integrity & Cryptographic Attestation',
    ruleCount: '6 integrity checks',
    authority: 'Standards: IT Act 2000 Class-3 DSC & Metadata Telemetry',
  },
];

const MATRIX_RULES: MatrixRule[] = [
  // Group 1: Identity & Statutory Registry
  {
    id: 'ID-01',
    code: '#ID-01',
    title: 'GSTN Registration Active & Valid',
    authority: 'GST Portal API v2.4',
    category: 'Identity',
    groupId: 'grp-1',
    groupName: '1. Identity & Statutory Registry Verification',
    bidders: {
      meridian: { status: 'PASS', note: 'State 33 (TN) Clear' },
      kaveri: { status: 'PASS', note: 'State 33 (TN) Active' },
      bharat: { status: 'WARN', note: '33-TN vs 27-MH Discord' },
      nova: { status: 'PASS', note: 'State 24 (GJ) Active' },
      zenith: { status: 'PASS', note: 'State 07 (DL) Active' },
    },
  },
  {
    id: 'ID-02',
    code: '#ID-02',
    title: 'PAN-Entity Legal Name Concordance',
    authority: 'CBDT NSDL Gateway',
    category: 'Identity',
    groupId: 'grp-1',
    groupName: '1. Identity & Statutory Registry Verification',
    bidders: {
      meridian: { status: 'PASS', note: '99.8% CBDT Match' },
      kaveri: { status: 'PASS', note: '100% Exact Match' },
      bharat: { status: 'PASS', note: 'AAACB1234F Clear' },
      nova: { status: 'PASS', note: 'AAGCS4512P Match' },
      zenith: { status: 'PASS', note: 'AABCK9923L Match' },
    },
  },
  {
    id: 'ID-03',
    code: '#ID-03',
    title: 'MCA21 Active & Good Standing (CIN)',
    authority: 'Ministry of Corporate Affairs',
    category: 'Identity',
    groupId: 'grp-1',
    groupName: '1. Identity & Statutory Registry Verification',
    bidders: {
      meridian: { status: 'PASS', note: 'Active / Regular' },
      kaveri: { status: 'PASS', note: 'Registered ROC-Chennai' },
      bharat: { status: 'PASS', note: 'Pune ROC Active' },
      nova: { status: 'PASS', note: 'Ahmedabad ROC Active' },
      zenith: { status: 'PASS', note: 'Delhi ROC Active' },
    },
  },
  {
    id: 'ID-04',
    code: '#ID-04',
    title: 'Director DIN Collision & Conflict',
    authority: 'CVC Manual Sec 5.4',
    category: 'Identity',
    groupId: 'grp-1',
    groupName: '1. Identity & Statutory Registry Verification',
    bidders: {
      meridian: { status: 'PASS', note: '3/3 DINs Isolated' },
      kaveri: { status: 'PASS', note: 'Proprietor No Conflicts' },
      bharat: { status: 'REVIEW', note: 'DIN Clear; IP Nexus Alert' },
      nova: { status: 'PASS', note: '4/4 DINs Isolated' },
      zenith: { status: 'FAIL', note: 'Cross-Holdings Trigger' },
    },
  },

  // Group 2: Financial Eligibility
  {
    id: 'FIN-01',
    code: '#FIN-01',
    title: '3-Yr Average Turnover ≥ ₹12.00 Cr',
    authority: 'NIT Clause 4.1.2 & GFR 161',
    category: 'Financial',
    groupId: 'grp-2',
    groupName: '2. Financial Eligibility & PQC Qualification',
    bidders: {
      meridian: { status: 'PASS', note: '₹28.40 Cr (Compliant)' },
      kaveri: { status: 'PASS', note: '₹8.10 Cr (MSE Exemption)' },
      bharat: { status: 'FAIL', note: '₹6.10 Cr (-49.1% Deficit)' },
      nova: { status: 'PASS', note: '₹14.20 Cr (Compliant)' },
      zenith: { status: 'FAIL', note: '₹4.50 Cr (-62.5% Deficit)' },
    },
  },
  {
    id: 'FIN-02',
    code: '#FIN-02',
    title: 'Audited Positive Net Worth ≥ ₹3.00 Cr',
    authority: 'NIT Clause 4.1.4',
    category: 'Financial',
    groupId: 'grp-2',
    groupName: '2. Financial Eligibility & PQC Qualification',
    bidders: {
      meridian: { status: 'PASS', note: '₹9.40 Cr' },
      kaveri: { status: 'PASS', note: '₹3.20 Cr' },
      bharat: { status: 'PASS', note: '₹4.85 Cr (Positive)' },
      nova: { status: 'PASS', note: '₹5.60 Cr' },
      zenith: { status: 'FAIL', note: '₹1.12 Cr Deficit' },
    },
  },
  {
    id: 'FIN-03',
    code: '#FIN-03',
    title: 'EMD Submission / SFMS Confirmation',
    authority: '₹36.80 Lakhs / SFMS BG',
    category: 'Financial',
    groupId: 'grp-2',
    groupName: '2. Financial Eligibility & PQC Qualification',
    bidders: {
      meridian: { status: 'PASS', note: 'HDFC SFMS Verified' },
      kaveri: { status: 'PASS', note: 'MSE Valid Waiver' },
      bharat: { status: 'PASS', note: 'SBI Pune BG Confirmed' },
      nova: { status: 'PASS', note: 'ICICI SFMS Confirmed' },
      zenith: { status: 'PASS', note: 'Axis BG Confirmed' },
    },
  },

  // Group 3: Statutory & PPP-MII Mandates
  {
    id: 'STAT-01',
    code: '#STAT-01',
    title: 'Make in India Local Content (Class-I ≥ 50%)',
    authority: 'PPP-MII Order 2017 Clause 3',
    category: 'Statutory',
    groupId: 'grp-3',
    groupName: '3. Statutory & Public Procurement Policy Mandates',
    bidders: {
      meridian: { status: 'PASS', note: '68.2% (Class-I Local)' },
      kaveri: { status: 'PASS', note: '84.0% (Class-I Local)' },
      bharat: { status: 'FAIL', note: '45.0% (Class-II Non-Pref)' },
      nova: { status: 'PASS', note: '58.0% (Class-I Local)' },
      zenith: { status: 'WARN', note: '51.2% Borderline' },
    },
  },
  {
    id: 'STAT-02',
    code: '#STAT-02',
    title: 'Land Border Restriction Compliance',
    authority: 'GFR 144(xi) F.No.6/18/2019-PPD',
    category: 'Statutory',
    groupId: 'grp-3',
    groupName: '3. Statutory & Public Procurement Policy Mandates',
    bidders: {
      meridian: { status: 'PASS', note: 'Clean Beneficial Audit' },
      kaveri: { status: 'PASS', note: '100% Domestic' },
      bharat: { status: 'FAIL', note: 'HK Parent without DPIIT' },
      nova: { status: 'PASS', note: 'Domestic Entity' },
      zenith: { status: 'WARN', note: 'Declaration under review' },
    },
  },
  {
    id: 'STAT-03',
    code: '#STAT-03',
    title: 'Debarment Screening (CPPP / GeM / MoF)',
    authority: 'CVC Vigilance Index',
    category: 'Statutory',
    groupId: 'grp-3',
    groupName: '3. Statutory & Public Procurement Policy Mandates',
    bidders: {
      meridian: { status: 'PASS', note: '0 Active Debarments' },
      kaveri: { status: 'PASS', note: 'Clean MSME Record' },
      bharat: { status: 'PASS', note: 'Clean Direct Record' },
      nova: { status: 'PASS', note: 'Clean Record' },
      zenith: { status: 'PASS', note: 'Clean Record' },
    },
  },

  // Group 4: Technical Specifications
  {
    id: 'TECH-01',
    code: '#TECH-01',
    title: 'MOC & Impeller Alloy (Duplex SS 2205)',
    authority: 'API-610 Table 4 Material Class',
    category: 'Technical',
    groupId: 'grp-4',
    groupName: '4. Technical Specifications & Engineering Compliance',
    bidders: {
      meridian: { status: 'PASS', note: 'Fully Compliant' },
      kaveri: { status: 'PASS', note: 'ASTM A890 Gr 4A Certified' },
      bharat: { status: 'PASS', note: 'Duplex SS 2205 Certified' },
      nova: { status: 'REVIEW', note: 'Impeller Warranty 36mo' },
      zenith: { status: 'FAIL', note: 'Grade Deviation Unapproved' },
    },
  },
  {
    id: 'TECH-02',
    code: '#TECH-02',
    title: 'OEM Authorization Form (MAF) Validity',
    authority: 'NIT Clause 2.4.1',
    category: 'Technical',
    groupId: 'grp-4',
    groupName: '4. Technical Specifications & Engineering Compliance',
    bidders: {
      meridian: { status: 'PASS', note: 'Original OEM Direct' },
      kaveri: { status: 'PASS', note: 'Self-Manufacturer MSE' },
      bharat: { status: 'PASS', note: 'Direct Hydrotech Corp' },
      nova: { status: 'PASS', note: 'Direct OEM Authorized' },
      zenith: { status: 'WARN', note: 'Third Party Trading Agent' },
    },
  },

  // Group 5: Forensic Document Integrity
  {
    id: 'DOC-01',
    code: '#DOC-01',
    title: 'Class-3 Digital Signature Certificate (DSC)',
    authority: 'CCA India / IT Act 2000',
    category: 'Integrity',
    groupId: 'grp-5',
    groupName: '5. Forensic Document Integrity & Cryptographic Attestation',
    bidders: {
      meridian: { status: 'PASS', note: 'eMudhra Class-3 Valid' },
      kaveri: { status: 'PASS', note: 'NIC-CA Class-3 Valid' },
      bharat: { status: 'PASS', note: 'Signer: Rajesh K. (Valid)' },
      nova: { status: 'PASS', note: 'Capricorn Class-3 Valid' },
      zenith: { status: 'PASS', note: 'IDSign Class-3 Valid' },
    },
  },
  {
    id: 'DOC-02',
    code: '#DOC-02',
    title: 'Bid Submission Network Isolation & Cluster',
    authority: 'CCI Section 3(3) / NIC Heuristics',
    category: 'Integrity',
    groupId: 'grp-5',
    groupName: '5. Forensic Document Integrity & Cryptographic Attestation',
    bidders: {
      meridian: { status: 'PASS', note: 'Unique ISP / Subnet' },
      kaveri: { status: 'PASS', note: 'Unique ISP / Subnet' },
      bharat: { status: 'FAIL', note: 'IP Match: 103.21.58.114' },
      nova: { status: 'PASS', note: 'Unique ISP / Subnet' },
      zenith: { status: 'FAIL', note: 'IP Match: 103.21.58.114' },
    },
  },
  {
    id: 'DOC-03',
    code: '#DOC-03',
    title: 'CVC Statutory Integrity Pact Execution',
    authority: 'CVC Manual 2021 Clause 12',
    category: 'Integrity',
    groupId: 'grp-5',
    groupName: '5. Forensic Document Integrity & Cryptographic Attestation',
    bidders: {
      meridian: { status: 'PASS', note: 'e-Stamp Verified' },
      kaveri: { status: 'PASS', note: 'TN e-Stamping Valid' },
      bharat: { status: 'PASS', note: 'MH e-Stamping Verified' },
      nova: { status: 'PASS', note: 'GJ e-Stamping Verified' },
      zenith: { status: 'PASS', note: 'DL e-Stamping Verified' },
    },
  },
];

export const ComplianceMatrixView: React.FC<ComplianceMatrixViewProps> = ({
  onNavigate,
  onDownloadDossier,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const filterTabs = [
    { id: 'ALL', label: 'All (34)' },
    { id: 'Identity', label: 'Identity (6)' },
    { id: 'Financial', label: 'Financial (7)' },
    { id: 'Statutory', label: 'Statutory (8)' },
    { id: 'Technical', label: 'Technical (7)' },
    { id: 'Integrity', label: 'Forensics (6)' },
  ];

  const filteredRules = useMemo(() => {
    return MATRIX_RULES.filter((rule) => {
      const matchesFilter = selectedFilter === 'ALL' || rule.category === selectedFilter;
      const matchesSearch =
        searchQuery === '' ||
        rule.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.authority.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [selectedFilter, searchQuery]);

  const handleExportXLSX = () => {
    setToastMsg('Exporting 34-Rule Statutory Compliance Cross-Tabulation Matrix (XLSX)...');
    onDownloadDossier();
    setTimeout(() => {
      setToastMsg('Compliance Matrix XLSX exported successfully.');
      setTimeout(() => setToastMsg(null), 4000);
    }, 1000);
  };

  const handleGenerateMemo = () => {
    setToastMsg('Compiling Official TEC Scrutiny Memo with statutory findings...');
    setTimeout(() => {
      onNavigate('dossier');
    }, 900);
  };

  const renderBadge = (status: 'PASS' | 'WARN' | 'REVIEW' | 'FAIL', note: string, bidderId: string) => {
    const isPass = status === 'PASS';
    const isWarn = status === 'WARN';
    const isReview = status === 'REVIEW';

    return (
      <div
        onClick={() => onNavigate('scrutiny', { bidderId })}
        className={`p-1.5 rounded-lg border text-left cursor-pointer transition-all hover:scale-[1.02] ${
          isPass
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
            : isWarn
            ? 'bg-amber-50/70 border-amber-200 text-amber-800'
            : isReview
            ? 'bg-blue-50/70 border-blue-200 text-blue-800'
            : 'bg-rose-50/70 border-rose-200 text-rose-800'
        }`}
      >
        <div className="flex items-center gap-1">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isPass
                ? 'bg-emerald-500'
                : isWarn
                ? 'bg-amber-500'
                : isReview
                ? 'bg-blue-500'
                : 'bg-rose-500'
            }`}
          ></span>
          <span className="font-bold text-[10px] tracking-wide uppercase">{status}</span>
        </div>
        <div className="text-[10px] font-medium leading-tight mt-0.5 truncate" title={note}>
          {note}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full space-y-4 text-slate-800 text-xs">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-md flex items-center justify-between border border-blue-500">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
            <span className="text-xs font-semibold">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* SUBHEADER TITLE & ACTION TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bidder Compliance Matrix</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse"></span>
              Stage 06 of 11: Cross-Entity Evaluation
            </span>
            <span className="text-xs text-slate-400 font-mono">Tender Ref: CPCL/MM/2026/PUMP-217</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive statutory concordance, qualification requirements, and technical risk cross-tabulation across all 5 responsive envelopes.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono mr-1">
            <span className="material-symbols-outlined text-[15px] text-slate-400">sync</span>
            Synced 1m ago
          </span>
          <button
            onClick={handleExportXLSX}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">table_view</span>
            Export Matrix (XLSX)
          </button>
          <button
            onClick={handleGenerateMemo}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">description</span>
            Generate TEC Scrutiny Memo
          </button>
        </div>
      </div>

      {/* TOP SUMMARY METRICS STRIP (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 w-full">
        {/* Scope Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Evaluation Scope</div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1 leading-none">
                34 <span className="text-xs font-sans font-medium text-slate-500">Criteria</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
              <span className="material-symbols-outlined text-[18px]">fact_check</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>5 Statutory Groups</span>
            <span className="font-mono font-medium text-slate-600">100% Covered</span>
          </div>
        </div>

        {/* Pass Card */}
        <div className="bg-emerald-50/40 rounded-xl border border-emerald-200 p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Unconditional Pass</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1 leading-none">
                118 <span className="text-xs font-sans font-medium text-emerald-600">/ 170</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </div>
          </div>
          <div className="text-[11px] text-emerald-700 mt-3 pt-2 border-t border-emerald-100 flex items-center justify-between">
            <span>Fully verified (69.4%)</span>
            <span className="font-mono font-medium text-emerald-700">Compliant</span>
          </div>
        </div>

        {/* Warning Flags Card */}
        <div className="bg-amber-50/40 rounded-xl border border-amber-200 p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Warning Flags</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              </div>
              <div className="text-2xl font-bold font-mono text-amber-700 mt-1 leading-none">
                24 <span className="text-xs font-sans font-medium text-amber-600">Cells</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-100/70 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <span className="material-symbols-outlined text-[18px]">warning</span>
            </div>
          </div>
          <div className="text-[11px] text-amber-800 mt-3 pt-2 border-t border-amber-100 flex items-center justify-between">
            <span>State code / Borderline</span>
            <span className="font-mono font-medium text-amber-800">Actionable</span>
          </div>
        </div>

        {/* CQ / Review Card */}
        <div className="bg-sky-50/40 rounded-xl border border-sky-200 p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-sky-800 uppercase tracking-wider">Clarifications (CQ)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              </div>
              <div className="text-2xl font-bold font-mono text-sky-700 mt-1 leading-none">
                16 <span className="text-xs font-sans font-medium text-sky-600">Cells</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-sky-100/70 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0">
              <span className="material-symbols-outlined text-[18px]">help_center</span>
            </div>
          </div>
          <div className="text-[11px] text-sky-700 mt-3 pt-2 border-t border-sky-100 flex items-center justify-between">
            <span>Clarification queries</span>
            <span className="font-mono font-medium text-sky-700">Pending</span>
          </div>
        </div>

        {/* Critical Non-Compliance Card */}
        <div className="bg-rose-50/40 rounded-xl border border-rose-200 p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">Disqualifications</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              </div>
              <div className="text-2xl font-bold font-mono text-rose-700 mt-1 leading-none">
                12 <span className="text-xs font-sans font-medium text-rose-600">Cells</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-100/70 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
              <span className="material-symbols-outlined text-[18px]">block</span>
            </div>
          </div>
          <div className="text-[11px] text-rose-700 mt-3 pt-2 border-t border-rose-100 flex items-center justify-between">
            <span>Statutory grounds</span>
            <span className="font-mono font-medium text-rose-700">Disqualified</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR: Filter Pills & Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedFilter === tab.id
                  ? 'bg-sky-600 text-white font-semibold shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-[16px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clause, authority or rule ID..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* MATRIX TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-[280px]">Compliance Criteria & Statutory Rule</th>
                <th className="py-3 px-3 w-[90px]">Category</th>
                <th className="py-3 px-3 w-[150px] bg-slate-100/50">
                  <div className="font-bold text-slate-900">Meridian Flow Systems</div>
                  <div className="text-[10px] text-emerald-700 font-mono font-semibold">PASS (96%) • Risk 04</div>
                </th>
                <th className="py-3 px-3 w-[150px]">
                  <div className="font-bold text-slate-900">Sri Kaveri Eng. Works</div>
                  <div className="text-[10px] text-emerald-700 font-mono font-semibold">PASS (91%) • Risk 12</div>
                </th>
                <th className="py-3 px-3 w-[150px] bg-rose-50/20">
                  <div className="font-bold text-slate-900">Bharat Hydrotech Corp</div>
                  <div className="text-[10px] text-rose-700 font-mono font-semibold">DISQUALIFIED • Risk 94</div>
                </th>
                <th className="py-3 px-3 w-[150px]">
                  <div className="font-bold text-slate-900">Nova Pumps & Systems</div>
                  <div className="text-[10px] text-amber-700 font-mono font-semibold">REVIEW (CQ) • Risk 42</div>
                </th>
                <th className="py-3 px-3 w-[150px] bg-rose-50/20">
                  <div className="font-bold text-slate-900">Zenith Infra Tech</div>
                  <div className="text-[10px] text-rose-700 font-mono font-semibold">DISQUALIFIED • Risk 86</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {MATRIX_GROUPS.map((grp) => {
                const groupRules = filteredRules.filter((r) => r.groupId === grp.id);
                if (groupRules.length === 0) return null;

                return (
                  <React.Fragment key={grp.id}>
                    {/* Section Header Row */}
                    <tr className="bg-slate-100/80 border-y border-slate-200">
                      <td colSpan={7} className="py-2.5 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{grp.title}</span>
                            <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-300 font-mono text-slate-600">
                              {grp.ruleCount}
                            </span>
                          </div>
                          <span className="text-[10.5px] font-mono text-slate-500">{grp.authority}</span>
                        </div>
                      </td>
                    </tr>

                    {/* Group Criteria Rows */}
                    {groupRules.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Rule Name & Citation */}
                        <td className="py-3 px-4 align-top">
                          <div className="font-semibold text-xs text-slate-900">{r.title}</div>
                          <div className="text-[10.5px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                            <span className="font-bold text-sky-700">{r.code}</span>
                            <span>•</span>
                            <span>{r.authority}</span>
                          </div>
                        </td>

                        {/* 2. Category */}
                        <td className="py-3 px-3 align-top">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {r.category}
                          </span>
                        </td>

                        {/* 3. Meridian Flow */}
                        <td className="py-3 px-3 align-top bg-slate-50/30">
                          {renderBadge(r.bidders.meridian.status, r.bidders.meridian.note, 'BID-MER-0018')}
                        </td>

                        {/* 4. Sri Kaveri */}
                        <td className="py-3 px-3 align-top">
                          {renderBadge(r.bidders.kaveri.status, r.bidders.kaveri.note, 'BID-KAV-0105')}
                        </td>

                        {/* 5. Bharat Hydrotech */}
                        <td className="py-3 px-3 align-top bg-rose-50/10">
                          {renderBadge(r.bidders.bharat.status, r.bidders.bharat.note, 'BID-HYD-0419')}
                        </td>

                        {/* 6. Nova Pumps */}
                        <td className="py-3 px-3 align-top">
                          {renderBadge(r.bidders.nova.status, r.bidders.nova.note, 'BID-NOV-0312')}
                        </td>

                        {/* 7. Zenith Infra */}
                        <td className="py-3 px-3 align-top bg-rose-50/10">
                          {renderBadge(r.bidders.zenith.status, r.bidders.zenith.note, 'BID-ZEN-0891')}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
