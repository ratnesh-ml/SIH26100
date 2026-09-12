export interface AuditEvent {
  blockNumber: number;
  hash: string;
  previousHash: string;
  merkleRoot: string;
  timestamp: string;
  officer: string;
  officerRole: string;
  action: string;
  bidderCode: string;
  bidderName: string;
  category: 'DECISION' | 'DETECTION' | 'ATTESTATION' | 'VERIFICATION' | 'SYSTEM';
  description: string;
  payloadJson?: string;
  status: 'COMMITTED' | 'VERIFIED' | 'ANCHORED';
}

export const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  {
    blockNumber: 144,
    hash: '3c7e1d54b899a1f2e3d4c5b6a7890123456789abcdef0123456789abcdef912f',
    previousHash: '8f9a2b71c402d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6e491',
    merkleRoot: 'd8c4b2a19f0e3d5c7b9a1e3f5a7c9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e',
    timestamp: '2026-03-12 11:28:40 IST',
    officer: 'officer@cpcl.gov.in (Rajesh Verma)',
    officerRole: 'Chief Procurement Officer',
    action: 'OFFICER_OVERRIDE_RECORDED',
    bidderCode: 'Bidder C',
    bidderName: 'Bharat Hydrotech Corp',
    category: 'DECISION',
    description: 'Statutory override committed with mandatory written minutes: Invoking Public Procurement Policy Order 2012 MSME turnover relaxation.',
    payloadJson: JSON.stringify({
      event: 'OFFICER_OVERRIDE_RECORDED',
      bidder_id: 'BID-HYD-0419',
      tender_ref: 'CPCL/MM/2026/PUMP-217',
      determination: 'OVERRIDE',
      justification_length: 512,
      dsc_token: 'RAJESH_VERMA_CPCL_0942',
      merkle_leaf_index: 143,
      statutory_provisions: ['MSME Order 2012 Clause 10', 'GFR Rule 153', 'CVC Circular 02/02/2021'],
    }, null, 2),
    status: 'COMMITTED',
  },
  {
    blockNumber: 143,
    hash: '8f9a2b71c402d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6e491',
    previousHash: '7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b',
    merkleRoot: 'c7b5a3928e1d2c4b6a8f0d2e4c6b8a0f2d4c6e8b0a2d4f6a8c0e2b4d6f8a0c2e',
    timestamp: '2026-03-12 11:24:12 IST',
    officer: 'SYSTEM_AUTOPRINT',
    officerRole: 'AI Compliance Scrutiny Engine',
    action: 'ANOMALY_VECTOR_RECORDED',
    bidderCode: 'Bidder C',
    bidderName: 'Bharat Hydrotech Corp',
    category: 'DETECTION',
    description: 'Heuristic Rule CPCL-GOODS-002 triggered FAIL: GSTIN state prefix 33-TN discordant with Pune ROC registration.',
    payloadJson: JSON.stringify({
      rule_id: 'CPCL-GOODS-002',
      finding_id: 'FND-2026-0042',
      severity: 'CRITICAL',
      detected_values: { gstin: '33AAACB9999F1Z5', pan: 'AAACB1234F', roc_state: 27 },
    }, null, 2),
    status: 'COMMITTED',
  },
  {
    blockNumber: 142,
    hash: '7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b',
    previousHash: '6b5a4d3c2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b',
    merkleRoot: 'b6a492817d0c1b3a5f7e9c1b3a5f7e9c1b3a5f7e9c1b3a5f7e9c1b3a5f7e9c1b',
    timestamp: '2026-03-12 11:20:05 IST',
    officer: 'SYSTEM_REGISTRY_GATEWAY',
    officerRole: 'NIC Statutory Gateway Adapter',
    action: 'REGISTRY_ATTESTATION_POLLED',
    bidderCode: 'Bidder C',
    bidderName: 'Bharat Hydrotech Corp',
    category: 'ATTESTATION',
    description: 'MCA-21 Gateway attested active incorporation U29100MH2018PTC310244 with 2 active directors.',
    payloadJson: JSON.stringify({
      gateway: 'MCA21_SOAP_GATEWAY',
      cin: 'U29100MH2018PTC310244',
      status: 'ACTIVE',
      directors: ['08192341 - R.K. AGGARWAL', '08192342 - S. AGGARWAL'],
    }, null, 2),
    status: 'COMMITTED',
  },
  {
    blockNumber: 141,
    hash: '6b5a4d3c2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b',
    previousHash: '5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b',
    merkleRoot: 'a59381706c9b0a2f4e8d8b0a2f4e8d8b0a2f4e8d8b0a2f4e8d8b0a2f4e8d8b0a',
    timestamp: '2026-03-12 11:15:33 IST',
    officer: 'SYSTEM_OCR_EXTRACTOR',
    officerRole: 'Deterministic Layout Engine',
    action: 'DOCUMENT_CAS_INGESTED',
    bidderCode: 'Bidder C',
    bidderName: 'Bharat Hydrotech Corp',
    category: 'VERIFICATION',
    description: '5 PDFs ingested; SHA-256 CAS digest committed. Zip bomb ratio 4.2:1 safe.',
    status: 'COMMITTED',
  },
  {
    blockNumber: 140,
    hash: '5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b',
    previousHash: '4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b',
    merkleRoot: '9482706f5b8a9f1e3d7c7a9f1e3d7c7a9f1e3d7c7a9f1e3d7c7a9f1e3d7c7a9f',
    timestamp: '2026-03-12 11:10:00 IST',
    officer: 'officer@cpcl.gov.in (Rajesh Verma)',
    officerRole: 'Chief Procurement Officer',
    action: 'TENDER_SCRUTINY_INITIATED',
    bidderCode: 'ALL',
    bidderName: 'All 5 Bidders',
    category: 'SYSTEM',
    description: 'Technical scrutiny round opened for CPCL/MM/2026/PUMP-217.',
    status: 'COMMITTED',
  },
];
