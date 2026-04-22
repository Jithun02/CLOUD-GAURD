from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Enum, Float, Index
from sqlalchemy.orm import relationship
from database import Base
import enum
from typing import Optional


class UserRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    SECURITY_ENGINEER = "security_engineer"
    DEVELOPER = "developer"
    AUDITOR = "auditor"
    READ_ONLY = "read_only"


class SeverityLevel(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class ScanStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class ResourceType(str, enum.Enum):
    AWS_S3 = "aws_s3"
    AWS_EC2 = "aws_ec2"
    AWS_RDS = "aws_rds"
    AWS_IAM = "aws_iam"
    AZURE_VM = "azure_vm"
    AZURE_SQL = "azure_sql"
    GCP_VM = "gcp_vm"
    GCP_STORAGE = "gcp_storage"
    KUBERNETES_POD = "kubernetes_pod"
    KUBERNETES_RBAC = "kubernetes_rbac"
    DOCKER_IMAGE = "docker_image"
    TERRAFORM = "terraform"


# ============================================================================
# MULTI-TENANT SAAS MODELS
# ============================================================================

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text)
    logo_url = Column(String(512))
    website = Column(String(512))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True, index=True)

    # Relationships
    teams = relationship("Team", back_populates="organization", cascade="all, delete-orphan")
    members = relationship("User", secondary="organization_members", back_populates="organizations")
    projects = relationship("Project", back_populates="organization", cascade="all, delete-orphan")
    billing = relationship("Billing", back_populates="organization", uselist=False)
    integrations = relationship("Integration", back_populates="organization", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    username = Column(String(255), nullable=False, unique=True)
    full_name = Column(String(255))
    hashed_password = Column(String(255))
    avatar_url = Column(String(512))
    is_active = Column(Boolean, default=True, index=True)
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)

    # OAuth
    google_id = Column(String(255), unique=True)
    github_id = Column(String(255), unique=True)

    # Relationships
    organizations = relationship("Organization", secondary="organization_members", back_populates="members")
    team_members = relationship("TeamMember", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="teams")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(Enum(UserRole), default=UserRole.DEVELOPER)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_members")


# ============================================================================
# PROJECT & REPOSITORY MODELS
# ============================================================================

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True, index=True)

    # Relationships
    organization = relationship("Organization", back_populates="projects")
    team = relationship("Team", back_populates="projects")
    repositories = relationship("Repository", back_populates="project", cascade="all, delete-orphan")


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    url = Column(String(512), nullable=False)
    provider = Column(String(50), nullable=False)  # github, gitlab, bitbucket, azure_devops
    external_id = Column(String(255), nullable=False)  # External provider's repo ID
    branch = Column(String(255), default="main")
    last_scan_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="repositories")
    scans = relationship("Scan", back_populates="repository", cascade="all, delete-orphan")


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    provider = Column(String(50), nullable=False)  # github, gitlab, aws, azure, gcp, etc
    name = Column(String(255), nullable=False)
    credentials = Column(JSON, nullable=False)  # Encrypted credentials
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relationships
    organization = relationship("Organization", back_populates="integrations")


# ============================================================================
# SCANNING & FINDINGS MODELS
# ============================================================================

class Scan(Base):
    __tablename__ = "scans"
    __table_args__ = (Index('idx_scan_repo_created', 'repository_id', 'created_at'),)

    id = Column(Integer, primary_key=True)
    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=False, index=True)
    scan_type = Column(String(50), nullable=False)  # iac, container, secrets, cloud, k8s
    status = Column(Enum(ScanStatus), default=ScanStatus.PENDING, index=True)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    duration = Column(Integer)  # in seconds
    total_resources = Column(Integer, default=0)
    findings_count = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    info_count = Column(Integer, default=0)
    risk_score = Column(Float, default=0.0)
    metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    repository = relationship("Repository", back_populates="scans")
    findings = relationship("Finding", back_populates="scan", cascade="all, delete-orphan")


