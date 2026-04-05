from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from database import Base


def _utc_now():
    """Timezone-aware UTC timestamp factory for column defaults."""
    return datetime.now(timezone.utc)


# ====================================
# USERS TABLE
# ====================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)

    password_hash = Column(String, nullable=False)

    role = Column(String, nullable=False)  # owner OR client

    created_at = Column(DateTime, default=_utc_now)

    # OWNER -> CLIENT RELATION
    clients = relationship("Client", back_populates="owner", cascade="all, delete-orphan")


# ====================================
# CLIENTS TABLE
# ====================================

class Client(Base):
    __tablename__ = "clients"

    # UNIQUE RANDOM CLIENT ID
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # LINK TO OWNER
    owner_id = Column(Integer, ForeignKey("users.id"))

    company_name = Column(String, nullable=False)

    email = Column(String, unique=True, index=True)
    phone = Column(String)

    # CLIENT LOGIN PASSWORD
    password_hash = Column(String)

    usage_limit = Column(Integer)
    validity_days = Column(Integer)

    created_at = Column(DateTime, default=_utc_now)

    # RELATIONSHIPS
    owner = relationship("User", back_populates="clients")
    usage = relationship("Usage", back_populates="client", uselist=False, cascade="all, delete-orphan")


# ====================================
# USAGE TABLE
# ====================================

class Usage(Base):
    __tablename__ = "usage"

    id = Column(Integer, primary_key=True, index=True)

    client_id = Column(String, ForeignKey("clients.id"), index=True)

    count = Column(Integer, default=0)

    start_date = Column(DateTime, default=_utc_now)

    # CLIENT RELATION
    client = relationship("Client", back_populates="usage")