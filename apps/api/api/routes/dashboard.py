from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from database import get_db
from schemas import DashboardResponse, DashboardStats, RiskScoreResponse
from models import (
    Organization, Project, Scan, Finding, SeverityLevel, 
    RiskScore, ComplianceFramework, ScanStatus
)

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    org_id: int = None,
    db: Session = Depends(get_db),
):
    """Get dashboard statistics."""
    
    # Build query filters
    org_filter = Organization.id == org_id if org_id else True
    
    # Count metrics
    total_organizations = db.query(func.count(Organization.id)).filter(org_filter).scalar() or 0
    total_projects = db.query(func.count(Project.id)).scalar() or 0
    
    active_scans = db.query(func.count(Scan.id)).filter(
        Scan.status == ScanStatus.IN_PROGRESS
    ).scalar() or 0
    
    # Finding counts by severity
    critical_findings = db.query(func.count(Finding.id)).filter(
        Finding.severity == SeverityLevel.CRITICAL,
        Finding.is_resolved == False,
        Finding.false_positive == False
    ).scalar() or 0
    
    high_findings = db.query(func.count(Finding.id)).filter(
        Finding.severity == SeverityLevel.HIGH,
        Finding.is_resolved == False,
        Finding.false_positive == False
    ).scalar() or 0
    
    medium_findings = db.query(func.count(Finding.id)).filter(
        Finding.severity == SeverityLevel.MEDIUM,
        Finding.is_resolved == False,
        Finding.false_positive == False
    ).scalar() or 0
    
    low_findings = db.query(func.count(Finding.id)).filter(
        Finding.severity == SeverityLevel.LOW,
        Finding.is_resolved == False,
        Finding.false_positive == False
    ).scalar() or 0
    
    # Calculate MTTR (Mean Time To Resolution)
    resolved_findings = db.query(Finding).filter(
        Finding.is_resolved == True,
        Finding.resolved_at != None
    ).limit(100).all()
    
    mttr_hours = None
    if resolved_findings:
        total_resolution_time = sum(
            (f.resolved_at - f.created_at).total_seconds() 
            for f in resolved_findings if f.resolved_at
        )
        mttr_hours = (total_resolution_time / len(resolved_findings)) / 3600 if resolved_findings else None
    
    # Get compliance score
    compliance_framework = db.query(ComplianceFramework).filter(
        ComplianceFramework.name == "CIS AWS Foundations"
    ).first()
    
    compliance_score = compliance_framework.compliance_score if compliance_framework else 0.0
    
    return DashboardStats(
        total_organizations=total_organizations,
        total_projects=total_projects,
        active_scans=active_scans,
        critical_findings=critical_findings,
        high_findings=high_findings,
        medium_findings=medium_findings,
        low_findings=low_findings,
        compliance_score=compliance_score,
        mttr_hours=mttr_hours,
    )


@router.get("/risk-score", response_model=RiskScoreResponse)
async def get_risk_score(
    org_id: int = None,
    db: Session = Depends(get_db),
):
    """Get organization risk score."""
    
    risk_score = db.query(RiskScore).filter(
        RiskScore.organization_id == org_id if org_id else True
    ).order_by(RiskScore.updated_at.desc()).first()
    
    if not risk_score:
        # Return default if not found
        return RiskScoreResponse(
            overall_score=0.0,
            asset_score=0.0,
            vulnerability_score=0.0,
            access_score=0.0,
            compliance_score=0.0,
            calculated_at=datetime.utcnow(),
        )
    
    return risk_score


@router.get("/recent-scans")
async def get_recent_scans(
    org_id: int = None,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    """Get recent scans."""
    query = db.query(Scan).order_by(Scan.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": scan.id,
            "repository_id": scan.repository_id,
            "scan_type": scan.scan_type,
            "status": scan.status.value,
            "findings_count": scan.findings_count,
            "risk_score": scan.risk_score,
            "created_at": scan.created_at,
            "completed_at": scan.completed_at,
        }
        for scan in query
    ]


@router.get("/recent-findings")
async def get_recent_findings(
    org_id: int = None,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    """Get recent findings."""
    query = db.query(Finding).order_by(Finding.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": finding.id,
            "scan_id": finding.scan_id,
            "rule_name": finding.rule_name,
            "severity": finding.severity.value,
            "is_resolved": finding.is_resolved,
            "created_at": finding.created_at,
        }
        for finding in query
    ]


@router.get("/compliance-summary")
async def get_compliance_summary(
    org_id: int = None,
    db: Session = Depends(get_db),
):
    """Get compliance framework summary."""
    frameworks = db.query(ComplianceFramework).filter(
        ComplianceFramework.organization_id == org_id if org_id else True
    ).all()
    
    return [
        {
            "name": f.name,
            "compliance_score": f.compliance_score,
            "passed_checks": f.passed_checks,
            "failed_checks": f.failed_checks,
            "last_scan_at": f.last_scan_at,
        }
        for f in frameworks
    ]


@router.get("/findings-trend")
async def get_findings_trend(
    org_id: int = None,
    days: int = 30,
    db: Session = Depends(get_db),
):
    """Get findings trend over time."""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    findings = db.query(Finding).filter(
        Finding.created_at >= start_date
    ).all()
    
    # Group by date
    trend = {}
    for finding in findings:
        date_key = finding.created_at.date().isoformat()
        if date_key not in trend:
            trend[date_key] = {
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0,
                "info": 0,
            }
        
        severity = finding.severity.value
        if severity in trend[date_key]:
            trend[date_key][severity] += 1
    
    return sorted(trend.items())


@router.get("/top-risky-repositories")
async def get_top_risky_repositories(
    org_id: int = None,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    """Get repositories with highest risk scores."""
    scans = db.query(Scan).order_by(Scan.risk_score.desc()).limit(limit).all()
    
    return [
        {
            "repository_id": scan.repository_id,
            "risk_score": scan.risk_score,
            "findings_count": scan.findings_count,
            "critical_count": scan.critical_count,
            "high_count": scan.high_count,
        }
        for scan in scans
    ]


@router.get("/vulnerabilities-by-cloud")
async def get_vulnerabilities_by_cloud(
    org_id: int = None,
    db: Session = Depends(get_db),
):
    """Get vulnerability distribution by cloud provider."""
    findings = db.query(Finding).filter(
        Finding.is_resolved == False,
        Finding.false_positive == False
    ).all()
    
    cloud_summary = {
        "aws": {"critical": 0, "high": 0, "medium": 0, "low": 0},
        "azure": {"critical": 0, "high": 0, "medium": 0, "low": 0},
        "gcp": {"critical": 0, "high": 0, "medium": 0, "low": 0},
        "kubernetes": {"critical": 0, "high": 0, "medium": 0, "low": 0},
    }
    
    for finding in findings:
        resource_type = finding.resource_type or "unknown"
        
        # Determine cloud provider
        cloud = None
        if resource_type.startswith("aws"):
            cloud = "aws"
        elif resource_type.startswith("azure"):
            cloud = "azure"
        elif resource_type.startswith("gcp"):
            cloud = "gcp"
        elif resource_type.startswith("kubernetes"):
            cloud = "kubernetes"
        
        if cloud and cloud in cloud_summary:
            severity = finding.severity.value
            if severity in cloud_summary[cloud]:
                cloud_summary[cloud][severity] += 1
    
    return cloud_summary
