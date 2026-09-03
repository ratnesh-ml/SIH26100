import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Loader2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Download,
  Activity,
  UploadCloud,
  FileText,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Check,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  fetchBidder,
  fetchBidderFindings,
  fetchBidderJobs,
  fetchBidderRisk,
  recordFindingDecision,
  fetchFindingDecisions,
  completeBidderReview,
  fetchDocumentPageBlob,
} from '../api/client';
import {
  BidderDetail,
  DecisionOut,
  FindingOut,
  FindingStatus,
  JobStatus,
  RiskProfileOut,
  User,
} from '../types';

interface BidderDetailViewProps {
  bidderId: string;
  onBack: () => void;
  currentUser?: User;
  onOpenPipeline?: (jobId: string, bidderId: string) => void;
  onOpenUploadModal?: () => void;
  canUpload?: boolean;
}

// Bounding box parser converting [x0, y0, x1, y1] or objects into CSS percentages
function parseBBox(bbox: any): { left: number; top: number; width: number; height: number } | null {
  if (!bbox) return null;
  if (Array.isArray(bbox) && bbox.length >= 4) {
    const [x0, y0, x1, y1] = bbox.map(Number);
    if (isNaN(x0) || isNaN(y0) || isNaN(x1) || isNaN(y1)) return null;
    if (x0 <= 1 && y0 <= 1 && x1 <= 1 && y1 <= 1) {
      return {
        left: Math.max(0, x0 * 100),
        top: Math.max(0, y0 * 100),
        width: Math.min(100, Math.max(2, (x1 - x0) * 100)),
        height: Math.min(100, Math.max(2, (y1 - y0) * 100)),
      };
    }
    const pageW = x1 > 700 ? 1000 : 612;
    const pageH = y1 > 900 ? 1000 : 792;
    return {
      left: Math.max(0, (x0 / pageW) * 100),
      top: Math.max(0, (y0 / pageH) * 100),
      width: Math.min(100, Math.max(2, ((x1 - x0) / pageW) * 100)),
      height: Math.min(100, Math.max(2, ((y1 - y0) / pageH) * 100)),
    };
  }
  if (typeof bbox === 'object') {
    if ('x0' in bbox && 'y0' in bbox && 'x1' in bbox && 'y1' in bbox) {
      return parseBBox([bbox.x0, bbox.y0, bbox.x1, bbox.y1]);
    }
    if ('left' in bbox && 'top' in bbox && 'width' in bbox && 'height' in bbox) {
      const l = Number(bbox.left);
      const t = Number(bbox.top);
      const w = Number(bbox.width);
      const h = Number(bbox.height);
      if (l <= 1 && t <= 1 && w <= 1 && h <= 1) {
        return { left: l * 100, top: t * 100, width: w * 100, height: h * 100 };
      }
      return { left: (l / 612) * 100, top: (t / 792) * 100, width: (w / 612) * 100, height: (h / 792) * 100 };
    }
  }
  return null;
}

