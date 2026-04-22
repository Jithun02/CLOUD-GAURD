from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas import ProjectCreate, ProjectResponse
from models import Project, Organization

router = APIRouter()


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
):
    """Create a new project."""
    # Verify organization exists
    org = db.query(Organization).filter(Organization.id == project_data.organization_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid organization ID",
        )
    
    db_project = Project(
        organization_id=project_data.organization_id,
        team_id=project_data.team_id,
        name=project_data.name,
        description=project_data.description,
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    return db_project


@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    org_id: int = None,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    """List projects."""
    query = db.query(Project)
    
    if org_id:
        query = query.filter(Project.organization_id == org_id)
    
    projects = query.offset(skip).limit(limit).all()
    return projects


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: Session = Depends(get_db),
):
    """Get project details."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
):
    """Update project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    
    if project_data.name:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description
    
    db.commit()
    db.refresh(project)
    
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
):
    """Delete project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    
    db.delete(project)
    db.commit()
