import React, { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, AlertCircle, Loader2, Shield, AlertTriangle, FileText, CheckCircle2, XCircle, HelpCircle, Download, Activity, UploadCloud } from 'lucide-react';
import { fetchBidder, fetchBidderFindings, fetchBidderJobs, fetchBidderRisk } from '../api/client';
import { BidderDetail, FindingOut, JobStatus, RiskProfileOut } from '../types';

interface BidderDetailViewProps {
  bidderId: string;
  onBack: () => void;
  onOpenPipeline?: (jobId: string, bidderId: string) => void;
  onOpenUploadModal?: () => void;
  canUpload?: boolean;
}

export const BidderDetailView: React.FC<BidderDetailViewProps> = ({
  bidderId,
  onBack,
  onOpenPipeline,
  onOpenUploadModal,
  canUpload,
}) => {
  const [bidder, setBidder] = useState<BidderDetail | null>(null);
  const [findings, setFindings] = useState<FindingOut[]>([]);
  const [risk, setRisk] = useState<RiskProfileOut | null>(null);
  const [latestJob, setLatestJob] = useState<JobStatus | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bidderRes, findingsRes, riskRes, jobsRes] = await Promise.all([
        fetchBidder(bidderId),
        fetchBidderFindings(bidderId).catch(() => [] as FindingOut[]),
        fetchBidderRisk(bidderId).catch(() => null as RiskProfileOut | null),
        fetchBidderJobs(bidderId).catch(() => [] as JobStatus[]),
      ]);
      setBidder(bidderRes);
      setFindings(findingsRes);
      setRisk(riskRes);
      if (jobsRes && jobsRes.length > 0) {
        setLatestJob(jobsRes[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve bidder evaluation dossier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [bidderId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'FAIL':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'WARN':
      case 'REVIEW':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bidders</span>
        </button>

        <div className="h-4 w-px bg-slate-800" />

        <div className="flex-1">
          <h2 className="text-xl font-bold tracking-tight text-white">
            {bidder?.canonical_name || bidder?.declared_name || 'Bidder Evaluation Cockpit'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Technical Compliance Dossier & Forensic Anomaly Audit
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {latestJob && bidder && onOpenPipeline && (
            <button
              onClick={() => onOpenPipeline(latestJob.id, bidder.id)}
              className="py-1.5 px-3 rounded-lg bg-sky-600/20 hover:bg-sky-600 hover:text-white border border-sky-500/30 text-sky-400 font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Pipeline Stepper ({latestJob.status})</span>
            </button>
          )}

          <button
            onClick={loadData}
            disabled={loading}
            title="Refresh Dossier"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-12 rounded-xl bg-slate-900/40 border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Loading evaluation findings & evidence...</span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 text-xs text-rose-300">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">Failed to load bidder dossier</p>
            <p className="mt-0.5 text-rose-400">{error}</p>
            <button
              onClick={loadData}
              className="mt-2.5 px-3 py-1 bg-rose-900/60 hover:bg-rose-900 text-rose-200 rounded font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && bidder && (
        <>
          {/* Identity & Risk Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Identity */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Statutory Identifiers
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">PAN</span>
                  <span className="font-mono text-slate-200">{bidder.pan || 'Not Declared'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">GSTIN</span>
                  <span className="font-mono text-slate-200">{bidder.gstin || 'Not Declared'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">CIN</span>
                  <span className="font-mono text-slate-200">{bidder.cin || 'Not Declared'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Udyam MSE</span>
                  <span className="font-mono text-slate-200">{bidder.udyam_no || 'Not Declared'}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Composite Risk Score */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Composite Risk Analysis
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    bidder.risk_band === 'HIGH'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                      : bidder.risk_band === 'MEDIUM'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                  }`}
                >
                  {bidder.risk_band} RISK
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-white">{bidder.risk_score}</span>
                <span className="text-xs text-slate-500 font-mono">/ 100</span>
              </div>

              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    bidder.risk_band === 'HIGH'
                      ? 'bg-rose-500'
                      : bidder.risk_band === 'MEDIUM'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, bidder.risk_score))}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-400">
                Review State: <span className="text-slate-200 font-medium">{bidder.review_state}</span>
              </div>
            </div>

            {/* Column 3: Forensic Signals */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Primary Risk Signals
              </div>
              {risk?.drivers && risk.drivers.length > 0 ? (
                <div className="space-y-1.5 text-xs max-h-32 overflow-y-auto">
                  {risk.drivers.map((d: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-[11px] py-1 border-b border-slate-800/50">
                      <span className="text-slate-300 truncate pr-2">{d.driver}</span>
                      <span className="font-mono font-semibold text-amber-400 shrink-0">+{d.points} pt</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-4 text-center">No elevated risk drivers detected.</div>
              )}
            </div>
          </div>

          {/* Compliance Findings Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400" />
                <span>Deterministic Compliance Findings ({findings.length})</span>
              </h3>
              <a
                href={`/api/v1/bidders/${bidder.id}/report.pdf`}
                target="_blank"
                rel="noreferrer"
                className="py-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs inline-flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CVC Dossier (PDF)</span>
              </a>
            </div>

            {findings.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                No evaluation findings generated yet for this bidder. Pipeline execution may be pending.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {findings.map((f: FindingOut) => (
                  <div
                    key={f.id}
                    className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col gap-2.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(f.status)}
                        <span className="font-mono text-xs font-bold text-sky-400">{f.rule_id}</span>
                        <span className="text-xs font-semibold text-slate-200">{f.title}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          f.status === 'PASS'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : f.status === 'FAIL'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {f.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{f.explanation}</p>

                    {f.evidence && f.evidence.length > 0 && (
                      <div className="mt-1 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1 text-xs">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                          Source Evidence Quote:
                        </span>
                        {f.evidence.map((ev: any, i: number) => (
                          <div key={i} className="text-slate-400 font-mono text-[11px] leading-relaxed">
                            <span className="text-sky-400 font-semibold">[Page {ev.page_no || 1}]</span> "{ev.quote}"
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ingested Documents Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Ingested Tender Filings ({bidder.documents?.length || 0})</span>
              </h3>
              {canUpload && onOpenUploadModal && (
                <button
                  onClick={onOpenUploadModal}
                  className="py-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
                  <span>Upload Additional Filings</span>
                </button>
              )}
            </div>

            {(!bidder.documents || bidder.documents.length === 0) ? (
              <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                No documents stored on disk for this bidder.
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl bg-slate-900/50 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-4">Filename</th>
                      <th className="py-2.5 px-4">Classification</th>
                      <th className="py-2.5 px-4">Pages</th>
                      <th className="py-2.5 px-4">SHA-256 Digest</th>
                      <th className="py-2.5 px-4 text-right">View / Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {bidder.documents.map((d: any) => (
                      <tr key={d.id} className="hover:bg-slate-800/20">
                        <td className="py-2.5 px-4 font-medium text-slate-200">{d.original_filename}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                            {d.doc_type || 'UNCLASSIFIED'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-400">{d.page_count || 1} pages</td>
                        <td className="py-2.5 px-4 font-mono text-slate-500 text-[10px]">
                          {d.sha256.substring(0, 16)}...
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <a
                            href={`/api/v1/documents/${d.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1"
                          >
                            <span>Download</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
