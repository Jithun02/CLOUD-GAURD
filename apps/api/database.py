from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from sqlalchemy.pool import NullPool
from config import get_settings
from typing import Generator

settings = get_settings()

# Create engine with connection pooling
engine: Engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    poolclass=NullPool if settings.ENV == "testing" else None,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for getting database session in FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database by creating all tables."""
    Base.metadata.create_all(bind=engine)


def drop_db() -> None:
    """Drop all tables from database (for testing/cleanup)."""
    Base.metadata.drop_all(bind=engine)
