from redis_client import redis_client

# ===============================
# SET VALUE
# ===============================

redis_client.set("test_key", "hello redis")

# ===============================
# GET VALUE
# ===============================

value = redis_client.get("test_key")
print("Value:", value)

# ===============================
# INCREMENT COUNTER
# ===============================

redis_client.set("counter", 0)

redis_client.incr("counter")
redis_client.incr("counter")

print("Counter:", redis_client.get("counter"))