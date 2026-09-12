export interface Finding {
  id: string;
  code: string;
  ruleTitle: string;
  ruleClause: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'FAIL' | 'WARN' | 'REVIEW' | 'PASS';
  evidenceCount: number;
  description: string;
  evidenceNote: string;
  document1: { name: string; page: number; bbox: [number, number, number, number]; label: string; text: string };
  document2?: { name: string; page: number; bbox: [number, number, number, number]; label: string; text: string };
}

export interface Bidder {
  id: string;
  code: string;
  tenderId: string;
  legalName: string;
  tradeName: string;
  tag: string;
  pan: string;
  panStatus: string;
  panMatch: string;
  gstin: string;
  gstinStatus: string;
  gstinMismatchNote?: string;
  cin: string;
  cinStatus: string;
  cinDate: string;
  udyam: string;
  udyamCategory: string;
  udyamSector: string;
  consistencyScore: number;
  turnover: string;
  turnoverNumeric: number;
  turnoverUdin: string;
  turnoverStatus: 'QUALIFIED' | 'DEFICIT' | 'EXEMPT';
  localContentPercent: number;
  localContentStatus: 'CLASS_I' | 'DEFICIT' | 'NON_LOCAL';
  emdAmount: string;
  emdStatus: string;
  emdBank: string;
  oemAuth: string;
  oemStatus: string;
  integrityPact: string;
  integrityStatus: string;
  complianceStatus: 'PASS' | 'WARN' | 'REVIEW' | 'FAIL';
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  officerDecision: 'PENDING' | 'QUALIFY' | 'REJECT' | 'OVERRIDE' | 'SEEK CLARIFICATION';
  officerJustification?: string;
  decisionTimestamp?: string;
  decisionDscToken?: string;
  findings: Finding[];
  documents: Array<{
    id: string;
    name: string;
    category: string;
    sizeBytes: number;
    sha256: string;
    pages: number;
    status: 'VERIFIED' | 'DISCORDANT' | 'FLAGGED';
    extractedText: string;
  }>;
}

