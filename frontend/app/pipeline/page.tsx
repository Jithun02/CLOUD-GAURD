'use client';
import React, { useState } from 'react';
import { LayoutWrapper } from '../../components/layout-wrapper';
import { scanCode } from '../../lib/api';
import { ScanResult } from '../../lib/types';
import {
  GitBranch,
  Play,
  CheckCircle,
  XCircle,
  FileCode,
  Terminal,
  RefreshCw,
  User,
  Database,
  Cpu,
  Lock,
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 'creds',
    name: 'Developer leaks credentials',
    icon: User,
    description: 'John is pushing a quick hotfix and accidentially hardcodes AWS keys in main.tf.',
    filename: 'infra/main.tf',
    cloud: 'AWS',
    code: `provider "aws" {
  region     = "us-east-1"
  access_key = "AKIAIDSFODNN7EXAMPLE"
  secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}`
  },
  {
    id: 'db',
    name: 'Database exposed to internet',
    icon: Database,
    description: 'A developer configures an RDS database to be publicly accessible with a hardcoded password.',
    filename: 'database/rds.tf',
    cloud: 'AWS',
    code: `resource "aws_db_instance" "production_db" {
  engine                 = "postgres"
  publicly_accessible    = true
  password               = "db_password_123_unsafe!"
}`
  },
  {
    id: 'k8s',
    name: 'Kubernetes pod running as root',
    icon: Cpu,
    description: 'A developer deploys a payment api running as root in privileged mode to solve a permissions error.',
    filename: 'k8s/payment-service.yaml',
    cloud: 'Kubernetes',
    code: `apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: payment-api
          securityContext:
            privileged: true
            runAsNonRoot: false`
  },
  {
    id: 'secure',
    name: 'Secure configuration - all checks pass',
    icon: Lock,
    description: 'The developer resolves all security issues and submits a clean, encrypted configuration.',
    filename: 'infra/main-fixed.tf',
    cloud: 'AWS',
    code: `provider "aws" {
  region = "us-east-1"
}
resource "aws_s3_bucket" "secure_uploads" {
  bucket = "startup-user-uploads"
}
resource "aws_s3_bucket_public_access_block" "secure_block" {
  bucket = aws_s3_bucket.secure_uploads.id
  block_public_acls       = true
  block_public_policy     = true
}`
  }
];

type StageStatus = 'idle' | 'running' | 'success' | 'failed';

