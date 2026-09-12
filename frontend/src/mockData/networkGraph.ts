export interface GraphNode {
  id: string;
  label: string;
  type: 'bidder' | 'director' | 'address' | 'ip' | 'bank';
  category: 'SUSPICIOUS' | 'CLEAN' | 'NEUTRAL';
  x: number;
  y: number;
  bidderCode?: string;
  details?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
  type: 'director_overlap' | 'contact_collision' | 'subnet_cluster' | 'bank_share';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const MOCK_GRAPH_NODES: GraphNode[] = [
  // Bidders
  { id: 'b_hyd', label: 'Bharat Hydrotech Corp', type: 'bidder', category: 'SUSPICIOUS', x: 260, y: 220, bidderCode: 'Bidder C', details: 'High risk (65/100), GSTIN mismatch' },
  { id: 'b_nov', label: 'Nova Pumps & Systems', type: 'bidder', category: 'SUSPICIOUS', x: 540, y: 200, bidderCode: 'Bidder D', details: 'High risk (74/100), GIMP metadata delta' },
  { id: 'b_zen', label: 'Zenith Infra Tech', type: 'bidder', category: 'SUSPICIOUS', x: 400, y: 440, bidderCode: 'Bidder E', details: 'Debarred on CPPP, cancelled GSTIN' },
  { id: 'b_mer', label: 'Meridian Flow Systems', type: 'bidder', category: 'CLEAN', x: 120, y: 380, bidderCode: 'Bidder A', details: 'Clean baseline (12/100), Class-I 68%' },
  { id: 'b_kav', label: 'Sri Kaveri Engineering', type: 'bidder', category: 'CLEAN', x: 680, y: 380, bidderCode: 'Bidder B', details: 'MSE Micro exempt (28/100)' },

  // Shared Entities
  { id: 'd_aggarwal', label: 'R.K. Aggarwal (DIN: 08192341)', type: 'director', category: 'SUSPICIOUS', x: 400, y: 280, details: 'Common Director / Signatory linking Bidder C and Bidder D' },
  { id: 'ip_subnet', label: 'Subnet 192.168.44.102', type: 'ip', category: 'SUSPICIOUS', x: 380, y: 150, details: 'Identical ISP submission timestamp (within 4 mins)' },
  { id: 'bank_pune', label: 'SBI Pune Ind. Branch', type: 'bank', category: 'NEUTRAL', x: 220, y: 330, details: 'Bank Guarantee issuer for Bidder C' },
  { id: 'addr_pune', label: 'Plot 44, MIDC Bhosari, Pune', type: 'address', category: 'SUSPICIOUS', x: 470, y: 360, details: 'Shared registered commercial office premises' },
];

export const MOCK_GRAPH_LINKS: GraphLink[] = [
  { source: 'b_hyd', target: 'd_aggarwal', label: 'Common Director', type: 'director_overlap', severity: 'HIGH' },
  { source: 'b_nov', target: 'd_aggarwal', label: 'Past Shareholder (40%)', type: 'director_overlap', severity: 'HIGH' },
  { source: 'b_hyd', target: 'ip_subnet', label: 'IP Collision (GeM portal)', type: 'subnet_cluster', severity: 'HIGH' },
  { source: 'b_nov', target: 'ip_subnet', label: 'IP Collision (GeM portal)', type: 'subnet_cluster', severity: 'HIGH' },
  { source: 'b_hyd', target: 'addr_pune', label: 'Registered Premises', type: 'contact_collision', severity: 'MEDIUM' },
  { source: 'b_zen', target: 'addr_pune', label: 'Prior Billing Address', type: 'contact_collision', severity: 'HIGH' },
  { source: 'b_hyd', target: 'bank_pune', label: 'Issued SFMS BG', type: 'bank_share', severity: 'LOW' },
];
