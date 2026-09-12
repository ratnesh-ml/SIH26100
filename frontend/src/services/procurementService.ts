import { MOCK_TENDERS, Tender } from '../mockData/tenders';
import { MOCK_BIDDERS, Bidder } from '../mockData/bidders';
import { MOCK_COMPLIANCE_CRITERIA, ComplianceCriterion } from '../mockData/complianceMatrix';
import { MOCK_RISK_PROFILES, BidderRiskProfile } from '../mockData/riskData';
import { MOCK_AUDIT_EVENTS, AuditEvent } from '../mockData/auditEvents';
import { MOCK_GRAPH_NODES, MOCK_GRAPH_LINKS, GraphNode, GraphLink } from '../mockData/networkGraph';

class ProcurementService {
  private tenders: Tender[] = [...MOCK_TENDERS];
  private bidders: Bidder[] = [...MOCK_BIDDERS];
  private complianceCriteria: ComplianceCriterion[] = [...MOCK_COMPLIANCE_CRITERIA];
  private auditEvents: AuditEvent[] = [...MOCK_AUDIT_EVENTS];

  // Tenders
  async getTenders(): Promise<Tender[]> {
    return new Promise((resolve) => setTimeout(() => resolve([...this.tenders]), 50));
  }

  async getTender(id: string): Promise<Tender | undefined> {
    return new Promise((resolve) =>
      setTimeout(() => resolve(this.tenders.find((t) => t.id === id || t.refNo === id) || this.tenders[0]), 50)
    );
  }

  // Bidders
  async getBidders(tenderId?: string): Promise<Bidder[]> {
    return new Promise((resolve) => {
      const filtered = tenderId
        ? this.bidders.filter((b) => b.tenderId === tenderId)
        : this.bidders;
      setTimeout(() => resolve([...filtered]), 50);
    });
  }

  async getBidder(bidderId: string): Promise<Bidder | undefined> {
    return new Promise((resolve) => {
      const bidder = this.bidders.find((b) => b.id === bidderId || b.code === bidderId) || this.bidders[0];
      setTimeout(() => resolve(bidder), 50);
    });
  }

  // Compliance Matrix
  async getComplianceMatrix(_tenderId?: string): Promise<ComplianceCriterion[]> {
    return new Promise((resolve) => setTimeout(() => resolve([...this.complianceCriteria]), 50));
  }

  // Risk Profile
  async getRiskAnalysis(bidderId: string): Promise<BidderRiskProfile | undefined> {
    return new Promise((resolve) => {
      const profile = MOCK_RISK_PROFILES[bidderId] || MOCK_RISK_PROFILES['BID-HYD-0419'];
      setTimeout(() => resolve(profile), 50);
    });
  }

  // Audit Ledger
  async getAuditTrail(_tenderId?: string): Promise<AuditEvent[]> {
    return new Promise((resolve) => setTimeout(() => resolve([...this.auditEvents]), 50));
  }

