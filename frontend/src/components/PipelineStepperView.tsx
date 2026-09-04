import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Play,
  FileText,
  Tag,
  ArrowRight,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { fetchBidder, fetchJobStatus, retagDocument, triggerJobProcessing } from '../api/client';
import { BidderDetail, JobStatus } from '../types';
import {
  StatusChip,
  Button,
  LoadingState,
  ErrorState,
} from './ui';

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
      const refreshedBidder = await fetchBidder(bidderId);
      setBidder(refreshedBidder);
      if (res.job_id && res.job_id !== jobId) {
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
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-hidden="true" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-rose-400" aria-hidden="true" />;
      case 'RUNNING':
        return <Loader2 className="w-5 h-5 text-sky-400 animate-spin" aria-hidden="true" />;
      default:
        return <Clock className="w-5 h-5 text-slate-600" aria-hidden="true" />;
    }
  };

  const isJobComplete = job?.status === 'DONE';
  const isJobFailed = job?.status === 'FAILED';

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="xs"
            onClick={onBackToBidders}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            aria-label="Back to Bidders Roster"
          >
            Bidders
          </Button>

          <div className="h-5 w-px bg-slate-800" aria-hidden="true" />

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Pipeline Processing Stepper</span>
              </h1>
              <StatusChip status={job?.status || 'QUEUED'} size="sm" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Bidder: <span className="text-slate-200 font-semibold">{bidder?.declared_name || bidderId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isJobFailed && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRetry}
              isLoading={isRetrying}
              leftIcon={<Play className="w-3.5 h-3.5" />}
            >
              Retry Full Pipeline
            </Button>
          )}

          {isJobComplete && (
            <Button
              variant="success"
              size="sm"
              onClick={() => onViewBidderCockpit(bidderId)}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Open Bidder Cockpit
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => loadJobAndBidder(false)}
            isLoading={loading}
            aria-label="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {error && (
        <ErrorState
          title="Processing Error Encountered"
          message={error}
          onRetry={() => loadJobAndBidder(false)}
        />
      )}

      {/* 2. Pipeline Stepper State Machine */}
      <div className="border border-slate-800 rounded-xl bg-slate-900/60 p-5 sm:p-6 space-y-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              11-Step Forensic Evaluation Stepper
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            Step {job?.current_step ?? 0} of {job?.steps?.length || 11}
          </span>
        </div>

        {loading && !job ? (
          <LoadingState message="Loading step state machine..." size="md" />
        ) : (
          <div className="grid grid-cols-1 gap-2">
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
                  {st.meta?.duration_ms !== undefined && (
                    <span className="text-slate-500">{st.meta.duration_ms} ms</span>
                  )}
                  <StatusChip status={st.status} size="xs" showIcon={false} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Ingested Documents & Retagging Panel */}
      {bidder && bidder.documents && bidder.documents.length > 0 && (
        <div className="border border-slate-800 rounded-xl bg-slate-900/60 p-5 sm:p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Ingested Filings & Document Classification Chips
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Officer can re-tag document to trigger pipeline reprocessing
            </span>
          </div>

          <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
            {bidder.documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-900/40 transition-colors"
              >
                <div className="space-y-0.5 truncate pr-2">
                  <div className="font-medium text-slate-200 truncate">{doc.original_filename}</div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {doc.page_count || 1} pages • SHA-256: {doc.sha256.substring(0, 16)}...
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    <select
                      aria-label={`Document classification for ${doc.original_filename}`}
                      value={doc.doc_type || 'OTHER'}
                      disabled={retaggingDocId === doc.id}
                      onChange={(e) => handleRetag(doc.id, e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-sky-500 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {DOCUMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {retaggingDocId === doc.id && (
                    <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" aria-hidden="true" />
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
