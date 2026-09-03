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
  document_id?: string;
  page_no?: number;
  bbox?: number[];
  quote?: string;
  field_name?: string;
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
  confidence?: number;
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
}

export interface RiskProfileOut {
  bidder_id: string;
  risk_score: number;
  risk_band: 'LOW' | 'MEDIUM' | 'HIGH';
  entity_confidence?: number;
  drivers: RiskDriverOut[];
  anomalies: AnomalySignalOut[];
}
