export interface RiskFactor {
  name: string;
  ruleClause: string;
  points: number;
  maxWeight: number;
  color: string;
  description: string;
  percentage: number;
}

export interface RiskSignal {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  category: string;
  ruleId: string;
  impactScore: string;
  description: string;
  evidenceRef: string;
}

export interface BidderRiskProfile {
  bidderId: string;
  compositeScore: number;
  band: 'LOW' | 'MEDIUM' | 'HIGH';
  heuristicLevel: string;
  factors: RiskFactor[];
  signals: RiskSignal[];
  vectorTelemetry: {
    identityDiscordance: number;
    financialShortfall: number;
    localContentGap: number;
    documentIntegrityAnomalies: number;
    networkClusterRisk: number;
  };
}

export const MOCK_RISK_PROFILES: Record<string, BidderRiskProfile> = {
  'BID-HYD-0419': {
    bidderId: 'BID-HYD-0419',
    compositeScore: 65,
    band: 'HIGH',
    heuristicLevel: 'LEVEL 3 HEURISTIC',
    factors: [
      {
        name: 'Identity Inconsistency',
        ruleClause: 'Rule #GFR-144-C',
        points: 35,
        maxWeight: 50,
        color: '#f43f5e',
        percentage: 53.8,
        description: 'PAN string mismatch between Form GST REG-06 and CBDT card',
      },
      {
        name: 'Compliance Gap',
        ruleClause: 'Rule #MII-PPO-2017',
        points: 25,
        maxWeight: 50,
        color: '#f59e0b',
        percentage: 38.5,
        description: 'Make In India local content 45.0% vs required 50.0% Class-I benchmark',
      },
      {
        name: 'Financial Factor Baseline',
        ruleClause: 'Rule #GFR-161',
        points: 5,
        maxWeight: 20,
        color: '#3b82f6',
        percentage: 7.7,
        description: 'Routine turnover check and verification baseline',
      },
    ],
    signals: [
      {
        id: 'SIG-01',
        severity: 'CRITICAL',
        title: 'Hard Entity Contradiction in Form GST REG-06',
        category: 'Tax & Entity Identity',
        ruleId: 'CPCL-GOODS-002',
        impactScore: '+35 pts',
        description: 'GSTIN state prefix 33-TN vs ROC registered corporate state 27-MH; characters 3-12 embed PAN AAACB9999F instead of AAACB1234F.',
        evidenceRef: 'gst_reg06.pdf • Page 1',
      },
      {
        id: 'SIG-02',
        severity: 'HIGH',
        title: 'Class-I Local Value-Addition Shortfall (5.0% Deficit)',
        category: 'PPP-MII 2017 Directive',
        ruleId: 'CPCL-GOODS-003',
        impactScore: '+25 pts',
        description: 'Declared domestic content is 45.0%, disqualifying bidder from mandatory Class-I domestic purchase preference under GFR Rule 153.',
        evidenceRef: 'local_content.pdf • Page 1',
      },
      {
        id: 'SIG-03',
        severity: 'MEDIUM',
        title: 'Author Timestamp vs Signing Timestamp Delta',
        category: 'Document Forensics',
        ruleId: 'CPCL-GOODS-007',
        impactScore: '+5 pts',
        description: 'PDF metadata indicates creation 48 minutes postdating the embedded CA digital signature timestamp.',
        evidenceRef: 'turnover_ca.pdf • Page 2',
      },
      {
        id: 'SIG-04',
        severity: 'MEDIUM',
        title: 'Director Link to Dormant Entity in Pune ROC',
        category: 'Corporate Registry',
        ruleId: 'MCA21-CROSS-01',
        impactScore: '+0 pts',
        description: 'Director DIN-08192341 linked to struck-off entity Hydrotech Valves LLP (No active vigilance bar).',
        evidenceRef: 'MCA-21 Gateway Record',
      },
    ],
    vectorTelemetry: {
      identityDiscordance: 70,
      financialShortfall: 25,
      localContentGap: 50,
      documentIntegrityAnomalies: 35,
      networkClusterRisk: 15,
    },
  },
};
