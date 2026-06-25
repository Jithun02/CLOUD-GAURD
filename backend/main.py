# backend/main.py
import time
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from prometheus_client import Counter, Gauge, generate_latest, CONTENT_TYPE_LATEST

from backend.scanner import scan_file
from backend.policies_data import POLICIES_LIST

app = FastAPI(title="PolicySync API", version="1.2.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Start time for uptime metric
START_TIME = time.time()

# Prometheus Metrics definition
scans_counter = Counter("policysync_scans_total", "Total number of scans executed")
scans_passed_counter = Counter("policysync_scans_passed_total", "Total number of scans that passed")
scans_failed_counter = Counter("policysync_scans_failed_total", "Total number of scans that failed")
violations_counter = Counter("policysync_violations_total", "Total number of violations found")
violations_by_severity = Counter(
    "policysync_violations_total_by_severity", 
    "Total violations by severity", 
    ["severity"]
)
violations_by_provider = Counter(
    "policysync_violations_total_by_provider", 
    "Total violations by provider", 
    ["provider"]
)
active_policies_gauge = Gauge("policysync_active_policies", "Number of active policies in library")
pipeline_runs_counter = Counter("policysync_pipeline_runs_total", "Total CI/CD pipeline runs")
pipeline_blocked_counter = Counter("policysync_pipeline_blocked_total", "Total pipeline runs blocked due to policy violations")
uptime_gauge = Gauge("policysync_uptime_seconds", "Uptime of the PolicySync service in seconds")

# Set static metric values
active_policies_gauge.set(len(POLICIES_LIST))

# In-memory scan history and stats store
scan_history = []

# Prepopulate history with mock entries from the PDF (Figure 9.4 and Figure B.2)
mock_scans = [
    {
        "id": str(uuid.uuid4()),
        "filename": "infra/main.tf",
        "cloud": "AWS",
        "timestamp": "2026-06-25T08:30:00Z",
        "status": "failed",
        "source": "WEB",
        "violations": [
            {
                "id": "AWS-001",
                "name": "Hardcoded AWS Credentials",
                "severity": "CRITICAL",
                "cloud": "AWS",
                "category": "IAM / Security Best Practices",
                "line": 15,
                "code": "access_key = \"AKIAIDSFODNN7EXAMPLE\"",
                "context": "13 | provider \"aws\" {\n14 |   region     = \"us-east-1\"\n15 |   access_key = \"AKIAIDSFODNN7EXAMPLE\"      # <-- Detected violation\n16 |   secret_key = \"wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\"\n17 | }",
                "resource": "provider \"aws\"",
                "message": "AWS access keys or secret keys hardcoded in configuration.",
                "fix": "Use IAM roles or AWS Secrets Manager."
            },
            {
                "id": "AWS-002",
                "name": "S3 Public Access",
                "severity": "CRITICAL",
                "cloud": "AWS",
                "category": "Storage / Data Protection",
                "line": 52,
                "code": "acl    = \"public-read\"",
                "context": "50 | resource \"aws_s3_bucket\" \"user_uploads\" {\n51 |   bucket = \"startup-user-uploads\"\n52 |   acl    = \"public-read\"      # <-- Detected violation\n53 | }",
                "resource": "aws_s3_bucket \"user_uploads\"",
                "message": "S3 bucket is configured with a public ACL, exposing data to the public internet.",
                "fix": "Set acl = 'private' and use aws_s3_bucket_public_access_block."
            },
            {
                "id": "AWS-003",
                "name": "Open Security Group (0.0.0.0/0)",
                "severity": "HIGH",
                "cloud": "AWS",
                "category": "Networking / Firewalls",
                "line": 64,
                "code": "cidr_blocks      = [\"0.0.0.0/0\"]",
                "context": "62 |   ingress {\n63 |     protocol    = \"tcp\"\n64 |     cidr_blocks = [\"0.0.0.0/0\"]      # <-- Detected violation\n65 |   }",
                "resource": "aws_security_group \"everything_open\"",
                "message": "Security group rules allow ingress traffic from any IP address (0.0.0.0/0) on sensitive ports or protocols.",
                "fix": "Restrict cidr_blocks to specific IP ranges or VPC subnets."
            }
        ],
        "summary": {"critical": 2, "high": 1, "medium": 0, "low": 0, "total": 3},
        "engine": "built-in"
    },
    {
        "id": "webhook-scan-1",
        "filename": "database/rds.tf",
        "cloud": "AWS",
        "timestamp": "2026-06-25T08:15:00Z",
        "status": "failed",
        "source": "WEBHOOK",
        "branch": "feature/db-setup",
        "pusher": "abishadh",
        "violations": [
            {
                "id": "AWS-005",
                "name": "RDS Public Access",
                "severity": "HIGH",
                "cloud": "AWS",
                "category": "Database / Security",
                "line": 18,
                "code": "publicly_accessible    = true",
                "context": "16 | resource \"aws_db_instance\" \"production_db\" {\n17 |   engine                 = \"postgres\"\n18 |   publicly_accessible    = true      # <-- Detected violation\n19 | }",
                "resource": "aws_db_instance \"production_db\"",
                "message": "RDS database instances are set to public, allowing connection attempts from outside the VPC.",
                "fix": "Set publicly_accessible = false and deploy database in private subnets."
            },
            {
                "id": "AWS-006",
                "name": "Hardcoded Password",
                "severity": "CRITICAL",
                "cloud": "AWS",
                "category": "Security Best Practices",
                "line": 20,
                "code": "password               = \"db_password_123_unsafe!\"",
                "context": "18 |   publicly_accessible    = true\n19 |   username               = \"db_admin\"\n20 |   password               = \"db_password_123_unsafe!\"      # <-- Detected violation\n21 | }",
                "resource": "aws_db_instance \"production_db\"",
                "message": "Plaintext passwords hardcoded in resources like databases, virtual machines, or local variables.",
                "fix": "Pass passwords via secure input variables or load them from Secrets Manager."
            }
        ],
        "summary": {"critical": 1, "high": 1, "medium": 0, "low": 0, "total": 2},
        "engine": "built-in"
    },
    {
        "id": "webhook-scan-2",
        "filename": "k8s/payment-service.yaml",
        "cloud": "Kubernetes",
        "timestamp": "2026-06-25T07:45:00Z",
        "status": "failed",
        "source": "WEBHOOK",
        "branch": "main",
        "pusher": "jithu",
        "violations": [
            {
                "id": "K8S-001",
                "name": "Container Running as Root",
                "severity": "HIGH",
                "cloud": "Kubernetes",
                "category": "Container Security",
                "line": 23,
                "code": "runAsNonRoot: false",
                "context": "21 |           securityContext:\n22 |             privileged: true\n23 |             runAsNonRoot: false      # <-- Detected violation\n24 |             runAsUser: 0",
                "resource": "Deployment",
                "message": "Kubernetes pod container runs as the root user (UID 0), granting full root permissions inside the container.",
                "fix": "Set runAsNonRoot: true and define a non-zero runAsUser (e.g. 1000)."
            },
            {
                "id": "K8S-002",
                "name": "Privileged Container",
                "severity": "CRITICAL",
                "cloud": "Kubernetes",
                "category": "Container Security",
                "line": 22,
                "code": "privileged: true",
                "context": "20 |         - name: payment-api\n21 |           securityContext:\n22 |             privileged: true      # <-- Detected violation\n23 |             runAsNonRoot: false",
                "resource": "Deployment",
                "message": "Container is running with privileged mode enabled, giving it access to the host node's kernel and devices.",
                "fix": "Set privileged: false and request specific Linux capabilities instead."
            }
        ],
        "summary": {"critical": 1, "high": 1, "medium": 0, "low": 0, "total": 2},
        "engine": "built-in"
    },
    {
        "id": "secure-scan-1",
        "filename": "infra/main-fixed.tf",
        "cloud": "AWS",
        "timestamp": "2026-06-25T07:30:00Z",
        "status": "passed",
        "source": "WEB",
        "violations": [],
        "summary": {"critical": 0, "high": 0, "medium": 0, "low": 0, "total": 0},
        "engine": "built-in"
    }
]

scan_history.extend(mock_scans)

# Update initial prometheus metrics based on prepopulated list
for s in mock_scans:
    scans_counter.inc()
    if s["status"] == "passed":
        scans_passed_counter.inc()
    else:
        scans_failed_counter.inc()
    for v in s["violations"]:
        violations_counter.inc()
        violations_by_severity.labels(severity=v["severity"]).inc()
        violations_by_provider.labels(provider=v["cloud"]).inc()

class ScanRequest(BaseModel):
    content: str
    filename: str
    cloud: str

class WebhookRequest(BaseModel):
    repository: Dict
    pusher: Dict
    ref: str
    commits: List[Dict]

@app.get("/")
def get_health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "PolicySync Security Scanner"
    }

