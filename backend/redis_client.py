import os
import redis
from dotenv import load_dotenv

# =====================================
# LOAD ENV VARIABLES
# =====================================

load_dotenv()

# =====================================
# READ REDIS URL FROM ENV
# =====================================

REDIS_URL = os.getenv("REDIS_URL")

if not REDIS_URL:
    raise ValueError("REDIS_URL is not set in environment variables")


# =====================================
# CREATE REDIS CLIENT
# =====================================

redis_client = redis.Redis.from_url(
    REDIS_URL,
    decode_responses=True
)


# =====================================
# TEST CONNECTION
# =====================================

try:
    redis_client.ping()
    print("Redis connected successfully")
except redis.exceptions.ConnectionError as e:
    print(f"WARNING: Redis connection failed on import: {e}")
    print("Redis features will fail until connection is restored.")

