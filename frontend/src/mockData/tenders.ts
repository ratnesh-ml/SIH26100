export interface Tender {
  id: string;
  refNo: string;
  title: string;
  organization: string;
  department: string;
  estimatedValue: string;
  estimatedValueNumeric: number;
  stage: string;
  status: 'active' | 'completed' | 'clarification' | 'audit';
  bidderCount: number;
  progressPercent: number;
  riskSummary: { high: number; medium: number; low: number };
  closingDate: string;
  updatedAt: string;
  jurisdiction: string;
  category: string;
  description: string;
  rulesCount: number;
  emdRequired: string;
  turnoverRequired: string;
  localContentRequired: string;
}

export const MOCK_TENDERS: Tender[] = [
  {
    id: 'CPCL-PUMP-217',
    refNo: 'CPCL/MM/2026/PUMP-217',
    title: 'API-610 Centrifugal Process Pumps',
    organization: 'CPCL',
    department: 'Manali Refinery Procurement Cell',
    estimatedValue: '₹18.40 Crores',
    estimatedValueNumeric: 184000000,
    stage: 'Technical Scrutiny & Adjudication',
    status: 'active',
    bidderCount: 5,
    progressPercent: 78,
    riskSummary: { high: 2, medium: 1, low: 2 },
    closingDate: '15-Mar-2026',
    updatedAt: 'Today, 11:28 IST',
    jurisdiction: 'Chennai, Tamil Nadu',
    category: 'Mechanical High-Pressure Package',
    description: 'Supply, inspection, testing, and commissioning of 12 API-610 (11th Edition) Between-Bearings Centrifugal Process Pumps for Crude Distillation Unit (CDU-II) Expansion.',
    rulesCount: 34,
    emdRequired: '₹36.80 Lakhs (2.0%)',
    turnoverRequired: '₹5.52 Crores (30% GFR Rule 161)',
    localContentRequired: '≥ 50.0% Class-I Local Supplier (PPP-MII 2017)',
  },
  {
    id: 'IOCL-VALVE-881',
    refNo: 'IOCL/ENG/2026/VALVE-881',
    title: 'High Pressure Gate & Globe Valves',
    organization: 'IOCL',
    department: 'Panipat Refinery Engineering Division',
    estimatedValue: '₹12.60 Crores',
    estimatedValueNumeric: 126000000,
    stage: 'Financial Bid Opening',
    status: 'active',
    bidderCount: 6,
    progressPercent: 92,
    riskSummary: { high: 0, medium: 2, low: 4 },
    closingDate: '22-Mar-2026',
    updatedAt: 'Today, 09:15 IST',
    jurisdiction: 'Panipat, Haryana',
    category: 'Piping & Metallurgy',
    description: 'Forged carbon and alloy steel high-pressure gate and globe valves conforming to API-600/API-602 specifications for hydrocracker unit.',
    rulesCount: 28,
    emdRequired: '₹25.20 Lakhs (2.0%)',
    turnoverRequired: '₹3.78 Crores (30%)',
    localContentRequired: '≥ 50.0% Class-I Local Supplier',
  },
  {
    id: 'ONGC-DRILL-104',
    refNo: 'ONGC/OFF/2026/DRILL-104',
    title: 'Subsea Wellhead Trees & Workover Systems',
    organization: 'ONGC',
    department: 'Offshore Engineering Services (KG Basin)',
    estimatedValue: '₹45.00 Crores',
    estimatedValueNumeric: 450000000,
    stage: 'Technical Clarification',
    status: 'clarification',
    bidderCount: 4,
    progressPercent: 45,
    riskSummary: { high: 1, medium: 2, low: 1 },
    closingDate: '30-Mar-2026',
    updatedAt: 'Yesterday, 17:40 IST',
    jurisdiction: 'Kakinada, Andhra Pradesh',
    category: 'Subsea Deepwater Package',
    description: 'KG-DWN-98/2 deepwater package high-pressure 15k PSI subsea trees with electro-hydraulic control pods and intervention riser systems.',
    rulesCount: 42,
    emdRequired: '₹90.00 Lakhs (2.0%)',
    turnoverRequired: '₹13.50 Crores (30%)',
    localContentRequired: '≥ 20.0% Class-II Local Supplier',
  },
  {
    id: 'GAIL-COMP-412',
    refNo: 'GAIL/PIPE/2026/COMP-412',
    title: 'High-Efficiency Gas Turbine Compressors',
    organization: 'GAIL',
    department: 'National Gas Pipeline Projects',
    estimatedValue: '₹28.75 Crores',
    estimatedValueNumeric: 287500000,
    stage: 'Pre-Award Audit',
    status: 'audit',
    bidderCount: 3,
    progressPercent: 88,
    riskSummary: { high: 0, medium: 1, low: 2 },
    closingDate: '10-Apr-2026',
    updatedAt: '03-Sep-2026, 14:10 IST',
    jurisdiction: 'New Delhi / Vijaipur',
    category: 'Turbomachinery',
    description: 'Multi-stage centrifugal gas pipeline booster compressors powered by industrial gas turbines for Urja Ganga Gas Pipeline expansion.',
    rulesCount: 36,
    emdRequired: '₹57.50 Lakhs (2.0%)',
    turnoverRequired: '₹8.62 Crores (30%)',
    localContentRequired: '≥ 50.0% Class-I Local Supplier',
  },
];
