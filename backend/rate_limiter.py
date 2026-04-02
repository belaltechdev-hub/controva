import time
import asyncio
from redis_client import redis_client

# ======================================
# LIMIT CONFIG
# ======================================

GLOBAL_LIMIT = 500
CLIENT_LIMIT = 50
WINDOW_SIZE = 1


# ======================================
# GLOBAL LIMITER
# ======================================

def global_limiter():

    key = "global_rate_limit"

    current_second = int(time.time())
    redis_key = f"{key}:{current_second}"

    count = redis_client.incr(redis_key)

    if count == 1:
        redis_client.expire(redis_key, WINDOW_SIZE)

    if count > GLOBAL_LIMIT:
        return False

    return True


# ======================================
# CLIENT LIMITER
# ======================================

def client_limiter(client_id: str):

    key = f"client_rate:{client_id}"

    current_second = int(time.time())
    redis_key = f"{key}:{current_second}"

    count = redis_client.incr(redis_key)

    if count == 1:
        redis_client.expire(redis_key, WINDOW_SIZE)

    if count > CLIENT_LIMIT:
        return False

    return True


# ======================================
# FINAL LIMITER
# ======================================

async def wait_for_slot(client_id: str):

    global_ok = global_limiter()
    client_ok = client_limiter(client_id)

    if not (global_ok and client_ok):
        return False

    return True