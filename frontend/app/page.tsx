'use client';
import React, { useEffect, useState } from 'react';
import { LayoutWrapper } from '../components/layout-wrapper';
import { getStats, getHistory } from '../lib/api';
import { Stats, ScanResult } from '../lib/types';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Play,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      try {
        const statsData = await getStats();
        setStats(statsData);
        const historyData = await getHistory('all', 1, 5);
        setRecentScans(historyData.scans);
      } catch (err) {
        console.error('Error loading overview data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    
    // Poll stats every 10 seconds for real-time update
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <LayoutWrapper title="Overview" subtitle="Real-time security policy enforcement across cloud infrastructure">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
          <div style={{ fontSize: '1.2rem', color: 'var(--muted)' }}>Loading PolicySync metrics...</div>
        </div>
      </LayoutWrapper>
    );
  }

  const passRate = ((stats.passed_scans / stats.total_scans) * 100).toFixed(1);
  const failRate = ((stats.failed_scans / stats.total_scans) * 100).toFixed(1);

  // Pie chart data
  const pieData = [
    { name: 'Critical', value: stats.critical_violations, color: '#ef4444' },
    { name: 'High', value: stats.high_violations, color: '#f59e0b' },
    { name: 'Medium', value: stats.medium_violations, color: '#3b82f6' },
    { name: 'Low', value: stats.low_violations, color: '#6b7280' },
  ].filter(d => d.value > 0);

  return (
    <LayoutWrapper title="Overview" subtitle="Real-time security policy enforcement across your cloud infrastructure">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Stats Cards */}
        <section className="grid-cols-4">
          <div className="card stat-card primary">
            <div className="stat-header">
              <span>Total Scans</span>
              <Activity size={16} />
            </div>
            <div className="stat-value">{stats.total_scans.toLocaleString()}</div>
            <div className="stat-sub">
              <span className="trend-up" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <TrendingUp size={12} /> +18.6%
              </span>
              <span>vs last 7 days</span>
            </div>
          </div>

          <div className="card stat-card success">
            <div className="stat-header">
              <span>Passed</span>
              <ShieldCheck size={16} />
            </div>
            <div className="stat-value">{stats.passed_scans.toLocaleString()}</div>
            <div className="stat-sub">
              <span className="trend-up">{passRate}% pass rate</span>
            </div>
          </div>

          <div className="card stat-card danger">
            <div className="stat-header">
              <span>Failed</span>
              <ShieldAlert size={16} />
            </div>
            <div className="stat-value">{stats.failed_scans.toLocaleString()}</div>
            <div className="stat-sub">
              <span className="trend-down">{failRate}% require remediation</span>
            </div>
          </div>

          <div className="card stat-card warning">
            <div className="stat-header">
              <span>Violations Found</span>
              <AlertTriangle size={16} />
            </div>
            <div className="stat-value">{stats.total_violations.toLocaleString()}</div>
            <div className="stat-sub">
              <span>across 18 active rules</span>
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section className="grid-cols-3">
          {/* Trend Chart (Span 2) */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: 600 }}>Scan Trend</h3>
            <div style={{ width: '100%', height: '260px' }}>
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.trend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} />
                    <YAxis stroke="var(--muted)" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-soft)', borderColor: 'var(--panel-border)' }}
                      labelStyle={{ color: 'var(--text)', fontWeight: 'bold' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="scans" stroke="#8884d8" name="Total Scans" strokeWidth={2} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="violations" stroke="#ef4444" name="Violations" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Violations by Severity Chart */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyItems: 'center' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: 600 }}>Violations by Severity</h3>
            <div style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {mounted && pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-soft)', borderColor: 'var(--panel-border)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No violations found</div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '12px' }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }}></div>
                  <span style={{ color: 'var(--muted)' }}>{d.name}:</span>
                  <strong style={{ marginLeft: 'auto' }}>{d.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Data Tables */}
        <section className="grid-cols-2">
          {/* Recent Scans */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Scans</h3>
              <a href="/history" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none' }}>
                View all <ArrowRight size={14} />
              </a>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Violations</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.map((scan) => (
                    <tr key={scan.id}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} className="text-muted" />
                        <span style={{ fontWeight: 500 }}>{scan.filename}</span>
                      </td>
                      <td>
                        <span className="badge badge-medium">{scan.cloud}</span>
                      </td>
                      <td>
                        <span className={`badge ${scan.status === 'passed' ? 'badge-passed' : 'badge-failed'}`}>
                          {scan.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {scan.status === 'passed' ? '0' : scan.violations.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Violated Policies */}
          <div className="card">
            <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: 600 }}>Top Violated Policies</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Policy</th>
                    <th>ID</th>
                    <th>Severity</th>
                    <th>Hits</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_violated.map((policy) => (
                    <tr key={policy.id}>
                      <td style={{ fontWeight: 500 }}>{policy.name}</td>
                      <td><code>{policy.id}</code></td>
                      <td>
                        <span className={`badge badge-${policy.severity.toLowerCase()}`}>
                          {policy.severity}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--error)' }}>{policy.hits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </LayoutWrapper>
  );
}
