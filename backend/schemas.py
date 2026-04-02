from pydantic import BaseModel, EmailStr
from typing import List, Optional

class ClientListResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: List[ClientResponse]


# =====================================
# USER SIGNUP
# =====================================

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    confirm_password: str


# =====================================
# USER LOGIN
# =====================================

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# =====================================
# CLIENT LOGIN
# =====================================

class ClientLogin(BaseModel):
    email: EmailStr
    password: str

# =====================================
# TOKEN RESPONSE
# =====================================

class TokenResponse(BaseModel):
    access_token: str
    token_type: str


# =====================================
# CLIENT CREATE
# =====================================

class ClientCreate(BaseModel):
    company_name: str
    email: EmailStr
    phone: str
    password: str
    usage_limit: int
    validity_days: int


# =====================================
# CLIENT UPDATE
# =====================================

class ClientUpdate(BaseModel):
    company_name: str
    email: EmailStr
    phone: str
    usage_limit: int
    validity_days: int


# =====================================
# CLIENT RESPONSE
# =====================================

class ClientResponse(BaseModel):
    id: str
    company_name: str
    email: str
    phone: str
    usage_limit: int
    validity_days: int

    # 🔥 ADD THESE (important)
    used: int
    remaining_usage: int
    usage_percent: float
    expire_in: int
    expire_unit: str

    class Config:
        from_attributes = True