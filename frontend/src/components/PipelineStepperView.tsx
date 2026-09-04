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
        return <CheckCircle2 className="w-5 h-5 text-[#248a3d]" aria-hidden="true" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-[#ba1a1a]" aria-hidden="true" />;
      case 'RUNNING':
        return <Loader2 className="w-5 h-5 text-[#0066cc] animate-spin" aria-hidden="true" />;
      default:
        return <Clock className="w-5 h-5 text-[#86868b]" aria-hidden="true" />;
    }
  };

  const isJobComplete = job?.status === 'DONE';
  const isJobFailed = job?.status === 'FAILED';

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Header & Controls */}
      <div className="p-6 rounded-3xl bg-white border border-[#e0e0e0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBackToBidders}
            className="p-2 rounded-full bg-[#f5f5f7] hover:bg-[#e0e0e0] text-[#1d1d1f] transition-colors cursor-pointer border border-[#e0e0e0] flex items-center justify-center shrink-0"
            title="Back to Bidders Roster"
            aria-label="Back to Bidders Roster"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
                Real-Time Forensic Pipeline Stepper
              </h1>
              <StatusChip status={job?.status || 'QUEUED'} size="sm" />
            </div>
            <p className="text-xs text-[#7a7a7a] mt-1">
              Target Bidder: <strong className="text-[#1d1d1f]">{bidder?.declared_name || bidderId}</strong>
              <span className="ml-2 font-mono text-[11px] text-[#0066cc]">Job #{jobId.slice(0, 10)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isJobFailed && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-4 py-2 rounded-full bg-[#ba1a1a] hover:bg-rose-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRetrying ? 'Restarting...' : 'Retry Pipeline'}</span>
            </button>
          )}

          {isJobComplete && (
            <button
              onClick={() => onViewBidderCockpit(bidderId)}
              className="px-4 py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-none"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Open Bidder Cockpit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => loadJobAndBidder(false)}
            disabled={loading}
            className="p-2 rounded-full bg-white hover:bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] transition-colors cursor-pointer"
            title="Refresh Status"
            aria-label="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <ErrorState
          title="Processing Error Encountered"
          message={error}
          onRetry={() => loadJobAndBidder(false)}
          variant="card"
        />
      )}

      {/* 2. Pipeline Stepper State Machine Card */}
      <div className="rounded-[18px] bg-white border border-[#e0e0e0] p-6 space-y-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#e0e0e0]">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#0066cc]" />
            <h2 className="text-sm font-semibold text-[#1d1d1f] tracking-tight">
              11-Step Forensic Evaluation Stepper
            </h2>
          </div>
          <span className="text-xs font-mono text-[#0066cc] bg-[#f5f5f7] px-3 py-1 rounded-full border border-[#e0e0e0] font-bold">
            Step {job?.current_step ?? 0} of {job?.steps?.length || 11}
          </span>
        </div>

        {loading && !job ? (
          <LoadingState message="Loading step state machine..." size="md" />
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {job?.steps?.map((st) => {
              const isRunning = st.status === 'RUNNING';
              const isDone = st.status === 'DONE';
              const isFailed = st.status === 'FAILED';

              return (
                <div
                  key={st.step_number}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isRunning
                      ? 'bg-[#f0f7ff] border-[#0066cc]/40 shadow-xs ring-1 ring-[#0066cc]/20'
                      : isDone
                      ? 'bg-white border-[#e0e0e0]'
                      : isFailed
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-[#f5f5f7] border-[#e0e0e0]/70 text-[#86868b]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">{getStepIcon(st.status)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#7a7a7a] font-semibold">
                          STEP {st.step_number}
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            isRunning
                              ? 'text-[#0066cc]'
                              : isDone
                              ? 'text-[#1d1d1f]'
                              : isFailed
                              ? 'text-[#ba1a1a]'
                              : 'text-[#86868b]'
                          }`}
                        >
                          {st.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    {st.meta?.duration_ms !== undefined && (
                      <span className="text-[#7a7a7a] text-[11px]">{st.meta.duration_ms} ms</span>
                    )}
                    <StatusChip status={st.status} size="xs" showIcon={false} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Ingested Documents & Retagging Panel */}
      {bidder && bidder.documents && bidder.documents.length > 0 && (
        <div className="rounded-[18px] bg-white border border-[#e0e0e0] p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#e0e0e0] flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0066cc]" />
              <h2 className="text-sm font-semibold text-[#1d1d1f]">
                Ingested Filings & Document Classification
              </h2>
            </div>
            <span className="text-xs text-[#7a7a7a]">
              Re-tag any document to trigger automated pipeline reprocessing
            </span>
          </div>

          <div className="divide-y divide-[#e0e0e0] border border-[#e0e0e0] rounded-xl overflow-hidden bg-white">
            {bidder.documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#f5f5f7] transition-colors"
              >
                <div className="space-y-0.5 truncate pr-2">
                  <div className="font-semibold text-[#1d1d1f] truncate">{doc.original_filename}</div>
                  <div className="text-[10px] font-mono text-[#7a7a7a]">
                    {doc.page_count || 1} pages • SHA-256: {doc.sha256.substring(0, 16)}...
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#7a7a7a]" aria-hidden="true" />
                    <select
                      aria-label={`Document classification for ${doc.original_filename}`}
                      value={doc.doc_type || 'OTHER'}
                      disabled={retaggingDocId === doc.id}
                      onChange={(e) => handleRetag(doc.id, e.target.value)}
                      className="bg-[#f5f5f7] border border-[#e0e0e0] rounded-full px-3 py-1 text-[#1d1d1f] text-xs focus:outline-none focus:border-[#0066cc] disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {DOCUMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {retaggingDocId === doc.id && (
                    <Loader2 className="w-3.5 h-3.5 text-[#0066cc] animate-spin" aria-hidden="true" />
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