class Finding(Base):
    __tablename__ = "findings"
    __table_args__ = (Index('idx_finding_scan_severity', 'scan_id', 'severity'),)

    id = Column(Integer, primary_key=True)
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=False, index=True)
    rule_id = Column(String(255), nullable=False)
    rule_name = Column(String(255), nullable=False)
    description = Column(Text)
    severity = Column(Enum(SeverityLevel), nullable=False, index=True)
    resource_type = Column(String(100))
    resource_id = Column(String(255))
    resource_details = Column(JSON)
    remediation = Column(Text)
    remediation_code = Column(Text)
    compliance_frameworks = Column(JSON)  # CIS, SOC2, etc
    is_resolved = Column(Boolean, default=False, index=True)
    resolved_at = Column(DateTime)
    false_positive = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scan = relationship("Scan", back_populates="findings")
    approvals = relationship("Approval", back_populates="finding")


# ============================================================================
# POLICY & COMPLIANCE MODELS
# ============================================================================

class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    policy_type = Column(String(50), nullable=False)  # rego, checkov, custom, etc
    content = Column(Text, nullable=False)  # Rego code or policy definition
    is_enabled = Column(Boolean, default=True, index=True)
    is_custom = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    versions = relationship("PolicyVersion", back_populates="policy", cascade="all, delete-orphan")


class PolicyVersion(Base):
    __tablename__ = "policy_versions"

    id = Column(Integer, primary_key=True)
    policy_id = Column(Integer, ForeignKey("policies.id"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    policy = relationship("Policy", back_populates="versions")


class ComplianceFramework(Base):
    __tablename__ = "compliance_frameworks"

    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    name = Column(String(100), nullable=False)  # CIS, SOC2, ISO27001, PCI-DSS, HIPAA, GDPR, NIST
    compliance_score = Column(Float, default=0.0)
    passed_checks = Column(Integer, default=0)
    failed_checks = Column(Integer, default=0)
    last_scan_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization")


# ============================================================================
# APPROVAL & AUDIT MODELS
# ============================================================================

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True)
    finding_id = Column(Integer, ForeignKey("findings.id"), nullable=False, index=True)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"))
    status = Column(String(20), default="pending")  # pending, approved, rejected
    reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime)

    # Relationships
    finding = relationship("Finding", back_populates="approvals")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (Index('idx_audit_user_created', 'user_id', 'created_at'),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    action = Column(String(255), nullable=False)
    resource_type = Column(String(100))
    resource_id = Column(Integer)
    details = Column(JSON)
    ip_address = Column(String(45))
    user_agent = Column(String(512))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")


# ============================================================================
# BILLING & SUBSCRIPTION MODELS
# ============================================================================

class Billing(Base):
    __tablename__ = "billing"

    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, unique=True)
    plan_name = Column(String(50), default="free")  # free, starter, pro, enterprise
    stripe_customer_id = Column(String(255))
    stripe_subscription_id = Column(String(255))
    billing_email = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="billing")


# ============================================================================
# REMEDIATION & RISK SCORING
# ============================================================================

class Remediation(Base):
    __tablename__ = "remediations"

    id = Column(Integer, primary_key=True)
    finding_id = Column(Integer, ForeignKey("findings.id"), nullable=False, index=True)
    status = Column(String(20), default="pending")  # pending, in_progress, completed, failed
    automated = Column(Boolean, default=False)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    finding = relationship("Finding")


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    overall_score = Column(Float, default=0.0)
    asset_score = Column(Float, default=0.0)
    vulnerability_score = Column(Float, default=0.0)
    access_score = Column(Float, default=0.0)
    compliance_score = Column(Float, default=0.0)
    calculated_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization")


# ============================================================================
# ORGANIZATION MEMBERS (Association Table)
# ============================================================================

from sqlalchemy import Table

organization_members = Table(
    'organization_members',
    Base.metadata,
    Column('organization_id', Integer, ForeignKey('organizations.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
)
