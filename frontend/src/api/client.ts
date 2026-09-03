/** REST API client for backend communication */

const API_BASE = '/api/v1';

export async function fetchHealth(): Promise<{ status: string; project: string; version: string }> {
  const response = await fetch('/health');
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchTenders(): Promise<{ items: any[]; total: number }> {
  const response = await fetch(`${API_BASE}/tenders`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tenders: ${response.statusText}`);
  }
  return response.json();
}
