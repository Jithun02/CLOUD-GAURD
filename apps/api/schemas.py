from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List
from models import UserRole, SeverityLevel, ScanStatus


# ============================================================================
# USER & AUTH SCHEMAS
# ============================================================================

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    email_verified: bool
    avatar_url: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


# ============================================================================
# ORGANIZATION SCHEMAS
# ============================================================================

class OrganizationBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    website: Optional[str] = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None


class OrganizationResponse(OrganizationBase):
    id: int
    logo_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# TEAM SCHEMAS
# ============================================================================

class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None


class TeamCreate(TeamBase):
    pass


class TeamMemberResponse(BaseModel):
    id: int
    user_id: int
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True


class TeamResponse(TeamBase):
    id: int
    organization_id: int
    created_at: datetime
    members: List[TeamMemberResponse] = []

    class Config:
        from_attributes = True


# ============================================================================
# PROJECT SCHEMAS
# ============================================================================

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    team_id: Optional[int] = None


class ProjectResponse(ProjectBase):
    id: int
    organization_id: int
    team_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# REPOSITORY SCHEMAS
# ============================================================================

class RepositoryBase(BaseModel):
    name: str
    url: str
    provider: str
    external_id: str


class RepositoryCreate(RepositoryBase):
    project_id: int
    branch: Optional[str] = "main"


class RepositoryResponse(RepositoryBase):
    id: int
    project_id: int
    branch: str
    last_scan_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# SCAN SCHEMAS
# ============================================================================

class ScanBase(BaseModel):
    scan_type: str
    status: ScanStatus = ScanStatus.PENDING


class ScanCreate(ScanBase):
    repository_id: int


class ScanResponse(ScanBase):
    id: int
    repository_id: int
    findings_count: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    info_count: int
    risk_score: float
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# FINDING SCHEMAS
# ============================================================================

class FindingBase(BaseModel):
    rule_id: str
    rule_name: str
    severity: SeverityLevel
    description: Optional[str] = None
    remediation: Optional[str] = None


class FindingResponse(FindingBase):
    id: int
    scan_id: int
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    is_resolved: bool
    false_positive: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FindingDetailResponse(FindingResponse):
    resource_details: Optional[dict] = None
    compliance_frameworks: Optional[list] = None
    remediation_code: Optional[str] = None


# ============================================================================
# POLICY SCHEMAS
# ============================================================================

class PolicyBase(BaseModel):
    name: str
    description: Optional[str] = None
    policy_type: str
    content: str


class PolicyCreate(PolicyBase):
    pass


class PolicyResponse(PolicyBase):
    id: int
    organization_id: int
    is_enabled: bool
    is_custom: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# COMPLIANCE SCHEMAS
# ============================================================================

class ComplianceFrameworkResponse(BaseModel):
    id: int
    name: str
    compliance_score: float
    passed_checks: int
    failed_checks: int
    last_scan_at: Optional[datetime] = None
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# DASHBOARD SCHEMAS
# ============================================================================

class RiskScoreResponse(BaseModel):
    overall_score: float
    asset_score: float
    vulnerability_score: float
    access_score: float
    compliance_score: float
    calculated_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_organizations: int
    total_projects: int
    active_scans: int
    critical_findings: int
    high_findings: int
    medium_findings: int
    low_findings: int
    compliance_score: float
    mttr_hours: Optional[float] = None


class DashboardResponse(BaseModel):
    stats: DashboardStats
    risk_score: RiskScoreResponse
    recent_scans: List[ScanResponse]
    recent_findings: List[FindingResponse]


# ============================================================================
# INTEGRATION SCHEMAS
# ============================================================================

class IntegrationCreate(BaseModel):
    provider: str
    name: str
    credentials: dict


class IntegrationResponse(BaseModel):
    id: int
    provider: str
    name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# AUDIT LOG SCHEMAS
# ============================================================================

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    details: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# APPROVAL SCHEMAS
# ============================================================================

class ApprovalCreate(BaseModel):
    finding_id: int
    reason: Optional[str] = None


class ApprovalResponse(BaseModel):
    id: int
    finding_id: int
    status: str
    reason: Optional[str] = None
    created_at: datetime
    approved_at: Optional[datetime] = None

    class Config:
        from_attributes = True
