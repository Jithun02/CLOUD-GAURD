# CloudGuard Deployment Guide

## Local Development Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+
- PostgreSQL 15
- Redis 7

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/cloudguard.git
cd cloudguard
```

2. **Set up environment variables**
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

3. **Start services with Docker Compose**
```bash
docker-compose up -d
```

4. **Initialize database**
```bash
cd apps/api
alembic upgrade head
```

5. **Access the application**
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Production Deployment

### AWS EKS Deployment

#### Prerequisites
- AWS Account with appropriate permissions
- Terraform >= 1.0
- kubectl configured
- AWS CLI v2

#### Steps

1. **Prepare Terraform variables**
```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your configuration
```

2. **Initialize Terraform**
```bash
terraform init
```

3. **Plan deployment**
```bash
terraform plan -out=tfplan
```

4. **Apply configuration**
```bash
terraform apply tfplan
```

5. **Configure kubectl**
```bash
aws eks update-kubeconfig --region us-east-1 --name cloudguard-cluster
```

6. **Deploy application with Helm**
```bash
cd infra/helm
helm install cloudguard ./cloudguard -f values.yaml
```

### Environment Variables

Required environment variables for production:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/cloudguard

# Redis
REDIS_URL=redis://host:6379/0

# AWS
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=us-east-1

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GITHUB_CLIENT_ID=your_github_client_id

# Stripe (for billing)
STRIPE_SECRET_KEY=your_stripe_key
```

### Database Migrations

```bash
# Run migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Monitoring Setup

1. **Prometheus** - Metrics collection
```bash
kubectl apply -f infra/kubernetes/prometheus/
```

2. **Grafana** - Dashboards
```bash
kubectl apply -f infra/kubernetes/grafana/
```

3. **Loki** - Log aggregation
```bash
kubectl apply -f infra/kubernetes/loki/
```

### Backup & Recovery

#### Database Backups
```bash
# AWS RDS automated backups are enabled with 30-day retention

# Manual backup
aws rds create-db-snapshot \
  --db-instance-identifier cloudguard-db \
  --db-snapshot-identifier cloudguard-backup-$(date +%Y%m%d)
```

#### Restore from Snapshot
```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier cloudguard-db-restored \
  --db-snapshot-identifier cloudguard-backup-20240101
```

### Scaling

#### Horizontal Scaling (Kubernetes)
```bash
# Scale API deployment
kubectl scale deployment cloudguard-api --replicas=5

# Autoscaling
kubectl apply -f infra/kubernetes/hpa.yaml
```

#### Vertical Scaling (RDS)
```bash
terraform apply -var="db_instance_class=db.t3.xlarge"
```

### Security Hardening

1. **Enable WAF**
```bash
# Apply WAF rules via AWS console or CloudFormation
```

2. **Certificate Management**
```bash
# Use ACM for TLS certificates
```

3. **Secrets Management**
```bash
# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret --name cloudguard/api-key
```

4. **Network Security**
- Enable VPC Flow Logs
- Configure Security Groups
- Enable NACLs

### Troubleshooting

#### API not responding
```bash
# Check pods
kubectl get pods -n cloudguard

# View logs
kubectl logs -f deployment/cloudguard-api -n cloudguard

# Describe pod
kubectl describe pod <pod-name> -n cloudguard
```

#### Database connection issues
```bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier cloudguard-db

# Test connection
psql -h <rds-endpoint> -U postgres -d cloudguard
```

#### Redis connectivity
```bash
# Connect to Redis
redis-cli -h <redis-endpoint> -p 6379 ping
```

### Performance Tuning

1. **Database**
- Enable connection pooling
- Optimize slow queries
- Configure indexes

2. **Redis**
- Monitor memory usage
- Configure eviction policies
- Enable persistence

3. **Kubernetes**
- Configure resource limits
- Enable autoscaling
- Use node affinity

## CI/CD Pipeline

GitHub Actions automatically:
1. Runs linting and tests
2. Builds Docker images
3. Pushes to ECR
4. Deploys to EKS

Push to `main` branch to trigger deployment to production.

## Rollback Procedure

```bash
# Kubernetes rollback
kubectl rollout undo deployment/cloudguard-api

# Terraform rollback
git revert <commit-hash>
terraform apply
```
