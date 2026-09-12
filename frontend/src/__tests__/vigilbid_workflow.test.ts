import { describe, it, expect } from 'vitest';
import { procurementService } from '../services/procurementService';

describe('VigilBid Service Layer & 20-Screen Workflow Verification', () => {
  describe('Mock Backend & Procurement Service', () => {
    it('provides high-fidelity PSU tenders matching requirements', async () => {
      const tenders = await procurementService.getTenders();
      expect(tenders.length).toBeGreaterThanOrEqual(4);
      const cpcl = tenders.find((t) => t.id === 'CPCL-PUMP-217');
      expect(cpcl).toBeDefined();
      expect(cpcl?.refNo).toBe('CPCL/MM/2026/PUMP-217');
      expect(cpcl?.organization).toBe('CPCL');
      expect(cpcl?.bidderCount).toBe(5);
    });

    it('provides synthetic bidders with complete statutory credentials', async () => {
      const bidders = await procurementService.getBidders('CPCL-PUMP-217');
      expect(bidders.length).toBe(5);

      const bharat = bidders.find((b) => b.id === 'BID-HYD-0419');
      expect(bharat).toBeDefined();
      expect(bharat?.legalName).toBe('Bharat Hydrotech Corporation Pvt Ltd');
      expect(bharat?.riskScore).toBe(65);
      expect(bharat?.pan).toBe('AAACB1234F');
      expect(bharat?.cin).toBe('U29100MH2018PTC310244');
      expect(bharat?.gstin).toBe('33AAACB9999F1Z5');
      expect(bharat?.findings.length).toBe(3);
    });

    it('provides compliance criteria covering statutory categories', async () => {
      const criteria = await procurementService.getComplianceMatrix();
      expect(criteria.length).toBe(18);

      const categories = new Set(criteria.map((c) => c.category));
      expect(categories.has('Identity & Tax')).toBe(true);
      expect(categories.has('Financial Capacity')).toBe(true);
      expect(categories.has('Statutory Directives')).toBe(true);
      expect(categories.has('Technical Capability')).toBe(true);
      expect(categories.has('Document Integrity')).toBe(true);
    });

    it('provides comprehensive risk telemetry & cartel collusion graph data', async () => {
      const risk = await procurementService.getRiskAnalysis('BID-HYD-0419');
      expect(risk).toBeDefined();
      expect(risk?.compositeScore).toBe(65);
      expect(risk?.factors.length).toBeGreaterThanOrEqual(3);

      const graph = await procurementService.getNetworkGraph();
      expect(graph.nodes.length).toBeGreaterThanOrEqual(8);
      expect(graph.links.length).toBeGreaterThanOrEqual(7);
      expect(graph.nodes.some((n) => n.category === 'SUSPICIOUS')).toBe(true);
    });

    it('validates audit ledger cryptographic chain integrity', async () => {
      const auditTrail = await procurementService.getAuditTrail();
      expect(auditTrail.length).toBeGreaterThanOrEqual(5);

      const verification = await procurementService.verifyAuditLedger();
      expect(verification.verified).toBe(true);
      expect(verification.blockCount).toBe(auditTrail.length);
      expect(verification.headHash).toBeDefined();
      expect(verification.headHash.length).toBe(64); // SHA-256 length
    });
  });

  describe('Officer Adjudication Workflow & SHA-256 Ledger Append', () => {
    it('rejects officer decisions with insufficient justification (<30 chars)', async () => {
      await expect(
        procurementService.submitOfficerDecision('BID-HYD-0419', 'OVERRIDE', 'Too short')
      ).rejects.toThrow('Justification must be at least 30 characters');
    });

    it('successfully commits OVERRIDE decision and appends cryptographic block', async () => {
      const initialTrail = await procurementService.getAuditTrail();
      const initialCount = initialTrail.length;

      const result = await procurementService.submitOfficerDecision(
        'BID-HYD-0419',
        'OVERRIDE',
        'Tender Evaluation Committee verified Form REG-06 and MSME relaxation orders under Public Procurement Policy 2012 Clause 10.'
      );

      expect(result.success).toBe(true);
      expect(result.newBlock.blockNumber).toBeGreaterThan(0);
      expect(result.newBlock.hash.length).toBe(64);
      expect(result.newBlock.action).toContain('OVERRIDE');

      // Verify audit trail grew
      const updatedTrail = await procurementService.getAuditTrail();
      expect(updatedTrail.length).toBe(initialCount + 1);
      const latestBlock = updatedTrail[0];
      expect(latestBlock.action).toContain('OVERRIDE');
      expect(latestBlock.hash).toBe(result.newBlock.hash);

      // Verify updated bidder
      expect(result.updatedBidder.officerDecision).toBe('OVERRIDE');
      expect(result.updatedBidder.complianceStatus).toBe('PASS');
    });
  });

  describe('CVC Dossier Generation & Export', () => {
    it('generates mock frontend dossier with statutory CVC format', () => {
      const dossier = procurementService.generateDossierText('CPCL-PUMP-217', 'BID-HYD-0419');
      expect(dossier).toContain('CHENNAI PETROLEUM CORPORATION LIMITED');
      expect(dossier).toContain('STATUTORY CVC COMPLIANCE & SCRUTINY DOSSIER');
      expect(dossier).toContain('Bharat Hydrotech Corporation Pvt Ltd');
      expect(dossier).toContain('AAACB1234F');
      expect(dossier).toContain('33AAACB9999F1Z5');
      expect(dossier).toContain('CRYPTOGRAPHIC PROVENANCE & LEDGER SEAL');
    });
  });
});
