import React, { useState } from 'react';

interface PipelineStepperViewProps {
  onNavigate: (view: string, params?: any) => void;
  bidderId?: string;
}

export const PipelineStepperView: React.FC<PipelineStepperViewProps> = ({
  onNavigate,
  bidderId = 'BID-HYD-0419',
}) => {
  const [selectedStep, setSelectedStep] = useState<number>(10);

  const steps = [
    {
      id: 1,
      title: 'Ingestion & Pre-Flight',
      desc: 'ClamAV malware scan & SHA-256 CAS manifest hashing',
      time: '1.2s',
      status: 'completed',
      category: 'Security',
      detail: 'Clean scan. SHA-256 CAS digest calculated: 8f4e229...c91d. 4 PDFs validated.',
    },
    {
      id: 2,
      title: 'Document OCR & Layout Preprocessing',
      desc: 'Tesseract 5 & layout table parsing on 142 pages',
      time: '4.8s',
      status: 'completed',
      category: 'Processing',
      detail: '142 pages rasterized at 300 DPI. Table recognition identified 18 audited schedules.',
    },
    {
      id: 3,
      title: 'Structured Key-Value Extraction',
      desc: 'Named entity extraction for PAN, GSTIN, CIN, Turnover',
      time: '3.1s',
      status: 'completed',
      category: 'Extraction',
      action: 'extraction',
      actionLabel: 'Inspect Extracted Fields →',
      detail: 'Confidence 98.4%. Extracted: PAN AAACB1234F, GSTIN 33AAACB9999F1Z5, CIN U29100MH2018PTC310244.',
    },
    {
      id: 4,
      title: 'Statutory Registry Verification',
      desc: 'Source-of-truth queries against CBDT, GSTN, MCA21, Udyam',
      time: '2.4s',
      status: 'completed',
      category: 'Verification',
      action: 'registry',
      actionLabel: 'Inspect Registry Queries →',
      detail: 'Discrepancy detected: GSTIN state code 33 (TN) differs from MCA21 ROC registered state 27 (MH).',
    },
    {
      id: 5,
      title: 'Deterministic Rule Engine',
      desc: 'Evaluation against GFR 2017 & CVC procurement criteria',
      time: '0.9s',
      status: 'completed',
      category: 'Rules',
      detail: 'Turnover rule evaluated: Declared ₹6.10 Cr vs tender threshold ₹12.00 Cr (FAIL).',
    },
    {
      id: 6,
      title: 'Financial Health & Ratio Modeling',
      desc: 'Audited balance sheets, net worth, liquidity evaluation',
      time: '1.5s',
      status: 'completed',
      category: 'Financial',
      detail: 'Net worth ₹4.85 Cr satisfies minimum requirement (₹3.00 Cr). Debt-to-equity ratio: 0.82.',
    },
    {
      id: 7,
      title: 'Cross-Bidder Collusion & Cartel Graph',
      desc: 'Director graph overlap, IP telemetry, bank account traces',
      time: '2.1s',
      status: 'completed',
      category: 'Cartel Detection',
      action: 'vendor-graph',
      actionLabel: 'Inspect Radial Graph →',
      detail: 'Shared director match detected: DIN 08492019 overlaps with Nova Pumps (Bidder D).',
    },
    {
      id: 8,
      title: 'Forensic Anomaly & Metadata Scanning',
      desc: 'PDF authoring timestamp vs DSC signature discordance',
      time: '1.0s',
      status: 'completed',
      category: 'Forensics',
      detail: 'PDF creation timestamp differs from DSC timestamp by 48m. Font alteration test clean.',
    },
    {
      id: 9,
      title: 'Risk Composite Score Synthesis',
      desc: 'Weighted multi-factor score synthesis (0–100 scale)',
      time: '0.4s',
      status: 'completed',
      category: 'Synthesis',
      action: 'risk-anomalies',
      actionLabel: 'Inspect Risk Vectors →',
      detail: 'Composite score: 65/100 (HIGH RISK). Primary drivers: Identity (+35) and Turnover (+25).',
    },
    {
      id: 10,
      title: 'Immutable Merkle Block Committal',
      desc: 'SHA-256 block hash linked to Block #144 in audit ledger',
      time: '0.6s',
      status: 'completed',
      category: 'Ledger',
      action: 'audit-ledger',
      actionLabel: 'Inspect Audit Block →',
      detail: 'Block #144 appended. Root: 8f4e229...c91d. Verified across 144 chronological blocks.',
    },
    {
      id: 11,
      title: 'Central Scrutiny Cockpit Ready',
      desc: 'Bidder evaluation package prepared for Officer Adjudication',
      time: 'Instant',
      status: 'ready',
      category: 'Adjudication',
      action: 'scrutiny',
      actionLabel: 'Open Scrutiny Cockpit →',
      detail: 'Awaiting officer determination (Qualify, Reject, Override, Seek Clarification).',
    },
  ];

  return (
    <div className="flex flex-col w-full space-y-4 text-slate-800 text-xs">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Pipeline Execution Monitor</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] uppercase font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 11 OF 11 COMPLETED
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated statutory ingestion, OCR extraction, source-of-truth registry verification, and risk synthesis.
          </p>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600">
            <span>
              Target Bidder: <strong className="font-mono text-slate-900">Bharat Hydrotech Corp ({bidderId})</strong>
            </span>
            <span>•</span>
            <span>
              Tender: <strong className="font-mono text-slate-900">CPCL/MM/2026/PUMP-217</strong>
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">Total Execution Time: 17.5s</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('scrutiny', { bidderId })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Bidder Scrutiny Cockpit</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Main Stepper Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Step List (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col gap-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
            Forensic Pipeline Sequence
          </div>

          <div className="space-y-2">
            {steps.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => setSelectedStep(idx)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  selectedStep === idx
                    ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-2 ring-blue-500/10'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                      s.status === 'ready'
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {s.status === 'ready' ? (
                      <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{s.title}</span>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                        {s.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{s.desc}</div>
                  </div>
                </div>

                <div className="text-right font-mono text-[11px] text-slate-400 shrink-0 ml-3">
                  {s.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Step Inspector (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-blue-600">
                  Step {steps[selectedStep].id} Details
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">{steps[selectedStep].title}</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                VERIFIED
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Execution Summary</label>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {steps[selectedStep].detail}
                </p>
              </div>

              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[11px] space-y-1">
                <div className="text-slate-500"># Forensic Process Stream Telemetry</div>
                <div>&gt; module: vigilbid.pipeline.step_{steps[selectedStep].id}</div>
                <div>&gt; latency: {steps[selectedStep].time}</div>
                <div>&gt; status: 0 (EXIT_SUCCESS)</div>
                <div>&gt; sha256: 8f4e229a17c76a...91d</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 mt-4">
            {steps[selectedStep].action ? (
              <button
                onClick={() => onNavigate(steps[selectedStep].action!)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{steps[selectedStep].actionLabel}</span>
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('scrutiny', { bidderId })}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-2.5 px-4 rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Scrutiny Cockpit</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
