import React from 'react';
import { RiskGauge } from '../common/RiskGauge';

interface RiskAnalysisViewProps {
  bidderId?: string;
  onNavigate: (view: string, params?: any) => void;
}

export const RiskAnalysisView: React.FC<RiskAnalysisViewProps> = ({
  bidderId = 'BID-HYD-0419',
  onNavigate,
}) => {
  const factors = [
    {
      name: 'Identity & Tax Discordance',
      points: '+35 pts',
      weight: '53.8%',
      severity: 'HIGH',
      color: 'bg-rose-600',
      description: 'State code 33 (TN) in GSTIN conflicts with MCA21 registered state 27 (MH). Potential proxy/shell concern.',
    },
    {
      name: 'Financial Turnover Shortfall',
      points: '+25 pts',
      weight: '38.5%',
      severity: 'HIGH',
      color: 'bg-rose-500',
      description: 'Declared 3-year turnover ₹6.10 Cr vs mandatory minimum ₹12.00 Cr (49.1% deficit).',
    },
    {
      name: 'MII Local Content Non-Compliance',
      points: '+5 pts',
      weight: '7.7%',
      severity: 'MEDIUM',
      color: 'bg-amber-500',
      description: 'Local content declared at 45.0% (Class-II) vs mandatory Class-I requirement (≥50.0%).',
    },
  ];

  return (
    <div className="flex flex-col w-full space-y-4 text-slate-800 text-xs">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('scrutiny')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Back to Scrutiny"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div className="h-5 w-px bg-slate-200"></div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Risk Composite Decomposition & Telemetry
              </h1>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                SCORE 65/100 • HIGH RISK
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Bidder: <strong className="text-slate-700">Bharat Hydrotech Corp ({bidderId})</strong> • Tender:{' '}
              <strong className="text-slate-700">CPCL/MM/2026/PUMP-217</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('vendor-graph')}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">hub</span>
            <span>Collusion Radial Graph</span>
          </button>
          <button
            onClick={() => onNavigate('scrutiny')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Proceed to Cockpit</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Risk Gauge & Factor Breakdown (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="font-bold text-slate-900 text-sm">Composite Score Decomposition</h2>
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                HIGH SEVERITY
              </span>
            </div>

            <div className="flex flex-col items-center justify-center my-6">
              <RiskGauge score={65} size={144} />
              <div className="mt-3 text-center">
                <div className="font-bold text-sm text-slate-900">Calculated Risk Index: 65/100</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Threshold for Escalation: &ge; 50/100</div>
              </div>
            </div>

            {/* Stacked Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                <span>Contribution Breakdown</span>
                <span className="font-mono">65 pts total</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div className="bg-rose-600 h-full" style={{ width: '54%' }} title="Identity +35"></div>
                <div className="bg-rose-400 h-full" style={{ width: '38%' }} title="Turnover +25"></div>
                <div className="bg-amber-400 h-full" style={{ width: '8%' }} title="Local Content +5"></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
                <span>0</span>
                <span>50 (High Risk Threshold)</span>
                <span>100</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-snug">
            Deterministic rule engine synthesizes verified registry flags and mathematical financial shortfalls.
          </div>
        </div>

        {/* Right: Detailed Vector Cards (7 Cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          {factors.map((f, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{f.name}</span>
                    <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{f.description}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="font-mono font-bold text-sm text-rose-700">{f.points}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{f.weight} of score</div>
                </div>
              </div>
            </div>
          ))}

          {/* Forensic Telemetry Strip */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 font-bold text-slate-900 text-xs">
              <span className="material-symbols-outlined text-[16px] text-blue-600">terminal</span>
              <span>Cryptographic Forensics & Metadata Telemetry</span>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold uppercase text-slate-400">Timestamp Alignment</div>
                <div className="font-mono text-xs font-semibold text-slate-800 mt-0.5">48m Discordance</div>
                <div className="text-[11px] text-slate-500 mt-0.5">PDF author timestamp vs DSC signoff</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold uppercase text-slate-400">Ingestion IP Pool</div>
                <div className="font-mono text-xs font-semibold text-slate-800 mt-0.5">103.21.144.92</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Maharashtra ASN Broadband pool</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
