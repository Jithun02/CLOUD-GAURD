'use client';
import React, { useState } from 'react';
import { LayoutWrapper } from '../../components/layout-wrapper';
import { Download, CheckCircle, XCircle, Award, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function ReportsPage() {
  const [downloading, setDownloading] = useState(false);

  const complianceScores = [
    { name: 'CIS AWS Foundations', score: 85, passed: 12, total: 14 },
    { name: 'NIST SP 800-53', score: 78, passed: 10, total: 13 },
    { name: 'SOC 2 Type II', score: 90, passed: 13, total: 14 },
    { name: 'GDPR Compliance', score: 95, passed: 14, total: 15 }
  ];

  const radarData = [
    { subject: 'Access Control', A: 90, fullMark: 100 },
    { subject: 'Data Encryption', A: 80, fullMark: 100 },
    { subject: 'Network Security', A: 85, fullMark: 100 },
    { subject: 'Logging & Audit', A: 78, fullMark: 100 },
    { subject: 'Container Security', A: 92, fullMark: 100 },
    { subject: 'Password Policy', A: 95, fullMark: 100 }
  ];

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      // Trigger fake pdf download
      const element = document.createElement("a");
      const file = new Blob(["Mock PolicySync Compliance Report PDF Content"], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = "policysync-compliance-report.pdf";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 1200);
  };

  return (
    <LayoutWrapper title="Compliance Reports" subtitle="Visualize regulatory framework alignments and download compliance audits">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Top Report Header Bar */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Award size={22} className="text-accent" />
            <div>
              <strong style={{ fontSize: '0.95rem', display: 'block' }}>Compliance Summary Audit</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Report generated on 2026-06-25. Valid for current commit hash.</span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleDownload} disabled={downloading}>
            <Download size={16} /> {downloading ? 'Downloading...' : 'Export PDF Report'}
          </button>
        </div>

        {/* Score Dials / Chart split */}
        <section className="grid-cols-3">
          {/* Radar Chart (Span 2) */}
          <div className="card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, alignSelf: 'start', marginBottom: '16px' }}>Compliance Categories</h3>
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" stroke="var(--muted)" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.2)" fontSize={9} />
                  <Radar name="Compliance" dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scores Overview */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Framework Scores</h3>
            <hr style={{ border: 'none', borderBottom: '1px solid var(--panel-border)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {complianceScores.map((score, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <strong>{score.name}</strong>
                    <span style={{ fontWeight: 'bold', color: score.score >= 85 ? 'var(--success)' : 'var(--warning)' }}>{score.score}%</span>
                  </div>
                  {/* Progress Bar */}
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score.score}%`, background: score.score >= 85 ? 'var(--success)' : 'var(--warning)', borderRadius: '3px' }}></div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                    {score.passed} of {score.total} policies passing
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Standards checklist */}
        <section className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Standards Checklist</h3>
          <div className="table-container" style={{ marginTop: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Standard Code</th>
                  <th>Description</th>
                  <th>Mapped Policies</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>CIS AWS v1.2 (Section 1.1)</strong></td>
                  <td>Ensure no credentials exist in code manifests or public repos</td>
                  <td><code>AWS-001</code></td>
                  <td><span className="badge badge-failed" style={{ gap: '4px' }}><XCircle size={12} /> Failed</span></td>
                </tr>
                <tr>
                  <td><strong>CIS AWS v1.2 (Section 2.1)</strong></td>
                  <td>Ensure S3 buckets have public access block configured</td>
                  <td><code>AWS-002</code></td>
                  <td><span className="badge badge-failed" style={{ gap: '4px' }}><XCircle size={12} /> Failed</span></td>
                </tr>
                <tr>
                  <td><strong>NIST SP 800-53 (AC-4)</strong></td>
                  <td>Enforce secure information flow boundary and restrict open security groups</td>
                  <td><code>AWS-003</code>, <code>GCP-001</code></td>
                  <td><span className="badge badge-passed" style={{ gap: '4px' }}><CheckCircle size={12} /> Passed</span></td>
                </tr>
                <tr>
                  <td><strong>NIST SP 800-53 (SC-28)</strong></td>
                  <td>Ensure storage services are encrypted at rest</td>
                  <td><code>AWS-007</code>, <code>AZ-001</code></td>
                  <td><span className="badge badge-passed" style={{ gap: '4px' }}><CheckCircle size={12} /> Passed</span></td>
                </tr>
                <tr>
                  <td><strong>SOC 2 Type II (CC6.1)</strong></td>
                  <td>Validate firewall and boundary security parameters</td>
                  <td><code>AWS-003</code>, <code>AZ-003</code></td>
                  <td><span className="badge badge-passed" style={{ gap: '4px' }}><CheckCircle size={12} /> Passed</span></td>
                </tr>
                <tr>
                  <td><strong>GDPR (Article 32)</strong></td>
                  <td>Security of processing container configuration validations</td>
                  <td><code>K8S-001</code>, <code>K8S-002</code></td>
                  <td><span className="badge badge-failed" style={{ gap: '4px' }}><XCircle size={12} /> Failed</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </LayoutWrapper>
  );
}