  async verifyAuditLedger(): Promise<{ verified: boolean; blockCount: number; headHash: string; verifiedAt: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          verified: true,
          blockCount: this.auditEvents.length,
          headHash: this.auditEvents[0].hash,
          verifiedAt: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
        });
      }, 400);
    });
  }

  // Officer Adjudication Decision
  async submitOfficerDecision(
    bidderId: string,
    decision: 'QUALIFY' | 'REJECT' | 'OVERRIDE' | 'SEEK CLARIFICATION',
    justification: string
  ): Promise<{ success: boolean; newBlock: AuditEvent; updatedBidder: Bidder }> {
    if (!justification || justification.trim().length < 30) {
      throw new Error('Justification must be at least 30 characters');
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        const bidderIndex = this.bidders.findIndex((b) => b.id === bidderId || b.code === bidderId);
        const bidder = bidderIndex >= 0 ? this.bidders[bidderIndex] : this.bidders[0];

        bidder.officerDecision = decision;
        bidder.officerJustification = justification;
        bidder.decisionTimestamp = new Date().toISOString();
        bidder.decisionDscToken = 'RAJESH_VERMA_CPCL_0942';

        if (decision === 'QUALIFY' || decision === 'OVERRIDE') {
          bidder.complianceStatus = 'PASS';
        } else if (decision === 'REJECT') {
          bidder.complianceStatus = 'FAIL';
        }

        // Generate synthetic next SHA-256 hash
        const nextBlockNumber = this.auditEvents[0].blockNumber + 1;
        const newBlockHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

        const newBlock: AuditEvent = {
          blockNumber: nextBlockNumber,
          hash: newBlockHash,
          previousHash: this.auditEvents[0].hash,
          merkleRoot: 'e9a1820f4c8b2d1e3f5a7c9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3eb4d8c2',
          timestamp: new Date().toLocaleTimeString('en-IN') + ' IST',
          officer: 'officer@cpcl.gov.in (Rajesh Verma)',
          officerRole: 'Chief Procurement Officer (CPCL)',
          action: `OFFICER_${decision}_RECORDED`,
          bidderCode: bidder.code,
          bidderName: bidder.legalName,
          category: 'DECISION',
          description: `Officer Adjudication recorded as ${decision}. Statutory minutes committed to cryptographic chain.`,
          payloadJson: JSON.stringify({
            event: `OFFICER_${decision}_RECORDED`,
            bidder_id: bidder.id,
            decision: decision,
            justification_length: justification.length,
            dsc_token: 'RAJESH_VERMA_CPCL_0942',
            timestamp: new Date().toISOString(),
          }, null, 2),
          status: 'COMMITTED',
        };

        this.auditEvents.unshift(newBlock);
        resolve({ success: true, newBlock, updatedBidder: { ...bidder } });
      }, 300);
    });
  }

  // Network Graph
  async getNetworkGraph(): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ nodes: [...MOCK_GRAPH_NODES], links: [...MOCK_GRAPH_LINKS] }), 50)
    );
  }

  // Dossier File Generation & Browser Download
  generateDossierText(tenderId: string, bidderId: string): string {
    const tender = this.tenders.find((t) => t.id === tenderId) || this.tenders[0];
    const bidder = this.bidders.find((b) => b.id === bidderId) || this.bidders[0];

    return `================================================================================
CHENNAI PETROLEUM CORPORATION LIMITED (CPCL)
(A Government of India Enterprise and Group Company of IndianOil)
MANALI REFINERY PROCUREMENT & CONTRACTS CELL • ISO 9001:2015

STATUTORY CVC COMPLIANCE & SCRUTINY DOSSIER
Under GFR 2017 & CVC Procurement Manual Guidelines
================================================================================

1. TENDER IDENTIFICATION & SUMMARY
--------------------------------------------------------------------------------
Tender Reference Number   : ${tender.refNo}
Tender Title              : ${tender.title}
Executing Department      : ${tender.department}
Estimated Contract Value  : ${tender.estimatedValue}
Statutory Rule Sets       : GFR 2017 Rules 144, 151, 153, 161, 173; DPIIT PPP-MII Order
Audit Genesis Hash        : e1930065f734efcb882190123456789abcdef0123456789abcdef0123456

2. SCRUTINIZED BIDDER CREDENTIALS
--------------------------------------------------------------------------------
Bidder Allocation Code    : ${bidder.code} (${bidder.tag})
Legal Entity Name         : ${bidder.legalName}
Trade Name                : ${bidder.tradeName}
Permanent Account No (PAN): ${bidder.pan} (${bidder.panStatus})
Goods & Services Tax (GST): ${bidder.gstin} (${bidder.gstinStatus})
Corporate ID Number (CIN) : ${bidder.cin} (${bidder.cinStatus})
MSME Udyam Registration  : ${bidder.udyam} (${bidder.udyamCategory})
3-Yr Audited Turnover     : ${bidder.turnover} (UDIN: ${bidder.turnoverUdin})
Declared Local Content    : ${bidder.localContentPercent}% (${bidder.localContentStatus})

3. AUTOMATED COMPLIANCE EVALUATION
--------------------------------------------------------------------------------
Preliminary Engine Status : ${bidder.complianceStatus}
Composite Risk Index      : ${bidder.riskScore} / 100 (${bidder.riskLevel})
Active Findings Flagged   : ${bidder.findings.length}
${bidder.findings
  .map(
    (f, idx) => `
[Finding #${idx + 1}] ${f.ruleTitle} (${f.code})
- Severity: ${f.severity} | Clause: ${f.ruleClause}
- Description: ${f.description}
- Evidence Note: ${f.evidenceNote}
- Primary Source: ${f.document1.name} (Page ${f.document1.page}, Box: [${f.document1.bbox.join(', ')}])
`
  )
  .join('')}

4. OFFICER STATUTORY ADJUDICATION & DETERMINATION
--------------------------------------------------------------------------------
Adjudicating Officer      : Shri Rajesh Verma (Chief Procurement Officer, CPCL)
Statutory Determination   : ${bidder.officerDecision}
Officer DSC Token ID      : ${bidder.decisionDscToken || 'RAJESH_VERMA_CPCL_0942 (Cryptographically Valid)'}
Determination Timestamp   : ${bidder.decisionTimestamp || '2026-03-12 11:28:40 IST'}

Written Statutory Minutes & Justification:
"${bidder.officerJustification || 'Tender Evaluation Committee reviewed the statutory submissions, verified the MSME relaxation guidelines, and confirmed the legal determination.'}"

5. CRYPTOGRAPHIC PROVENANCE & LEDGER SEAL
--------------------------------------------------------------------------------
Forward SHA-256 Block Hash: ${this.auditEvents[0].hash}
Previous Chained Block Hash: ${this.auditEvents[0].previousHash}
Merkle Root Anchor Digest : ${this.auditEvents[0].merkleRoot}
Digital Signature Status  : SIGNED & ATTESTED (NIC-CERT Level 3 HSM)

================================================================================
END OF OFFICIAL COMPLIANCE DOSSIER • EXPORTED FROM VIGILBID AUDIT SUITE
================================================================================`;
  }

  downloadDossierFile(tenderId: string = 'CPCL-PUMP-217', bidderId: string = 'BID-HYD-0419'): void {
    const textContent = this.generateDossierText(tenderId, bidderId);
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CPCL_CVC_Dossier_${tenderId}_${bidderId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const procurementService = new ProcurementService();
