from datetime import datetime, timezone
from pathlib import Path
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker

# Database file location
BASE_DIR = Path(__file__).resolve().parent.parent
DB_FILE = BASE_DIR / "backend" / "rakshasakhi.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_FILE.as_posix()}"

# Create SQLite engine with thread-check disabled for FastAPI concurrency
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    telegram_chat_id = Column(String(50), nullable=True)
    relationship = Column(String(50), default="Friend/Family", nullable=True)
    is_primary = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )


def init_db():
    """Create all tables in the database if they don't already exist."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency for yielding request-scoped SQLAlchemy sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
