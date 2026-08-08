"""Flask extension instances, created here to avoid circular imports."""
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()

# Counters live in this process's memory, which is only correct while the app
# runs as a single worker - see the --workers flag in render.yaml, kept at 1
# for the same reason the JWT revocation list needs it (auth_service.py).
limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")