@app.post("/api/scan")
def run_scan(request: ScanRequest):
    result = scan_file(request.content, request.filename, request.cloud)
    
    # Save scan record to history
    record_status = "failed" if result["violations"] else "passed"
    record = {
        "id": str(uuid.uuid4()),
        "filename": request.filename,
        "cloud": request.cloud,
        "timestamp": datetime.utcnow().isoformat(),
        "status": record_status,
        "violations": result["violations"],
        "summary": result["summary"],
        "engine": result["engine"],
        "source": "WEB"
    }
    
    scan_history.insert(0, record)
    
    # Update metrics
    scans_counter.inc()
    if record_status == "passed":
        scans_passed_counter.inc()
    else:
        scans_failed_counter.inc()
        
    for v in result["violations"]:
        violations_counter.inc()
        violations_by_severity.labels(severity=v["severity"]).inc()
        violations_by_provider.labels(provider=request.cloud).inc()
        
    return record

@app.get("/api/history")
def get_history(status: Optional[str] = None, page: int = 1, limit: int = 10):
    filtered = scan_history
    if status:
        filtered = [s for s in scan_history if s["status"].lower() == status.lower()]
        
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    
    return {
        "scans": filtered[start_idx:end_idx],
        "total": len(filtered),
        "page": page,
        "limit": limit
    }

