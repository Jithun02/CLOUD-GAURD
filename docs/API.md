# CloudGuard API Documentation

## Base URL
```
https://api.cloudguard.io/api/v1
```

## Authentication

All API requests require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Getting Access Token

**POST** `/auth/login`

```bash
curl -X POST https://api.cloudguard.io/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

## Endpoints

### Organizations

#### List Organizations
**GET** `/organizations`

Query Parameters:
- `skip`: (int) Number of records to skip (default: 0)
- `limit`: (int) Number of records to return (default: 10)

```bash
curl https://api.cloudguard.io/api/v1/organizations \
  -H "Authorization: Bearer $TOKEN"
```

#### Create Organization
**POST** `/organizations`

```bash
curl -X POST https://api.cloudguard.io/api/v1/organizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Acme Corp",
    "slug": "acme-corp",
    "description": "Main organization"
  }'
```

#### Get Organization
**GET** `/organizations/{org_id}`

#### Update Organization
**PUT** `/organizations/{org_id}`

#### Delete Organization
**DELETE** `/organizations/{org_id}`

### Scans

#### List Scans
**GET** `/scans`

Query Parameters:
- `repo_id`: (int) Filter by repository
- `status`: (string) pending|in_progress|completed|failed
- `skip`: (int) Offset
- `limit`: (int) Limit

```bash
curl "https://api.cloudguard.io/api/v1/scans?status=completed" \
  -H "Authorization: Bearer $TOKEN"
```

#### Create Scan
**POST** `/scans`

```bash
curl -X POST https://api.cloudguard.io/api/v1/scans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "repository_id": 1,
    "scan_type": "iac"
  }'
```

#### Get Scan Details
**GET** `/scans/{scan_id}`

#### Retry Failed Scan
**POST** `/scans/{scan_id}/retry`

#### Delete Scan
**DELETE** `/scans/{scan_id}`

### Findings

#### List Findings
**GET** `/findings`

Query Parameters:
- `scan_id`: (int) Filter by scan
- `severity`: (string) critical|high|medium|low|info
- `resolved`: (bool) Filter by resolution status
- `skip`: (int) Offset
- `limit`: (int) Limit

```bash
curl "https://api.cloudguard.io/api/v1/findings?severity=critical" \
  -H "Authorization: Bearer $TOKEN"
```

#### Get Finding
**GET** `/findings/{finding_id}`

#### Resolve Finding
**PUT** `/findings/{finding_id}/resolve`

#### Mark as False Positive
**PUT** `/findings/{finding_id}/false-positive`

#### Get Findings by Severity
**GET** `/findings/by-severity/summary`

Response:
```json
{
  "critical": 5,
  "high": 12,
  "medium": 28,
  "low": 45
}
```

### Policies

#### List Policies
**GET** `/policies`

Query Parameters:
- `org_id`: (int) Organization ID
- `enabled_only`: (bool) Only enabled policies
- `custom_only`: (bool) Only custom policies

#### Create Policy
**POST** `/policies?org_id=1`

```bash
curl -X POST "https://api.cloudguard.io/api/v1/policies?org_id=1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "S3 Encryption",
    "policy_type": "rego",
    "content": "package cloudguard.s3...",
    "description": "Enforce S3 encryption"
  }'
```

#### Get Policy
**GET** `/policies/{policy_id}`

#### Update Policy
**PUT** `/policies/{policy_id}`

#### Toggle Policy
**PUT** `/policies/{policy_id}/toggle`

#### Delete Policy
**DELETE** `/policies/{policy_id}`

#### Get Policy Versions
**GET** `/policies/{policy_id}/versions`

### Dashboard

#### Get Dashboard Stats
**GET** `/dashboard/stats`

Response:
```json
{
  "total_organizations": 10,
  "total_projects": 45,
  "active_scans": 3,
  "critical_findings": 8,
  "high_findings": 24,
  "medium_findings": 102,
  "low_findings": 340,
  "compliance_score": 87.5,
  "mttr_hours": 2.5
}
```

#### Get Risk Score
**GET** `/dashboard/risk-score`

Response:
```json
{
  "overall_score": 72.5,
  "asset_score": 65.0,
  "vulnerability_score": 78.0,
  "access_score": 72.0,
  "compliance_score": 87.5,
  "calculated_at": "2024-01-15T10:30:00Z"
}
```

#### Get Recent Scans
**GET** `/dashboard/recent-scans?limit=10`

#### Get Recent Findings
**GET** `/dashboard/recent-findings?limit=10`

#### Get Compliance Summary
**GET** `/dashboard/compliance-summary`

#### Get Findings Trend
**GET** `/dashboard/findings-trend?days=30`

#### Get Top Risky Repositories
**GET** `/dashboard/top-risky-repositories?limit=10`

#### Get Vulnerabilities by Cloud
**GET** `/dashboard/vulnerabilities-by-cloud`

## Error Handling

All errors return appropriate HTTP status codes with error messages:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common Status Codes
- `200 OK` - Request succeeded
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Rate Limiting

Rate limits: 100 requests per minute per API token

Headers in response:
- `X-RateLimit-Limit`: 100
- `X-RateLimit-Remaining`: 95
- `X-RateLimit-Reset`: 1234567890

## Webhooks

### Supported Events
- `scan.completed`
- `scan.failed`
- `finding.critical`
- `approval.required`

### Register Webhook
**POST** `/webhooks`

```bash
curl -X POST https://api.cloudguard.io/api/v1/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "url": "https://your-domain.com/webhook",
    "events": ["scan.completed", "finding.critical"]
  }'
```

### Webhook Payload
```json
{
  "event": "scan.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "scan_id": 123,
    "repository_id": 456,
    "findings_count": 15,
    "risk_score": 75.5
  }
}
```

## SDKs

### Python
```bash
pip install cloudguard-sdk
```

```python
from cloudguard import CloudGuardClient

client = CloudGuardClient(api_key="your-api-key")

# List scans
scans = client.scans.list()

# Create scan
scan = client.scans.create(repository_id=1, scan_type="iac")
```

### JavaScript/TypeScript
```bash
npm install @cloudguard/sdk
```

```typescript
import { CloudGuardClient } from '@cloudguard/sdk';

const client = new CloudGuardClient({ apiKey: 'your-api-key' });

// List organizations
const orgs = await client.organizations.list();

// Create policy
const policy = await client.policies.create({
  name: 'S3 Encryption',
  policy_type: 'rego',
  content: '...'
});
```

## Examples

### Full Scan Workflow
```bash
# 1. Create organization
ORG=$(curl -X POST https://api.cloudguard.io/api/v1/organizations \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"MyOrg","slug":"myorg"}' \
  | jq -r '.id')

# 2. Create project
PROJECT=$(curl -X POST https://api.cloudguard.io/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"organization_id\":$ORG,\"name\":\"MyProject\"}" \
  | jq -r '.id')

# 3. Create scan
SCAN=$(curl -X POST https://api.cloudguard.io/api/v1/scans \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"repository_id\":1,\"scan_type\":\"iac\"}" \
  | jq -r '.id')

# 4. Wait for completion
while true; do
  STATUS=$(curl https://api.cloudguard.io/api/v1/scans/$SCAN \
    -H "Authorization: Bearer $TOKEN" | jq -r '.status')
  if [ "$STATUS" = "completed" ]; then break; fi
  sleep 5
done

# 5. Get findings
curl "https://api.cloudguard.io/api/v1/findings?scan_id=$SCAN" \
  -H "Authorization: Bearer $TOKEN"
```
