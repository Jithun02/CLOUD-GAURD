'use client';
import React, { useState, useEffect, useRef } from 'react';
import { LayoutWrapper } from '../../components/layout-wrapper';
import { Terminal, Play, Trash2, HelpCircle } from 'lucide-react';

const HELP_TEXT = `PolicySync CLI Emulator - Available commands:
  help                           - Show this help list
  clear                          - Clear the terminal screen
  docker-compose up              - Boot local PostgreSQL and FastAPI containers
  policy_check.py scan main.tf   - Scan bad Terraform configuration
  policy_check.py scan good.tf   - Scan clean secure Terraform configuration
`;

const DOCKER_COMPOSE_LOGS = [
  "policySyncDev:~/$ docker-compose up",
  "[+] Running 2/2",
  " ✔ Network policysync_default     Created                                                          0.1s",
  " ✔ Volume \"policysync_data\"       Created                                                          0.1s",
  "[+] Running 2/2",
  " ✔ Container policysync-db-1      Healthy                                                          1.7s",
  " ✔ Container policysync-api-1     Healthy                                                          2.3s",
  "Attaching to db-1, api-1",
  "db-1  | PostgreSQL database directory appears to contain a database; Skipping initialization",
  "db-1  | 2026-06-25 08:48:21 UTC [1] LOG:  starting PostgreSQL 15.4 on x86_64-pc-linux-gnu...",
  "db-1  | 2026-06-25 08:48:21 UTC [1] LOG:  listening on IPv4 address \"0.0.0.0\", port 5432",
  "db-1  | 2026-06-25 08:48:21 UTC [1] LOG:  listening on IPv6 address \"::\", port 5432",
  "db-1  | 2026-06-25 08:48:21 UTC [1] LOG:  database system is ready to accept connections",
  "api-1 | > policysync-api@1.2.0 start",
  "api-1 | > python3 backend/main.py",
  "api-1 | ",
  "api-1 | [INFO] Starting PolicySync API server...",
  "api-1 | [INFO] Environment: development",
  "api-1 | [INFO] Connected to PostgreSQL at db:5432",
  "api-1 | [INFO] Redis not configured, continuing without cache",
  "api-1 | [INFO] Server listening on port 8000",
  "api-1 | [INFO] Health check active at http://localhost:8000/health",
  "api-1 | ",
  "✔ All services are up and healthy!",
  "✔ API:   http://localhost:8000       (healthy)",
  "✔ DB:    localhost:5432              (healthy)",
  "policySyncDev:~/$ "
];

const SCAN_TF_LOGS = [
  "policySyncDev:~/$ policy_check.py scan main.tf",
  "[*] PolicySync v1.2.0 - Scanning configuration...",
  "[*] File: main.tf",
  "[*] Provider: AWS   Region: us-east-1",
  "[*] Scan Started: 2026-06-25 08:49:10",
  "======================================",
  "",
  "======================================",
  "[!] VIOLATION FOUND (4)",
  "======================================",
  "[\u001b[91mCRITICAL\u001b[0m] AWS-001: Hardcoded AWS Credentials",
  "File       : main.tf",
  "Line       : 15",
  "Resource   : provider \"aws\"",
  "Message    : AWS access key or secret key found hardcoded in configuration.",
  "Severity   : CRITICAL",
  "----------------------------------------",
  "13 | provider \"aws\" {",
  "14 |   region     = \"us-east-1\"",
  "15 |   access_key = \"AKIAIDSFODNN7EXAMPLE\"      # <-- Detected violation",
  "----------------------------------------",
  "💡 How to Fix: Remove access_key and secret_key. Use environment variables.",
  "======================================",
  "[\u001b[91mCRITICAL\u001b[0m] AWS-002: S3 Public Access",
  "File       : main.tf",
  "Line       : 22",
  "Resource   : aws_s3_bucket \"user_uploads\"",
  "Message    : S3 bucket configured with public-read ACL.",
  "----------------------------------------",
  "22 |   acl    = \"public-read\"                  # <-- Detected violation",
  "----------------------------------------",
  "======================================",
  "Scan Summary: \u001b[91m4 violations found (2 CRITICAL, 2 HIGH, 0 PASSED)\u001b[0m",
  "policySyncDev:~/$ "
];

const SCAN_GOOD_LOGS = [
  "policySyncDev:~/$ policy_check.py scan good.tf",
  "[*] PolicySync v1.2.0 - Scanning configuration...",
  "[*] File: good.tf",
  "[*] Provider: AWS   Region: us-east-1",
  "[*] Scan Started: 2026-06-25 08:49:50",
  "======================================",
  "",
  "✔ No violations found.",
  "======================================",
  "Scan Summary: \u001b[92m0 violations found (0 CRITICAL, 0 HIGH, 1 PASSED)\u001b[0m",
  "policySyncDev:~/$ "
];

