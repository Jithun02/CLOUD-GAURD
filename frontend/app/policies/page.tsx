'use client';
import React, { useState, useEffect } from 'react';
import { LayoutWrapper } from '../../components/layout-wrapper';
import { getPolicies } from '../../lib/api';
import { Policy } from '../../lib/types';
import { ShieldCheck, Search, Filter, HelpCircle, AlertTriangle } from 'lucide-react';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCloud, setSelectedCloud] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  useEffect(() => {
    async function loadPolicies() {
      try {
        const data = await getPolicies();
        setPolicies(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPolicies();
  }, []);

  const clouds = ['all', 'AWS', 'GCP', 'Azure', 'Kubernetes'];
  const severities = ['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const filteredPolicies = policies.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCloud = selectedCloud === 'all' || p.cloud.toLowerCase() === selectedCloud.toLowerCase();
    const matchesSeverity = selectedSeverity === 'all' || p.severity.toUpperCase() === selectedSeverity.toUpperCase();
    return matchesSearch && matchesCloud && matchesSeverity;
  });

  return (
    <LayoutWrapper title="Policies" subtitle="Browsable security policy library covering AWS, GCP, Azure, and Kubernetes">
      <div style={{ display: 'grid', gridTemplateColumns: selectedPolicy ? '1.5fr 1fr' : '1fr', gap: '24px', transition: 'all 0.3s ease' }}>
        
        {/* Main List Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Filters Bar */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
            
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '6px 12px', width: '250px' }}>
              <Search size={16} className="text-muted" />
              <input
                type="text"
                placeholder="Search policies..."
                style={{ background: 'none', border: 'none', color: 'white', outline: 'none', fontSize: '0.85rem', width: '100%' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Cloud Filter */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Cloud:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {clouds.map((c) => (
                  <button
                    key={c}
                    className={`btn btn-secondary ${selectedCloud === c ? 'active' : ''}`}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      background: selectedCloud === c ? 'rgba(6,182,212,0.15)' : '',
                      borderColor: selectedCloud === c ? 'var(--accent)' : '',
                      color: selectedCloud === c ? 'var(--text)' : '',
                    }}
                    onClick={() => setSelectedCloud(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Filter */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Severity:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {severities.map((s) => (
                  <button
                    key={s}
                    className={`btn btn-secondary ${selectedSeverity === s ? 'active' : ''}`}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      background: selectedSeverity === s ? 'rgba(6,182,212,0.15)' : '',
                      borderColor: selectedSeverity === s ? 'var(--accent)' : '',
                      color: selectedSeverity === s ? 'var(--text)' : '',
                    }}
                    onClick={() => setSelectedSeverity(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Table list */}
          <div className="card">
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Loading rules...</div>
            ) : (
              <div className="table-container" style={{ marginTop: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rule ID</th>
                      <th>Rule Name</th>
                      <th>Cloud</th>
                      <th>Severity</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPolicies.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPolicy(p)}
                        style={{ cursor: 'pointer', background: selectedPolicy?.id === p.id ? 'rgba(6,182,212,0.05)' : '' }}
                      >
                        <td><code>{p.id}</code></td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td><span className="badge badge-medium">{p.cloud}</span></td>
                        <td>
                          <span className={`badge badge-${p.severity.toLowerCase()}`}>
                            {p.severity}
                          </span>
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{p.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Details Column (Visible only when policy clicked) */}
        {selectedPolicy && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px', alignSelf: 'start', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code>{selectedPolicy.id}</code>
                <span className={`badge badge-${selectedPolicy.severity.toLowerCase()}`}>
                  {selectedPolicy.severity}
                </span>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                onClick={() => setSelectedPolicy(null)}
              >
                Close
              </button>
            </div>

            <div>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{selectedPolicy.name}</h2>
              <span className="badge badge-medium">{selectedPolicy.cloud}</span> • <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{selectedPolicy.category}</span>
            </div>

            <hr style={{ border: 'none', borderBottom: '1px solid var(--panel-border)' }} />

            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>Description</h4>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{selectedPolicy.description}</p>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>Real-World Risk</h4>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: '#fca5a5' }}>{selectedPolicy.risk}</p>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--success)', marginBottom: '4px' }}>Standard Fix</h4>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: '#c7d2fe', fontStyle: 'italic' }}>{selectedPolicy.fix}</p>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>Detailed Remediation Guide</h4>
              <pre className="code-block" style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap', background: '#040914', border: '1px solid rgba(255,255,255,0.05)', color: '#a78bfa' }}>
                {selectedPolicy.remediation}
              </pre>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>Compliance Mappings</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span className="badge badge-medium" style={{ fontSize: '0.7rem' }}>CWE Mapped</span>
                <span className="badge badge-medium" style={{ fontSize: '0.7rem' }}>CIS Benchmark</span>
                <span className="badge badge-medium" style={{ fontSize: '0.7rem' }}>NIST 800-53</span>
                <span className="badge badge-medium" style={{ fontSize: '0.7rem' }}>SOC 2 Type II</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </LayoutWrapper>
  );
}
