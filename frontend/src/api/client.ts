/** Strict REST API client for VigilBid backend contracts */

import {
  BidderDetail,
  BidderListResponse,
  FindingOut,
  LoginResponse,
  RiskProfileOut,
  TenderCreate,
  TenderDetail,
  TenderListResponse,
  UploadPackageResponse,
  ComplianceMatrix,
  DecisionOut,
  CompleteReviewResponse,
  BidderLinkGraphOut,
  AnomalySignalOut,
  AuditEventOut,
  AuditVerifyOut,
  DashboardMetricsOut,
  JobStatus,
  User,
  CopilotQueryRequest,
  CopilotQueryResponse,
  RAGKnowledgeBaseStatus,
} from '../types';

const API_BASE = '/api/v1';
const TOKEN_STORAGE_KEY = 'vigilbid_auth_token';
const REQUEST_TIMEOUT_MS = 15_000;

export type ApiError = {
  status?: number;
  code?: string;
  message: string;
  requestId?: string;
};

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    const typedError = error as Error & Partial<ApiError>;
    return {
      message: typedError.message,
      ...(typeof typedError.status === 'number' ? { status: typedError.status } : {}),
      ...(typeof typedError.code === 'string' ? { code: typedError.code } : {}),
      ...(typeof typedError.requestId === 'string' ? { requestId: typedError.requestId } : {}),
    };
  }
  return { message: 'An unexpected error occurred.' };
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
      signal: options.signal ?? controller.signal,
    });
  } catch (error) {
    if (timedOut && error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errorDetail = response.statusText;
    let errorCode: string | undefined;
    let requestId: string | undefined;
    try {
      const errJson = (await response.json()) as { detail?: unknown; code?: unknown; request_id?: unknown };
      if (typeof errJson.code === 'string') {
        errorCode = errJson.code;
      }
      if (typeof errJson.request_id === 'string') {
        requestId = errJson.request_id;
      }
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // Keep the HTTP status text when the server does not return JSON.
    }
    const error = new Error(errorDetail || `HTTP ${response.status}`) as Error & Partial<ApiError>;
    error.status = response.status;
    error.code = errorCode;
    error.requestId = requestId;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

// 1. Health Probe
export async function fetchHealth(): Promise<{ status: string; project: string; version: string }> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch('/health', { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText || `HTTP ${response.status}`}`);
    }
    return response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Health check timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

// 2. Authentication
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await request<LoginResponse>(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.access_token) {
    setStoredToken(res.access_token);
  }
  return res;
}

export async function fetchCurrentUser(): Promise<User> {
  return request<User>(`${API_BASE}/auth/me`);
}

// 2b. Executive Dashboard Metrics
export async function fetchDashboardMetrics(): Promise<DashboardMetricsOut> {
  return request<DashboardMetricsOut>(`${API_BASE}/dashboard/metrics`);
}

export async function logout(): Promise<void> {
  try {
    await request<{ status: string }>(`${API_BASE}/auth/logout`, {
      method: 'POST',
    });
  } catch {
    // Ignore backend logout error if already disconnected
  } finally {
    clearStoredToken();
  }
}

// 3. Tenders
export async function fetchTenders(page = 1, limit = 20, statusFilter?: string): Promise<TenderListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (statusFilter) {
    params.append('status', statusFilter);
  }
  return request<TenderListResponse>(`${API_BASE}/tenders?${params.toString()}`);
}

export async function createTender(payload: TenderCreate): Promise<TenderDetail> {
  return request<TenderDetail>(`${API_BASE}/tenders`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchTender(tenderId: string): Promise<TenderDetail> {
  return request<TenderDetail>(`${API_BASE}/tenders/${tenderId}`);
}

export async function fetchComplianceMatrix(tenderId: string): Promise<ComplianceMatrix> {
  return request<ComplianceMatrix>(`${API_BASE}/tenders/${tenderId}/matrix`);
}


// 4. Bidders
export async function fetchBidders(tenderId?: string, page = 1, limit = 20): Promise<BidderListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const url = tenderId
    ? `${API_BASE}/tenders/${tenderId}/bidders?${params.toString()}`
    : `${API_BASE}/bidders?${params.toString()}`;
  return request<BidderListResponse>(url);
}

export async function fetchBidder(bidderId: string): Promise<BidderDetail> {
  return request<BidderDetail>(`${API_BASE}/bidders/${bidderId}`);
}

export async function fetchBidderFindings(bidderId: string, statusFilter?: string): Promise<FindingOut[]> {
  const params = new URLSearchParams();
  if (statusFilter) {
    params.append('status', statusFilter);
  }
  const q = params.toString() ? `?${params.toString()}` : '';
  return request<FindingOut[]>(`${API_BASE}/bidders/${bidderId}/findings${q}`);
}

export async function fetchBidderRisk(bidderId: string): Promise<RiskProfileOut> {
  return request<RiskProfileOut>(`${API_BASE}/bidders/${bidderId}/risk`);
}

export async function fetchBidderAnomalies(bidderId: string): Promise<AnomalySignalOut[]> {
  return request<AnomalySignalOut[]>(`${API_BASE}/bidders/${bidderId}/anomalies`);
}

export async function fetchTenderGraph(tenderId: string): Promise<BidderLinkGraphOut> {
  return request<BidderLinkGraphOut>(`${API_BASE}/tenders/${tenderId}/graph`);
}

// 4b. Audit Trail & Cryptographic Chain Verification
export async function fetchAuditTrail(
  tenderId?: string,
  targetType?: string,
  targetId?: string,
  action?: string,
  page = 1,
  limit = 50
): Promise<AuditEventOut[]> {
  const params = new URLSearchParams();
  if (page) params.append('page', String(page));
  if (limit) params.append('limit', String(limit));
  if (targetType) params.append('target_type', targetType);
  if (targetId) params.append('target_id', targetId);
  if (action) params.append('action', action);

  const endpoint = tenderId
    ? `${API_BASE}/tenders/${tenderId}/audit?${params.toString()}`
    : `${API_BASE}/audit/trail?${params.toString()}`;

  return request<AuditEventOut[]>(endpoint);
}

export async function verifyAuditChain(): Promise<AuditVerifyOut> {
  return request<AuditVerifyOut>(`${API_BASE}/audit/verify`);
}

// 5. Ingestion & Document Uploads
export async function uploadBidderPackage(
  tenderId: string,
  declaredName: string,
  files: File[]
): Promise<UploadPackageResponse> {
  const formData = new FormData();
  formData.append('declared_name', declaredName);
  for (const file of files) {
    formData.append('files', file);
  }

  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/tenders/${tenderId}/bidders`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function uploadDocuments(
  bidderId: string,
  files: File[]
): Promise<UploadPackageResponse> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/bidders/${bidderId}/documents`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function retagDocument(
  bidderId: string,
  docId: string,
  docType: string
): Promise<{ job_id: string; status: string; message: string }> {
  return request<{ job_id: string; status: string; message: string }>(
    `${API_BASE}/bidders/${bidderId}/documents/${docId}/retag`,
    {
      method: 'POST',
      body: JSON.stringify({ doc_type: docType }),
    }
  );
}

// 6. Processing Jobs & Pipeline Execution
export async function fetchJobStatus(jobId: string): Promise<JobStatus> {
  return request<JobStatus>(`${API_BASE}/jobs/${jobId}`);
}

export async function triggerJobProcessing(jobId: string): Promise<JobStatus> {
  return request<JobStatus>(`${API_BASE}/jobs/${jobId}/process`, {
    method: 'POST',
  });
}

export async function fetchBidderJobs(bidderId: string): Promise<JobStatus[]> {
  return request<JobStatus[]>(`${API_BASE}/bidders/${bidderId}/jobs`);
}

// 7. Human Review & Decisions
export async function recordFindingDecision(
  findingId: string,
  action: string,
  reason?: string,
  resultingStatus?: string
): Promise<DecisionOut> {
  return request<DecisionOut>(`${API_BASE}/findings/${findingId}/decision`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      reason,
      resulting_status: resultingStatus,
    }),
  });
}

export async function fetchFindingDecisions(findingId: string): Promise<DecisionOut[]> {
  return request<DecisionOut[]>(`${API_BASE}/findings/${findingId}/decisions`);
}

export async function fetchBidderDecisions(bidderId: string): Promise<DecisionOut[]> {
  return request<DecisionOut[]>(`${API_BASE}/bidders/${bidderId}/decisions`);
}

export async function completeBidderReview(bidderId: string): Promise<CompleteReviewResponse> {
  return request<CompleteReviewResponse>(`${API_BASE}/bidders/${bidderId}/complete-review`, {
    method: 'POST',
  });
}

export async function fetchDocumentPageBlob(docId: string, pageNo = 1, dpi = 150): Promise<string> {
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}/documents/${docId}/pages/${pageNo}.png?dpi=${dpi}`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to load page image (HTTP ${response.status})`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function queryCopilot(payload: CopilotQueryRequest): Promise<CopilotQueryResponse> {
  return request<CopilotQueryResponse>(`${API_BASE}/copilot/query`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchCopilotKnowledgeDomains(): Promise<RAGKnowledgeBaseStatus> {
  return request<RAGKnowledgeBaseStatus>(`${API_BASE}/copilot/knowledge-domains`);
}




