import os
from datetime import datetime, timedelta, timezone

# Fix passlib + bcrypt 4.x compatibility
# passlib 1.7.4 expects bcrypt.__about__.__version__ which was removed in bcrypt 4.x
import bcrypt as _bcrypt
if not hasattr(_bcrypt, '__about__'):
    class _About:
        __version__ = _bcrypt.__version__
    _bcrypt.__about__ = _About

from passlib.context import CryptContext
from jose import JWTError, jwt


# =====================================
# READ SECRET KEY FROM ENV
# =====================================

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise ValueError("SECRET_KEY is not set in environment variables")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


# =====================================
# PASSWORD HASHING CONFIG
# =====================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
)


# =====================================
# PASSWORD HASHING FUNCTIONS
# =====================================

def _truncate_password(password: str) -> bytes:
    """Truncate password to 72 bytes (bcrypt limit) safely."""
    return password.encode("utf-8")[:72]

def hash_password(password: str) -> str:
    pwd_bytes = _truncate_password(password)
    salt = _bcrypt.gensalt()
    hashed = _bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = _truncate_password(plain_password)
    hashed_bytes = hashed_password.encode("utf-8")
    return _bcrypt.checkpw(pwd_bytes, hashed_bytes)


# =====================================
# CREATE JWT TOKEN
# =====================================

def create_access_token(data: dict) -> str:

    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


# =====================================
# VERIFY JWT TOKEN
# =====================================

def verify_token(token: str):

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except JWTError:
        return None