@app.get("/api/stats")
def get_stats():
    # Gather aggregate statistics
    all_violations = [v for s in scan_history for v in s.get("violations", [])]
    
    total_scans = len(scan_history)
    passed_scans = sum(1 for s in scan_history if s["status"] == "passed")
    failed_scans = total_scans - passed_scans
    
    # Setup standard trend data
    trend_data = [
        {"date": "2026-06-19", "scans": 12, "passed": 9, "failed": 3, "violations": 8},
        {"date": "2026-06-20", "scans": 15, "passed": 12, "failed": 3, "violations": 7},
        {"date": "2026-06-21", "scans": 18, "passed": 14, "failed": 4, "violations": 10},
        {"date": "2026-06-22", "scans": 14, "passed": 10, "failed": 4, "violations": 9},
        {"date": "2026-06-23", "scans": 22, "passed": 18, "failed": 4, "violations": 6},
        {"date": "2026-06-24", "scans": 25, "passed": 20, "failed": 5, "violations": 12},
        {"date": "2026-06-25", "scans": total_scans, "passed": passed_scans, "failed": failed_scans, "violations": len(all_violations)}
    ]
    
    # Top violated rules helper
    violations_counts = {}
    for v in all_violations:
        violations_counts[v["id"]] = violations_counts.get(v["id"], 0) + 1
        
    top_violated = []
    for policy in POLICIES_LIST:
        hits = violations_counts.get(policy["id"], 0)
        if hits > 0 or len(top_violated) < 5: # include at least some policies even if 0 hits
            top_violated.append({
                "id": policy["id"],
                "name": policy["name"],
                "severity": policy["severity"],
                "hits": hits
            })
    
    # Sort top violated by hits descending
    top_violated = sorted(top_violated, key=lambda x: x["hits"], reverse=True)[:5]
    
    severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for v in all_violations:
        sev = v["severity"].upper()
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
        
    return {
        "total_scans": total_scans + 1283, # adding mock base
        "passed_scans": passed_scans + 958,
        "failed_scans": failed_scans + 325,
        "critical_violations": severity_counts["CRITICAL"] + 140,
        "high_violations": severity_counts["HIGH"] + 310,
        "medium_violations": severity_counts["MEDIUM"] + 214,
        "low_violations": severity_counts["LOW"] + 74,
        "total_violations": len(all_violations) + 738,
        "policies_active": len(POLICIES_LIST),
        "trend": trend_data,
        "top_violated": top_violated
    }

