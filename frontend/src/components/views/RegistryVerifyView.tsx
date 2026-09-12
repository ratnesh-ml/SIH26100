import React, { useState } from 'react';

interface RegistryVerifyViewProps {
  onNavigate: (view: string, params?: any) => void;
  bidderId?: string;
}

export const RegistryVerifyView: React.FC<RegistryVerifyViewProps> = ({
  onNavigate,
  bidderId = 'BID-HYD-0419',
}) => {
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [selectedRegistry, setSelectedRegistry] = useState<string | null>(null);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 800);
  };

  const handleExportJSON = () => {
    const proof = {
      timestamp: new Date().toISOString(),
      enclaveId: '#SANDBOX-REG-8492',
      bidderId,
      registriesPolled: 9,
      status: 'VERIFIED_WITH_DISCORDANCE',
      sha256Proof: 'a6f90021c7d48891ab01e912f718aa0021c7d48891ab01e912f718aa',
      results: [
        { registry: 'GSTN', id: '33AAACB9999F1Z5', match: '88.4%', status: 'ACTIVE_MISMATCH' },
        { registry: 'PAN', id: 'AAACB1234F', match: '82.1%', status: 'VALID_MISMATCH' },
        { registry: 'UDYAM', id: 'UDYAM-MH-26-0034912', match: '99.8%', status: 'VERIFIED' },
        { registry: 'MCA21', id: 'U29100MH2018PTC310244', match: '100%', status: 'VERIFIED' },
        { registry: 'CBDT_ITR', id: 'PAN-ITR-AY25-26', match: '99.1%', status: 'VERIFIED' },
        { registry: 'DIGILOCKER', id: 'in.gov.gst.cert/33AAACB9999F1Z5', match: '100%', status: 'VERIFIED' },
        { registry: 'CPPP_DEBARMENT', id: 'DoE OM F.1/2/2023-PPD', match: '0.0%', status: 'CLEAN' },
        { registry: 'EPFO', id: 'MHPUN0038491000', match: '98.5%', status: 'VERIFIED' },
        { registry: 'ESIC', id: '31000492810000999', match: '97.9%', status: 'VERIFIED' },
      ],
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(proof, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `Registry_Audit_Proof_${bidderId}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  const registries = [
    {
      id: 'gstn',
      code: 'GSTN',
      name: 'Goods & Services Tax Network',
      identifier: '33AAACB9999F1Z5',
      badge: 'ACTIVE — Mismatch Detected',
      badgeType: 'amber',
      tag: 'State 33 vs 27',
      accuracy: 88.4,
      accuracyText: '88.4% Match',
      accuracyColor: 'bg-amber-500',
      timestamp: '2026-03-12 10:14:22 IST',
      mode: 'Direct API (GSTN v2.4 via NIC)',
    },
    {
      id: 'pan',
      code: 'PAN',
      name: 'Income Tax Dept / NSDL',
      identifier: 'AAACB1234F',
      badge: 'VALID — Mismatch with GSTIN',
      badgeType: 'amber',
      tag: 'Entity matched',
      accuracy: 82.1,
      accuracyText: '82.1% Match',
      accuracyColor: 'bg-amber-500',
      timestamp: '2026-03-12 10:14:23 IST',
      mode: 'CBDT e-Verification API',
    },
    {
      id: 'udyam',
      code: 'Udyam',
      name: 'Ministry of MSME',
      identifier: 'UDYAM-MH-26-0034912',
      badge: 'VERIFIED',
      badgeType: 'green',
      tag: 'Medium Mfg',
      accuracy: 99.8,
      accuracyText: '99.8% Match',
      accuracyColor: 'bg-emerald-500',
      timestamp: '2026-03-12 10:14:24 IST',
      mode: 'Udyam Portal Core Sync',
    },
    {
      id: 'mca21',
      code: 'MCA21',
      name: 'Ministry of Corporate Affairs',
      identifier: 'U29100MH2018PTC310244',
      badge: 'VERIFIED',
      badgeType: 'green',
      tag: 'Active Entity',
      accuracy: 100,
      accuracyText: '100% Match',
      accuracyColor: 'bg-emerald-500',
      timestamp: '2026-03-12 10:14:26 IST',
      mode: 'MCA V3 Real-Time Webhook',
    },
    {
      id: 'cbdt',
      code: 'CBDT ITR',
      name: 'Central Board of Direct Taxes',
      identifier: 'AY 2025-26 Filed (₹6.10 Cr ATO)',
      badge: 'VERIFIED',
      badgeType: 'green',
      tag: 'Audited Tax',
      accuracy: 99.1,
      accuracyText: '99.1% Match',
      accuracyColor: 'bg-emerald-500',
      timestamp: '2026-03-12 10:14:27 IST',
      mode: 'CBDT Bulk PAN-ITR Sync',
    },
    {
      id: 'digilocker',
      code: 'DigiLocker',
      name: 'National Digital Locker System',
      identifier: 'URI: in.gov.gst.cert/33AAACB9999F1Z5',
      badge: 'VERIFIED',
      badgeType: 'green',
      tag: 'Gov Vault',
      accuracy: 100,
      accuracyText: '100.0% Match',
      accuracyColor: 'bg-emerald-500',
      timestamp: '2026-03-12 10:14:28 IST',
      mode: 'DigiLocker Issuer OAuth2',
    },
    {
      id: 'cppp',
      code: 'CPPP Debarment',
      name: 'Central Procurement Portal Blacklist',
      identifier: 'DoE OM F.1/2/2023-PPD Registry',
      badge: 'NO MATCH (CLEAN)',
      badgeType: 'green',
      tag: '0 Debarments',
      accuracy: 0,
      accuracyText: '0.0% Debarment Match',
      accuracyColor: 'bg-slate-200',
      timestamp: '2026-03-12 10:14:30 IST',
      mode: 'GeM & CPPP Aggregator',
    },
    {
      id: 'epfo',
      code: 'EPFO',
      name: "Employees' Provident Fund Org",
      identifier: 'MHPUN0038491000',
      badge: 'VERIFIED',
      badgeType: 'green',
      tag: '48 Active Employees',
      accuracy: 98.5,
      accuracyText: '98.5% Match',
      accuracyColor: 'bg-emerald-500',
      timestamp: '2026-03-12 10:14:31 IST',
      mode: 'Shram Suvidha Unified API',
    },
    {
      id: 'esic',
      code: 'ESIC',
      name: "Employees' State Insurance Corp",
      identifier: '31000492810000999',
      badge: 'VERIFIED',
      badgeType: 'green',
      tag: 'Up to Feb 2026',
      accuracy: 97.9,
      accuracyText: '97.9% Match',
      accuracyColor: 'bg-emerald-500',
      timestamp: '2026-03-12 10:14:32 IST',
      mode: 'ESIC Employer Gateway',
    },
  ];

  return (
    <div className="flex flex-col w-full gap-5 text-slate-800 text-xs">
      {/* Context Header */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Government Registry Verification</h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
              9 Registries Queried
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Deterministic real-time cross-validation against statutory government registers and compliance databases.
          </p>

          {/* Bidder Identity Badges Strip */}
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
            <span className="inline-flex items-center font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              Bidder: Bharat Hydrotech Corp
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              GSTIN: <span className="text-slate-700 font-semibold">27AABCB8899K1Z4</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400 font-mono text-[11px]">
              CIN: <span className="text-slate-700 font-semibold">U29100MH2018PTC310244</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-[11px]">
              Registered: <span className="text-slate-700 font-semibold">Pune, MH</span>
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            type="button"
          >
            <span className={`material-symbols-outlined text-[16px] text-slate-500 ${syncing ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{syncing ? 'Synchronizing...' : syncSuccess ? 'Sync Complete!' : 'Re-run Registry Sync'}</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">download</span>
            <span>Export Audit Proof (JSON)</span>
          </button>
        </div>
      </section>

      {/* Top Enclave Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-amber-50/80 border border-amber-200 rounded-xl">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
            <span className="material-symbols-outlined text-[18px]">security</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-950">
                Evaluation Environment: Controlled Sandbox / Simulated Registry Responses
              </span>
            </div>
            <p className="text-[11px] text-amber-800 leading-normal">
              All upstream API handshakes executed via gVisor cryptographic enclave with SHA-256 evidence chain pinning.
              Simulated responses follow NIC/GSTN/MCA statutory schemas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-amber-200 shadow-2xs font-bold">
            Sandbox ID: #SANDBOX-REG-8492
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            NIC-CERT Level 3 Enclave
          </span>
        </div>
      </div>

      {/* Verification Grid: 9 Registry Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {registries.map((reg) => (
          <article
            key={reg.id}
            className={`flex flex-col justify-between bg-white border rounded-xl p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all ${
              selectedRegistry === reg.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
            }`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900">{reg.code}</span>
                    <span className="text-[11px] text-slate-400 font-normal">{reg.name}</span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                    reg.badgeType === 'amber'
                      ? 'text-amber-800 bg-amber-50 border-amber-200'
                      : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                  }`}
                >
                  {reg.badge}
                </span>
              </div>

              <div className="space-y-2 text-xs pt-1 border-t border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block">Identifier</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <code className="font-mono text-xs font-bold text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[210px]">
                      {reg.identifier}
                    </code>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 font-semibold">
                      {reg.tag}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Match Accuracy</span>
                    <span className={`font-semibold ${reg.accuracyColor.replace('bg-', 'text-')}`}>
                      {reg.accuracyText}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${reg.accuracyColor} rounded-full`} style={{ width: `${reg.accuracy}%` }}></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span className="text-slate-400">Verified Timestamp</span>
                  <span className="font-mono text-[10.5px] text-slate-600">{reg.timestamp}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="text-slate-400">Verification Mode</span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono truncate max-w-[170px]">
                    {reg.mode}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedRegistry(selectedRegistry === reg.id ? null : reg.id)}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                type="button"
              >
                {selectedRegistry === reg.id ? 'Hide Details' : 'View Details'}
              </button>
              <span className="text-[10.5px] text-slate-400 flex items-center gap-1 font-mono">
                <span className="text-emerald-500 font-bold">✓</span> Audit Trail
              </span>
            </div>
          </article>
        ))}
      </section>

      {/* Consistency Summary Section */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col gap-4 mt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Cross-Source Consistency & Statutory Compliance Assessment
            </h2>
            <p className="text-xs text-slate-500">
              Automated synthesis of discrepancies across registered databases versus tender submission requirements.
            </p>
          </div>
          <span className="self-start sm:self-auto text-[11px] font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 font-semibold">
            Deterministic Engine: 9/9 Polled (0 Timeouts)
          </span>
        </div>

        {/* 3 Key Synthesis Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Finding 1: Identity / GSTIN Alignment */}
          <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <h3 className="text-xs font-bold text-amber-950">Identity & Tax Alignment</h3>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                <strong className="font-semibold text-amber-950">State Code Discordance Flagged:</strong> GSTIN state
                code (33 - Tamil Nadu) does not align with principal place of business registered in MCA21 / Udyam (27
                - Maharashtra). Requires statutory clarification under GFR 144.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-800 font-semibold">
              <span>Impact: High Clarification</span>
              <span className="font-mono text-[10.5px]">Rule #GFR-144-C</span>
            </div>
          </div>

          {/* Finding 2: Financial Threshold */}
          <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <h3 className="text-xs font-bold text-amber-950">Financial Threshold Compliance</h3>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                <strong className="font-semibold text-amber-950">Turnover Gap:</strong> CA-audited FY24-25 turnover
                ₹6.10 Cr verified via CBDT/ITR, falling short of Tender minimum qualification criteria (₹12.00 Cr). MSE
                turnover relaxation applies if eligible.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-800 font-semibold">
              <span>Impact: Medium (MSE Exemption Check)</span>
              <span className="font-mono text-[10.5px]">Rule #FIN-PQC-02</span>
            </div>
          </div>

          {/* Finding 3: Integrity / Debarment */}
          <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <h3 className="text-xs font-bold text-emerald-950">Integrity & Debarment Clearance</h3>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                <strong className="font-semibold text-emerald-950">Statutory Clean Record:</strong> No Debarment or
                Blacklist records found on CPPP, GeM, or Ministry of Finance registers. Clear statutory integrity
                clearance for public procurement participation.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-800 font-semibold">
              <span>Impact: Cleared</span>
              <span className="font-mono text-[10.5px]">Rule #DOE-BLK-01</span>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-100 gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0">check_circle</span>
            <span>
              Deterministic Rule Sync: <strong>9 of 9 Registries Polled</strong> • 0 Unresolved Timeouts • Evidence
              pinned to SHA-256 ledger
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('scrutiny')}
              className="px-4 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer"
              type="button"
            >
              Flag Discrepancy for Clarification
            </button>
            <button
              onClick={() => onNavigate('matrix')}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              type="button"
            >
              <span>Proceed to Stage 08: Compliance Rules</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
