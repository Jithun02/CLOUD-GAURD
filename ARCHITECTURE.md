# CloudGuard Architecture

## System Overview

CloudGuard is a multi-tenant SaaS platform for enterprise cloud security governance. The system is designed with microservices architecture, scalability, and security as core principles.

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
├─────────────────────────────────────────────────────────────┤
│  • Next.js 15 Frontend (React)                             │
│  • Web Browser / Mobile Client                             │
│  • Real-time Dashboard & Analytics                         │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS / GraphQL / REST
┌────────────────▼────────────────────────────────────────────┐
│                   API Gateway Layer                         │
├─────────────────────────────────────────────────────────────┤
│  • CloudFront CDN                                           │
│  • API Gateway (Rate Limiting)                             │
│  • WAF & DDoS Protection                                    │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│              Application Layer (K8s Pods)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  FastAPI     │  │  FastAPI     │  │  FastAPI     │      │
│  │  API Server  │  │  API Server  │  │  API Server  │      │
│  │  (replicas)  │  │  (replicas)  │  │  (replicas)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│        │                   │                   │             │
│  ┌─────────────────────────────────────────────────┐        │
│  │         Service Mesh (Istio)                    │        │
│  │    Load Balancing, Tracing, Policies            │        │
│  └─────────────────────────────────────────────────┘        │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┬──────────────┐
    │            │            │              │
┌───▼──┐  ┌─────▼─────┐  ┌──▼────┐  ┌─────▼─────┐
│  DB  │  │   Cache   │  │ Queue │  │ File Stor.│
│ RDS  │  │   Redis   │  │Celery │  │     S3    │
└──────┘  └───────────┘  └───────┘  └───────────┘
```

## Technology Stack

### Frontend (Client-Side)
- **Framework**: Next.js 15 with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Visualization**: Recharts
- **Animations**: Framer Motion
- **UI Components**: ShadCN UI

### Backend (Server-Side)
- **Framework**: FastAPI (Python 3.11)
- **Database**: PostgreSQL 15 (RDS)
- **ORM**: SQLAlchemy
- **Cache**: Redis 7
- **Task Queue**: Celery / Dramatiq
- **API Gateway**: AWS API Gateway
- **Logging**: Structured logging with Loki
- **Tracing**: OpenTelemetry

### Security Engines
- **Policy Enforcement**: Open Policy Agent (OPA) with Rego
- **IaC Scanning**: Checkov
- **Container Scanning**: Trivy
- **Code Analysis**: Semgrep
- **Secret Detection**: Custom engine + TruffleHog

### Infrastructure
- **Container Orchestration**: Kubernetes (EKS)
- **Networking**: AWS VPC with multiple AZs
- **Load Balancing**: AWS Application Load Balancer (ALB)
- **Auto-scaling**: Kubernetes HPA + Cluster Autoscaler
- **Monitoring**: Prometheus + Grafana + Loki
- **Service Mesh**: Istio (optional, for advanced routing)
- **CI/CD**: GitHub Actions
- **Artifact Registry**: AWS ECR
- **Infrastructure as Code**: Terraform

## Data Architecture

### Database Schema
```
Organizations (Multi-tenancy root)
├── Users & Teams
├── Projects & Repositories
├── Scans & Findings
├── Policies & Compliance
├── Integrations
├── Approvals & Audit Logs
└── Billing & Subscriptions
```

### Data Flow
1. **Scan Initiation** → Triggers async job in Celery
2. **Scanner Execution** → Security engines (Checkov, Trivy, etc.)
3. **Finding Storage** → Results persisted in PostgreSQL
4. **Analysis & Scoring** → Risk calculation engine
5. **Alerts & Notifications** → WebSocket push to clients

## Security Architecture

### Authentication & Authorization
```
┌─────────────┐
│ User Login  │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ JWT Token Generation │
│ (HS256 + RS256)      │
└──────┬───────────────┘
       │
       ▼
