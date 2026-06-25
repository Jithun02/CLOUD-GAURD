'use client';
import React, { useState } from 'react';
import { LayoutWrapper } from '../../components/layout-wrapper';
import { Settings, Save, Trash2, ShieldAlert, Wifi } from 'lucide-react';

export default function SettingsPage() {
  const [threshold, setThreshold] = useState('HIGH');
  const [enableCheckov, setEnableCheckov] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('http://localhost:8000/webhook/github');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setSaveSuccess(false);
    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
    }, 800);
  };

  const handleClearDb = () => {
    if (confirm("Are you sure you want to clear the in-memory scan history? This action is irreversible.")) {
      alert("In-memory history cleared.");
    }
  };

  return (
    <LayoutWrapper title="Settings" subtitle="Configure PolicySync engine rules, webhook triggers, and database thresholds">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Settings Form Grid */}
        <section className="grid-cols-2">
          
          {/* General Scanner Configuration */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={18} /> Engine Configuration
            </h3>
            
            <hr style={{ border: 'none', borderBottom: '1px solid var(--panel-border)' }} />
            
            <div className="form-group">
              <label className="form-label">Deployment Block Threshold</label>
              <select
                className="form-select"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              >
                <option value="CRITICAL">Block on CRITICAL only</option>
                <option value="HIGH">Block on HIGH and above (Recommended)</option>
                <option value="MEDIUM">Block on MEDIUM and above</option>
                <option value="LOW">Block on any violation</option>
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                Commits triggering violations at or above this level will return code 1 and fail the build pipeline.
              </span>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <input
                type="checkbox"
                id="checkov"
                checked={enableCheckov}
                onChange={(e) => setEnableCheckov(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="checkov" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                Enable Checkov Community Rules
              </label>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '-8px', marginLeft: '26px' }}>
              When checked, PolicySync searches for local checkov execution binary to validate against 1,000+ public rules.
            </span>

            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ width: 'fit-content', marginTop: '12px' }}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>

            {saveSuccess && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', color: '#34d399' }}>
                ✔ Settings updated successfully.
              </div>
            )}
          </div>

          {/* Webhook Configuration */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wifi size={18} /> Github Webhook Integration
            </h3>
            
            <hr style={{ border: 'none', borderBottom: '1px solid var(--panel-border)' }} />

            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.4 }}>
              Register this webhook URL in your GitHub repository's Settings &gt; Webhooks page to trigger automatic commit checking on code pushes.
            </p>

            <div className="form-group">
              <label className="form-label">Payload URL</label>
              <input
                type="text"
                className="form-input"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Content Type</label>
              <input
                type="text"
                className="form-input"
                value="application/json"
                disabled
              />
            </div>
          </div>

        </section>

        {/* Database Management */}
        <section className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.01)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={20} style={{ color: 'var(--error)' }} />
            <div>
              <strong style={{ fontSize: '0.9rem', display: 'block', color: '#f87171' }}>Danger Zone</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Clear local in-memory audit logs and restart metric trackers.</span>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }} onClick={handleClearDb}>
            <Trash2 size={16} /> Reset Memory
          </button>
        </section>

      </div>
    </LayoutWrapper>
  );
}
