import React from 'react';
import { Tender } from '../../mockData/tenders';

interface HeaderProps {
  tenders: Tender[];
  selectedTenderId: string;
  onSelectTender: (id: string) => void;
  onOpenNotifications?: () => void;
  onSignOut?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentUser?: { id: string; name: string; role: string; title: string };
}

export const Header: React.FC<HeaderProps> = ({
  tenders,
  selectedTenderId,
  onSelectTender,
  onOpenNotifications,
  onSignOut,
  searchQuery,
  onSearchChange,
  currentUser,
}) => {
  return (
    <header className="fixed top-0 left-64 right-0 h-14 bg-white border-b border-slate-200 z-40 px-6 flex items-center justify-between gap-4 select-none shadow-2xs">
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        {/* Tender Selector */}
        <div className="relative flex items-center border border-slate-200 rounded-md bg-slate-50/70 px-2.5 py-1.5 w-72 hover:border-slate-300 focus-within:border-blue-500 focus-within:bg-white transition-colors">
          <span className="material-symbols-outlined text-[16px] text-slate-500 mr-1.5 shrink-0">dataset</span>
          <select
            value={selectedTenderId}
            onChange={(e) => onSelectTender(e.target.value)}
            className="w-full bg-transparent text-[12px] text-slate-800 truncate focus:outline-none cursor-pointer font-medium"
          >
            {tenders.map((t) => (
              <option key={t.id} value={t.id}>
                {t.refNo} • {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1 flex items-center bg-slate-50/70 border border-slate-200 rounded-md px-3 py-1.5 focus-within:border-blue-500 focus-within:bg-white transition-colors">
          <span className="material-symbols-outlined text-[16px] text-slate-400 mr-2 shrink-0">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tenders, bidders, GSTIN, PAN..."
            className="w-full bg-transparent text-[12px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="font-mono text-[9.5px] bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-600 shadow-2xs ml-1 shrink-0">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-4">
        {/* Anomaly quick flag */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-full text-[11px] text-rose-700 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span>Bidder C: High Risk Anomaly (65/100)</span>
        </div>

        {/* Notifications Button */}
        <button
          onClick={onOpenNotifications}
          aria-label="Notifications"
          className="relative p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
        </button>

        <div className="h-6 w-px bg-slate-200"></div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col items-end text-right leading-tight">
            <span className="text-[13px] text-slate-900 font-semibold">{currentUser?.name || 'Rajesh Verma'}</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10.5px] text-slate-500">
                {currentUser?.title || (currentUser?.role ? currentUser.role.toUpperCase() : 'Chief Procurement Officer')}
              </span>
              <span className="font-mono text-[9px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                DSC Active
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-xs border border-slate-300 shadow-2xs">
            {(currentUser?.name || 'Rajesh Verma')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          {onSignOut && (
            <button
              onClick={onSignOut}
              title="Sign Out / Switch Workspace"
              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
