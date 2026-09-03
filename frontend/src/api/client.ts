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
  JobStatus,
  User,
} from '../types';

const API_BASE = '/api/v1';
const TOKEN_STORAGE_KEY = 'vigilbid_auth_token';

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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorDetail || `HTTP ${response.status}`);
  }

  return response.json();
}

// 1. Health Probe
export async function fetchHealth(): Promise<{ status: string; project: string; version: string }> {
  const response = await fetch('/health');
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  return response.json();
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


