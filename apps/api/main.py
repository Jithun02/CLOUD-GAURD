from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from config import get_settings
from database import init_db
from api.routes import auth, organizations, projects, scans, findings, policies, dashboard

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    init_db()
    print("✅ Database initialized")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down application")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise Cloud Security Governance Platform",
    lifespan=lifespan,
)

# ============================================================================
# MIDDLEWARE
# ============================================================================

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Trusted Host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.cloudguard.io", "cloudguard.io"],
)


# ============================================================================
# EXCEPTION HANDLERS
# ============================================================================

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc) if settings.DEBUG else None},
    )


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "environment": settings.ENV,
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "Enterprise Cloud Security Governance Platform",
        "docs": "/docs",
    }


# ============================================================================
# ROUTE REGISTRATION
# ============================================================================

# Auth routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])

# Organization routes
app.include_router(organizations.router, prefix="/api/v1/organizations", tags=["Organizations"])

# Project routes
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])

# Scan routes
app.include_router(scans.router, prefix="/api/v1/scans", tags=["Scans"])

# Finding routes
app.include_router(findings.router, prefix="/api/v1/findings", tags=["Findings"])

# Policy routes
app.include_router(policies.router, prefix="/api/v1/policies", tags=["Policies"])

# Dashboard routes
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])


# ============================================================================
# STARTUP
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )
