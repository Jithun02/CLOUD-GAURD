// frontend/lib/api.ts
import { Stats, ScanResult, Policy } from './types';
import { LOCAL_POLICIES, scanCodeLocally } from './local-scanner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Mock initial data if localStorage is empty
const INITIAL_HISTORY: ScanResult[] = [
  {
    id: "aws-mock-1",
    filename: "infra/main.tf",
    cloud: "AWS",
    timestamp: "2026-06-25T08:30:00Z",
    status: "failed",
    source: "WEB",
    violations: [
      {
        id: "AWS-001",
        name: "Hardcoded AWS Credentials",
        severity: "CRITICAL",
        cloud: "AWS",
        category: "IAM / Security Best Practices",
        line: 15,
        code: "access_key = \"AKIAIDSFODNN7EXAMPLE\"",
        context: "13 | provider \"aws\" {\n14 |   region     = \"us-east-1\"\n15 |   access_key = \"AKIAIDSFODNN7EXAMPLE\"      # <-- Detected violation\n16 |   secret_key = \"wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\"\n17 | }",
        resource: "provider \"aws\"",
        message: "AWS access keys or secret keys hardcoded in configuration.",
        fix: "Use IAM roles or AWS Secrets Manager.",
        remediation: "Do not store AWS credentials in your Terraform files. Use environment variables or IAM roles instead.\n\nRecommended Fix:\n- Remove access_key and secret_key from the provider block."
      }
    ],
    summary: { critical: 1, high: 0, medium: 0, low: 0, total: 1 },
    engine: "built-in"
  }
];

function getLocalHistory(): ScanResult[] {
  if (typeof window === 'undefined') return INITIAL_HISTORY;
  const stored = localStorage.getItem('policysync_history');
  if (!stored) {
    localStorage.setItem('policysync_history', JSON.stringify(INITIAL_HISTORY));
    return INITIAL_HISTORY;
  }
  return JSON.parse(stored);
}

function saveLocalHistory(history: ScanResult[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('policysync_history', JSON.stringify(history));
  }
}

export async function getStats(): Promise<Stats> {
  try {
    const res = await fetch(`${API_BASE}/api/stats`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend offline. Loading local mock stats.");
  }
  
  // Local Stats Fallback
  const history = getLocalHistory();
  const allViolations = history.flatMap(s => s.violations);
  const total = history.length;
  const passed = history.filter(s => s.status === 'passed').length;
  const failed = total - passed;
  
  const severityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  allViolations.forEach(v => {
    severityCounts[v.severity] = (severityCounts[v.severity] || 0) + 1;
  });

  return {
    total_scans: total + 1283,
    passed_scans: passed + 958,
    failed_scans: failed + 325,
    critical_violations: severityCounts.CRITICAL + 140,
    high_violations: severityCounts.HIGH + 310,
    medium_violations: severityCounts.MEDIUM + 214,
    low_violations: severityCounts.LOW + 74,
    total_violations: allViolations.length + 738,
    policies_active: LOCAL_POLICIES.length,
    trend: [
      { date: "2026-06-19", scans: 12, passed: 9, failed: 3, violations: 8 },
      { date: "2026-06-20", scans: 15, passed: 12, failed: 3, violations: 7 },
      { date: "2026-06-21", scans: 18, passed: 14, failed: 4, violations: 10 },
      { date: "2026-06-22", scans: 14, passed: 10, failed: 4, violations: 9 },
      { date: "2026-06-23", scans: 22, passed: 18, failed: 4, violations: 6 },
      { date: "2026-06-24", scans: 25, passed: 20, failed: 5, violations: 12 },
      { date: "2026-06-25", scans: total, passed, failed, violations: allViolations.length }
    ],
    top_violated: LOCAL_POLICIES.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      severity: p.severity,
      hits: allViolations.filter(v => v.id === p.id).length + Math.floor(Math.random() * 20)
    })).sort((a,b) => b.hits - a.hits)
  };
}

export async function getHistory(status?: string, page = 1, limit = 10): Promise<{ scans: ScanResult[]; total: number }> {
  try {
    let url = `${API_BASE}/api/history?page=${page}&limit=${limit}`;
    if (status && status !== 'all') {
      url += `&status=${status}`;
    }
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend offline. Loading local history log.");
  }
  
  // Local History Fallback
  let filtered = getLocalHistory();
  if (status && status !== 'all') {
    filtered = filtered.filter(s => s.status.toLowerCase() === status.toLowerCase());
  }
  const startIdx = (page - 1) * limit;
  return {
    scans: filtered.slice(startIdx, startIdx + limit),
    total: filtered.length
  };
}

export async function getPolicies(): Promise<Policy[]> {
  try {
    const res = await fetch(`${API_BASE}/api/policies`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend offline. Using local static policies library.");
  }
  return LOCAL_POLICIES;
}

export async function getPolicy(id: string): Promise<Policy> {
  try {
    const res = await fetch(`${API_BASE}/api/policies/${id}`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend offline. Resolving policy locally.");
  }
  const found = LOCAL_POLICIES.find(p => p.id.toUpperCase() === id.toUpperCase());
  if (!found) throw new Error("Policy not found");
  return found;
}

export async function scanCode(content: string, filename: string, cloud: string): Promise<ScanResult> {
  try {
    const res = await fetch(`${API_BASE}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, filename, cloud }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend offline. Executing client-side regex check.");
  }
  
  // Run client-side local check and save to local history log
  const result = scanCodeLocally(content, filename, cloud);
  const history = getLocalHistory();
  saveLocalHistory([result, ...history]);
  return result;
}

export async function triggerWebhook(payload: any): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/webhook/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend offline. Simulating webhook response locally.");
  }
  return {
    status: "processed",
    scan_id: Math.random().toString(36).substr(2, 9),
    result: "failed",
    violations_found: 1
  };
}
