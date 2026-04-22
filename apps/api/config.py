import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "CloudGuard API"
    APP_VERSION: str = "1.0.0"
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = ENV == "development"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/cloudguard"
    )
    
    # Security
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "your-secret-key-change-in-production"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://cloudguard.io",
    ]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list = ["*"]
    CORS_ALLOW_HEADERS: list = ["*"]
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Celery
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
    
    # AWS
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_DEFAULT_REGION: str = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    AWS_ACCOUNT_ID: Optional[str] = os.getenv("AWS_ACCOUNT_ID")
    
    # Azure
    AZURE_SUBSCRIPTION_ID: Optional[str] = os.getenv("AZURE_SUBSCRIPTION_ID")
    AZURE_TENANT_ID: Optional[str] = os.getenv("AZURE_TENANT_ID")
    AZURE_CLIENT_ID: Optional[str] = os.getenv("AZURE_CLIENT_ID")
    AZURE_CLIENT_SECRET: Optional[str] = os.getenv("AZURE_CLIENT_SECRET")
    
    # GCP
    GCP_PROJECT_ID: Optional[str] = os.getenv("GCP_PROJECT_ID")
    GCP_CREDENTIALS_JSON: Optional[str] = os.getenv("GCP_CREDENTIALS_JSON")
    
    # OAuth
    GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET")
    GITHUB_CLIENT_ID: Optional[str] = os.getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET: Optional[str] = os.getenv("GITHUB_CLIENT_SECRET")
    
    # GitHub Integration
    GITHUB_API_TOKEN: Optional[str] = os.getenv("GITHUB_API_TOKEN")
    GITHUB_WEBHOOK_SECRET: Optional[str] = os.getenv("GITHUB_WEBHOOK_SECRET")
    
    # GitLab Integration
    GITLAB_API_TOKEN: Optional[str] = os.getenv("GITLAB_API_TOKEN")
    GITLAB_WEBHOOK_SECRET: Optional[str] = os.getenv("GITLAB_WEBHOOK_SECRET")
    
    # Bitbucket Integration
    BITBUCKET_CLIENT_ID: Optional[str] = os.getenv("BITBUCKET_CLIENT_ID")
    BITBUCKET_CLIENT_SECRET: Optional[str] = os.getenv("BITBUCKET_CLIENT_SECRET")
    
    # Email
    SMTP_SERVER: Optional[str] = os.getenv("SMTP_SERVER")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "noreply@cloudguard.io")
    
    # Stripe (Billing)
    STRIPE_SECRET_KEY: Optional[str] = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY: Optional[str] = os.getenv("STRIPE_PUBLISHABLE_KEY")
    STRIPE_WEBHOOK_SECRET: Optional[str] = os.getenv("STRIPE_WEBHOOK_SECRET")
    
    # OPA Configuration
    OPA_ENABLED: bool = True
    OPA_BUNDLE_PATH: str = "/policies"
    
    # Monitoring
    SENTRY_DSN: Optional[str] = os.getenv("SENTRY_DSN")
    PROMETHEUS_ENABLED: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
