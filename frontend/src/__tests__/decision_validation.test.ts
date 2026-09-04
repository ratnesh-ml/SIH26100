import { describe, it, expect } from 'vitest';

export interface DecisionValidationResult {
  valid: boolean;
  error?: string;
  resulting_status?: string;
}

export function validateOfficerDecision(
  action: string,
  reason?: string,
  currentStatus = 'FAIL'
): DecisionValidationResult {
  const allowedActions = ['ACCEPT', 'REQUEST_CLARIFICATION', 'OVERRIDE', 'REJECT'];
  if (!allowedActions.includes(action)) {
    return { valid: false, error: `Invalid officer action: ${action}` };
  }

  if (action === 'OVERRIDE') {
    if (!reason || !reason.trim()) {
      return {
        valid: false,
        error: 'Officer written justification is strictly required by CVC rules when overriding machine evaluation.',
      };
    }
    return {
      valid: true,
      resulting_status: currentStatus === 'FAIL' ? 'PASS' : 'FAIL',
    };
  }

  if (action === 'ACCEPT') {
    return { valid: true, resulting_status: 'PASS' };
  }

  if (action === 'REJECT') {
    return { valid: true, resulting_status: 'FAIL' };
  }

  if (action === 'REQUEST_CLARIFICATION') {
    return { valid: true, resulting_status: 'REVIEW' };
  }

  return { valid: true };
}

describe('Officer Decision Validation & CVC Compliance Rules', () => {
  it('enforces mandatory written justification when action is OVERRIDE', () => {
    // Empty reason should fail validation
    const emptyOverride = validateOfficerDecision('OVERRIDE', '');
    expect(emptyOverride.valid).toBe(false);
    expect(emptyOverride.error).toContain('justification is strictly required');

    // Whitespace-only reason should fail validation
    const whitespaceOverride = validateOfficerDecision('OVERRIDE', '   ');
    expect(whitespaceOverride.valid).toBe(false);

    // Explicit justification should pass validation
    const validOverride = validateOfficerDecision(
      'OVERRIDE',
      'Audited balance sheet shows turnover exceeds 5 Cr threshold under Note 4.'
    );
    expect(validOverride.valid).toBe(true);
    expect(validOverride.resulting_status).toBe('PASS');
  });

  it('allows optional reason on ACCEPT, REQUEST_CLARIFICATION, and REJECT', () => {
    const acceptNoReason = validateOfficerDecision('ACCEPT');
    expect(acceptNoReason.valid).toBe(true);
    expect(acceptNoReason.resulting_status).toBe('PASS');

    const clarifyNoReason = validateOfficerDecision('REQUEST_CLARIFICATION');
    expect(clarifyNoReason.valid).toBe(true);
    expect(clarifyNoReason.resulting_status).toBe('REVIEW');

    const rejectNoReason = validateOfficerDecision('REJECT');
    expect(rejectNoReason.valid).toBe(true);
    expect(rejectNoReason.resulting_status).toBe('FAIL');
  });

  it('rejects unsupported decision actions', () => {
    const invalid = validateOfficerDecision('DISQUALIFY_FRAUD');
    expect(invalid.valid).toBe(false);
    expect(invalid.error).toContain('Invalid officer action');
  });
});
