// frontend/lib/types.ts

export interface Policy {
  id: string;
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  cloud: string;
  category: string;
  description: string;
  fix: string;
  risk: string;
  remediation: string;
}

export interface Violation {
  id: string;
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  cloud: string;
  category: string;
  line: number;
  code: string;
  context: string;
  resource: string;
  message: string;
  fix: string;
  remediation: string;
}

export interface ScanResult {
  id: string;
  filename: string;
  cloud: string;
  timestamp: string;
  status: 'passed' | 'failed';
  violations: Violation[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  engine: 'built-in' | 'checkov';
  source: 'WEB' | 'WEBHOOK' | 'CLI';
  branch?: string;
  pusher?: string;
}

export interface TrendPoint {
  date: string;
  scans: number;
  passed: number;
  failed: number;
  violations: number;
}

export interface TopViolated {
  id: string;
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  hits: number;
}

export interface Stats {
  total_scans: number;
  passed_scans: number;
  failed_scans: number;
  critical_violations: number;
  high_violations: number;
  medium_violations: number;
  low_violations: number;
  total_violations: number;
  policies_active: number;
  trend: TrendPoint[];
  top_violated: TopViolated[];
}
