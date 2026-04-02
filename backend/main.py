"""
Lion SaaS Usage Monitor API
Professional FastAPI implementation
"""

from dotenv import load_dotenv
load_dotenv()

import os

IS_PROD = os.getenv("ENV") == "production"

from fastapi import FastAPI, Response, HTTPException, Depends, Request

def success_response(data=None, message=""):
    return {
        "success": True,
        "data": data,
        "message": message
    }
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from models import User, Client, Usage

from schemas import (
    UserSignup,
    UserLogin,
    ClientLogin,
    TokenResponse,
    ClientCreate,
    ClientUpdate,
    ClientResponse,
    ClientListResponse,
)

from fastapi.responses import JSONResponse
from auth import hash_password, verify_password, create_access_token
from dependencies import require_owner, get_current_client
from rate_limiter import wait_for_slot
from redis_usage import get_usage, set_usage, increment_usage
from redis_client import redis_client
from logger_config import logger
from fastapi.middleware.cors import CORSMiddleware
import math


#=================#
#=== APP NAME ====#
#=================#

APP_NAME = "Lion API"
APP_VERSION = "2.0.0"

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Usage limit and expiry management system",
)

#==========================================#
#==== HTTPExceptionERROR HANDLE ===========#
#==========================================#

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail
        },
    )
#====================================#
# Global Exception handler (baad me) #
#====================================#

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"ERROR: {str(exc)}")

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal Server Error"
        },
    )
# ===================================#
# ======== LOGOUT ENDPOINT ========= #
# ===================================#

@app.post("/logout")
def logout(response: Response):

    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=IS_PROD,
        samesite="none" if IS_PROD else "lax",
        path="/"
    )

    return success_response(message="Logged out successfully")

# =============================== #
# ======== FASTAPI INIT ========= #
# =============================== #

# CORS middleware
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

#================================#
#======= OWNER SIGNUP ===========#
#================================#

@app.post("/signup", response_model=TokenResponse)
async def signup(user: UserSignup, db: Session = Depends(get_db)):

    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        name=user.name,
        email=user.email,
        phone=user.phone,
        password_hash=hash_password(user.password),
        role="owner",
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({
         "user_id": new_user.id,
         "role": "owner"
})

    return {"access_token": token, "token_type": "bearer"}

#================================#
#=========== LOGIN ==============#
#================================#


@app.post("/login", response_model=TokenResponse)
async def login(user: UserLogin, response: Response, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # ✅ Improved token payload (production-ready)
    token = create_access_token({
         "user_id": db_user.id,
         "role": "owner"
})

    # ✅ Dynamic cookie config (local + production safe)
    response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,
    secure=IS_PROD,  # 🔥 auto switch
    samesite="none" if IS_PROD else "lax",  # 🔥 auto switch
    max_age=86400,
    path="/"
)

    return {
        "access_token": token,
        "token_type": "bearer"
    }

#================================
#=  OWNER ONLY / CLIENT ONLY ===#
#================================


@app.get("/owner-only")
def owner_route(user=Depends(require_owner)):
    return {"message": "Owner Access Granted", "email": user.email}


@app.get("/client-only")
def client_route(client=Depends(get_current_client)):
    return {"message": "Client Access Granted", "email": client.email}


# =======================================#
#============ CLIENT LOGIN ==============#
# =======================================#

@app.post("/client/login", response_model=TokenResponse)
async def client_login(client: ClientLogin, response: Response, db: Session = Depends(get_db)):

    db_client = db.query(Client).filter(Client.email == client.email).first()

    if not db_client:
        raise HTTPException(status_code=400, detail="Client not found")

    if not verify_password(client.password, db_client.password_hash):
        raise HTTPException(status_code=400, detail="Invalid password")

    # ✅ Token payload (correct & scalable)
    token = create_access_token({
        "client_id": db_client.id,
        "role": "client"
    })

    # ✅ FIXED COOKIE CONFIG (LOCAL WORKING)
    response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,
    secure=IS_PROD,
    samesite="none" if IS_PROD else "lax",
    max_age=86400,
    path="/"
)

    return {
        "access_token": token,
        "token_type": "bearer"
    }

# ======================================#
#========= CLIENT DASHBOARD ============#
# ======================================#


