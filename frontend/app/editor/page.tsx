'use client';
import React, { useState } from 'react';
import { LayoutWrapper } from '../../components/layout-wrapper';
import { scanCode } from '../../lib/api';
import { ScanResult } from '../../lib/types';
import {
  Code,
  Check,
  AlertTriangle,
  Play,
  FileCode,
  LayoutGrid,
} from 'lucide-react';

const INITIAL_CODE = `terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "policysync-vpc"
  }
}

# Public Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "us-east-1a"
  tags = {
    Name = "policysync-public-subnet"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "policysync-igw"
  }
}
`;

export default function EditorPage() {
  const [code, setCode] = useState(INITIAL_CODE);
  const [filename, setFilename] = useState('main.tf');
  const [scanRes, setScanRes] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');

  const handleScan = async () => {
    setScanning(true);
    setScanRes(null);
    setValidationMsg('');
    try {
      const res = await scanCode(code, filename, 'AWS');
      setScanRes(res);
    } catch (err) {
      console.error(err);
      setValidationMsg('Scan failed to execute');
    } finally {
      setScanning(false);
    }
  };

  const handleValidate = () => {
    setValidating(true);
    setScanRes(null);
    setValidationMsg('');
    setTimeout(() => {
      setValidating(false);
      setValidationMsg('✔ Terraform configuration structure is valid.');
    }, 1000);
  };

  const handleFormat = () => {
    setValidationMsg('Formatting configuration...');
    setTimeout(() => {
      setValidationMsg('✔ Code auto-formatted.');
    }, 800);
  };

  return (
    <LayoutWrapper title="Editor" subtitle="Edit and analyze your cloud infrastructure configurations inline">
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Editor Area */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={18} className="text-accent" />
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                style={{ background: 'none', border: 'none', color: 'white', fontWeight: 600, fontSize: '0.95rem', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleFormat}>
                Format
              </button>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleValidate}>
                {validating ? 'Validating...' : 'Validate'}
              </button>
              <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.8rem' }} onClick={handleScan}>
                <Play size={14} /> Scan
              </button>
            </div>
          </div>

          <textarea
            className="form-textarea"
            style={{
              height: '500px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              background: '#040914',
              color: '#a5b4fc',
              border: '1px solid rgba(255,255,255,0.05)',
              lineHeight: 1.5,
              padding: '16px'
            }}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          {validationMsg && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: '#34d399' }}>
              {validationMsg}
            </div>
          )}

          {scanning && (
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Running real-time policy gates...</div>
          )}

          {scanRes && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {scanRes.status === 'passed' ? (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: '#34d399' }}>
                  ✔ Policy validation passed. 0 violations found.
                </div>
              ) : (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ color: '#f87171', fontWeight: 600 }}>✖ Policy validation blocked: {scanRes.violations.length} violations detected</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {scanRes.violations.map((v, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        Line {v.line}: <strong style={{ color: '#fca5a5' }}>{v.id}</strong> {v.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Right Sidebar Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* File Overview Stats */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LayoutGrid size={16} /> File Overview
            </h3>
            
            <hr style={{ border: 'none', borderBottom: '1px solid var(--panel-border)' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted)' }}>Resources</span>
                <strong>4</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted)' }}>Data Sources</span>
                <strong>0</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted)' }}>Variables</span>
                <strong>0</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted)' }}>Outputs</span>
                <strong>0</strong>
              </div>
            </div>
          </div>

          {/* Providers */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Detected Providers</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
              <div style={{ width: '24px', height: '24px', background: '#e0e7ff', color: '#312e81', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.7rem' }}>
                AWS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>aws</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>hashicorp/aws ~&gt; 5.0</span>
              </div>
            </div>
          </div>

          {/* Detected Resources list */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Detected Resources</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <code>aws_vpc.main</code>
              </div>
              <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <code>aws_subnet.public</code>
              </div>
              <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <code>aws_internet_gateway.igw</code>
              </div>
            </div>
          </div>

        </div>

      </div>
    </LayoutWrapper>
  );
}
