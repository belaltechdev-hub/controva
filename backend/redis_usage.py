from redis_client import redis_client

# ======================================
# REDIS USAGE KEY
# ======================================

def usage_key(client_id: str):
    return f"usage_counter:{client_id}"


# ======================================
# GET USAGE FROM REDIS
# ======================================

def get_usage(client_id: str):
    key = usage_key(client_id)
    value = redis_client.get(key)

    if value is None:
        return None

    return int(value)


# ======================================
# SET USAGE IN REDIS
# ======================================

def set_usage(client_id: str, count: int):
    key = usage_key(client_id)
    redis_client.set(key, count)


# ======================================
# INCREMENT USAGE
# ======================================

def increment_usage(client_id: str):
    key = usage_key(client_id)
    return redis_client.incr(key)