import { describe, it, expect } from 'vitest';
import { BidderMatrixRow, FindingStatus } from '../types';

export function computeMatrixStatusCounts(bidders: BidderMatrixRow[]) {
  const counts = { PASS: 0, WARN: 0, REVIEW: 0, FAIL: 0, PENDING: 0, TOTAL: 0 };
  counts.TOTAL = bidders.length;
  for (const b of bidders) {
    const st = b.status as keyof typeof counts;
    if (counts[st] !== undefined) {
      counts[st]++;
    } else {
      counts.PENDING++;
    }
  }
  return counts;
}

export function filterAndSortBidders(
  bidders: BidderMatrixRow[],
  statusFilter: string,
  riskFilter: string,
  searchQuery: string,
  sortField: 'risk' | 'name' | 'status',
  sortOrder: 'asc' | 'desc'
) {
  return bidders
    .filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (riskFilter !== 'ALL') {
        if (riskFilter === 'HIGH' && b.risk_score <= 60) return false;
        if (riskFilter === 'MEDIUM' && (b.risk_score <= 30 || b.risk_score > 60)) return false;
        if (riskFilter === 'LOW' && b.risk_score > 30) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!b.name.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'risk') {
        cmp = a.risk_score - b.risk_score;
      } else if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === 'status') {
        cmp = a.status.localeCompare(b.status);
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });
}

const mockBidders: BidderMatrixRow[] = [
  { id: 'b1', name: 'Alpha Engineering', status: 'PASS', risk_score: 10, risk_band: 'LOW', cells: [] },
  { id: 'b2', name: 'Beta Logistics', status: 'FAIL', risk_score: 75, risk_band: 'HIGH', cells: [] },
  { id: 'b3', name: 'Gamma Enterprises', status: 'WARN', risk_score: 40, risk_band: 'MEDIUM', cells: [] },
  { id: 'b4', name: 'Delta Supplies', status: 'REVIEW', risk_score: 35, risk_band: 'MEDIUM', cells: [] },
  { id: 'b5', name: 'Epsilon Tech', status: 'PASS', risk_score: 20, risk_band: 'LOW', cells: [] },
];

describe('Compliance Matrix Filtering & Aggregations', () => {
  it('correctly aggregates KPI status counts', () => {
    const counts = computeMatrixStatusCounts(mockBidders);
    expect(counts.TOTAL).toBe(5);
    expect(counts.PASS).toBe(2);
    expect(counts.FAIL).toBe(1);
    expect(counts.WARN).toBe(1);
    expect(counts.REVIEW).toBe(1);
    expect(counts.PENDING).toBe(0);
  });

  it('filters bidders by status', () => {
    const passOnly = filterAndSortBidders(mockBidders, 'PASS', 'ALL', '', 'risk', 'desc');
    expect(passOnly.length).toBe(2);
    expect(passOnly.every((b) => b.status === 'PASS')).toBe(true);

    const failOnly = filterAndSortBidders(mockBidders, 'FAIL', 'ALL', '', 'risk', 'desc');
    expect(failOnly.length).toBe(1);
    expect(failOnly[0].name).toBe('Beta Logistics');
  });

  it('filters bidders by risk level (HIGH, MEDIUM, LOW)', () => {
    const highRisk = filterAndSortBidders(mockBidders, 'ALL', 'HIGH', '', 'risk', 'desc');
    expect(highRisk.length).toBe(1);
    expect(highRisk[0].risk_score).toBe(75);

    const medRisk = filterAndSortBidders(mockBidders, 'ALL', 'MEDIUM', '', 'risk', 'desc');
    expect(medRisk.length).toBe(2);

    const lowRisk = filterAndSortBidders(mockBidders, 'ALL', 'LOW', '', 'risk', 'desc');
    expect(lowRisk.length).toBe(2);
  });

  it('filters bidders by search text query', () => {
    const filtered = filterAndSortBidders(mockBidders, 'ALL', 'ALL', 'logistics', 'risk', 'desc');
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('b2');
  });

  it('sorts bidders by risk score descending and ascending', () => {
    const desc = filterAndSortBidders(mockBidders, 'ALL', 'ALL', '', 'risk', 'desc');
    expect(desc[0].risk_score).toBe(75);
    expect(desc[desc.length - 1].risk_score).toBe(10);

    const asc = filterAndSortBidders(mockBidders, 'ALL', 'ALL', '', 'risk', 'asc');
    expect(asc[0].risk_score).toBe(10);
    expect(asc[asc.length - 1].risk_score).toBe(75);
  });
});
