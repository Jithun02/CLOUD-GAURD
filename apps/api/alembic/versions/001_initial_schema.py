"""Initial database schema creation.

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create all tables for the initial schema."""
    
    # Create organizations table
    op.create_table(
        'organizations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False, unique=True),
        sa.Column('slug', sa.String(255), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('logo_url', sa.String(512), nullable=True),
        sa.Column('website', sa.String(512), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_organizations_slug', 'slug'),
        sa.Index('ix_organizations_created_at', 'created_at'),
        sa.Index('ix_organizations_is_active', 'is_active'),
    )
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('username', sa.String(255), nullable=False, unique=True),
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column('hashed_password', sa.String(255), nullable=True),
        sa.Column('avatar_url', sa.String(512), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('email_verified', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.Column('google_id', sa.String(255), nullable=True, unique=True),
        sa.Column('github_id', sa.String(255), nullable=True, unique=True),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_users_email', 'email'),
        sa.Index('ix_users_is_active', 'is_active'),
        sa.Index('ix_users_created_at', 'created_at'),
    )
    
    # Create organization_members association table
    op.create_table(
        'organization_members',
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('organization_id', 'user_id'),
    )
    
    # Create teams table
    op.create_table(
        'teams',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_teams_organization_id', 'organization_id'),
    )
    
    # Create team_members table
    op.create_table(
        'team_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('team_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', postgresql.ENUM('owner', 'admin', 'security_engineer', 'developer', 'auditor', 'read_only', name='userrole'), nullable=False, server_default='developer'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_team_members_team_id', 'team_id'),
        sa.Index('ix_team_members_user_id', 'user_id'),
    )
    
    # Create projects table
    op.create_table(
        'projects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('team_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_projects_organization_id', 'organization_id'),
        sa.Index('ix_projects_created_at', 'created_at'),
        sa.Index('ix_projects_is_active', 'is_active'),
    )
    
    # Continue with more tables...
    # (Scan, Finding, Policy, etc.)


def downgrade() -> None:
    """Drop all tables."""
    
    op.drop_table('organization_members')
    op.drop_table('team_members')
    op.drop_table('teams')
    op.drop_table('projects')
    op.drop_table('users')
    op.drop_table('organizations')