┌─────────────────────────┐
│ RBAC + ABAC             │
│ (6 roles, attribute-based policies)
└─────────────────────────┘
```

### Secrets Management
- AWS Secrets Manager for production secrets
- Encrypted credentials storage in database
- Rotation policies for API keys
- Audit logging for secret access

### Network Security
- VPC with public/private subnets
- Network ACLs and Security Groups
- SSL/TLS for all communications
- WAF rules for API protection
- DDoS protection via AWS Shield

### Data Protection
- Encryption at rest (RDS, S3, EBS)
- Encryption in transit (TLS 1.3)
- Row-level security in database
- Data retention policies
- Automated backups (30-day retention)

## Scalability Design

### Horizontal Scaling
- **Frontend**: Served via CloudFront CDN globally
- **API**: Kubernetes auto-scaling based on CPU/Memory
- **Database**: RDS read replicas for read-heavy workloads
- **Cache**: ElastiCache cluster with multi-AZ

### Vertical Scaling
- RDS instance type upgrade
- Kubernetes node type upgrade
- Cache node type upgrade

### Load Balancing
- AWS Application Load Balancer (Layer 7)
- Kubernetes Service load balancing
- DNS failover for multi-region (future)

## Reliability & Disaster Recovery

### High Availability
- Multi-AZ deployment for all components
- RDS automated failover (< 2 minutes)
- Kubernetes pod replica distribution
- Load balancer health checks

### Backup Strategy
```
Daily Backups (30-day retention)
↓
Weekly Archive Backups (1-year retention)
↓
Geographic Replication (cross-region)
```

### Recovery Time Objectives (RTO)
- RDS: < 2 minutes (automated failover)
- Kubernetes: < 5 minutes (pod scheduling)
- API: < 1 minute (ALB health check)

### Recovery Point Objectives (RPO)
- Database: 5 minutes (backup interval)
- Logs: Real-time (CloudWatch Logs)

## Performance Optimization

### Caching Strategy
```
┌─────────────────────────────────────────┐
│         Multi-Layer Caching              │
├─────────────────────────────────────────┤
│ 1. CDN Cache (CloudFront)               │
│    - Static assets, 24 hours            │
│ 2. Application Cache (Redis)            │
│    - API responses, 5-30 minutes        │
│ 3. Database Query Cache                 │
│    - Query results, 1-5 minutes         │
│ 4. Browser Cache                        │
│    - Static assets, 1-7 days            │
└─────────────────────────────────────────┘
```

### Database Optimization
- Connection pooling (25-100 connections)
- Query optimization with indexes
- Materialized views for dashboards
- Batch processing for large operations

### API Optimization
- Response pagination (default 10, max 100)
- Field selection (GraphQL future)
- Request compression (gzip)
- Rate limiting (100 req/min)

## Monitoring & Observability

### Metrics Collection
- **Prometheus**: System and application metrics
- **StatsD**: Application event metrics
- **OpenTelemetry**: Distributed tracing

### Log Aggregation
- **Loki**: Centralized log storage
- **CloudWatch**: AWS service logs
- **Structured logging**: JSON format for parsing

### Dashboards
```
1. System Health Dashboard
   - CPU, Memory, Network usage
   - Pod status, Node status
   
2. Application Performance Dashboard
   - Request latency, Error rate
   - Database query performance
   
3. Security Dashboard
   - Scan status, Findings trend
   - Risk score progression
   
4. Business Metrics Dashboard
   - Organizations, Projects
   - Subscriptions, Revenue
```

### Alerting
- Pod crash alerts
- Database connection pool exhaustion
- High latency alerts (p99 > 1s)
- Error rate alerts (> 1%)
- Security event alerts

## Deployment Pipeline

```
┌──────────┐
│ Git Push │
└─────┬────┘
      │
      ▼
┌──────────────────┐
│ GitHub Actions   │
│ - Lint & Format  │
│ - Run Tests      │
│ - Build Docker   │
│ - Push to ECR    │
└─────┬────────────┘
      │
      ▼
┌──────────────────┐
│ Manual Approval  │
│ (for main branch)│
└─────┬────────────┘
      │
      ▼
┌──────────────────┐
│ ArgoCD Deployment│
│ - Blue/Green     │
│ - Canary (opt.)  │
│ - Rollback ready │
└──────────────────┘
```

## Cost Optimization

### Resource Right-sizing
- Spot instances for non-critical workloads (30% savings)
- Reserved instances for baseload (40% savings)
- Auto-scaling to match demand

### Storage Optimization
- S3 intelligent tiering for old scan results
- Compression for database backups
- Regular cleanup of old logs

## Future Enhancements

1. **Multi-region Deployment**
   - Global load balancing
   - Cross-region replication

2. **Kubernetes Federation**
   - Multiple EKS clusters
   - Geo-distributed scanning

3. **Advanced Analytics**
   - ML-based anomaly detection
   - Predictive risk scoring

4. **GraphQL API**
   - More efficient data querying
   - Reduced bandwidth

5. **Mobile Applications**
   - Native iOS/Android apps
   - Push notifications
