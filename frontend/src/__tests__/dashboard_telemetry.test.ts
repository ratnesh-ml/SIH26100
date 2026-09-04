import { describe, it, expect } from 'vitest';

export function computeComplianceDistribution(dist: Record<string, number>, total: number) {
  const safeTotal = total > 0 ? total : 1;
  const order = ['PASS', 'WARN', 'REVIEW', 'FAIL', 'PENDING'];
  return order.map((key) => {
    const count = dist[key] || 0;
    const pct = Math.round((count / safeTotal) * 100);
    return { key, count, pct };
  });
}

export function computeRiskDistribution(dist: Record<string, number>, total: number) {
  const safeTotal = total > 0 ? total : 1;
  const order = [
    { key: 'LOW', label: 'Low Risk (0–30)' },
    { key: 'MEDIUM', label: 'Medium Risk (31–60)' },
    { key: 'HIGH', label: 'High Risk (>60)' },
  ];
  return order.map((item) => {
    const count = dist[item.key] || 0;
    const pct = Math.round((count / safeTotal) * 100);
    return { ...item, count, pct };
  });
}

describe('Executive Dashboard Telemetry & Distribution Calculations', () => {
  it('calculates compliance percentage distribution across cohorts', () => {
    const dist = { PASS: 3, WARN: 1, REVIEW: 1, FAIL: 0, PENDING: 0 };
    const total = 5;
    const result = computeComplianceDistribution(dist, total);

    const pass = result.find((r) => r.key === 'PASS');
    expect(pass?.count).toBe(3);
    expect(pass?.pct).toBe(60);

    const warn = result.find((r) => r.key === 'WARN');
    expect(warn?.count).toBe(1);
    expect(warn?.pct).toBe(20);

    const review = result.find((r) => r.key === 'REVIEW');
    expect(review?.count).toBe(1);
    expect(review?.pct).toBe(20);

    const fail = result.find((r) => r.key === 'FAIL');
    expect(fail?.count).toBe(0);
    expect(fail?.pct).toBe(0);
  });

  it('calculates forensic risk distribution across score bands', () => {
    const dist = { LOW: 3, MEDIUM: 1, HIGH: 1 };
    const total = 5;
    const result = computeRiskDistribution(dist, total);

    const low = result.find((r) => r.key === 'LOW');
    expect(low?.count).toBe(3);
    expect(low?.pct).toBe(60);

    const med = result.find((r) => r.key === 'MEDIUM');
    expect(med?.count).toBe(1);
    expect(med?.pct).toBe(20);

    const high = result.find((r) => r.key === 'HIGH');
    expect(high?.count).toBe(1);
    expect(high?.pct).toBe(20);
  });

  it('handles zero total bidders safely without dividing by zero', () => {
    const result = computeComplianceDistribution({}, 0);
    expect(result.every((r) => r.pct === 0)).toBe(true);
  });
});
