import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  AlertCircle,
  Play,
  FileText,
  Tag,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { fetchBidder, fetchJobStatus, retagDocument, triggerJobProcessing } from '../api/client';
import { BidderDetail, JobStatus } from '../types';

interface PipelineStepperViewProps {
  jobId: string;
  bidderId: string;
  onBackToBidders: () => void;
  onViewBidderCockpit: (bidderId: string) => void;
}

const DOCUMENT_TYPES = [
  'GST_CERT',
  'PAN_CARD',
  'CIN_CERT',
  'UDYAM_CERT',
  'CA_TURNOVER_CERT',
  'AUDITED_FINANCIALS',
  'OEM_AUTH_LETTER',
  'WORK_ORDER',
  'MII_DECLARATION',
  'EMD_BG_PROOF',
  'OTHER',
];

export const PipelineStepperView: React.FC<PipelineStepperViewProps> = ({
  jobId,
  bidderId,
  onBackToBidders,
  onViewBidderCockpit,
}) => {
  const [job, setJob] = useState<JobStatus | null>(null);
  const [bidder, setBidder] = useState<BidderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retaggingDocId, setRetaggingDocId] = useState<string | null>(null);

  const pollTimerRef = useRef<any>(null);

  const loadJobAndBidder = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [jobData, bidderData] = await Promise.all([
        fetchJobStatus(jobId),
        fetchBidder(bidderId).catch(() => null),
      ]);
      setJob(jobData);
      if (bidderData) setBidder(bidderData);
      setError(null);

      // Continue polling if job is still in progress
      if (jobData.status === 'QUEUED' || jobData.status === 'PROCESSING' || jobData.status === 'RUNNING') {
        schedulePoll();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve job status.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const schedulePoll = () => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    pollTimerRef.current = setTimeout(() => {
      loadJobAndBidder(true);
    }, 2000);
  };

  useEffect(() => {
    loadJobAndBidder();
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [jobId]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    try {
      const updatedJob = await triggerJobProcessing(jobId);
      setJob(updatedJob);
      schedulePoll();
    } catch (err: any) {
      setError(err?.message || 'Failed to restart pipeline processing.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleRetag = async (docId: string, newType: string) => {
    setRetaggingDocId(docId);
    try {
      const res = await retagDocument(bidderId, docId, newType);
      // Reload bidder documents
      const refreshedBidder = await fetchBidder(bidderId);
      setBidder(refreshedBidder);
      // If a new job was spawned for reprocessing, poll that
      if (res.job_id && res.job_id !== jobId) {
        // Refresh status
        loadJobAndBidder();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to retag document.');
    } finally {
      setRetaggingDocId(null);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-rose-400" />;
      case 'RUNNING':
        return <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-slate-600" />;
    }
  };

  const isJobComplete = job?.status === 'DONE';
  const isJobFailed = job?.status === 'FAILED';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToBidders}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Bidders</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Pipeline Processing Stepper</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${
                  isJobComplete
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : isJobFailed
                    ? 'bg-rose-950 text-rose-400 border-rose-800'
                    : 'bg-sky-950 text-sky-400 border-sky-800 animate-pulse'
                }`}
              >
                {job?.status || 'INITIALIZING'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Bidder: <span className="text-slate-200 font-semibold">{bidder?.declared_name || bidderId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isJobFailed && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              {isRetrying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>Retry Full Pipeline</span>
            </button>
          )}

          {isJobComplete && (
            <button
              onClick={() => onViewBidderCockpit(bidderId)}
              className="py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-950"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Open Bidder Cockpit</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => loadJobAndBidder(false)}
            disabled={loading}
            title="Refresh Status"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 text-xs text-rose-300">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">Processing Error Encountered</p>
            <p className="mt-0.5 text-rose-400 font-mono text-[11px]">{error}</p>
          </div>
        </div>
      )}

      {/* Pipeline 11-Step Stepper */}
      <div className="border border-slate-800 rounded-xl bg-slate-900/60 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            11-Step Forensic Evaluation Stepper
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Step {job?.current_step ?? 0} of {job?.steps?.length || 11}
          </span>
        </div>

        {loading && !job ? (
          <div className="p-8 text-center flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
            <span className="text-xs text-slate-400">Loading step state machine...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {job?.steps?.map((st) => (
              <div
                key={st.step_number}
                className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                  st.status === 'DONE'
                    ? 'bg-emerald-950/20 border-emerald-800/40'
                    : st.status === 'RUNNING'
                    ? 'bg-sky-950/30 border-sky-800/60 shadow-md shadow-sky-950/50'
                    : st.status === 'FAILED'
                    ? 'bg-rose-950/40 border-rose-800/80'
                    : 'bg-slate-950/40 border-slate-800/70 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0">{getStepIcon(st.status)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500 font-semibold">
                        STEP {st.step_number}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          st.status === 'DONE'
                            ? 'text-slate-200'
                            : st.status === 'RUNNING'
                            ? 'text-sky-300 font-bold'
                            : st.status === 'FAILED'
                            ? 'text-rose-300 font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        {st.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono">
                  {st.meta?.duration_ms && (
                    <span className="text-slate-500">{st.meta.duration_ms} ms</span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                      st.status === 'DONE'
                        ? 'text-emerald-400 bg-emerald-950/60'
                        : st.status === 'RUNNING'
                        ? 'text-sky-400 bg-sky-950/80 animate-pulse'
                        : st.status === 'FAILED'
                        ? 'text-rose-400 bg-rose-950'
                        : 'text-slate-500 bg-slate-900'
                    }`}
                  >
                    {st.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ingested Documents & Retagging Panel */}
      {bidder && bidder.documents && bidder.documents.length > 0 && (
        <div className="border border-slate-800 rounded-xl bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Ingested Filings & Document Classification Chips</span>
            </h3>
            <span className="text-xs text-slate-400">
              Officer can re-tag document to trigger reprocessing from Step 4
            </span>
          </div>

          <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/50">
            {bidder.documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-900/30"
              >
                <div className="space-y-0.5 truncate pr-2">
                  <div className="font-medium text-slate-200 truncate">{doc.original_filename}</div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {doc.page_count || 1} pages • SHA-256: {doc.sha256.substring(0, 16)}...
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={doc.doc_type || 'OTHER'}
                      disabled={retaggingDocId === doc.id}
                      onChange={(e) => handleRetag(doc.id, e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-sky-500 disabled:opacity-50"
                    >
                      {DOCUMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {retaggingDocId === doc.id && (
                    <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
