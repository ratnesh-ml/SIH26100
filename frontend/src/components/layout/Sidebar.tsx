import React from 'react';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  anomalyCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRoute, onNavigate, anomalyCount = 2 }) => {
  const navItems = [
    { route: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { route: 'tenders', label: 'Tenders', icon: 'gavel' },
    { route: 'bidders', label: 'Bidders', icon: 'badge' },
    { route: 'compliance-matrix', label: 'Compliance Matrix', icon: 'fact_check' },
    { route: 'risk', label: 'Risk & Anomalies', icon: 'warning', badge: anomalyCount },
    { route: 'graph', label: 'Vendor Graph', icon: 'hub' },
    { route: 'audit', label: 'Audit Ledger', icon: 'receipt_long' },
  ];

  const secondaryItems = [
    { route: 'dossier', label: 'CVC Dossier', icon: 'description' },
    { route: 'pipeline', label: 'Forensic Pipeline', icon: 'account_tree' },
    { route: 'registry', label: 'Registry Sync', icon: 'verified' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-50 flex flex-col justify-between select-none shadow-xs">
      <div className="flex flex-col">
        {/* Logo Header */}
        <div
          onClick={() => onNavigate('dashboard')}
          className="h-14 px-4 flex items-center gap-3 border-b border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs font-bold text-sm">
            VB
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold tracking-tight text-slate-900 leading-tight">VigilBid</span>
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">ProcureShield • GOV</span>
          </div>
        </div>

        {/* Section Label: Core Registry */}
        <div className="px-4 pt-4 pb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Core Registry</span>
        </div>

        {/* Primary Navigation */}
        <nav className="flex flex-col gap-0.5 px-2.5">
          {navItems.map((item) => {
            const isActive = currentRoute === item.route || (item.route === 'bidders' && currentRoute === 'scrutiny');
            return (
              <button
                key={item.route}
                onClick={() => onNavigate(item.route)}
                className={`flex items-center justify-between px-3 py-2 rounded-md font-medium text-[13px] transition-all text-left w-full ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border-l-[3px] border-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-blue-700' : 'text-slate-500'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold font-mono bg-rose-100 text-rose-700 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Section Label: Forensics & Reports */}
        <div className="px-4 pt-4 pb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Forensics & Reports</span>
        </div>

        {/* Secondary Navigation */}
        <nav className="flex flex-col gap-0.5 px-2.5">
          {secondaryItems.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => onNavigate(item.route)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md font-medium text-[12px] transition-colors text-left w-full ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border-l-[3px] border-blue-600'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <span className={`material-symbols-outlined text-[16px] ${isActive ? 'text-blue-700' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80 flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="font-mono text-[10px] text-slate-400">SYS_VER</span>
          <span className="font-mono text-[11px] font-semibold text-slate-700">v2.4.8-PROD</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded border border-slate-200 shadow-2xs">
          <span className="material-symbols-outlined text-[14px] text-emerald-600">verified_user</span>
          <span className="font-mono text-[10.5px] font-medium text-slate-700 truncate">NIC-CERT Level 3 SECURED</span>
        </div>
      </div>
    </aside>
  );
};