export const BidderDetailView: React.FC<BidderDetailViewProps> = ({
  bidderId,
  onBack,
  currentUser,
  onOpenPipeline,
  onOpenUploadModal,
  canUpload,
}) => {
  const [bidder, setBidder] = useState<BidderDetail | null>(null);
  const [findings, setFindings] = useState<FindingOut[]>([]);
  const [risk, setRisk] = useState<RiskProfileOut | null>(null);
  const [latestJob, setLatestJob] = useState<JobStatus | null>(null);

  // Selected Finding State
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [findingDecisions, setFindingDecisions] = useState<DecisionOut[]>([]);
  const [loadingDecisions, setLoadingDecisions] = useState(false);

  // Filter State
  const [criteriaFilter, setCriteriaFilter] = useState<string>('ALL');

  // Evidence Viewer State
  const [selectedEvidenceIdx, setSelectedEvidenceIdx] = useState<number>(0);
  const [evidencePageNo, setEvidencePageNo] = useState<number>(1);
  const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
  const [loadingPageImage, setLoadingPageImage] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Decision Form State
  const [decisionAction, setDecisionAction] = useState<string>('ACCEPT');
  const [decisionReason, setDecisionReason] = useState<string>('');
  const [submittingDecision, setSubmittingDecision] = useState<boolean>(false);
  const [decisionFeedback, setDecisionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Complete Review State
  const [completingReview, setCompletingReview] = useState<boolean>(false);
  const [completeReviewMessage, setCompleteReviewMessage] = useState<string | null>(null);

  // Drawer toggle
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Bidder Data
  const loadData = useCallback(async () => {
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
      if (findingsRes.length > 0 && !selectedFindingId) {
        setSelectedFindingId(findingsRes[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve bidder evaluation dossier.');
    } finally {
      setLoading(false);
    }
  }, [bidderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Current active finding
  const activeFinding = useMemo(() => {
    if (!findings || findings.length === 0) return null;
    return findings.find((f) => f.id === selectedFindingId) || findings[0];
  }, [findings, selectedFindingId]);

  // Load decision history for active finding
  useEffect(() => {
    if (!activeFinding) {
      setFindingDecisions([]);
      return;
    }
    let isCurrent = true;
    setLoadingDecisions(true);
    fetchFindingDecisions(activeFinding.id)
      .then((decs) => {
        if (isCurrent) setFindingDecisions(decs);
      })
      .catch(() => {
        if (isCurrent) setFindingDecisions([]);
      })
      .finally(() => {
        if (isCurrent) setLoadingDecisions(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [activeFinding?.id]);

  // Active evidence reference
  const activeEvidence = useMemo(() => {
    if (!activeFinding?.evidence || activeFinding.evidence.length === 0) return null;
    return activeFinding.evidence[selectedEvidenceIdx] || activeFinding.evidence[0];
  }, [activeFinding, selectedEvidenceIdx]);

  // Sync page number with active evidence
  useEffect(() => {
    if (activeEvidence) {
      setEvidencePageNo(activeEvidence.page_no || activeEvidence.page || 1);
    } else {
      setEvidencePageNo(1);
    }
  }, [activeEvidence]);

  // Fetch page image blob when active document and page changes
  useEffect(() => {
    const docId = activeEvidence?.document_id;
    if (!docId) {
      setPageImageUrl(null);
      return;
    }

    let isCurrent = true;
    setLoadingPageImage(true);
    fetchDocumentPageBlob(docId, evidencePageNo, 150)
      .then((url) => {
        if (isCurrent) setPageImageUrl(url);
      })
      .catch(() => {
        if (isCurrent) setPageImageUrl(null);
      })
      .finally(() => {
        if (isCurrent) setLoadingPageImage(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [activeEvidence?.document_id, evidencePageNo]);

  // Reset evidence index on finding change
  useEffect(() => {
    setSelectedEvidenceIdx(0);
    setDecisionFeedback(null);
  }, [selectedFindingId]);

  // Categorize Findings
  const categorizedFindings = useMemo(() => {
    const categories: Record<string, FindingOut[]> = {
      'Identity & Debarment': [],
      'Financial Capacity': [],
      'Technical Competence': [],
      'Statutory & Preference': [],
      'Document Anomalies': [],
      'Other Criteria': [],
    };

    for (const f of findings) {
      // Filter tab check
      if (criteriaFilter !== 'ALL' && f.status !== criteriaFilter) {
        continue;
      }

      const r = (f.rule_id || '').toUpperCase();
      if (r.startsWith('R-ID') || f.title.toLowerCase().includes('pan') || f.title.toLowerCase().includes('gstin')) {
        categories['Identity & Debarment'].push(f);
      } else if (r.startsWith('R-FIN') || f.title.toLowerCase().includes('turnover') || f.title.toLowerCase().includes('worth')) {
        categories['Financial Capacity'].push(f);
      } else if (r.startsWith('R-TECH') || f.title.toLowerCase().includes('experience') || f.title.toLowerCase().includes('oem')) {
        categories['Technical Competence'].push(f);
      } else if (
        r.startsWith('R-MII') ||
        r.startsWith('R-MSE') ||
        r.startsWith('R-LND') ||
        r.startsWith('R-EMD') ||
        f.title.toLowerCase().includes('make in india') ||
        f.title.toLowerCase().includes('mse') ||
        f.title.toLowerCase().includes('border')
      ) {
        categories['Statutory & Preference'].push(f);
      } else if (r.startsWith('R-ANOM') || f.title.toLowerCase().includes('anomaly') || f.title.toLowerCase().includes('modification')) {
        categories['Document Anomalies'].push(f);
      } else {
        categories['Other Criteria'].push(f);
      }
    }

    return categories;
  }, [findings, criteriaFilter]);

  // Unresolved findings count
  const unresolvedCount = useMemo(() => {
    return findings.filter((f) => !f.is_resolved && !f.latest_decision && (f.status === 'FAIL' || f.status === 'REVIEW' || f.status === 'WARN')).length;
  }, [findings]);

  // Submit human decision
  const handleRecordDecision = async () => {
    if (!activeFinding) return;
    if (decisionAction === 'OVERRIDE' && !decisionReason.trim()) {
      setDecisionFeedback({
        type: 'error',
        message: 'An explicit written reason is strictly required when overriding a machine evaluation.',
      });
      return;
    }

    setSubmittingDecision(true);
    setDecisionFeedback(null);
    try {
      const decision = await recordFindingDecision(
        activeFinding.id,
        decisionAction,
        decisionReason.trim() || undefined
      );
      setDecisionFeedback({
        type: 'success',
        message: `Decision '${decision.action}' recorded successfully with audit ref ${decision.audit_ref?.slice(0, 8) || 'verified'}.`,
      });
      setDecisionReason('');
      // Reload finding decisions and refresh bidder
      const updatedDecs = await fetchFindingDecisions(activeFinding.id);
      setFindingDecisions(updatedDecs);
      loadData();
    } catch (err: any) {
      setDecisionFeedback({
        type: 'error',
        message: err?.message || 'Failed to record decision.',
      });
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Complete review handler
  const handleCompleteReview = async () => {
    setCompletingReview(true);
    setCompleteReviewMessage(null);
    try {
      const res = await completeBidderReview(bidderId);
      setCompleteReviewMessage(`Review Complete: Bidder overall status is now ${res.overall_status}.`);
      loadData();
    } catch (err: any) {
      setCompleteReviewMessage(`Cannot complete review: ${err?.message || 'Unresolved mandatory findings remain.'}`);
    } finally {
      setCompletingReview(false);
    }
  };

  const renderStatusBadge = (status: FindingStatus | string) => {
    switch (status) {
      case 'PASS':
      case 'QUALIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/90 text-emerald-400 border border-emerald-800/80">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>PASS</span>
          </span>
        );
      case 'FAIL':
      case 'NOT_QUALIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/90 text-rose-400 border border-rose-800/80">
            <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
            <span>FAIL</span>
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950/90 text-amber-400 border border-amber-800/80">
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            <span>WARN</span>
          </span>
        );
      case 'REVIEW':
      case 'UNDER_EVALUATION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-950/90 text-yellow-400 border border-yellow-800/80">
            <AlertCircle className="w-3 h-3 text-yellow-400 shrink-0" />
            <span>REVIEW</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800">
            <HelpCircle className="w-3 h-3 text-slate-500 shrink-0" />
            <span>{status || 'PENDING'}</span>
          </span>
        );
    }
  };

  const getRiskBadge = (score: number) => {
    if (score > 60) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-rose-950 text-rose-400 border border-rose-800/80 inline-flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" />
          <span>HIGH RISK ({score})</span>
        </span>
      );
    }
    if (score > 30) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-amber-950 text-amber-400 border border-amber-800/80 inline-flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          <span>MEDIUM RISK ({score})</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800/80 inline-flex items-center gap-1">
        <ShieldCheck className="w-3 h-3" />
        <span>LOW RISK ({score})</span>
      </span>
    );
  };

  // Active bbox calculation
  const parsedBox = useMemo(() => {
    if (!activeEvidence) return null;
    return parseBBox(activeEvidence.bbox || activeEvidence.bounding_box);
  }, [activeEvidence]);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] space-y-3">
      {/* 1. Header Bar */}
      <header className="px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Roster</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-white tracking-tight">
                {bidder?.canonical_name || bidder?.declared_name || 'Bidder Cockpit'}
              </h1>
              {bidder?.canonical_name && bidder?.declared_name && bidder.canonical_name !== bidder.declared_name && (
                <span className="text-[11px] text-slate-400 font-mono">
                  (Declared: &ldquo;{bidder.declared_name}&rdquo;)
                </span>
              )}
              {bidder?.entity_confidence !== undefined && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-400 border border-sky-800/60 inline-flex items-center gap-1">
                  <UserCheck className="w-2.5 h-2.5" />
                  <span>Conf: {Math.round(bidder.entity_confidence * 100)}%</span>
                </span>
              )}
            </div>

            {/* Statutory Tax IDs */}
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-0.5 flex-wrap">
              <span>PAN: <strong className="text-slate-200">{bidder?.pan || 'NOT_FOUND'}</strong></span>
              <span>•</span>
              <span>GSTIN: <strong className="text-slate-200">{bidder?.gstin || 'NOT_FOUND'}</strong></span>
              {bidder?.udyam_no && (
                <>
                  <span>•</span>
                  <span>Udyam: <strong className="text-slate-200">{bidder.udyam_no}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Pill, Risk, and Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {bidder && renderStatusBadge(bidder.overall_status)}
          {bidder && getRiskBadge(bidder.risk_score)}

          <a
            href={`/api/v1/bidders/${bidderId}/report.pdf`}
            target="_blank"
            rel="noreferrer"
            className="py-1.5 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>CVC Dossier (PDF)</span>
          </a>

          {canUpload && onOpenUploadModal && (
            <button
              onClick={onOpenUploadModal}
              className="py-1.5 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
              <span>Upload Docs</span>
            </button>
          )}

          {latestJob && onOpenPipeline && (
            <button
              onClick={() => onOpenPipeline(latestJob.id, bidderId)}
              className="py-1.5 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-sky-400 hover:text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Stepper</span>
            </button>
          )}

          <button
            onClick={handleCompleteReview}
            disabled={completingReview || (currentUser?.role !== 'officer' && currentUser?.role !== 'admin')}
            title={unresolvedCount > 0 ? `${unresolvedCount} mandatory findings remain unresolved` : 'Finalize review'}
            className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
              unresolvedCount > 0
                ? 'bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/80 text-amber-300'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950'
            }`}
          >
            {completingReview ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>
              {unresolvedCount > 0 ? `Complete Review (${unresolvedCount} pending)` : 'Complete Review'}
            </span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh Cockpit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {error && (
        <div className="px-4 py-2 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {completeReviewMessage && (
        <div className="px-4 py-2 rounded-lg bg-sky-950/80 border border-sky-800 text-sky-200 text-xs flex items-center justify-between">
          <span>{completeReviewMessage}</span>
          <button onClick={() => setCompleteReviewMessage(null)} className="text-sky-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 2. Main Three-Column Cockpit Workspace */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* ==================================================================== */}
        {/* LEFT COLUMN: Criteria Rail (col-span-3 or w-80)                     */}
        {/* ==================================================================== */}
        <aside className="col-span-12 md:col-span-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col min-h-0 overflow-hidden">
          {/* Criteria Filter Tabs */}
          <div className="p-2.5 border-b border-slate-800/80 flex items-center justify-between gap-1 text-[11px] font-medium bg-slate-950/40">
            {['ALL', 'FAIL', 'REVIEW', 'WARN', 'PASS'].map((tab) => (
              <button
                key={tab}
                onClick={() => setCriteriaFilter(tab)}
                className={`px-2 py-1 rounded transition-colors ${
                  criteriaFilter === tab
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Categorized Findings List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs">
            {Object.entries(categorizedFindings).map(([category, catFindings]) => {
              if (catFindings.length === 0) return null;
              return (
                <div key={category} className="space-y-1.5">
                  <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {category} ({catFindings.length})
                  </div>
                  <div className="space-y-1">
                    {catFindings.map((finding) => {
                      const isSelected = activeFinding?.id === finding.id;
                      const hasDecision = !!finding.latest_decision || finding.is_resolved;
                      return (
                        <div
                          key={finding.id}
                          onClick={() => setSelectedFindingId(finding.id)}
                          className={`p-2 rounded-lg cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-slate-800/90 border-sky-500 shadow-sm'
                              : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono text-[10px] font-bold text-sky-400 truncate">
                              {finding.rule_id}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {hasDecision && (
                                <span title="Officer Decision Logged">
                                  <CheckCircle2 className="w-3 h-3 text-sky-400" />
                                </span>
                              )}
                              {renderStatusBadge(finding.status)}
                            </div>
                          </div>

                          <p className="text-[11px] font-medium text-slate-200 line-clamp-2 leading-tight">
                            {finding.title}
                          </p>

                          {/* Confidence Bar */}
                          {finding.confidence !== undefined && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                              <span className="w-12">Conf {Math.round((finding.confidence || 1) * 100)}%</span>
                              <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    (finding.confidence || 1) >= 0.9
                                      ? 'bg-emerald-400'
                                      : (finding.confidence || 1) >= 0.7
                                      ? 'bg-amber-400'
                                      : 'bg-rose-400'
                                  }`}
                                  style={{ width: `${Math.round((finding.confidence || 1) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {findings.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-500 text-xs">
                No evaluation criteria findings registered.
              </div>
            )}
          </div>
        </aside>

        {/* ==================================================================== */}
        {/* CENTER COLUMN: Evidence Viewer (col-span-5 or flex)                 */}
        {/* ==================================================================== */}
        <section className="col-span-12 md:col-span-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col min-h-0 overflow-hidden">
          {/* Evidence Viewer Toolbar */}
          <div className="p-2.5 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-950/60 text-xs">
            {/* Document / Evidence Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-[50%]">
              {activeFinding?.evidence && activeFinding.evidence.length > 0 ? (
                activeFinding.evidence.map((ev, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedEvidenceIdx(idx);
                      setEvidencePageNo(ev.page_no || ev.page || 1);
                    }}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono whitespace-nowrap transition-colors border ${
                      selectedEvidenceIdx === idx
                        ? 'bg-sky-600/30 text-sky-300 border-sky-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Doc #{idx + 1} (p.{ev.page_no || ev.page || 1})
                  </button>
                ))
              ) : (
                <span className="text-[11px] font-medium text-slate-400">Statutory Evidence</span>
              )}
            </div>

            {/* Page & Zoom Controls */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setEvidencePageNo((p) => Math.max(1, p - 1))}
                disabled={evidencePageNo <= 1}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[10px] px-1 text-slate-300">p.{evidencePageNo}</span>
              <button
                onClick={() => setEvidencePageNo((p) => p + 1)}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <div className="h-3 w-px bg-slate-800 mx-1" />

              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[10px] text-slate-400 w-8 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                title="Reset Zoom"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {activeEvidence?.document_id && (
                <a
                  href={`/api/v1/documents/${activeEvidence.document_id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded bg-slate-900 border border-slate-800 text-sky-400 hover:text-white ml-1"
                  title="Open Original PDF"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Page Image Canvas with Bounding Box Overlay */}
          <div className="flex-1 overflow-auto p-4 bg-slate-950/80 flex items-center justify-center relative min-h-[350px]">
            {loadingPageImage && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 z-20">
                <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                <span className="text-xs text-slate-400">Loading page image raster...</span>
              </div>
            )}

            {pageImageUrl ? (
              <div
                className="relative shadow-2xl transition-transform origin-top"
                style={{ width: `${zoomLevel}%` }}
              >
                <img
                  src={pageImageUrl}
                  alt={`Page ${evidencePageNo}`}
                  className="w-full h-auto rounded border border-slate-800 block bg-white"
                />

                {/* Bounding Box Highlight Overlay */}
                {parsedBox && (
                  <div
                    className="absolute border-2 border-amber-400 bg-amber-400/25 pointer-events-none rounded transition-all ring-2 ring-amber-400/20"
                    style={{
                      left: `${parsedBox.left}%`,
                      top: `${parsedBox.top}%`,
                      width: `${parsedBox.width}%`,
                      height: `${parsedBox.height}%`,
                    }}
                  >
                    <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500 text-slate-950 shadow">
                      {activeEvidence?.field_name || activeEvidence?.field || 'EVIDENCE'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 max-w-sm">
                <div className="p-3 rounded-full bg-slate-900 border border-slate-800 inline-block text-slate-400 mb-2">
                  <FileText className="w-6 h-6 text-sky-400" />
                </div>
                <h4 className="text-xs font-semibold text-slate-300">
                  {activeEvidence?.document_id ? 'Rendering Page Preview' : 'Authoritative Registry Check'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  {activeFinding?.explanation || 'This finding is derived from cross-document verification or simulated registry lookup.'}
                </p>
                {activeEvidence?.quote && (
                  <div className="mt-3 p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-sky-300 font-mono text-left">
                    &ldquo;{activeEvidence.quote}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Extracted Quote & Method Callout Panel */}
          {activeEvidence && (
            <div className="p-2.5 border-t border-slate-800 bg-slate-950 text-xs">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span className="font-semibold uppercase text-slate-300">
                  Field: <strong className="text-sky-400 font-mono">{activeEvidence.field_name || activeEvidence.field || 'General Evidence'}</strong>
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  Method: {activeEvidence.method || 'anchor_regex'}
                </span>
              </div>
              {activeEvidence.quote && (
                <div className="p-1.5 rounded bg-slate-900/90 border border-slate-800 font-mono text-[11px] text-amber-200/90 leading-relaxed">
                  &ldquo;{activeEvidence.quote}&rdquo;
                </div>
              )}
            </div>
          )}
        </section>

        {/* ==================================================================== */}
        {/* RIGHT COLUMN: Finding Card + Decision Panel (col-span-4 or w-96)    */}
        {/* ==================================================================== */}
        <section className="col-span-12 md:col-span-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col min-h-0 overflow-y-auto p-3 space-y-3">
          {activeFinding ? (
            <>
              {/* Finding Summary Card */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-sky-400">
                      {activeFinding.rule_id}
                    </span>
                    <h3 className="text-xs font-bold text-white mt-0.5 leading-snug">
                      {activeFinding.title}
                    </h3>
                  </div>
                  {renderStatusBadge(activeFinding.status)}
                </div>

                {/* Extracted vs Expected Table */}
                {(activeFinding.extracted || activeFinding.expected) && (
                  <div className="border border-slate-800/80 rounded-md overflow-hidden text-[10px]">
                    <div className="bg-slate-900/90 px-2 py-1 font-semibold text-slate-400 border-b border-slate-800">
                      Extracted vs Required Benchmark
                    </div>
                    <div className="divide-y divide-slate-800/60 bg-slate-950/50 p-2 space-y-1">
                      {activeFinding.extracted && (
                        <div>
                          <span className="text-slate-400">Extracted:</span>{' '}
                          <span className="font-mono text-amber-300">
                            {JSON.stringify(activeFinding.extracted)}
                          </span>
                        </div>
                      )}
                      {activeFinding.expected && (
                        <div>
                          <span className="text-slate-400">Expected:</span>{' '}
                          <span className="font-mono text-emerald-300">
                            {JSON.stringify(activeFinding.expected)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Forensic Explanation */}
                <div className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/40 p-2 rounded border border-slate-800/60">
                  <p className="font-medium text-slate-400 text-[10px] uppercase mb-0.5">Explanation:</p>
                  <p>{activeFinding.explanation}</p>
                </div>

                {/* Statutory Clause & Authority */}
                {activeFinding.citation && (
                  <div className="text-[10px] text-slate-400 p-2 rounded bg-sky-950/20 border border-sky-900/40 space-y-0.5">
                    <p className="font-semibold text-sky-300 uppercase">
                      Clause Citation ({activeFinding.citation.order || 'Statutory Authority'})
                    </p>
                    <p className="italic text-slate-300">
                      &ldquo;{activeFinding.citation.quote || activeFinding.citation.clause}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Decision Panel */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-sky-400" />
                    <span>Officer Decision Panel</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    Machine: {activeFinding.status}
                  </span>
                </div>

                {/* Decision Action Options */}
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setDecisionAction('ACCEPT')}
                    className={`p-2 rounded-lg font-medium text-left border transition-all ${
                      decisionAction === 'ACCEPT'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-sm shadow-emerald-950'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-[11px]">Accept</div>
                    <div className="text-[9px] text-slate-400">Satisfies requirement</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionAction('REQUEST_CLARIFICATION')}
                    className={`p-2 rounded-lg font-medium text-left border transition-all ${
                      decisionAction === 'REQUEST_CLARIFICATION'
                        ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-sm shadow-amber-950'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-[11px]">Clarify</div>
                    <div className="text-[9px] text-slate-400">Ask vendor for proof</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionAction('OVERRIDE')}
                    className={`p-2 rounded-lg font-medium text-left border transition-all ${
                      decisionAction === 'OVERRIDE'
                        ? 'bg-purple-950 text-purple-300 border-purple-500 shadow-sm shadow-purple-950'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-[11px]">Override</div>
                    <div className="text-[9px] text-slate-400">Override machine rec</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionAction('REJECT')}
                    className={`p-2 rounded-lg font-medium text-left border transition-all ${
                      decisionAction === 'REJECT'
                        ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-sm shadow-rose-950'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-[11px]">Reject</div>
                    <div className="text-[9px] text-slate-400">Disqualifying gap</div>
                  </button>
                </div>

                {/* Officer Comments / Reason */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Officer Justification {decisionAction === 'OVERRIDE' ? <span className="text-rose-400 font-bold">* (Strictly Required)</span> : '(Optional)'}
                  </label>
                  <textarea
                    rows={2}
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder={
                      decisionAction === 'OVERRIDE'
                        ? 'State the official grounds and evidentiary reason for overriding this finding...'
                        : 'Add formal review note or clarification details...'
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Feedback Alert */}
                {decisionFeedback && (
                  <div
                    className={`p-2 rounded text-[11px] flex items-center gap-1.5 ${
                      decisionFeedback.type === 'success'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {decisionFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{decisionFeedback.message}</span>
                  </div>
                )}

                {/* Submit Decision Button */}
                <button
                  type="button"
                  onClick={handleRecordDecision}
                  disabled={submittingDecision}
                  className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-sky-950"
                >
                  {submittingDecision ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Record Officer Decision</span>
                </button>
              </div>

              {/* Audit Decision History */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <History className="w-3 h-3 text-slate-400" />
                    <span>Audit Decision History ({findingDecisions.length})</span>
                  </span>
                  {loadingDecisions && <Loader2 className="w-3 h-3 animate-spin text-slate-500" />}
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto text-[11px]">
                  {findingDecisions.map((dec) => (
                    <div
                      key={dec.id}
                      className="p-2 rounded bg-slate-900/60 border border-slate-800/80 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-slate-200">
                          {dec.actor_name || 'Officer'} ({dec.actor_role || 'officer'})
                        </span>
                        <span className="font-mono text-slate-500">
                          {new Date(dec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sky-400">{dec.action}</span>
                        {dec.resulting_status && (
                          <span className="text-slate-400 text-[10px]">→ {dec.resulting_status}</span>
                        )}
                      </div>

                      {dec.reason && <p className="text-slate-300 text-[10px] italic">&ldquo;{dec.reason}&rdquo;</p>}

                      {dec.audit_ref && (
                        <div className="text-[9px] font-mono text-slate-500 truncate" title={dec.audit_ref}>
                          Hash: {dec.audit_ref.slice(0, 12)}...
                        </div>
                      )}
                    </div>
                  ))}

                  {findingDecisions.length === 0 && !loadingDecisions && (
                    <div className="text-[10px] text-slate-500 italic text-center py-2">
                      No decisions recorded yet. Machine recommendation currently active.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Select a criterion from the rail to inspect evidence and record decisions.
            </div>
          )}
        </section>
      </div>

      {/* 3. Collapsible Bottom Drawer: Risk Drivers & Document Anomalies */}
      <footer className="rounded-xl bg-slate-900/80 border border-slate-800 shrink-0 overflow-hidden shadow-lg">
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="w-full px-4 py-2 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white bg-slate-950/40 hover:bg-slate-950/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Forensic Risk Drivers & Document Anomalies</span>
            {risk?.drivers && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                {risk.drivers.length} drivers / {risk.anomalies?.length || 0} anomalies
              </span>
            )}
          </div>
          {isDrawerOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {isDrawerOpen && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 bg-slate-950/90 max-h-48 overflow-y-auto text-xs">
            {/* Risk Drivers */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Forensic Risk Point Drivers
              </h4>
              <div className="space-y-1.5">
                {risk?.drivers && risk.drivers.length > 0 ? (
                  risk.drivers.map((d, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <span className="text-slate-300 text-[11px]">{d.driver}</span>
                      <span className="font-mono font-bold text-amber-400">+{d.points}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No adverse risk drivers identified.</p>
                )}
              </div>
            </div>

            {/* Document Anomalies */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Document Structural & Anomaly Signals
              </h4>
              <div className="space-y-1.5">
                {risk?.anomalies && risk.anomalies.length > 0 ? (
                  risk.anomalies.map((a, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-slate-900 border border-slate-800 flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-sky-400">{a.code}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              a.severity === 'HIGH'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                                : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                            }`}
                          >
                            {a.severity}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{a.description}</p>
                      </div>
                      <span className="font-mono font-bold text-rose-400">+{a.points}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No structural PDF anomalies detected.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};
