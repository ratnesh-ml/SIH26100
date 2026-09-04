import { describe, it, expect } from 'vitest';
import {
  StatusChip,
  Card,
  Button,
  Modal,
  EmptyState,
  LoadingState,
  ErrorState,
  Tabs,
} from '../components/ui';
import { getStatusTheme, getRiskTier } from './status_chips.test';

describe('Phase 47 UI/UX Architecture & Primitives', () => {
  it('verifies all 8 modular UI primitives are valid React component functions', () => {
    expect(typeof StatusChip).toBe('function');
    expect(typeof Card).toBe('function');
    expect(typeof Button).toBe('object'); // forwardRef component
    expect(typeof Modal).toBe('function');
    expect(typeof EmptyState).toBe('function');
    expect(typeof LoadingState).toBe('function');
    expect(typeof ErrorState).toBe('function');
    expect(typeof Tabs).toBe('function');
  });

  it('verifies StatusChip semantic mapping', () => {
    expect(getStatusTheme('PASS').variant).toBe('pass');
    expect(getStatusTheme('FAIL').variant).toBe('fail');
    expect(getStatusTheme('WARN').variant).toBe('warn');
    expect(getStatusTheme('REVIEW').variant).toBe('review');
    expect(getStatusTheme('PENDING').variant).toBe('pending');
  });

  it('verifies Risk Tier thresholds conform to GFR/CVC scoring bounds', () => {
    expect(getRiskTier(20).band).toBe('LOW');
    expect(getRiskTier(45).band).toBe('MEDIUM');
    expect(getRiskTier(75).band).toBe('HIGH');
  });
});
