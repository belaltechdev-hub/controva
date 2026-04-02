import os
from datetime import datetime, timedelta

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
    deprecated="auto"
)


# =====================================
# PASSWORD HASHING FUNCTIONS
# =====================================

def hash_password(password: str) -> str:
    password = password[:72]   # bcrypt max limit fix
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    plain_password = plain_password[:72]   # same limit apply
    return pwd_context.verify(plain_password, hashed_password)


# =====================================
# CREATE JWT TOKEN
# =====================================

def create_access_token(data: dict) -> str:

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
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