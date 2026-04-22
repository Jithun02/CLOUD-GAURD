# CloudGuard - Policy as Code Security Enforcement Platform

An enterprise-grade SaaS platform for automated cloud security governance across AWS, Azure, GCP, Kubernetes, and Terraform environments.

## 🎯 Product Vision

CloudGuard is a modern, scalable security governance platform that enables enterprises to:
- Enforce security policies across multi-cloud environments
- Automate infrastructure-as-code scanning
- Detect and remediate security misconfigurations in real-time
- Maintain compliance with industry frameworks (CIS, SOC2, ISO27001, PCI-DSS, HIPAA, GDPR)
- Integrate seamlessly into CI/CD pipelines

## 🏗️ Architecture

### Monorepo Structure
```
.
├── apps/
│   ├── web/                 # Next.js 15 SaaS frontend
│   ├── api/                 # FastAPI backend
│   └── worker/              # Celery/Dramatiq background jobs
├── packages/
│   ├── ui/                  # ShadCN UI components
│   ├── types/               # Shared TypeScript types
│   └── policies/            # Policy definitions
├── infra/
│   ├── terraform/           # AWS infrastructure as code
│   ├── kubernetes/          # K8s manifests
│   └── helm/                # Helm charts
├── .github/workflows/       # CI/CD pipelines
└── docs/                    # Documentation

```

## 🔧 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **ShadCN UI** - Component library
- **TanStack Query** - Data fetching
- **Zustand** - State management
- **Recharts** - Data visualization
- **Framer Motion** - Animations

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Primary database
- **SQLAlchemy** - ORM
- **Redis** - Caching and queue
- **Celery/Dramatiq** - Background tasks
- **gRPC** - Internal services

### Security Engines
- **Open Policy Agent (OPA/Rego)** - Policy enforcement
- **Checkov** - IaC scanning
- **Trivy** - Vulnerability scanning
- **Semgrep** - Code pattern matching
- **Custom Rule Engine** - Organization-specific rules
- **Secret Detection** - API keys and credentials

### Infrastructure
- **Docker** - Containerization
- **Kubernetes** - Orchestration
- **Helm** - K8s package management
- **Terraform** - IaC
- **GitHub Actions** - CI/CD
- **ArgoCD** - GitOps deployment

### Cloud Integrations
- AWS (IAM, S3, Config, CloudTrail)
- Azure (AD, Defender, Blob)
- GCP (IAM, GCS, SCC)

### Monitoring
- **Prometheus** - Metrics collection
- **Grafana** - Visualization
- **Loki** - Log aggregation
- **OpenTelemetry** - Tracing

## 📋 Enterprise Features

1. **Multi-Tenant SaaS** - Organizations, Workspaces, Teams, Projects
2. **Identity & Access Control** - RBAC + ABAC with 6 roles
3. **Repository Integrations** - GitHub, GitLab, Bitbucket, Azure DevOps
4. **CI/CD Security Gates** - Auto-block deployments on critical findings
5. **IaC Security Scanner** - Terraform, CloudFormation, K8s YAML, Helm, Dockerfiles
6. **Runtime Cloud Security** - Live cloud posture scanning
7. **Kubernetes Security** - Workload and cluster scanning
8. **Secrets Detection** - AWS Keys, Private Keys, Tokens, Passwords
9. **Compliance Engine** - Multi-framework compliance reporting
10. **AI Copilot** - ML-powered insights and remediation suggestions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7

### Development Setup

```bash
# Install dependencies
npm install

# Setup backend
cd apps/api
pip install -r requirements.txt
alembic upgrade head

# Run frontend dev server
cd apps/web
npm run dev

# Run backend dev server
cd apps/api
uvicorn main:app --reload

# Run worker
cd apps/worker
celery -A tasks worker --loglevel=info
```

## 📊 Database Schema

Core entities:
- Users & Authentication
- Organizations & Teams
- Projects & Repositories
- Scans & Findings
- Policies & Compliance
- Approvals & Audit Logs
- Billing & Subscriptions

## 🔐 Security Features

- OWASP Top 10 protection
- CSRF protection
- Rate limiting & DDoS protection
- API key management
- Secrets in vault
- Row-level security
- Encrypted backups
- WAF support

## 📈 Deployment

### Production
- Frontend: Vercel/CloudFront
- Backend: Kubernetes on EKS
- Database: AWS RDS Multi-AZ
- Queue: Redis
- Storage: S3
- CDN: CloudFront

## 📖 Documentation

- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Architecture Guide](./docs/architecture.md)
- [Contributing Guide](./docs/CONTRIBUTING.md)

## 📄 License

MIT License - See LICENSE file for details
