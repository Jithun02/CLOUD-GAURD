from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from schemas import ScanCreate, ScanResponse
from models import Scan, Repository, ScanStatus

router = APIRouter()


def run_scan_task(scan_id: int, db: Session):
    """Background task to run security scan."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        return
    
    scan.status = ScanStatus.IN_PROGRESS
    scan.started_at = datetime.utcnow()
    db.commit()
    
    try:
        # TODO: Integrate with Checkov, Trivy, Semgrep, OPA
        # This is where the actual scanning logic would go
        
        scan.status = ScanStatus.COMPLETED
        scan.completed_at = datetime.utcnow()
        if scan.started_at:
            scan.duration = int((scan.completed_at - scan.started_at).total_seconds())
    except Exception as e:
        scan.status = ScanStatus.FAILED
        scan.completed_at = datetime.utcnow()
    
    db.commit()


@router.post("", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
async def create_scan(
    scan_data: ScanCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Create and trigger a security scan."""
    # Verify repository exists
    repo = db.query(Repository).filter(Repository.id == scan_data.repository_id).first()
    if not repo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid repository ID",
        )
    
    # Create scan
    db_scan = Scan(
        repository_id=scan_data.repository_id,
        scan_type=scan_data.scan_type,
        status=ScanStatus.PENDING,
    )
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)
    
    # Queue background task
    background_tasks.add_task(run_scan_task, db_scan.id, db)
    
    return db_scan


@router.get("", response_model=List[ScanResponse])
async def list_scans(
    repo_id: int = None,
    status: str = None,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    """List scans."""
    query = db.query(Scan)
    
    if repo_id:
        query = query.filter(Scan.repository_id == repo_id)
    if status:
        query = query.filter(Scan.status == status)
    
    scans = query.order_by(Scan.created_at.desc()).offset(skip).limit(limit).all()
    return scans


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(
    scan_id: int,
    db: Session = Depends(get_db),
):
    """Get scan details."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found",
        )
    return scan


@router.post("/{scan_id}/retry", response_model=ScanResponse)
async def retry_scan(
    scan_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Retry a failed scan."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found",
        )
    
    if scan.status != ScanStatus.FAILED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only retry failed scans",
        )
    
    scan.status = ScanStatus.PENDING
    scan.started_at = None
    scan.completed_at = None
    scan.duration = None
    db.commit()
    db.refresh(scan)
    
    # Queue background task
    background_tasks.add_task(run_scan_task, scan.id, db)
    
    return scan


@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scan(
    scan_id: int,
    db: Session = Depends(get_db),
):
    """Delete scan and its findings."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found",
        )
    
    db.delete(scan)
    db.commit()
