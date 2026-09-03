import { useEffect, useState } from 'react';
import { fetchHealth } from './api/client';
import { Shield, CheckCircle, FileText, AlertTriangle, Scale } from 'lucide-react';

export default function App() {
  const [health, setHealth] = useState<{ status: string; project: string; version: string } | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: 'offline', project: 'VigilBid (SIH26100)', version: '1.0.0' }));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-sky-400" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">VigilBid</h1>
            <p className="text-xs text-slate-400">CPCL Two-Bid Tender Evaluation & Decision Support</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            GFR 2017 & CVC Compliant
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Backend: {health?.status ?? 'Connecting...'}
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-8 flex flex-col gap-6">
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">Phase 03 — Production Architecture Scaffolding</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Decision-support platform initialized with strict separation of AI textification & deterministic compliance rules.
            UI components (S1–S8) and 11-step pipeline runner structured for development.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <FileText className="w-5 h-5 text-sky-400 mb-2" />
              <div className="text-sm font-medium text-slate-200">11-Step Pipeline</div>
              <div className="text-xs text-slate-500 mt-1">Ingest → Classify → Extract → Rule Engine</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <Scale className="w-5 h-5 text-amber-400 mb-2" />
              <div className="text-sm font-medium text-slate-200">34 Compliance Rules</div>
              <div className="text-xs text-slate-500 mt-1">CPCL BEC Goods Template v1 Locked</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <CheckCircle className="w-5 h-5 text-emerald-400 mb-2" />
              <div className="text-sm font-medium text-slate-200">Cryptographic Audit</div>
              <div className="text-xs text-slate-500 mt-1">SHA-256 Hash Chain Integrity</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <AlertTriangle className="w-5 h-5 text-rose-400 mb-2" />
              <div className="text-sm font-medium text-slate-200">Legal Terminology</div>
              <div className="text-xs text-slate-500 mt-1">Strict Advisory Vocabulary Enforced</div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/80 px-6 py-3 text-xs text-slate-500 flex justify-between">
        <span>VigilBid • SIH Grand Finale (Problem SIH26100)</span>
        <span>Version 1.0.0</span>
      </footer>
    </div>
  );
}
