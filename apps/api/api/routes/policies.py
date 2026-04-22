from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas import PolicyCreate, PolicyResponse
from models import Policy, PolicyVersion, Organization

router = APIRouter()


@router.post("", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_policy(
    policy_data: PolicyCreate,
    org_id: int,
    db: Session = Depends(get_db),
):
    """Create a new policy."""
    # Verify organization exists
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid organization ID",
        )
    
    # Create policy
    db_policy = Policy(
        organization_id=org_id,
        name=policy_data.name,
        description=policy_data.description,
        policy_type=policy_data.policy_type,
        content=policy_data.content,
        is_custom=True,
    )
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    
    # Create initial version
    version = PolicyVersion(
        policy_id=db_policy.id,
        version=1,
        content=policy_data.content,
    )
    db.add(version)
    db.commit()
    
    return db_policy


@router.get("", response_model=List[PolicyResponse])
async def list_policies(
    org_id: int,
    enabled_only: bool = False,
    custom_only: bool = False,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    """List policies for an organization."""
    query = db.query(Policy).filter(Policy.organization_id == org_id)
    
    if enabled_only:
        query = query.filter(Policy.is_enabled == True)
    if custom_only:
        query = query.filter(Policy.is_custom == True)
    
    policies = query.offset(skip).limit(limit).all()
    return policies


@router.get("/{policy_id}", response_model=PolicyResponse)
async def get_policy(
    policy_id: int,
    db: Session = Depends(get_db),
):
    """Get policy details."""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found",
        )
    return policy


@router.put("/{policy_id}", response_model=PolicyResponse)
async def update_policy(
    policy_id: int,
    policy_data: PolicyCreate,
    db: Session = Depends(get_db),
):
    """Update policy."""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found",
        )
    
    # Update fields
    if policy_data.name:
        policy.name = policy_data.name
    if policy_data.description is not None:
        policy.description = policy_data.description
    if policy_data.content:
        policy.content = policy_data.content
        
        # Create new version
        latest_version = db.query(PolicyVersion).filter(
            PolicyVersion.policy_id == policy_id
        ).order_by(PolicyVersion.version.desc()).first()
        
        new_version = latest_version.version + 1 if latest_version else 1
        version = PolicyVersion(
            policy_id=policy_id,
            version=new_version,
            content=policy_data.content,
        )
        db.add(version)
    
    db.commit()
    db.refresh(policy)
    
    return policy


@router.put("/{policy_id}/toggle", response_model=PolicyResponse)
async def toggle_policy(
    policy_id: int,
    db: Session = Depends(get_db),
):
    """Enable or disable policy."""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found",
        )
    
    policy.is_enabled = not policy.is_enabled
    db.commit()
    db.refresh(policy)
    
    return policy


@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_policy(
    policy_id: int,
    db: Session = Depends(get_db),
):
    """Delete policy."""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found",
        )
    
    db.delete(policy)
    db.commit()


@router.get("/{policy_id}/versions")
async def get_policy_versions(
    policy_id: int,
    db: Session = Depends(get_db),
):
    """Get policy version history."""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found",
        )
    
    versions = db.query(PolicyVersion).filter(
        PolicyVersion.policy_id == policy_id
    ).order_by(PolicyVersion.version.desc()).all()
    
    return [
        {
            "version": v.version,
            "created_at": v.created_at,
        }
        for v in versions
    ]
