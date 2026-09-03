/** TypeScript interfaces matching backend schemas */

export type FindingStatus = 'PASS' | 'WARN' | 'REVIEW' | 'FAIL' | 'INFO';
export type UserRole = 'officer' | 'approver' | 'auditor' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface Criterion {
  id: string;
  tender_id: string;
  code: string;
  title: string;
  description?: string;
  rule_ids?: string[];
  sort_order: number;
}

export interface Tender {
  id: string;
  nit_no: string;
  title: string;
  portal: string;
  estimated_value?: number;
  bid_due_date?: string;
  bidder_count: number;
  created_at: string;
}

export interface Bidder {
  id: string;
  tender_id: string;
  declared_name: string;
  canonical_name?: string;
  overall_status: FindingStatus;
  risk_score: number;
  risk_band: 'LOW' | 'MEDIUM' | 'HIGH';
  review_state: string;
}

export interface Finding {
  id: string;
  bidder_id: string;
  criterion_id?: string;
  rule_id: string;
  rule_version: string;
  status: FindingStatus;
  title: string;
  explanation: string;
  confidence?: number;
}
