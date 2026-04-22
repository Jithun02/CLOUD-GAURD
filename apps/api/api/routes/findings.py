from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas import FindingResponse, FindingDetailResponse
from models import Finding, Scan, SeverityLevel
from datetime import datetime

router = APIRouter()


@router.get("", response_model=List[FindingResponse])
async def list_findings(
    scan_id: int = None,
    severity: str = None,
    resolved: bool = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List findings."""
    query = db.query(Finding)
    
    if scan_id:
        query = query.filter(Finding.scan_id == scan_id)
    if severity:
        query = query.filter(Finding.severity == severity)
    if resolved is not None:
        query = query.filter(Finding.is_resolved == resolved)
    
    findings = query.order_by(Finding.created_at.desc()).offset(skip).limit(limit).all()
    return findings


@router.get("/{finding_id}", response_model=FindingDetailResponse)
async def get_finding(
    finding_id: int,
    db: Session = Depends(get_db),
):
    """Get finding details."""
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finding not found",
        )
    return finding


@router.put("/{finding_id}/resolve", response_model=FindingResponse)
async def resolve_finding(
    finding_id: int,
    db: Session = Depends(get_db),
):
    """Mark finding as resolved."""
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finding not found",
        )
    
    finding.is_resolved = True
    finding.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(finding)
    
    return finding


@router.put("/{finding_id}/unresolve", response_model=FindingResponse)
async def unresolve_finding(
    finding_id: int,
    db: Session = Depends(get_db),
):
    """Mark finding as unresolved."""
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finding not found",
        )
    
    finding.is_resolved = False
    finding.resolved_at = None
    db.commit()
    db.refresh(finding)
    
    return finding


@router.put("/{finding_id}/false-positive", response_model=FindingResponse)
async def mark_false_positive(
    finding_id: int,
    db: Session = Depends(get_db),
):
    """Mark finding as false positive."""
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finding not found",
        )
    
    finding.false_positive = True
    finding.is_resolved = True
    finding.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(finding)
    
    return finding


@router.get("/by-severity/summary")
async def get_findings_by_severity(
    scan_id: int = None,
    db: Session = Depends(get_db),
):
    """Get findings grouped by severity."""
    query = db.query(Finding)
    
    if scan_id:
        query = query.filter(Finding.scan_id == scan_id)
    
    findings = query.all()
    
    summary = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
        "info": 0,
    }
    
    for finding in findings:
        if not finding.is_resolved and not finding.false_positive:
            if finding.severity == SeverityLevel.CRITICAL:
                summary["critical"] += 1
            elif finding.severity == SeverityLevel.HIGH:
                summary["high"] += 1
            elif finding.severity == SeverityLevel.MEDIUM:
                summary["medium"] += 1
            elif finding.severity == SeverityLevel.LOW:
                summary["low"] += 1
            elif finding.severity == SeverityLevel.INFO:
                summary["info"] += 1
    
    return summary


@router.get("/by-resource/summary")
async def get_findings_by_resource(
    scan_id: int = None,
    db: Session = Depends(get_db),
):
    """Get findings grouped by resource type."""
    query = db.query(Finding)
    
    if scan_id:
        query = query.filter(Finding.scan_id == scan_id)
    
    findings = query.all()
    
    summary = {}
    for finding in findings:
        resource_type = finding.resource_type or "unknown"
        if resource_type not in summary:
            summary[resource_type] = 0
        summary[resource_type] += 1
    
    return summary
