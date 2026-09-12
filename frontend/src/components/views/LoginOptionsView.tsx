import React from 'react';

interface LoginOptionsViewProps {
  onSelectRole: (role: string, name: string, title: string) => void;
  onBackToHero: () => void;
}

export const LoginOptionsView: React.FC<LoginOptionsViewProps> = ({
  onSelectRole,
  onBackToHero,
}) => {
  const roles = [
    {
      id: 'officer',
      name: 'Rajesh Verma',
      title: 'Sr. Procurement Officer (CPCL)',
      roleLabel: 'Procurement Officer',
      badge: 'Primary Recommended',
      isPrimary: true,
      status: 'Active',
      statusColor: 'emerald',
      icon: 'description',
      description:
        'Executes clause-by-clause bid verification, reviews flagged discrepancies, and drafts statutory technical evaluations.',
      features: ['Tender Scrutiny Cockpit', 'Evidence Citation Inspector', 'Adjudication Signoff'],
    },
    {
      id: 'approver',
      name: 'Dr. Suresh Nair',
      title: 'Chief General Manager (Procurement)',
      roleLabel: 'Approver',
      isPrimary: false,
      status: 'Standby',
      statusColor: 'slate',
      icon: 'check_circle',
      description:
        'Provides statutory concurrence, validates comparative evaluation summaries, and signs final award recommendations with DSC token.',
      features: ['Technical Evaluation Concurrence', 'Financial Comparative Approval', 'DSC Token Signing'],
    },
    {
      id: 'cvo',
      name: 'P. Venkatraman, IPS',
      title: 'Chief Vigilance Officer (CVO)',
      roleLabel: 'Vigilance Officer',
      isPrimary: false,
      status: 'Standby',
      statusColor: 'slate',
      icon: 'security',
      description:
        'Monitors high-risk tender indicators, detects cartelization & collusion networks, and audits integrity pact compliance.',
      features: ['Cartel & Collusion Radial Graph', 'Integrity Red-Flag Scanner', 'CVC Circular Audit Check'],
    },
    {
      id: 'auditor',
      name: 'Meenakshi Sundaram',
      title: 'Principal Director of Audit (CAG)',
      roleLabel: 'Auditor / Compliance',
      isPrimary: false,
      status: 'Standby',
      statusColor: 'slate',
      icon: 'receipt_long',
      description:
        'Performs post-procurement proprietary audits, validates immutable Merkle ledger blocks, and generates CVC compliance dossiers.',
      features: ['Immutable Merkle Audit Ledger', 'CVC Compliance Dossier Generator', 'Tamper-Evident SHA-256 Chain'],
    },
  ];

  return (
    <div className="bg-[#F8FAFC] text-slate-900 font-sans min-h-screen flex flex-col justify-between antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Statutory Bar & Navigation */}
      <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="bg-slate-50 text-slate-600 text-xs px-6 py-2 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              GeM 4.0 & CPPP Compliance Gateway Connected
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">
              Authenticated Session:{' '}
              <span className="font-mono font-medium text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                NIC-ID: PR-88219 (P. Sharma)
              </span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1.5 bg-blue-50/80 text-blue-700 px-2 py-0.5 rounded border border-blue-200/80 font-medium">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              DSC Token Valid (Class 3)
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-[11px] text-slate-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-slate-400">verified_user</span>
              TLS 1.3 / NIC HSM Verified
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
                <span className="material-symbols-outlined text-[20px]">shield</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-950 tracking-tight text-lg leading-tight">VigilBid</span>
                  <span className="text-[10px] font-semibold uppercase font-mono tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                    Gov-Procure Suite
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block leading-tight font-medium">
                  Public Procurement AI & Scrutiny Infrastructure
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-900">Chennai Petroleum Corporation Ltd (CPCL)</div>
              <div className="text-[11px] text-slate-500">Tender Scrutiny Wing • PSU Portal ID #99214</div>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <button
              onClick={onBackToHero}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Portal Overview
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-5xl mx-auto">
          {/* Header & Context */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full mb-3 shadow-xs">
              <span className="material-symbols-outlined text-[15px] text-blue-700">verified</span>
              Statutory Access Gate • Single Sign-On Verified
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 tracking-tight mb-3">
              Choose Your Procurement Workspace
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Select an authorized role for this evaluation session. Your statutory permissions, scrutiny credentials,
              and DSC signing authority will configure automatically.
            </p>
          </div>

          {/* 4 Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {roles.map((r) => (
              <div
                key={r.id}
                onClick={() => onSelectRole(r.id, r.name, r.title)}
                className={`relative bg-white rounded-xl cursor-pointer transition-all flex flex-col justify-between p-6 group ${
                  r.isPrimary
                    ? 'border-2 border-blue-600 shadow-md ring-4 ring-blue-500/10'
                    : 'border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300'
                }`}
              >
                {r.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-semibold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1.5 whitespace-nowrap">
                    <span className="material-symbols-outlined text-[13px]">star</span>
                    {r.badge}
                  </div>
                )}

                <div>
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-5 group-hover:scale-105 transition-transform ${
                      r.isPrimary
                        ? 'bg-blue-50 border border-blue-200 text-blue-600'
                        : 'bg-slate-50 border border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">{r.icon}</span>
                  </div>

                  {/* Role Title & Status */}
                  <div className="flex items-center justify-between mb-1.5">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">{r.roleLabel}</h2>
                    {r.status === 'Active' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                      </span>
                    ) : (
                      <span className="inline-block w-2 h-2 rounded-full bg-slate-300" title="Standby"></span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{r.description}</p>

                  {/* Features list */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 mb-6 text-[11px] text-slate-600">
                    {r.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-blue-600 shrink-0">check</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary CTA */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRole(r.id, r.name, r.title);
                  }}
                  className={`w-full inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-lg shadow-xs transition-all text-center cursor-pointer ${
                    r.isPrimary
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                  }`}
                >
                  Continue as {r.roleLabel}
                  <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">
                    arrow_forward
                  </span>
                </button>
              </div>
            ))}
          </div>

          <div className="text-center text-xs text-slate-500">
            <span>Need authentication assistance or DSC token drivers? </span>
            <a href="mailto:nic-cert@gem.gov.in" className="text-blue-600 hover:underline font-medium">
              Contact NIC Helpdesk (#1800-NIC-GOV)
            </a>
          </div>
        </div>
      </main>

      {/* Statutory Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">VigilBid</span>
            <span>•</span>
            <span>Government of India Sovereign Procurement Security</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>GFR 2017 Rule 144(xi)</span>
            <span>•</span>
            <span>CVC Guidelines 2021</span>
            <span>•</span>
            <span className="font-mono text-slate-700">SYS_VER v2.4.8-PROD</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