export default function TerminalPage() {
  const [history, setHistory] = useState<string[]>([
    "Welcome to PolicySync Console (v1.2.0)",
    "Type 'help' to list available commands.",
    "",
    "policySyncDev:~/$ "
  ]);
  const [input, setInput] = useState('');
  const [printingLogs, setPrintingLogs] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (printingLogs || !input.trim()) return;

    const cmd = input.trim();
    setInput('');
    setHistory((prev) => {
      // replace prompt on last line
      const lines = [...prev];
      if (lines[lines.length - 1] === "policySyncDev:~/$ ") {
        lines[lines.length - 1] = `policySyncDev:~/$ ${cmd}`;
      } else {
        lines.push(`policySyncDev:~/$ ${cmd}`);
      }
      return lines;
    });

    if (cmd === 'clear') {
      setHistory(["policySyncDev:~/$ "]);
      return;
    }

    if (cmd === 'help') {
      setHistory((prev) => [...prev, ...HELP_TEXT.split('\n'), "policySyncDev:~/$ "]);
      return;
    }

    if (cmd === 'docker-compose up') {
      setPrintingLogs(true);
      for (const line of DOCKER_COMPOSE_LOGS.slice(1)) {
        await new Promise((resolve) => setTimeout(resolve, 80));
        setHistory((prev) => [...prev, line]);
      }
      setPrintingLogs(false);
      return;
    }

    if (cmd === 'policy_check.py scan main.tf') {
      setPrintingLogs(true);
      for (const line of SCAN_TF_LOGS.slice(1)) {
        await new Promise((resolve) => setTimeout(resolve, 60));
        setHistory((prev) => [...prev, line]);
      }
      setPrintingLogs(false);
      return;
    }

    if (cmd === 'policy_check.py scan good.tf') {
      setPrintingLogs(true);
      for (const line of SCAN_GOOD_LOGS.slice(1)) {
        await new Promise((resolve) => setTimeout(resolve, 60));
        setHistory((prev) => [...prev, line]);
      }
      setPrintingLogs(false);
      return;
    }

    // Default unknown command
    setHistory((prev) => [
      ...prev,
      `bash: command not found: ${cmd}`,
      "policySyncDev:~/$ "
    ]);
  };

  return (
    <LayoutWrapper title="Terminal Console" subtitle="Simulate container configurations and local scan command execution">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Terminal Header Info */}
        <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '0.85rem' }}>
            <Terminal size={16} />
            <span>Interactive CLI Environment</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setHistory(["policySyncDev:~/$ "])}>
              <Trash2 size={14} /> Clear
            </button>
            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => { setInput('docker-compose up'); }}>
              <Play size={14} /> Run docker-compose
            </button>
          </div>
        </div>

        {/* Console Box */}
        <div
          className="card"
          style={{
            background: '#020617',
            borderColor: 'rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '24px',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            lineHeight: '1.6',
            color: '#cbd5e1',
            minHeight: '450px',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            maxHeight: '600px',
            boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ flexGrow: 1 }}>
            {history.map((line, idx) => {
              // Parse ANSI Color escapes in terminal emulation
              let color = 'inherit';
              let weight = 'normal';
              let displayLine = line;
              
              if (line.includes('[INFO]')) {
                color = '#38bdf8';
              } else if (line.includes('✔') || line.includes('[x]')) {
                color = '#34d399';
              } else if (line.includes('✖') || line.includes('Failed') || line.includes('[!]') || line.includes('VIOLATION')) {
                color = '#f87171';
                weight = 'bold';
              } else if (line.includes('policySyncDev:~/')) {
                color = '#a78bfa';
                weight = 'bold';
              }

              // Replace ANSI escape codes
              displayLine = displayLine
                .replace(/\u001b\[91m/g, '')
                .replace(/\u001b\[92m/g, '')
                .replace(/\u001b\[0m/g, '')
                .replace(/\u001b\[1m/g, '');

              // Avoid printing empty lines on prompt
              if (displayLine === "policySyncDev:~/$ " && idx < history.length - 1) {
                return null;
              }

              return (
                <div key={idx} style={{ color, fontWeight: weight, whiteSpace: 'pre-wrap' }}>
                  {displayLine}
                </div>
              );
            })}
            <div ref={terminalEndRef} />
          </div>

          {/* Prompt Form */}
          <form onSubmit={handleCommandSubmit} style={{ display: 'flex', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
            <span style={{ color: '#a78bfa', fontWeight: 'bold', marginRight: '8px' }}>policySyncDev:~/$</span>
            <input
              type="text"
              style={{
                background: 'none',
                border: 'none',
                color: '#f8fafc',
                flexGrow: 1,
                outline: 'none',
                fontFamily: 'monospace',
                fontSize: '0.85rem'
              }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={printingLogs}
              placeholder={printingLogs ? "Simulating execution..." : "Type command (e.g. 'help')..."}
              autoFocus
            />
          </form>
        </div>

      </div>
    </LayoutWrapper>
  );
}
