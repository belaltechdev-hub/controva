import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


# =====================================
# LOAD ENV VARIABLES
# =====================================

load_dotenv()


# =====================================
# READ DATABASE URL FROM ENV
# =====================================

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in environment variables")


# =====================================
# CREATE DATABASE ENGINE
# =====================================

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)


# =====================================
# SESSION FACTORY
# =====================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# =====================================
# BASE MODEL
# =====================================

Base = declarative_base()


# =====================================
# DATABASE DEPENDENCY
# =====================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()