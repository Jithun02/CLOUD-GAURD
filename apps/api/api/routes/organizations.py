from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas import OrganizationCreate, OrganizationResponse, OrganizationUpdate
from models import Organization, User

router = APIRouter()


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    org_data: OrganizationCreate,
    db: Session = Depends(get_db),
):
    """Create a new organization."""
    # Check if slug already exists
    existing = db.query(Organization).filter(Organization.slug == org_data.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization with this slug already exists",
        )
    
    # Create organization
    db_org = Organization(
        name=org_data.name,
        slug=org_data.slug,
        description=org_data.description,
        website=org_data.website,
    )
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    
    return db_org


@router.get("", response_model=List[OrganizationResponse])
async def list_organizations(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    """List all organizations."""
    orgs = db.query(Organization).offset(skip).limit(limit).all()
    return orgs


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: int,
    db: Session = Depends(get_db),
):
    """Get organization by ID."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    return org


@router.put("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: int,
    org_data: OrganizationUpdate,
    db: Session = Depends(get_db),
):
    """Update organization."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    
    # Update fields
    if org_data.name:
        org.name = org_data.name
    if org_data.description is not None:
        org.description = org_data.description
    if org_data.website:
        org.website = org_data.website
    if org_data.logo_url:
        org.logo_url = org_data.logo_url
    
    db.commit()
    db.refresh(org)
    
    return org


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    org_id: int,
    db: Session = Depends(get_db),
):
    """Delete organization."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    
    db.delete(org)
    db.commit()


@router.get("/{org_id}/members", response_model=List[dict])
async def list_org_members(
    org_id: int,
    db: Session = Depends(get_db),
):
    """List organization members."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    
    return [
        {
            "id": member.id,
            "email": member.email,
            "username": member.username,
            "full_name": member.full_name,
        }
        for member in org.members
    ]


@router.post("/{org_id}/members/{user_id}")
async def add_org_member(
    org_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
    """Add member to organization."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    if user not in org.members:
        org.members.append(user)
        db.commit()
    
    return {"message": "Member added successfully"}