export const MOCK_BIDDERS: Bidder[] = [
  {
    id: 'BID-HYD-0419',
    code: 'Bidder C',
    tenderId: 'CPCL-PUMP-217',
    legalName: 'Bharat Hydrotech Corporation Pvt Ltd',
    tradeName: 'Bharat Hydrotech Solutions',
    tag: 'Primary Scrutiny Case',
    pan: 'AAACB1234F',
    panStatus: 'NSDL Active',
    panMatch: 'CBDT Match 99.1%',
    gstin: '33AAACB9999F1Z5',
    gstinStatus: 'State & Entity Mismatch',
    gstinMismatchNote: 'GSTIN state code 33 (Tamil Nadu) vs ROC state code 27 (Maharashtra); embedded PAN AAACB9999F conflicts with standalone PAN AAACB1234F.',
    cin: 'U29100MH2018PTC310244',
    cinStatus: 'MCA21 Active',
    cinDate: '14/06/2018',
    udyam: 'UDYAM-MH-26-0034912',
    udyamCategory: 'Medium-MSE',
    udyamSector: 'Manufacturing Sector',
    consistencyScore: 82.1,
    turnover: '₹6.10 Crores',
    turnoverNumeric: 61000000,
    turnoverUdin: '24049819BCDE1942',
    turnoverStatus: 'DEFICIT',
    localContentPercent: 45.0,
    localContentStatus: 'DEFICIT',
    emdAmount: '₹36.80 Lakhs (BG)',
    emdStatus: 'VERIFIED SFMS',
    emdBank: 'SBI Pune Industrial Branch BG-8841',
    oemAuth: 'Direct Hydrotech Facility (ISO 9001:2015)',
    oemStatus: 'VALIDATED',
    integrityPact: 'Executed on Stamp Paper ₹500 (e-Stamping Valid)',
    integrityStatus: 'SIGNED & ATTESTED',
    complianceStatus: 'FAIL',
    riskScore: 65,
    riskLevel: 'HIGH',
    officerDecision: 'PENDING',
    findings: [
      {
        id: 'FND-2026-0042',
        code: 'CPCL-GOODS-002',
        ruleTitle: 'PAN-GSTIN Identity Inconsistency',
        ruleClause: 'GFR 2017 Rule 144 & CGST Act 2017 Section 22',
        severity: 'CRITICAL',
        status: 'FAIL',
        evidenceCount: 4,
        description: 'Standalone PAN card submitted is AAACB1234F. However, characters 3–12 of the submitted Form GST REG-06 contain AAACB9999F (a different legal tax entity).',
        evidenceNote: 'State prefix 33-TN vs Pune ROC 27-MH. The bidder submitted another corporate entity’s PAN card or an unauthorized branch certificate.',
        document1: {
          name: 'gst_reg06.pdf',
          page: 1,
          bbox: [120, 85, 340, 110],
          label: 'GST REG-06 Certificate (Page 1)',
          text: 'Registration Number (GSTIN): 33AAACB9999F1Z5\nLegal Name: Bharat Hydrotech Corporation Pvt Ltd\nState: Tamil Nadu (33)',
        },
        document2: {
          name: 'pan_card.pdf',
          page: 1,
          bbox: [140, 160, 310, 185],
          label: 'Income Tax PAN Card (Page 1)',
          text: 'INCOME TAX DEPARTMENT • GOVT OF INDIA\nPermanent Account Number: AAACB1234F\nName: BHARAT HYDROTECH CORP PVT LTD',
        },
      },
      {
        id: 'FND-2026-0043',
        code: 'CPCL-GOODS-003',
        ruleTitle: 'Local Content Deficit (MII-PPO)',
        ruleClause: 'DPIIT Public Procurement Order (PPP-MII) 2017 Clause 2(b)',
        severity: 'HIGH',
        status: 'FAIL',
        evidenceCount: 2,
        description: 'Declared domestic value addition is 45.0%, failing the mandatory Class-I benchmark of ≥ 50.0% prescribed for refinery process packages.',
        evidenceNote: 'Audited Annexure B shows imported impellers and mechanical seal assemblies from Germany totaling 55% landed value.',
        document1: {
          name: 'local_content.pdf',
          page: 1,
          bbox: [95, 210, 380, 245],
          label: 'Make in India Self-Declaration (Page 1)',
          text: 'We hereby certify that the local content in API-610 Pumps offered against Tender CPCL/MM/2026/PUMP-217 is 45.0% (Class-II Supplier).',
        },
      },
      {
        id: 'FND-2026-0044',
        code: 'CPCL-GOODS-007',
        ruleTitle: 'Document Anomaly & Signature Delta',
        ruleClause: 'CVC Vigilance Manual 2021 & IT Act 2000 Section 3',
        severity: 'MEDIUM',
        status: 'WARN',
        evidenceCount: 2,
        description: 'PDF author metadata creation timestamp postdates declared digital signature timestamp by 48 minutes.',
        evidenceNote: 'NIC-CERT integrity checksum indicates potential retrospective metadata modification post-signing.',
        document1: {
          name: 'turnover_ca.pdf',
          page: 2,
          bbox: [80, 320, 360, 355],
          label: 'CA Turnover Certificate (Page 2)',
          text: 'UDIN: 24049819BCDE1942 • Turnover FY 2024-25: ₹6.10 Crores\nDSC Signature: CA. Rajesh Sharma (M.No 049819)',
        },
      },
    ],
    documents: [
      {
        id: 'DOC-01',
        name: 'gst_reg06.pdf',
        category: 'Statutory Tax Registration',
        sizeBytes: 428100,
        sha256: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
        pages: 3,
        status: 'DISCORDANT',
        extractedText: 'FORM GST REG-06 • Government of India • Registration Certificate • GSTIN: 33AAACB9999F1Z5',
      },
      {
        id: 'DOC-02',
        name: 'pan_card.pdf',
        category: 'Income Tax Credential',
        sizeBytes: 198450,
        sha256: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        pages: 1,
        status: 'VERIFIED',
        extractedText: 'INCOME TAX DEPARTMENT • GOVT OF INDIA • Permanent Account Number: AAACB1234F',
      },
      {
        id: 'DOC-03',
        name: 'turnover_ca.pdf',
        category: 'Financial Capability (Turnover)',
        sizeBytes: 645120,
        sha256: '3f4e5d6c7b8a90123456789abcdef0123456789abcdef0123456789abcdef012',
        pages: 2,
        status: 'FLAGGED',
        extractedText: 'CHARTERED ACCOUNTANTS CERTIFICATE • UDIN: 24049819BCDE1942 • Average 3-Yr Turnover: ₹6.10 Cr',
      },
      {
        id: 'DOC-04',
        name: 'local_content.pdf',
        category: 'Statutory Local Content (MII)',
        sizeBytes: 312800,
        sha256: '7c8b9a0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
        pages: 2,
        status: 'FLAGGED',
        extractedText: 'LOCAL CONTENT DECLARATION • DPIIT PPP-MII ORDER 2017 • Declared Local Content: 45.0%',
      },
      {
        id: 'DOC-05',
        name: 'udyam_cert.pdf',
        category: 'MSME Statutory Certificate',
        sizeBytes: 254300,
        sha256: '5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e',
        pages: 2,
        status: 'VERIFIED',
        extractedText: 'UDYAM REGISTRATION CERTIFICATE • UDYAM-MH-26-0034912 • Enterprise Type: Medium',
      },
    ],
  },
  {
    id: 'BID-MER-0102',
    code: 'Bidder A',
    tenderId: 'CPCL-PUMP-217',
    legalName: 'Meridian Flow Systems Pvt Ltd',
    tradeName: 'Meridian Pumps India',
    tag: 'Golden Baseline (Clean Vendor)',
    pan: 'AABCM1234A',
    panStatus: 'NSDL Active',
    panMatch: '100% Verified',
    gstin: '33AABCM1234A1Z5',
    gstinStatus: 'Active & Matched (Tamil Nadu)',
    cin: 'U29120TN2015PTC099812',
    cinStatus: 'MCA21 Active',
    cinDate: '08/02/2015',
    udyam: 'UDYAM-TN-02-0012498',
    udyamCategory: 'Medium-MSE',
    udyamSector: 'Heavy Industrial Machinery',
    consistencyScore: 98.6,
    turnover: '₹14.20 Crores',
    turnoverNumeric: 142000000,
    turnoverUdin: '24098112AAAA1092',
    turnoverStatus: 'QUALIFIED',
    localContentPercent: 68.4,
    localContentStatus: 'CLASS_I',
    emdAmount: '₹36.80 Lakhs (BG)',
    emdStatus: 'VERIFIED SFMS',
    emdBank: 'Bank of Baroda Chennai Main Branch',
    oemAuth: 'Direct OEM Manufacturer (ISO 9001, API-610 License)',
    oemStatus: 'VALIDATED',
    integrityPact: 'Executed on Stamp Paper ₹500',
    integrityStatus: 'SIGNED & ATTESTED',
    complianceStatus: 'PASS',
    riskScore: 12,
    riskLevel: 'LOW',
    officerDecision: 'QUALIFY',
    findings: [],
    documents: [],
  },
  {
    id: 'BID-KAV-0211',
    code: 'Bidder B',
    tenderId: 'CPCL-PUMP-217',
    legalName: 'Sri Kaveri Engineering Works',
    tradeName: 'Kaveri Engg',
    tag: 'MSE Micro Vendor (Turnover Exempt)',
    pan: 'AABCK4491E',
    panStatus: 'NSDL Active',
    panMatch: 'Jaro-Winkler 0.88 Match',
    gstin: '33AABCK4491E1Z2',
    gstinStatus: 'Active (Tamil Nadu)',
    gstinMismatchNote: 'Trade name abbreviation drift (Kaveri Engg vs Sri Kaveri Engineering Works). Minor discrepancy under GFR Rule 153.',
    cin: 'Unregistered Partnership / MSME',
    cinStatus: 'ROF Registered',
    cinDate: '22/11/2012',
    udyam: 'UDYAM-TN-02-0044190',
    udyamCategory: 'Micro-MSE',
    udyamSector: 'Fabrication & Pumps',
    consistencyScore: 89.4,
    turnover: '₹3.40 Crores',
    turnoverNumeric: 34000000,
    turnoverUdin: '24011294BCDE9912',
    turnoverStatus: 'EXEMPT',
    localContentPercent: 74.0,
    localContentStatus: 'CLASS_I',
    emdAmount: 'Exempt (Micro MSE)',
    emdStatus: 'EXEMPT VERIFIED',
    emdBank: 'N/A (Udyam Exemption Rule 170)',
    oemAuth: 'Authorized Distributor of Flowserve India',
    oemStatus: 'VALIDATED',
    integrityPact: 'Executed and Attested',
    integrityStatus: 'SIGNED & ATTESTED',
    complianceStatus: 'REVIEW',
    riskScore: 28,
    riskLevel: 'LOW',
    officerDecision: 'PENDING',
    findings: [],
    documents: [],
  },
  {
    id: 'BID-NOV-0654',
    code: 'Bidder D',
    tenderId: 'CPCL-PUMP-217',
    legalName: 'Nova Pumps & Systems Ltd',
    tradeName: 'Nova Fluidics',
    tag: 'Adversarial Test & Metadata Delta',
    pan: 'AABCN8812D',
    panStatus: 'NSDL Active',
    panMatch: 'Parity Match 98.4%',
    gstin: '33AABCN8812D1Z9',
    gstinStatus: 'Active (Tamil Nadu)',
    cin: 'L29100TN2008PLC068910',
    cinStatus: 'MCA21 Active',
    cinDate: '05/05/2008',
    udyam: 'UDYAM-TN-02-0091823',
    udyamCategory: 'Large Enterprise',
    udyamSector: 'Pumps & Fluid Control',
    consistencyScore: 71.2,
    turnover: '₹22.50 Crores',
    turnoverNumeric: 225000000,
    turnoverUdin: '24088190AAAA5521',
    turnoverStatus: 'QUALIFIED',
    localContentPercent: 54.0,
    localContentStatus: 'CLASS_I',
    emdAmount: '₹36.80 Lakhs (e-PBG)',
    emdStatus: 'VERIFIED SFMS',
    emdBank: 'HDFC Bank Chennai Sector 4',
    oemAuth: 'Direct OEM Facilities',
    oemStatus: 'VALIDATED',
    integrityPact: 'Signed with Digital Token',
    integrityStatus: 'SIGNED & ATTESTED',
    complianceStatus: 'WARN',
    riskScore: 74,
    riskLevel: 'HIGH',
    officerDecision: 'PENDING',
    findings: [],
    documents: [],
  },
  {
    id: 'BID-ZEN-0899',
    code: 'Bidder E',
    tenderId: 'CPCL-PUMP-217',
    legalName: 'Zenith Infra Tech Pvt Ltd',
    tradeName: 'Zenith EPC Solutions',
    tag: 'National Debarment & Sanctions',
    pan: 'AABCZ9911Z',
    panStatus: 'NSDL Cancelled / Flagged',
    panMatch: 'Debarment Hit',
    gstin: '07AABCZ9911Z1Z4',
    gstinStatus: 'Suo-Moto Cancelled (Delhi)',
    gstinMismatchNote: 'CPPP National Debarment list hit under GFR Rule 151(iii) for fraudulent documentation in IOCL Vadodara tender.',
    cin: 'U45200DL2019PTC345678',
    cinStatus: 'Strike-Off Notice Issued',
    cinDate: '19/09/2019',
    udyam: 'Not Available',
    udyamCategory: 'None',
    udyamSector: 'General Construction',
    consistencyScore: 34.0,
    turnover: '₹2.10 Crores',
    turnoverNumeric: 21000000,
    turnoverUdin: 'INVALID / FAKE UDIN',
    turnoverStatus: 'DEFICIT',
    localContentPercent: 15.0,
    localContentStatus: 'NON_LOCAL',
    emdAmount: 'Unverified Cheque / Fake BG',
    emdStatus: 'REJECTED SFMS',
    emdBank: 'Cooperative Bank (Unlisted)',
    oemAuth: 'Fake Certificate Template',
    oemStatus: 'REJECTED',
    integrityPact: 'Missing Stamp & Verification',
    integrityStatus: 'DEFECTIVE',
    complianceStatus: 'FAIL',
    riskScore: 95,
    riskLevel: 'HIGH',
    officerDecision: 'REJECT',
    officerJustification: 'Statutory disqualification executed under GFR 2017 Rule 151. Bidder is actively blacklisted on CPPP and GSTIN registration is cancelled.',
    findings: [],
    documents: [],
  },
];
