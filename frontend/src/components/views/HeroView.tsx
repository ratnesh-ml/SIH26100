import React from 'react';

interface HeroViewProps {
  onEnterWorkspace: () => void;
  onExploreDemo: () => void;
  onLoginOptions: () => void;
}

export const HeroView: React.FC<HeroViewProps> = ({
  onEnterWorkspace,
  onExploreDemo,
  onLoginOptions,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 shadow-2xs">
        <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg flex items-center justify-center shadow-2xs">
              <span className="material-symbols-outlined text-blue-600 text-[20px]">shield</span>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-base font-bold text-slate-900 leading-tight tracking-tight">VigilBid</span>
              <span className="text-[11px] font-medium text-slate-500 leading-tight">Procurement AI</span>
            </div>
            <span className="hidden sm:inline-flex items-center justify-center font-mono text-[10.5px] font-semibold bg-blue-50/70 border border-blue-200/80 text-blue-700 px-2.5 py-0.5 rounded-md tracking-tight ml-2">
              GEM & PSU PROCUREMENT GRADE
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1.5">
            <span className="bg-blue-50 text-blue-700 font-semibold text-xs px-3.5 py-1.5 rounded-lg inline-flex items-center justify-center h-8">
              Platform Overview
            </span>
            <button
              onClick={onExploreDemo}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium text-xs px-3.5 py-1.5 rounded-lg inline-flex items-center justify-center h-8 transition-colors"
            >
              Interactive Tour
            </button>
            <button
              onClick={onEnterWorkspace}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium text-xs px-3.5 py-1.5 rounded-lg inline-flex items-center justify-center h-8 transition-colors"
            >
              Executive Cockpit
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onLoginOptions}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 hidden lg:inline-flex items-center transition-colors"
            >
              Workspace Roles
            </button>
            <button
              onClick={onEnterWorkspace}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-lg shadow-xs transition-colors inline-flex items-center justify-center gap-1.5 h-9"
            >
              <span>Access Portal</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="flex-1 w-full max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-10 py-6 flex flex-col justify-between gap-6">
        {/* Top Statutory Banner */}
        <div className="flex justify-center w-full">
          <div className="bg-white border border-slate-200 text-slate-700 text-xs px-4 py-1.5 rounded-full shadow-2xs inline-flex items-center gap-2 flex-wrap justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800">GeM 4.0 & CPCL Compliance Aligned</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 uppercase font-semibold text-[10.5px] tracking-wide">
              MINISTRY OF FINANCE GFR 2017 CERTIFIED SCRUTINY WORKFLOW
            </span>
          </div>
        </div>

        {/* Hero Split Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column */}
          <section className="lg:col-span-6 flex flex-col justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-1 rounded-lg uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  VIGILBID PROCUREMENT INTELLIGENCE
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                AI-Assisted Bid Compliance.{' '}
                <span className="text-blue-600 block mt-1">Evidence-First Decisions.</span>
              </h1>
              <p className="text-slate-600 leading-relaxed text-sm max-w-xl">
                VigilBid enables procurement evaluation committees to verify multi-tier bidder documents, isolate compliance risks, inspect exact evidentiary citations, and execute legally binding, auditable tender awards across GeM and Public Sector Undertakings.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={onEnterWorkspace}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Procurement Workspace</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
              <button
                onClick={onExploreDemo}
                className="bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold text-sm px-5 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-blue-600">play_circle</span>
                <span>Explore 90-Second Demo</span>
              </button>
            </div>

            {/* Micro Stats */}
            <div className="border-t border-slate-100 pt-4 grid grid-cols-3 gap-3 text-center sm:text-left">
              <div>
                <div className="font-mono text-xl font-extrabold text-slate-900">&lt;108ms</div>
                <div className="text-[11px] text-slate-500 font-medium">Evaluation Speed</div>
              </div>
              <div>
                <div className="font-mono text-xl font-extrabold text-blue-600">100%</div>
                <div className="text-[11px] text-slate-500 font-medium">Deterministic Rules</div>
              </div>
              <div>
                <div className="font-mono text-xl font-extrabold text-emerald-600">SHA-256</div>
                <div className="text-[11px] text-slate-500 font-medium">Cryptographic Audit</div>
              </div>
            </div>
          </section>

          {/* Right Column: 3 Pillar Cards */}
          <section className="lg:col-span-6 flex flex-col gap-4 justify-between">
            {/* Pillar 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">document_scanner</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Document Intelligence & Coordinate Highlighting</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-blue-100 text-blue-800">
                    STAGE 01-04
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Deterministic native PDF extraction maps GSTIN, PAN, turnover metrics, and CA certificates to exact pixel coordinates and split-screen visual bounding boxes.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">assured_workload</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Multi-Portal Government Registry Verification</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    STAGE 05-07
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Cross-checks bidder identities against GSTN, NSDL Income Tax, MCA-21, and CPPP National Debarment to eliminate shell company infiltration.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">analytics</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Explainable Risk Decomposition & Human Adjudication</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-amber-100 text-amber-800">
                    STAGE 08-11
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  0–100 composite risk scoring with full mathematical transparency. Procurement officers retain ultimate authority to qualify, reject, or override with mandatory CVC audit minutes.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer info bar */}
        <footer className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Chennai Petroleum Corporation Limited (CPCL)</span>
            <span>•</span>
            <span>Ministry of Petroleum & Natural Gas (MoPNG)</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>Smart India Hackathon 2026</span>
            <span>Problem Statement: SIH26100</span>
          </div>
        </footer>
      </main>
    </div>
  );
};
