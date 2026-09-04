import React from 'react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  activeView:
    | 'dashboard'
    | 'tenders'
    | 'matrix'
    | 'bidders'
    | 'bidder-detail'
    | 'pipeline'
    | 'risk-anomalies'
    | 'graph'
    | 'audit'
    | 'demo';
  onNavigate: (view: 'dashboard' | 'tenders' | 'bidders' | 'audit' | 'demo') => void;
  onLogout: () => void;
  healthStatus?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeView,
  onNavigate,
  onLogout,
  healthStatus,
}) => {
  const isDemoActive = activeView === 'demo';
  const isDashboardActive = activeView === 'dashboard';
  const isTendersActive = activeView === 'tenders' || activeView === 'matrix';
  const isBiddersActive =
    activeView === 'bidders' ||
    activeView === 'bidder-detail' ||
    activeView === 'pipeline' ||
    activeView === 'risk-anomalies';
  const isAuditActive = activeView === 'audit';

  const getViewSubtitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Executive Command Center • Central Tender Board';
      case 'tenders':
        return 'Active Two-Bid Tenders • GFR 2017 Evaluation';
      case 'matrix':
        return 'Tender Compliance Matrix • NIT CPCL/MM/2026/PUMP-217';
      case 'bidders':
      case 'bidder-detail':
        return 'Primary Bidder Cockpit • Adjudication & Evidence';
      case 'graph':
        return 'Cross-Bidder Collusion Graph • CVC Related-Party Heuristics';
      case 'audit':
        return 'Tamper-Evident Audit Ledger • SHA-256 Hash Chain';
      case 'pipeline':
        return '11-Step Forensic Pipeline Stepper • Live Monitor';
      case 'demo':
        return 'SIH Grand Finale Presentation Runner';
      default:
        return 'Public Procurement Decision Support';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full shadow-sm">
      {/* Row 1: Apple Global Black Bar (44px) */}
      <div className="h-11 bg-black text-white flex items-center justify-between px-6 border-b border-white/10">
        <div className="flex items-center gap-6">
          <div
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onNavigate('dashboard')}
          >
            <span className="w-6 h-6 rounded-full bg-[#0066cc] flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
              V
            </span>
            <span className="text-[13px] font-semibold tracking-tight text-white flex items-center gap-1.5">
              CPCL <span className="text-white/40">•</span> VigilBid
            </span>
            <span className="text-[10px] tracking-wider px-1.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/80 font-mono">
              SIH26100
            </span>
          </div>

          {currentUser && (
            <nav className="hidden md:flex items-center gap-5 text-[13px] border-l border-white/15 pl-6">
              <button
                onClick={() => onNavigate('dashboard')}
                className={`transition-colors py-1 ${
                  isDashboardActive
                    ? 'text-white font-semibold underline underline-offset-8 decoration-[#0066cc] decoration-2'
                    : 'text-[#a0a0a5] hover:text-white font-normal'
                }`}
              >
                Command Center
              </button>
              <button
                onClick={() => onNavigate('tenders')}
                className={`transition-colors py-1 ${
                  isTendersActive
                    ? 'text-white font-semibold underline underline-offset-8 decoration-[#0066cc] decoration-2'
                    : 'text-[#a0a0a5] hover:text-white font-normal'
                }`}
              >
                Tenders
              </button>
              <button
                onClick={() => onNavigate('bidders')}
                className={`transition-colors py-1 ${
                  isBiddersActive
                    ? 'text-white font-semibold underline underline-offset-8 decoration-[#0066cc] decoration-2'
                    : 'text-[#a0a0a5] hover:text-white font-normal'
                }`}
              >
                Bidders
              </button>
              <button
                onClick={() => onNavigate('audit')}
                className={`transition-colors py-1 ${
                  isAuditActive
                    ? 'text-white font-semibold underline underline-offset-8 decoration-[#0066cc] decoration-2'
                    : 'text-[#a0a0a5] hover:text-white font-normal'
                }`}
              >
                Audit Ledger
              </button>
              <button
                onClick={() => onNavigate('demo')}
                className={`transition-colors py-1 flex items-center gap-1.5 ${
                  isDemoActive
                    ? 'text-amber-300 font-semibold underline underline-offset-8 decoration-amber-400 decoration-2'
                    : 'text-amber-400/90 hover:text-amber-300 font-normal'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Live Demo
              </button>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {healthStatus && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/90 text-[11px] font-mono">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  healthStatus === 'healthy' || healthStatus === 'ok'
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <span>PostgreSQL 16 & OCR Online</span>
            </div>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-white">
                <span className="w-2 h-2 rounded-full bg-[#0071e3]" />
                <span className="font-medium text-[12px]">{currentUser.full_name}</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/15 text-white/80">
                  {currentUser.role}
                </span>
              </div>

              <button
                onClick={onLogout}
                title="Sign Out"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500/20 border border-white/15 hover:border-rose-400/40 text-white/80 hover:text-rose-300 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('demo')}
              className="px-4 py-1 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium transition-colors"
            >
              Enter Demo
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Frosted Apple Sub-Nav (52px) */}
      <div className="h-[52px] bg-[#f5f5f7]/90 backdrop-blur-xl border-b border-[#e0e0e0] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold text-[#1d1d1f] tracking-tight">
            Decision Support Matrix
          </span>
          <div className="h-3.5 w-[1px] bg-[#e0e0e0]" />
          <span className="text-[13px] text-[#7a7a7a] font-normal truncate max-w-[450px]">
            {getViewSubtitle()}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-white border border-[#0066cc] text-[#0066cc] text-[11px] font-semibold shadow-xs">
            GFR 2017 Audit Active
          </span>
          <span className="px-3 py-1 rounded-full bg-white border border-[#e0e0e0] text-[#1d1d1f] text-[11px] font-medium shadow-xs">
            PPP-MII 50%+
          </span>
          <span className="px-3 py-1 rounded-full bg-white border border-[#e0e0e0] text-[#7a7a7a] text-[11px] font-mono shadow-xs">
            SHA-256 Verified
          </span>
        </div>
      </div>
    </header>
  );
};
