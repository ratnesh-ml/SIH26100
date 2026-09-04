import React from 'react';
import { Shield, LogOut, User as UserIcon } from 'lucide-react';
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
    | 'audit';
  onNavigate: (view: 'dashboard' | 'tenders' | 'bidders' | 'audit') => void;
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
  const isDashboardActive = activeView === 'dashboard';
  const isTendersActive = activeView === 'tenders' || activeView === 'matrix' || activeView === 'graph';
  const isBiddersActive =
    activeView === 'bidders' ||
    activeView === 'bidder-detail' ||
    activeView === 'pipeline' ||
    activeView === 'risk-anomalies';
  const isAuditActive = activeView === 'audit';

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">VigilBid</span>
              <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300">
                SIH26100
              </span>
            </div>
            <p className="text-[11px] text-slate-400">CPCL Public Procurement Decision Support</p>
          </div>
        </div>

        {currentUser && (
          <nav className="flex items-center gap-1 border-l border-slate-800 pl-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isDashboardActive
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('tenders')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isTendersActive
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Tenders
            </button>
            <button
              onClick={() => onNavigate('bidders')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isBiddersActive
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              All Bidders
            </button>
            <button
              onClick={() => onNavigate('audit')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isAuditActive
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Audit Trail
            </button>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-4">
        {healthStatus && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                healthStatus === 'healthy' || healthStatus === 'ok' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span>DB: {healthStatus}</span>
          </div>
        )}

        {currentUser ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/70">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <div className="text-left">
                <span className="text-xs font-medium text-slate-200 block leading-tight truncate max-w-[140px]">
                  {currentUser.full_name}
                </span>
                <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-sky-400 block">
                  {currentUser.role}
                </span>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 rounded-md hover:bg-rose-950/40 border border-transparent hover:border-rose-800/60 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Not Authenticated</div>
        )}
      </div>
    </header>
  );
};