export default function PipelinePage() {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [stages, setStages] = useState<{ [key: string]: StageStatus }>({
    push: 'idle',
    unittest: 'idle',
    lint: 'idle',
    build: 'idle',
    policy: 'idle',
    deploy: 'idle'
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const resetPipeline = () => {
    setStages({
      push: 'idle',
      unittest: 'idle',
      lint: 'idle',
      build: 'idle',
      policy: 'idle',
      deploy: 'idle'
    });
    setLogs([]);
    setScanResult(null);
    setIsRunning(false);
  };

  const runSimulation = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setScanResult(null);
    setLogs([]);

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Stage 1: Push
    setStages((prev) => ({ ...prev, push: 'running' }));
    addLog(`Git: Commit pushed to branch 'feature/deploy' by dev_admin.`);
    addLog(`Git: Webhook triggered: Sending payload to PolicySync receiver...`);
    await delay(1200);
    setStages((prev) => ({ ...prev, push: 'success' }));
    addLog(`Git: Repository successfully synchronized.`);

    // Stage 2: Unit Tests
    setStages((prev) => ({ ...prev, unittest: 'running' }));
    addLog(`Jest: Running 47 unit test assertions...`);
    await delay(1500);
    setStages((prev) => ({ ...prev, unittest: 'success' }));
    addLog(`Jest: ✔ 47/47 unit tests passed successfully.`);

    // Stage 3: Lint & Format
    setStages((prev) => ({ ...prev, lint: 'running' }));
    addLog(`Lint: Executing ESLint and TFLint code checkers...`);
    await delay(1200);
    setStages((prev) => ({ ...prev, lint: 'success' }));
    addLog(`Lint: ✔ 0 formatting warnings. Clean layout check.`);

    // Stage 4: Build
    setStages((prev) => ({ ...prev, build: 'running' }));
    addLog(`Docker: Building multi-stage container deployment layers...`);
    await delay(1800);
    setStages((prev) => ({ ...prev, build: 'success' }));
    addLog(`Docker: ✔ Container layers compiled. Image tagged 'policysync-demo:latest'.`);

    // Stage 5: Policy Check (API Call)
    setStages((prev) => ({ ...prev, policy: 'running' }));
    addLog(`PolicySync: Invoking dual-engine IaC scanner on changed files...`);
    addLog(`PolicySync: Scanning file '${selectedScenario.filename}'...`);
    
    let result: ScanResult;
    try {
      result = await scanCode(selectedScenario.code, selectedScenario.filename, selectedScenario.cloud);
      setScanResult(result);
    } catch (err) {
      addLog(`PolicySync: ERROR: Scan call failed. Check database logs.`);
      setStages((prev) => ({ ...prev, policy: 'failed' }));
      setIsRunning(false);
      return;
    }

    await delay(1500);

    if (result.status === 'failed') {
      setStages((prev) => ({
        ...prev,
        policy: 'failed',
        deploy: 'failed'
      }));
      addLog(`PolicySync: ✖ VIOLATIONS DETECTED: Scanner returned exit code 1.`);
      addLog(`PolicySync: Blocked by ${result.violations.length} critical/high findings.`);
      addLog(`CI/CD: Deployment process terminated. STATUS: FAILED.`);
    } else {
      setStages((prev) => ({
        ...prev,
        policy: 'success',
        deploy: 'running'
      }));
      addLog(`PolicySync: ✔ 0 violations found. Scanner returned exit code 0.`);
      addLog(`PolicySync: All policy gates successfully validated.`);
      
      // Stage 6: Deploy
      addLog(`CI/CD: Initializing deploy tasks to production cluster...`);
      await delay(1500);
      setStages((prev) => ({ ...prev, deploy: 'success' }));
      addLog(`CI/CD: ✔ Deployment completed successfully to Kubernetes cluster.`);
      addLog(`CI/CD: Service live at http://app.policysync.local.`);
    }
    setIsRunning(false);
  };

  const getStageColorClass = (status: StageStatus) => {
    switch (status) {
      case 'running': return 'running-pulse';
      case 'success': return 'success-bg';
      case 'failed': return 'failed-bg';
      default: return 'idle-bg';
    }
  };

  return (
    <LayoutWrapper title="CI/CD Pipeline Simulator" subtitle="See how PolicySync scans and blocks non-compliant code before deploy">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Choose a Scenario */}
        <section className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>CHOOSE A SCENARIO</h3>
          <div className="grid-cols-4">
            {SCENARIOS.map((sc) => {
              const Icon = sc.icon;
              const isSelected = selectedScenario.id === sc.id;
              return (
                <div
                  key={sc.id}
                  onClick={() => { if (!isRunning) { setSelectedScenario(sc); resetPipeline(); } }}
                  style={{
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--panel-border)',
                    background: isSelected ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255,255,255,0.01)',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} />
                    </div>
                    <strong style={{ fontSize: '0.85rem' }}>{sc.name}</strong>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.4 }}>{sc.description}</p>
                  <code style={{ fontSize: '0.7rem', color: 'var(--accent)', marginTop: '4px' }}>{sc.filename}</code>
                </div>
              );
            })}
          </div>
        </section>

        {/* Trigger Commit */}
        <section className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <GitBranch size={20} className="text-muted" />
            <div>
              <strong style={{ fontSize: '0.9rem', display: 'block' }}>Push {selectedScenario.filename} to branch 'main'</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Policy Check is configured as a live blocker webhook.</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={resetPipeline} disabled={isRunning}>Reset</button>
            <button className="btn btn-primary" onClick={runSimulation} disabled={isRunning}>
              <Play size={16} /> Simulate Push
            </button>
          </div>
        </section>

        {/* Pipeline Stage Visualization */}
        <section className="card" style={{ padding: '32px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', position: 'relative' }}>
            {/* Background Line */}
            <div style={{ position: 'absolute', top: '16px', left: '10%', right: '10%', height: '4px', background: 'rgba(255,255,255,0.05)', zIndex: 1 }}></div>

            {[
              { id: 'push', name: 'Code Push', desc: 'Commit received' },
              { id: 'unittest', name: 'Unit Tests', desc: 'Jest - 47 assertions' },
              { id: 'lint', name: 'Lint & Format', desc: 'ESLint + TFLint' },
              { id: 'build', name: 'Build', desc: 'Docker image built' },
              { id: 'policy', name: 'Policy Check', desc: 'PolicySync Gate' },
              { id: 'deploy', name: 'Deploy', desc: 'Production cluster' }
            ].map((st) => {
              const status = stages[st.id];
              return (
                <div key={st.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2 }}>
                  <div className={`stage-circle ${getStageColorClass(status)}`}>
                    {status === 'success' && <CheckCircle size={16} style={{ color: 'white' }} />}
                    {status === 'failed' && <XCircle size={16} style={{ color: 'white' }} />}
                    {status === 'running' && <RefreshCw size={14} className="spin" />}
                    {status === 'idle' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }}></div>}
                  </div>
                  <strong style={{ fontSize: '0.85rem' }}>{st.name}</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{st.desc}</span>
                </div>
              );
            })}
          </div>

          <style jsx>{`
            .stage-circle {
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.3s ease;
            }
            .idle-bg { background: #1e293b; border: 2px solid rgba(255,255,255,0.05); }
            .running-pulse {
              background: var(--accent);
              border: 2px solid var(--accent);
              box-shadow: 0 0 15px rgba(6,182,212,0.6);
            }
            .success-bg { background: var(--success); }
            .failed-bg { background: var(--error); }
            :global(.spin) {
              animation: spin 1.5s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </section>

        {/* Results Block */}
        {scanResult && (
          <section className="grid-cols-2">
            
            {/* Terminal logs */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={18} /> Pipeline logs
              </h3>
              <div
                style={{
                  background: '#040914',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  padding: '16px',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  height: '300px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  color: '#93c5fd'
                }}
              >
                {logs.map((lg, i) => (
                  <div key={i}>{lg}</div>
                ))}
              </div>
            </div>

            {/* Scan findings blocking deployment */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCode size={18} /> Violations blocking deployment
              </h3>

              {scanResult.status === 'passed' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--success)' }}>
                  <CheckCircle size={48} style={{ marginBottom: '16px' }} />
                  <strong style={{ fontSize: '1rem' }}>Pipeline Gate Passed Successfully</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>All policy gate checks returned exit code 0.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '300px' }}>
                  {scanResult.violations.map((v, i) => (
                    <div
                      key={i}
                      style={{
                        border: '1px solid rgba(239,68,68,0.15)',
                        background: 'rgba(239,68,68,0.03)',
                        borderRadius: '10px',
                        padding: '12px 16px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#f87171' }}>{v.id}: {v.name}</strong>
                        <span className={`badge badge-${v.severity.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{v.severity}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '6px' }}>{v.message}</p>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                        File: <code>{selectedScenario.filename}</code> • Line: <code>{v.line}</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </section>
        )}

      </div>
    </LayoutWrapper>
  );
}
