import logging
import os

# ======================================
# LOG FILE NAME
# ======================================

LOG_FILE = "server.log"

# ======================================
# LOG FORMAT
# ======================================

LOG_FORMAT = "%(asctime)s | %(levelname)s | %(message)s"

# ======================================
# CREATE LOG DIRECTORY (SAFE)
# ======================================

if not os.path.exists("logs"):
    os.makedirs("logs")

LOG_PATH = os.path.join("logs", LOG_FILE)

# ======================================
# LOGGER CONFIGURATION
# ======================================

logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    handlers=[logging.FileHandler(LOG_PATH), logging.StreamHandler()],
)

# ======================================
# GLOBAL LOGGER
# ======================================

logger = logging.getLogger("saas_logger")