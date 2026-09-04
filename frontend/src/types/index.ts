/** TypeScript interfaces strictly matching VigilBid backend schemas */

export type FindingStatus = 'PASS' | 'WARN' | 'REVIEW' | 'FAIL' | 'INFO' | 'PENDING';
export type UserRole = 'officer' | 'evaluator' | 'approver' | 'vigilance' | 'auditor' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  user: User;
}

export interface CriterionOut {
  id: string;
  tender_id: string;
  code: string;
  title: string;
  description?: string;
  required_doc_types?: string[];
  rule_ids?: string[];
  sort_order: number;
}

export interface TenderSummary {
  id: string;
  nit_no: string;
  title: string;
  portal: string;
  status: string;
  estimated_value?: number;
  bid_due_date?: string;
  bidder_count: number;
  created_at: string;
}

export interface TenderListResponse {
  items: TenderSummary[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TenderCreate {
  nit_no: string;
  title: string;
  portal: string;
  estimated_value?: number;
  bid_due_date?: string;
  mse_applicable: boolean;
  mii_class_required?: string;
  requires_oem: boolean;
  template?: string;
}

export interface TenderDetail extends TenderSummary {
  mse_applicable: boolean;
  mii_class_required?: string;
  requires_oem: boolean;
  criteria: CriterionOut[];
  created_by?: string;
}

export interface MatrixCell {
  criterion_id: string;
  status: FindingStatus;
  finding_id?: string | null;
}

export interface BidderMatrixRow {
  id: string;
  name: string;
  status: FindingStatus;
  risk_score: number;
  risk_band?: 'LOW' | 'MEDIUM' | 'HIGH';
  cells: MatrixCell[];
}

export interface ComplianceMatrix {
  tender_id: string;
  criteria: CriterionOut[];
  bidders: BidderMatrixRow[];
}


export interface BidderSummary {
  id: string;
  tender_id?: string;
  declared_name: string;
  canonical_name?: string;
  overall_status: FindingStatus;
  risk_score: number;
  risk_band: 'LOW' | 'MEDIUM' | 'HIGH';
  review_state: string;
  document_count: number;
  created_at: string;
}

export interface BidderListResponse {
  items: BidderSummary[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface DocumentSummary {
  id: string;
  bidder_id: string;
  original_filename: string;
  sha256: string;
  mime: string;
  page_count?: number;
  doc_type?: string;
  storage_path?: string;
  created_at: string;
}

export interface BidderDetail {
  id: string;
  tender_id?: string;
  declared_name: string;
  canonical_name?: string;
  pan?: string;
  gstin?: string;
  cin?: string;
  udyam_no?: string;
  entity_confidence?: number;
  overall_status: FindingStatus;
  risk_score: number;
  risk_band: 'LOW' | 'MEDIUM' | 'HIGH';
  review_state: string;
  created_at: string;
  documents: DocumentSummary[];
}

export interface EvidenceRef {
  document?: string;
  document_id?: string;
  page?: number;
  page_no?: number;
  field?: string;
  field_name?: string;
  quote?: string;
  value?: string;
  bounding_box?: Record<string, any>;
  bbox?: Record<string, any> | number[];
  source?: string;
  method?: string;
  confidence?: number;
}

export interface DecisionOut {
  id: string;
  finding_id?: string | null;
  bidder_id: string;
  bid_id?: string | null;
  actor_id: string;
  actor_name?: string | null;
  actor_role?: string | null;
  action: string;
  reason?: string | null;
  resulting_status: string;
  machine_recommendation?: string | null;
  audit_ref?: string | null;
  created_at: string;
}

export interface CompleteReviewResponse {
  status: string;
  message: string;
  bidder_id: string;
  review_state: string;
  overall_status: string;
  bid_id?: string | null;
  bid_status?: string | null;
  decisions_count: number;
}

export interface FindingOut {
  id: string;
  bidder_id: string;
  criterion_id?: string;
  rule_id: string;
  rule_version?: string;
  status: FindingStatus;
  title: string;
  explanation: string;
  citation?: Record<string, any>;
  confidence?: number;
  extracted?: Record<string, any>;
  expected?: Record<string, any>;
  machine_recommendation?: string;
  latest_decision?: DecisionOut | null;
  is_resolved?: boolean;
  evidence?: EvidenceRef[];
  created_at?: string;
}

export interface RiskDriverOut {
  driver: string;
  points: number;
  source_ref?: Record<string, any>;
}

export interface AnomalySignalOut {
  code: string;
  severity: string;
  points: number;
  description: string;
  evidence?: Record<string, any>;
}

export interface RiskProfileOut {
  bidder_id: string;
  score?: number;
  risk_score?: number;
  band?: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_band?: 'LOW' | 'MEDIUM' | 'HIGH';
  entity_confidence?: number;
  drivers: RiskDriverOut[];
  anomalies: AnomalySignalOut[];
}

export interface GraphNodeOut {
  id: string;
  label: string;
  type: string;
  node_type?: string;
  properties?: Record<string, any>;
}

export interface GraphEdgeOut {
  source: string;
  target: string;
  reason: string;
  evidence?: Record<string, any>;
  strength: number;
  edge_type?: string;
}

export interface BidderPairLinkOut {
  source_bidder: string;
  target_bidder: string;
  source_bidder_name: string;
  target_bidder_name: string;
  reason: string;
  evidence?: Record<string, any>;
  strength: number;
  shared_attributes?: Record<string, any>[];
  cvc_warning?: string;
}

export interface GraphSummaryOut {
  tender_id?: string;
  total_bidders: number;
  linked_bidders_count: number;
  collusion_clusters_count: number;
  total_direct_links: number;
  max_link_strength: number;
}

export interface BidderLinkGraphOut {
  nodes: GraphNodeOut[];
  edges: GraphEdgeOut[];
  direct_bidder_links?: BidderPairLinkOut[];
  clusters?: string[][];
  summary?: GraphSummaryOut;
}


export interface StepStatus {
  name: string;
  step_number: number;
  status: 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED' | 'SKIPPED';
  started_at?: string;
  ended_at?: string;
  meta?: Record<string, any>;
}

export interface JobStatus {
  id: string;
  bidder_id: string;
  status: 'QUEUED' | 'PROCESSING' | 'RUNNING' | 'DONE' | 'FAILED';
  current_step: number;
  steps: StepStatus[];
  error?: string | null;
  created_at: string;
  started_at?: string;
  ended_at?: string;
}

export interface RejectedFile {
  filename: string;
  reason: string;
}

export interface UploadPackageResponse {
  bidder_id: string;
  job_id: string;
  total_files?: number;
  accepted: DocumentSummary[];
  rejected: RejectedFile[];
}

export interface AuditEventOut {
  seq: number;
  ts: string;
  actor_id?: string | null;
  role: string;
  action: string;
  target_type: string;
  target_id: string;
  payload?: Record<string, any> | null;
  prev_hash: string;
  curr_hash: string;
}

export interface AuditVerifyOut {
  ok: boolean;
  length: number;
  first_broken_seq?: number | null;
  head_hash?: string | null;
}

export interface ProcessingPerformance {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  active_jobs: number;
  total_audit_events: number;
  success_rate_percent: number;
}

export interface DashboardMetricsOut {
  total_tenders: number;
  total_bidders: number;
  verified_bidders: number;
  pending_bidders: number;
  high_risk_bidders: number;
  compliance_distribution: Record<string, number>;
  risk_distribution: Record<string, number>;
  avg_risk_score: number;
  finding_counts: Record<string, any>;
  processing_performance: ProcessingPerformance;
}

export interface CopilotCitation {
  source: string;
  clause: string;
  content: string;
  score: number;
  page_no?: number;
  domain?: string;
  exact_quote?: string;
  document_name?: string;
  url?: string;
}

export interface CopilotQueryRequest {
  question: string;
  tender_id?: string;
  bidder_id?: string;
  domains?: string[];
  top_k?: number;
}

export interface CopilotQueryResponse {
  answer: string;
  citations: CopilotCitation[];
  domains_searched: string[];
  used_llm: boolean;
  confidence: number;
  grounding_status: string;
  facts: string[];
  explanations: string[];
  injection_detected: boolean;
  is_conclusive: boolean;
  category: string;
}

export interface RAGDomainInfo {
  domain: string;
  description: string;
  total_chunks: number;
}

export interface RAGKnowledgeBaseStatus {
  total_chunks: number;
  domains: RAGDomainInfo[];
}