@app.get("/api/policies")
def get_policies():
    return POLICIES_LIST

@app.get("/api/policies/{policy_id}")
def get_policy(policy_id: str):
    for policy in POLICIES_LIST:
        if policy["id"].upper() == policy_id.upper():
            return policy
    raise HTTPException(status_code=404, detail="Policy not found")

@app.post("/webhook/github")
async def github_webhook(request: Request):
    try:
        payload = await request.json()
        
        repo_name = payload.get("repository", {}).get("full_name", "unknown/repo")
        pusher = payload.get("pusher", {}).get("name", "unknown")
        ref = payload.get("ref", "refs/heads/main")
        branch = ref.split("/")[-1] if "/" in ref else ref
        
        # In a real app we'd fetch the commit contents. Here we simulate scanning the commit files.
        # Check commits for files modified and mock scan
        commits = payload.get("commits", [])
        scanned_files = []
        violations = []
        
        # Default to a mock commit scan depending on branch
        # Let's say if it is feature/db, we scan a bad db config
        filename = "infra/main.tf"
        cloud = "AWS"
        file_content = """
        provider "aws" {
          region     = "us-east-1"
          access_key = "AKIAIDSFODNN7EXAMPLE"
          secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        }
        """
        
        if "db" in branch:
            filename = "database/rds.tf"
            cloud = "AWS"
            file_content = "password = \"unsafe_password_123!\""
        elif "k8s" in branch or "payment" in branch:
            filename = "k8s/payment-service.yaml"
            cloud = "Kubernetes"
            file_content = "privileged: true"
        elif "fixed" in branch or "secure" in branch:
            filename = "infra/main-fixed.tf"
            cloud = "AWS"
            file_content = "acl = \"private\""
            
        result = scan_file(file_content, filename, cloud)
        record_status = "failed" if result["violations"] else "passed"
        
        record = {
            "id": str(uuid.uuid4()),
            "filename": filename,
            "cloud": cloud,
            "timestamp": datetime.utcnow().isoformat(),
            "status": record_status,
            "violations": result["violations"],
            "summary": result["summary"],
            "engine": result["engine"],
            "source": "WEBHOOK",
            "branch": branch,
            "pusher": pusher
        }
        
        scan_history.insert(0, record)
        
        # Update metrics
        scans_counter.inc()
        pipeline_runs_counter.inc()
        if record_status == "passed":
            scans_passed_counter.inc()
        else:
            scans_failed_counter.inc()
            pipeline_blocked_counter.inc()
            
        for v in result["violations"]:
            violations_counter.inc()
            violations_by_severity.labels(severity=v["severity"]).inc()
            violations_by_provider.labels(provider=cloud).inc()
            
        return {
            "status": "processed",
            "scan_id": record["id"],
            "result": record_status,
            "violations_found": len(result["violations"])
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid webhook payload: {str(e)}")

@app.get("/metrics")
def get_metrics():
    # Update uptime metric
    uptime_gauge.set(time.time() - START_TIME)
    
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
