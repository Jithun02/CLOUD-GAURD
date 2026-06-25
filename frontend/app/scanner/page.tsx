'use client';
import React, { useState } from 'react';
import { LayoutWrapper } from '../../components/layout-wrapper';
import { scanCode } from '../../lib/api';
import { ScanResult } from '../../lib/types';
import {
  Play,
  ShieldAlert,
  ShieldCheck,
  Code2,
  FileCode,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const PRESETS = {
  aws_bad: {
    name: 'Bad AWS Config',
    filename: 'main.tf',
    cloud: 'AWS',
    code: `# DEMO FILE - AWS Security Violations
provider "aws" {
  region     = "us-east-1"
  access_key = "AKIAIDSFODNN7EXAMPLE" # AWS-001: Hardcoded credentials
  secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}

resource "aws_s3_bucket" "user_uploads" {
  bucket = "startup-user-uploads"
  acl    = "public-read" # AWS-002: Public bucket access
}

resource "aws_security_group" "allow_all" {
  name   = "allow-all"
  vpc_id = "vpc-12345"

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"] # AWS-003: Unrestricted ingress
  }
}

resource "aws_db_instance" "mydb" {
  allocated_storage   = 20
  engine              = "mysql"
  instance_class      = "db.t3.micro"
  username            = "admin"
  password            = "MyPassword123!" # AWS-006: Hardcoded password
  publicly_accessible = true # AWS-005: Public database
}`
  },
  aws_good: {
    name: 'Good AWS Config',
    filename: 'main-fixed.tf',
    cloud: 'AWS',
    code: `# DEMO FILE - Secure AWS Configuration
provider "aws" {
  region = "us-east-1"
  # Credentials loaded from environment or IAM profile
}

resource "aws_s3_bucket" "secure_uploads" {
  bucket = "startup-user-uploads-secured"
}

resource "aws_s3_bucket_public_access_block" "secure_block" {
  bucket = aws_s3_bucket.secure_uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_security_group" "restricted_sg" {
  name        = "restricted"
  description = "Allows access only to corporate subnet"
  vpc_id      = "vpc-12345"

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["192.168.1.0/24"] # Secure subnet restriction
  }
}`
  },
  k8s_bad: {
    name: 'Bad K8s Deployment',
    filename: 'payment-service.yaml',
    cloud: 'Kubernetes',
    code: `# DEMO FILE - Kubernetes Violations
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: payment-api
          image: payment-service:v1.2.0
          securityContext:
            privileged: true # K8S-002: Privileged container
            runAsNonRoot: false # K8S-001: Root container
            runAsUser: 0
          env:
            - name: STRIPE_API_KEY
              value: "sk_live_51NzABC123XYZ789" # K8S-003: Hardcoded secret`
  },
  k8s_good: {
    name: 'Good K8s Deployment',
    filename: 'payment-service-secure.yaml',
    cloud: 'Kubernetes',
    code: `# DEMO FILE - Secure Kubernetes Configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: payment-api
          image: payment-service:v1.2.0
          securityContext:
            privileged: false # Secure configuration
            runAsNonRoot: true
            runAsUser: 1000
          env:
            - name: STRIPE_API_KEY
              valueFrom:
                secretKeyRef:
                  name: payment-secrets
                  key: stripe-api-key`
  }
};

export default function ScannerPage() {
  const [code, setCode] = useState(PRESETS.aws_bad.code);
  const [filename, setFilename] = useState(PRESETS.aws_bad.filename);
  const [cloud, setCloud] = useState(PRESETS.aws_bad.cloud);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [expandedFixId, setExpandedFixId] = useState<string | null>(null);

  const handlePresetSelect = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setCode(preset.code);
    setFilename(preset.filename);
    setCloud(preset.cloud);
  };

  const handleScan = async () => {
    setScanning(true);
    setResult(null);
    setExpandedFixId(null);
    try {
      const scanRes = await scanCode(code, filename, cloud);
      setResult(scanRes);
    } catch (err) {
      console.error(err);
      alert('Error running security scan');
    } finally {
      setScanning(false);
    }
  };

  const toggleFix = (violationId: string) => {
    setExpandedFixId(expandedFixId === violationId ? null : violationId);
  };

  return (
    <LayoutWrapper title="Scanner" subtitle="Paste Terraform or Kubernetes configurations for real-time validation">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Presets and Options */}
        <section className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)' }}>Presets:</span>
            {Object.keys(PRESETS).map((key) => (
              <button
                key={key}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => handlePresetSelect(key as keyof typeof PRESETS)}
              >
                {PRESETS[key as keyof typeof PRESETS].name}
              </button>
            ))}
          </div>
        </section>

        {/* Input Details */}
        <section className="grid-cols-2">
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code2 size={18} /> Configuration Editor
            </h3>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flexGrow: 1 }}>
                <label className="form-label">Filename</label>
                <input
                  type="text"
                  className="form-input"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ width: '150px' }}>
                <label className="form-label">Cloud Provider</label>
                <select
                  className="form-select"
                  value={cloud}
                  onChange={(e) => setCloud(e.target.value)}
                >
                  <option value="AWS">AWS</option>
                  <option value="GCP">GCP</option>
                  <option value="Azure">Azure</option>
                  <option value="Kubernetes">Kubernetes</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ flexGrow: 1, marginBottom: 0 }}>
              <label className="form-label">Code / Manifest Content</label>
              <textarea
                className="form-textarea"
                style={{ height: '350px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <button className="btn btn-primary" onClick={handleScan} disabled={scanning} style={{ width: '100%' }}>
              <Play size={16} /> {scanning ? 'Scanning...' : 'Run Policy Check'}
            </button>
          </div>

          {/* Results Side */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '500px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={18} /> Scan Results
            </h3>

            {!result && !scanning && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--muted)', textAlign: 'center', padding: '40px 20px' }}>
                <Code2 size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                <p>Run a check to see policy validation details.</p>
              </div>
            )}

            {scanning && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--muted)' }}>
                <div style={{ border: '3px solid rgba(6,182,212,0.1)', borderTop: '3px solid var(--accent)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
                <p>Analyzing files against policy library...</p>
                <style jsx>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}

            {result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto' }}>
                {/* Result Header Box */}
                {result.status === 'failed' ? (
                  <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldAlert size={24} style={{ color: 'var(--error)' }} />
                    <div>
                      <strong style={{ display: 'block', color: '#f87171' }}>
                        {result.violations.length} violations found – pipeline blocked
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        {result.summary.critical} Critical • {result.summary.high} High • Engine: {result.engine}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldCheck size={24} style={{ color: 'var(--success)' }} />
                    <div>
                      <strong style={{ display: 'block', color: '#34d399' }}>
                        All checks passed
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        No policy violations found in this file • Engine: {result.engine}
                      </span>
                    </div>
                  </div>
                )}

                {/* Violations List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result.violations.map((v, idx) => {
                    const uniqueId = `${v.id}-${idx}`;
                    const isExpanded = expandedFixId === uniqueId;
                    return (
                      <div
                        key={uniqueId}
                        style={{
                          border: '1px solid rgba(255,255,255,0.06)',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: '12px',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Violation Header */}
                        <div
                          style={{
                            padding: '12px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                          }}
                          onClick={() => toggleFix(uniqueId)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className={`badge badge-${v.severity.toLowerCase()}`}>
                              {v.severity}
                            </span>
                            <strong style={{ fontSize: '0.9rem' }}>{v.id}</strong>
                            <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Line {v.line}</span>
                          </div>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>

                        {/* Details View */}
                        <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          <p style={{ margin: '12px 0 6px 0', fontSize: '0.9rem', fontWeight: 600 }}>{v.name}</p>
                          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '10px' }}>{v.message}</p>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '8px' }}>
                            Resource: <code>{v.resource}</code>
                          </div>
                          
                          {/* Code Preview */}
                          <pre className="code-block" style={{ margin: '8px 0', fontSize: '0.75rem' }}>
                            {v.context}
                          </pre>

                          {/* How to Fix Dropdown */}
                          <div style={{ marginTop: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 600, fontSize: '0.8rem', marginBottom: '6px' }}>
                              <span>💡 How to Fix</span>
                            </div>
                            <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '8px', padding: '12px', fontSize: '0.8rem', color: '#c4b5fd', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                              {v.remediation}
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

      </div>
    </LayoutWrapper>
  );
}