@app.get("/client/dashboard")
async def client_dashboard(
    db: Session = Depends(get_db),
    client=Depends(get_current_client)
):

    # =========================
    # GET USAGE (DB fallback)
    # =========================
    usage = db.query(Usage).filter(Usage.client_id == client.id).first()

    # =========================
    # REAL-TIME USAGE (REDIS)
    # =========================
    current_usage = get_usage(client.id)

    if current_usage is None:
        current_usage = usage.count if usage else 0

    # =========================
    # SAFE LIMIT CALCULATION
    # =========================
    used = current_usage
    remaining = max(client.usage_limit - used, 0)

    if client.usage_limit == 0:
        usage_percent = 0
    else:
        usage_percent = min((used / client.usage_limit) * 100, 100)

    usage_percent = round(usage_percent, 2)

    # =========================
    # EXPIRY CALCULATION
    # =========================
    if usage:
       expiry_date = usage.start_date + timedelta(days=client.validity_days)
    else:
       expiry_date = datetime.utcnow() + timedelta(days=client.validity_days)

# 🔥 ये दोनों cases के बाद होना चाहिए
    remaining_time = expiry_date - datetime.utcnow()
    total_seconds = remaining_time.total_seconds()

    if total_seconds <= 0:
       expire_in = 0
       expire_unit = "expired"

    elif total_seconds < 86400:
      expire_in = int(total_seconds // 3600)
      expire_unit = "hours"

    else:
      expire_in = int(total_seconds // 86400)
      expire_unit = "days"
    # =========================
    # FINAL RESPONSE
    # =========================
    return success_response(data={
        "company": client.company_name,
        "total_limit": client.usage_limit,
        "used": used,
        "remaining": remaining,
        "usage_percent": usage_percent,
        "total_validity": client.validity_days,
        "expire_in": expire_in,
        "expire_unit": expire_unit,
        "expiry_date": expiry_date.isoformat(),
    })


# ======================================#
#===== REST CLIENT CHECK USAGE =========#
# ======================================#


@app.get("/api/check/{client_id}")
async def api_check_usage(client_id: str, request: Request, db: Session = Depends(get_db)):

    # ======================================
    # ========== RATE LIMITER ===============
    # ======================================
    allowed_slot = await wait_for_slot(client_id)

    if not allowed_slot:
        return {
            "allowed": False,
            "reason": "rate limit exceeded"
        }

    logger.info(f"Request received from client {client_id}")

    # ======================================
    # ========== GET CLIENT =================
    # ======================================
    client = db.query(Client).filter(Client.id == client_id).first()

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # ======================================
    # ======== GET USAGE RECORD =============
    # ======================================
    usage = db.query(Usage).filter(Usage.client_id == client.id).first()

    if not usage:
        raise HTTPException(status_code=404, detail="Usage not found")

    # ======================================
    # ======= REDIS USAGE COUNTER ==========
    # ======================================
    try:
        current_usage = get_usage(client_id)

        if current_usage is None:
            current_usage = usage.count
            set_usage(client_id, current_usage)

    except Exception as e:
        logger.error(f"Redis error: {str(e)}")
        return {
            "allowed": False,
            "reason": "system error"
        }

    # ======================================
    # 🔥 ELIGIBILITY CHECK (NO CHARGE)
    # ======================================

    expiry_date = usage.start_date + timedelta(days=client.validity_days)

    # ❌ PLAN EXPIRED
    if datetime.utcnow() > expiry_date:
        return {
            "allowed": False,
            "reason": "plan expired"
        }

    # ❌ NO LIMIT CONFIGURED
    if client.usage_limit == 0:
        return {
            "allowed": False,
            "reason": "no usage limit configured"
        }

    # ❌ LIMIT REACHED
    if current_usage >= client.usage_limit:
        logger.warning(f"Client {client_id} usage limit reached")
        return {
            "allowed": False,
            "reason": "limit reached"
        }

    # ======================================
    # 🔥 CHARGE POINT (ALWAYS CHARGE IF VALID)
    # ======================================
    try:
      current_usage = increment_usage(client_id)
    except Exception as e:
      logger.error(f"Increment error: {str(e)}")

    # 🔥 fallback to DB increment
    usage.count += 1
    db.commit()
    current_usage = usage.count

    # ======================================
    # ======== REMAINING ===================
    # ======================================
    remaining = max(client.usage_limit - current_usage, 0)

    # ======================================
    # ======== DB SYNC =====================
    # ======================================
    if current_usage % 10 == 0:
        usage.count = current_usage
        db.commit()

    # ======================================
    # ============ RESPONSE ================
    # ======================================
    logger.info(
        f"Client {client_id} allowed | usage={current_usage}/{client.usage_limit}"
    )

    return success_response(
        data={
            "allowed": True,
            "used": current_usage,
            "limit": client.usage_limit,
            "remaining": remaining,
        }
    )

# ======================================#
# ========= REST API DATA ==============#
# ======================================#


@app.get("/api/data/{client_id}")
async def api_data(client_id: str, db: Session = Depends(get_db)):

    # =========================
    # GET CLIENT
    # =========================
    client = db.query(Client).filter(Client.id == client_id).first()

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # =========================
    # GET USAGE (DB fallback)
    # =========================
    usage = db.query(Usage).filter(Usage.client_id == client.id).first()

    # =========================
    # REDIS USAGE (REAL SOURCE)
    # =========================
    try:
       current_usage = get_usage(client_id)

       if current_usage is None:
             current_usage = usage.count if usage else 0
  
    except Exception as e:
      logger.error(f"Redis error: {str(e)}")
      current_usage = usage.count if usage else 0

    # =========================
    # SAFE LIMIT CALCULATION
    # =========================
    if client.usage_limit == 0:
        percent = 0
    else:
        percent = (current_usage / client.usage_limit) * 100

    percent = round(percent, 2)

    # =========================
    # SAFE EXPIRY CALCULATION
    # =========================
    if usage:
        expiry_date = usage.start_date + timedelta(days=client.validity_days)
    else:
        expiry_date = datetime.utcnow() + timedelta(days=client.validity_days)

    remaining_time = expiry_date - datetime.utcnow()

    if remaining_time.total_seconds() <= 0:
        expire_in = 0
        expire_unit = "expired"

    elif remaining_time.total_seconds() < 86400:
        expire_in = int(remaining_time.total_seconds() // 3600)
        expire_unit = "hours"

    else:
        expire_in = int(remaining_time.total_seconds() // 86400)
        expire_unit = "days"

    # =========================
    # FINAL RESPONSE
    # =========================
    return success_response(data={
        "client": client.company_name,
        "used": current_usage,
        "limit": client.usage_limit,
        "remaining": max(client.usage_limit - current_usage, 0),  # 🔥 SAFE
        "percent": percent,
        "total_validity": client.validity_days,
        "expire_in": expire_in,
        "expire_unit": expire_unit,
    })

# ======================================#
# ====== REST API RESET ================#
# ======================================#


@app.post("/api/reset/{client_id}")
async def api_reset(
    client_id: str, db: Session = Depends(get_db), owner=Depends(require_owner)
):

    usage = (
        db.query(Usage)
        .join(Client)
        .filter(Client.id == client_id, Client.owner_id == owner.id)
        .first()
    )

    if not usage:
        raise HTTPException(status_code=404, detail="Usage not found")

    usage.count = 0
    usage.start_date = datetime.utcnow()

    db.commit()

    #------->RESET REDIS COUNTER<-------#
    redis_client.delete(f"usage_counter:{client_id}")

    return {"success": True, "message": "Client usage reset"}


# ======================================#
# ======== OWNER CREATE CLIENT =========#
# ======================================#


@app.post("/owner/create-client")
async def create_client(
    client: ClientCreate, db: Session = Depends(get_db), owner=Depends(require_owner)
):

# ===============================================#
# == CHECK DUPLICATE CLIENT EMAIL (PER OWNER) ===#
# ===============================================#

    existing_client = (
        db.query(Client)
        .filter(Client.email == client.email, Client.owner_id == owner.id)
        .first()
    )

    if existing_client:
        raise HTTPException(
            status_code=400,
            detail="Client with this email already exists for this owner",
        )

    # ===============================
    # CREATE CLIENT
    # ===============================

    new_client = Client(
        owner_id=owner.id,
        company_name=client.company_name,
        email=client.email,
        phone=client.phone,
        password_hash=hash_password(client.password),
        usage_limit=client.usage_limit,
        validity_days=client.validity_days,
    )

    db.add(new_client)
    db.commit()
    db.refresh(new_client)

    # ===============================
    # CREATE USAGE RECORD
    # ===============================

    usage = Usage(client_id=new_client.id)

    db.add(usage)
    db.commit()

    return success_response(
    data={"client_id": new_client.id},
    message="Client created successfully"
)


# ======================================
# GET ALL CLIENTS
# ======================================


@app.get("/owner/clients", response_model=ClientListResponse)
async def get_clients(db: Session = Depends(get_db), owner=Depends(require_owner)):

    # =========================
    # GET CLIENTS
    # =========================
    clients = db.query(Client).filter(Client.owner_id == owner.id).all()

    result = []

    for client in clients:

        # =========================
        # GET USAGE (DB fallback)
        # =========================
        usage = db.query(Usage).filter(Usage.client_id == client.id).first()

        # =========================
        # REDIS USAGE (REAL SOURCE)
        # =========================
        current_usage = get_usage(client.id)

        if current_usage is None:
            current_usage = usage.count if usage else 0

        used = current_usage

        # =========================
        # SAFE REMAINING
        # =========================
        remaining = max(client.usage_limit - used, 0)

        # =========================
        # SAFE PERCENT
        # =========================
        if client.usage_limit == 0:
         percent = 0
        else:
         percent = min((used / client.usage_limit) * 100, 100)

         percent = round(percent, 2)

        # =========================
        # EXPIRY DATE (MUST HAVE)
        # =========================
        if usage:
                expiry_date = usage.start_date + timedelta(days=client.validity_days)
        else:
          expiry_date = datetime.utcnow() + timedelta(days=client.validity_days)

        # =========================
        # SAFE EXPIRY
        # =========================
        remaining_time = expiry_date - datetime.utcnow()
        total_seconds = remaining_time.total_seconds()

        if total_seconds <= 0:
         expire_in = 0
         expire_unit = "expired"

        elif total_seconds < 3600:
         expire_in = int(total_seconds // 60)
         expire_unit = "minutes"

        elif total_seconds < 86400:
         expire_in = max(int(total_seconds // 3600), 1)
         expire_unit = "hours"

        else:
         expire_in = int(total_seconds // 86400)
         expire_unit = "days"

        # =========================
        # FINAL OBJECT
        # =========================
        result.append({
            "id": client.id,
            "company_name": client.company_name,
            "email": client.email,
            "phone": client.phone,
            "usage_limit": client.usage_limit,
            "validity_days": client.validity_days,

            # 🔥 IMPORTANT FIELDS
            "used": used,
            "remaining_usage": remaining,
            "usage_percent": percent,
            "expire_in": expire_in,
            "expire_unit": expire_unit,
        })

    # =========================
    # FINAL RESPONSE
    # =========================
    return {
        "success": True,
        "message": "Clients fetched successfully",
        "data": result
    }

# ======================================
# EDIT CLIENT
# ======================================


@app.put("/owner/edit-client/{client_id}")
async def edit_client(
    client_id: str,
    updated: ClientUpdate,
    db: Session = Depends(get_db),
    owner=Depends(require_owner),
):

    client = (
        db.query(Client)
        .filter(Client.id == client_id, Client.owner_id == owner.id)
        .first()
    )

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    client.company_name = updated.company_name
    client.email = updated.email
    client.phone = updated.phone
    client.usage_limit = updated.usage_limit
    client.validity_days = updated.validity_days

    db.commit()

    return {"success": True, "message": "Client updated successfully"}


# ======================================
# DELETE CLIENT
# ======================================


@app.delete("/owner/delete-client/{client_id}")
async def delete_client(
    client_id: str, db: Session = Depends(get_db), owner=Depends(require_owner)
):

    client = (
        db.query(Client)
        .filter(Client.id == client_id, Client.owner_id == owner.id)
        .first()
    )

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    db.delete(client)
    db.commit()

    return {"success": True, "message": "Client deleted successfully"}


# ======================================
# RESET CLIENT USAGE
# ======================================


@app.post("/owner/reset-usage/{client_id}")
async def reset_usage(
    client_id: str, db: Session = Depends(get_db), owner=Depends(require_owner)
):

    usage = (
        db.query(Usage)
        .join(Client)
        .filter(Client.id == client_id, Client.owner_id == owner.id)
        .first()
    )

    if not usage:
        raise HTTPException(status_code=404, detail="Usage not found")

    usage.count = 0
    usage.start_date = datetime.utcnow()

    db.commit()

    #----------< RESET REDIS COUNTER >------------------------#
    redis_client.delete(f"usage_counter:{client_id}")

    return {"success": True, "message": "Usage reset"}


# =========================================================
# STARTUP EVENT
# =========================================================


@app.on_event("startup")
def startup_event():
    try:
        redis_client.ping()
        print("Redis connection verified on startup")
    except Exception as e:
        print("❌ Redis not connected:", str(e))
        # 🚫 DO NOT crash the app
