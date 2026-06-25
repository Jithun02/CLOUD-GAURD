'use client';
import React, { useState, useEffect } from 'react';
import { LayoutWrapper } from '../../components/layout-wrapper';
import { getHistory } from '../../lib/api';
import { ScanResult } from '../../lib/types';
import {
  Clock,
  ShieldCheck,
  ShieldAlert,
  GitPullRequest,
  ChevronDown,
  ChevronUp,
  FileCode,
} from 'lucide-react';

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [expandedScanId, setExpandedScanId] = useState<string | null>(null);

  const limit = 10;

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      try {
        const data = await getHistory(statusFilter, page, limit);
        setScans(data.scans);
        setTotal(data.total);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [statusFilter, page]);

  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter);
    setPage(1);
    setExpandedScanId(null);
  };

  const toggleScanExpand = (id: string) => {
    setExpandedScanId(expandedScanId === id ? null : id);
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      // If mock date, return simplified
      if (isoString.includes('2026-06-25T08:30:00Z')) return '5m ago';
      if (isoString.includes('2026-06-25T08:15:00Z')) return '20m ago';
      if (isoString.includes('2026-06-25T07:45:00Z')) return '50m ago';
      if (isoString.includes('2026-06-25T07:30:00Z')) return '1h ago';
      return date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <LayoutWrapper title="Scan History" subtitle="Audit log of all manual and automated infrastructure security scans">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Status Filters */}
        <div className="card" style={{ padding: '16px', display: 'flex', gap: '8px' }}>
          {['all', 'passed', 'failed'].map((st) => (
            <button
              key={st}
              className={`btn btn-secondary ${statusFilter === st ? 'active' : ''}`}
              style={{
                padding: '6px 16px',
                fontSize: '0.8rem',
                background: statusFilter === st ? 'rgba(6,182,212,0.15)' : '',
                borderColor: statusFilter === st ? 'var(--accent)' : '',
                color: statusFilter === st ? 'var(--text)' : '',
              }}
              onClick={() => handleFilterChange(st)}
            >
              {st.toUpperCase()}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--muted)' }}>
            <span>Total: <strong>{total} scans</strong></span>
          </div>
        </div>

        {/* History List */}
        {loading ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
            Loading audit log history...
          </div>
        ) : scans.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
            No scans match the current filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {scans.map((scan) => {
              const isExpanded = expandedScanId === scan.id;
              return (
                <div
                  key={scan.id}
                  style={{
                    border: '1px solid var(--panel-border)',
                    background: 'var(--panel)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Row Header */}
                  <div
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleScanExpand(scan.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexGrow: 1 }}>
                      {scan.status === 'passed' ? (
                        <ShieldCheck size={22} style={{ color: 'var(--success)' }} />
                      ) : (
                        <ShieldAlert size={22} style={{ color: 'var(--error)' }} />
                      )}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '0.95rem' }}>{scan.filename}</strong>
                          {scan.source === 'WEBHOOK' && (
                            <span className="badge badge-webhook" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                              Webhook
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span>Cloud: <strong>{scan.cloud}</strong></span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {formatTime(scan.timestamp)}
                          </span>
                          {scan.branch && (
                            <>
                              <span>•</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <GitPullRequest size={12} /> {scan.branch}
                              </span>
                            </>
                          )}
                          {scan.pusher && (
                            <>
                              <span>•</span>
                              <span>Pushed by: <strong>{scan.pusher}</strong></span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {scan.status === 'passed' ? (
                        <span className="badge badge-passed">PASSED</span>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {scan.summary.critical > 0 && (
                            <span className="badge badge-critical" style={{ fontSize: '0.7rem' }}>
                              {scan.summary.critical} CRIT
                            </span>
                          )}
                          {scan.summary.high > 0 && (
                            <span className="badge badge-high" style={{ fontSize: '0.7rem' }}>
                              {scan.summary.high} HIGH
                            </span>
                          )}
                        </div>
                      )}
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Expanded Violation Details */}
                  {isExpanded && (
                    <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                      {scan.violations.length === 0 ? (
                        <div style={{ padding: '16px 0', color: 'var(--success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ShieldCheck size={16} /> Scan passed with 0 security findings.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                            Security Findings Details ({scan.violations.length})
                          </h4>
                          {scan.violations.map((v, index) => (
                            <div
                              key={index}
                              style={{
                                border: '1px solid rgba(255,255,255,0.05)',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '8px',
                                padding: '12px 16px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span className={`badge badge-${v.severity.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                                    {v.severity}
                                  </span>
                                  <strong style={{ fontSize: '0.85rem' }}>{v.id}: {v.name}</strong>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Line {v.line}</span>
                              </div>
                              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '8px' }}>{v.message}</p>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                                  Resource Context: <code>{v.resource}</code>
                                </div>
                                <pre className="code-block" style={{ fontSize: '0.7rem', margin: '4px 0' }}>
                                  {v.context}
                                </pre>
                                <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '6px', padding: '8px 12px', fontSize: '0.75rem', color: '#c4b5fd', marginTop: '4px' }}>
                                  <strong>How to Fix:</strong> {v.fix}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
              Page <strong>{page}</strong> of {totalPages}
            </span>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}

      </div>
    </LayoutWrapper>
  );
}
