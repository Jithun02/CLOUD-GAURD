import type { AwsSummary } from '../lib/aws';

function formatStatus(summary: AwsSummary) {
  if (summary.connected) {
    return { label: 'Connected to AWS', tone: 'ok' as const };
  }

  return { label: summary.error ?? 'AWS credentials required', tone: 'warn' as const };
}

export function AwsDashboard({ summary }: { summary: AwsSummary }) {
  const status = formatStatus(summary);

  const items = [
    { label: 'CloudTrail', value: summary.resources.cloudTrails, detail: 'trails discovered' },
    { label: 'AWS Config', value: summary.resources.configRecorders, detail: 'recorders active' },
    { label: 'S3', value: summary.resources.s3Buckets, detail: 'buckets visible' },
    { label: 'CloudWatch', value: summary.resources.logGroups, detail: 'log groups found' },
    { label: 'IAM', value: summary.resources.iamRoles, detail: 'roles visible' },
    { label: 'Total', value: summary.resources.total, detail: 'resources counted' },
  ];

  return (
    <div className="aws-dashboard">
      <div className="status-row">
        <span className={`pill ${status.tone}`}>{status.label}</span>
        <span className="pill">Account: {summary.identity.accountId ?? 'unknown'}</span>
        <span className="pill">Region: {summary.identity.region ?? 'unknown'}</span>
      </div>

      <div className="summary-list">
        {items.map((item) => (
          <div className="summary-item" key={item.label}>
            <span className="panel-label">{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="detail-grid">
        <div>
          <h2>Identity</h2>
          <ul>
            <li>Principal: {summary.identity.principal ?? 'unknown'}</li>
            <li>ARN: {summary.identity.arn ?? 'unknown'}</li>
            <li>AWS account: {summary.identity.accountId ?? 'unknown'}</li>
          </ul>
        </div>

        <div>
          <h2>Discovered resources</h2>
          <ul>
            <li>CloudTrails: {summary.discovered.cloudTrails.slice(0, 3).join(', ') || 'none'}</li>
            <li>S3 buckets: {summary.discovered.s3Buckets.slice(0, 3).join(', ') || 'none'}</li>
            <li>IAM roles: {summary.discovered.iamRoles.slice(0, 3).join(', ') || 'none'}</li>
          </ul>
        </div>
      </div>

      <div>
        <span className="panel-label">Raw AWS payload</span>
        <pre className="raw-json">{JSON.stringify(summary, null, 2)}</pre>
      </div>
    </div>
  );
}
