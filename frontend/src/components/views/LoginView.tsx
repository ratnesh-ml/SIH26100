import React, { useState } from 'react';

interface LoginViewProps {
  onLoginSuccess: (user: {
    id: string;
    username: string;
    full_name: string;
    email: string;
    role: string;
    department: string;
    is_active: boolean;
  }) => void;
  onBackToOptions: () => void;
  initialRole?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onBackToOptions,
  initialRole = 'officer',
}) => {
  const [env, setEnv] = useState<'live' | 'sandbox'>('live');
  const [authMethod, setAuthMethod] = useState<'dsc' | 'sso'>('dsc');
  const [employeeId, setEmployeeId] = useState('CPCL-OFF-0942');
  const [pin, setPin] = useState('••••••••');
  const [statutoryConsent, setStatutoryConsent] = useState(true);
  const [role, setRole] = useState(initialRole);

  const handleQuickFill = (targetRole: string) => {
    setRole(targetRole);
    if (targetRole === 'officer') {
      setEmployeeId('CPCL-OFF-0942');
    } else if (targetRole === 'cvo') {
      setEmployeeId('CVC-VIG-1008');
    } else if (targetRole === 'auditor') {
      setEmployeeId('CAG-AUD-5521');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userMap: Record<string, any> = {
      officer: {
        id: 'usr_officer_1',
        username: 'rverma',
        full_name: 'Rajesh Verma',
        email: 'rajesh.verma@cpcl.gov.in',
        role: 'officer',
        department: 'CPCL Materials & Procurement Directorate',
        is_active: true,
      },
      approver: {
        id: 'usr_approver_1',
        username: 'snair',
        full_name: 'Dr. Suresh Nair',
        email: 'suresh.nair@cpcl.gov.in',
        role: 'approver',
        department: 'Chief General Manager (Procurement)',
        is_active: true,
      },
      cvo: {
        id: 'usr_cvo_1',
        username: 'pvenkat',
        full_name: 'P. Venkatraman, IPS',
        email: 'p.venkatraman@cvc.gov.in',
        role: 'cvo',
        department: 'Chief Vigilance Office (MoPNG / CVC)',
        is_active: true,
      },
      auditor: {
        id: 'usr_auditor_1',
        username: 'msundaram',
        full_name: 'Meenakshi Sundaram',
        email: 'm.sundaram@cag.gov.in',
        role: 'auditor',
        department: 'Comptroller & Auditor General of India',
        is_active: true,
      },
    };

    const user = userMap[role] || userMap.officer;
    onLoginSuccess(user);
  };

  return (
    <div className="bg-[#F8FAFC] text-slate-900 min-h-screen flex flex-col justify-between antialiased">
      {/* Top Banner / Classification Header */}
      <header className="w-full bg-white border-b border-slate-200 py-2.5 px-6 sm:px-10 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2.5">
            <span className="inline-flex items-center justify-center p-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 shadow-xs">
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900 tracking-tight leading-none flex items-center gap-1.5">
                VigilBid{' '}
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium border border-slate-200">
                  Gov-Procure Suite
                </span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Public Procurement AI & Scrutiny Infrastructure
              </span>
            </div>
          </div>
          <span className="hidden md:inline-block h-4 w-px bg-slate-200"></span>
          <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> GeM 4.0 & CPCL Compliance Gateway
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-600 font-mono text-[11px]">
            <span className="material-symbols-outlined text-[14px] text-blue-600">lock</span>
            <span>TLS 1.3 / NIC HSM Signed</span>
          </div>
          <button
            onClick={onBackToOptions}
            className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-400">arrow_back</span>
            Change Workspace Role
          </button>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 items-center justify-center gap-8">
        <div className="w-full flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-8 sm:p-9 shadow-sm">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-xl bg-blue-50/80 border border-blue-200 mb-3 shadow-xs text-blue-600">
                <span className="material-symbols-outlined text-[32px]">shield</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign in to Procurement Workspace</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your statutory credentials to access active tender scrutiny
              </p>
            </div>

            {/* Environment Selector */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Evaluation Environment</span>
                <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                  Authorized Access Only
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setEnv('live')}
                  className={`flex flex-col text-left py-2 px-3 rounded-md transition-all cursor-pointer ${
                    env === 'live'
                      ? 'bg-white border border-slate-200 shadow-xs text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    CPCL Production
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Active PSU Registry</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEnv('sandbox')}
                  className={`flex flex-col text-left py-2 px-3 rounded-md transition-all cursor-pointer ${
                    env === 'sandbox'
                      ? 'bg-white border border-slate-200 shadow-xs text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Sandboxed Training
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Synthetic Dossiers</span>
                </button>
              </div>
            </div>

            {/* Quick Fill Role Selector */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Quick-Select Credentials:
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('officer')}
                  className={`px-2 py-1.5 rounded text-[11px] font-medium border text-center transition-colors cursor-pointer ${
                    role === 'officer'
                      ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Proc. Officer
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('cvo')}
                  className={`px-2 py-1.5 rounded text-[11px] font-medium border text-center transition-colors cursor-pointer ${
                    role === 'cvo'
                      ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Vigilance (CVO)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('auditor')}
                  className={`px-2 py-1.5 rounded text-[11px] font-medium border text-center transition-colors cursor-pointer ${
                    role === 'auditor'
                      ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  CAG Auditor
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Auth Mode */}
              <div className="flex items-center gap-4 text-xs font-medium text-slate-700 pt-1 pb-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="authMethod"
                    checked={authMethod === 'dsc'}
                    onChange={() => setAuthMethod('dsc')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>DSC Token (Class 3)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="authMethod"
                    checked={authMethod === 'sso'}
                    onChange={() => setAuthMethod('sso')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Gov SSO / Parichay OTP</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NIC Officer ID / Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    badge
                  </span>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">DSC PIN / Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    key
                  </span>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-600 leading-snug">
                  <input
                    type="checkbox"
                    checked={statutoryConsent}
                    onChange={(e) => setStatutoryConsent(e.target.checked)}
                    required
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>
                    I confirm that I am an authorized public procurement official acting in compliance with GFR 2017 &
                    CVC integrity guidelines.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!statutoryConsent}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold py-2.5 px-4 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Authenticate & Enter Workspace</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono">IP: 10.42.19.88 (NIC-NET)</span>
              <span>SHA-256 Session Encrypted</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-3 px-6 text-xs text-slate-500 text-center">
        Government of India • Ministry of Petroleum & Natural Gas • Central Vigilance Commission Compliant
      </footer>
    </div>
  );
};
