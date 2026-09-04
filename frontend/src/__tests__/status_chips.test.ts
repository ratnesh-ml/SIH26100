import { describe, it, expect } from 'vitest';

export function getStatusTheme(status: string) {
  const normalized = (status || 'PENDING').toUpperCase();
  switch (normalized) {
    case 'PASS':
    case 'QUALIFIED':
    case 'DONE':
      return { variant: 'pass', color: 'emerald', label: 'PASS' };
    case 'FAIL':
    case 'NOT_QUALIFIED':
    case 'FAILED':
      return { variant: 'fail', color: 'rose', label: 'FAIL' };
    case 'WARN':
      return { variant: 'warn', color: 'amber', label: 'WARN' };
    case 'REVIEW':
    case 'UNDER_EVALUATION':
      return { variant: 'review', color: 'yellow', label: 'REVIEW' };
    default:
      return { variant: 'pending', color: 'slate', label: normalized || 'PENDING' };
  }
}

export function getRiskTier(score: number): { band: 'LOW' | 'MEDIUM' | 'HIGH'; label: string; color: string } {
  if (score > 60) {
    return { band: 'HIGH', label: `HIGH RISK (${score})`, color: 'rose' };
  }
  if (score > 30) {
    return { band: 'MEDIUM', label: `MEDIUM RISK (${score})`, color: 'amber' };
  }
  return { band: 'LOW', label: `LOW RISK (${score})`, color: 'emerald' };
}

describe('Status Chips & Vocabulary Telemetry', () => {
  it('maps PASS and QUALIFIED to emerald theme', () => {
    expect(getStatusTheme('PASS')).toEqual({ variant: 'pass', color: 'emerald', label: 'PASS' });
    expect(getStatusTheme('QUALIFIED')).toEqual({ variant: 'pass', color: 'emerald', label: 'PASS' });
    expect(getStatusTheme('DONE')).toEqual({ variant: 'pass', color: 'emerald', label: 'PASS' });
  });

  it('maps FAIL and NOT_QUALIFIED to rose theme without aggressive accusatory labels', () => {
    expect(getStatusTheme('FAIL')).toEqual({ variant: 'fail', color: 'rose', label: 'FAIL' });
    expect(getStatusTheme('NOT_QUALIFIED')).toEqual({ variant: 'fail', color: 'rose', label: 'FAIL' });
    expect(getStatusTheme('FAILED')).toEqual({ variant: 'fail', color: 'rose', label: 'FAIL' });
  });

  it('maps WARN and REVIEW to distinct non-blocking advisory themes', () => {
    expect(getStatusTheme('WARN')).toEqual({ variant: 'warn', color: 'amber', label: 'WARN' });
    expect(getStatusTheme('REVIEW')).toEqual({ variant: 'review', color: 'yellow', label: 'REVIEW' });
    expect(getStatusTheme('UNDER_EVALUATION')).toEqual({ variant: 'review', color: 'yellow', label: 'REVIEW' });
  });

  it('correctly calculates risk bands based on score thresholds', () => {
    // 0-30 = LOW
    expect(getRiskTier(0).band).toBe('LOW');
    expect(getRiskTier(15).band).toBe('LOW');
    expect(getRiskTier(30).band).toBe('LOW');

    // 31-60 = MEDIUM
    expect(getRiskTier(31).band).toBe('MEDIUM');
    expect(getRiskTier(50).band).toBe('MEDIUM');
    expect(getRiskTier(60).band).toBe('MEDIUM');

    // > 60 = HIGH
    expect(getRiskTier(61).band).toBe('HIGH');
    expect(getRiskTier(85).band).toBe('HIGH');
    expect(getRiskTier(100).band).toBe('HIGH');
  });
});
