"""Application configuration loaded from environment variables."""
import os
from datetime import timedelta

from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(BASE_DIR, ".env"))


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _normalize_database_url(url: str) -> str:
    """Some hosts (Heroku-style providers) still hand out `postgres://` -
    SQLAlchemy 1.4+ only recognizes `postgresql://`/`postgresql+psycopg2://`
    and raises on the old scheme, so rewrite it here rather than requiring
    every deploy target to know about this quirk."""
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://"):]
    return url


class Config:
    """Base configuration shared by all environments."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me-in-production-32b")

    SQLALCHEMY_DATABASE_URI = _normalize_database_url(
        os.environ.get(
            "DATABASE_URL",
            "postgresql+psycopg2://postgres:postgres@localhost:5432/relationship_graph",
        )
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me-in-production-32b")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", 15))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.environ.get("JWT_REFRESH_TOKEN_EXPIRES_DAYS", 30))
    )
    JWT_TOKEN_LOCATION = ["headers"]

    # Credentials now live in the `users` table (see app/models/user.py and
    # migration 5490fe2cba1e). SUPER_ADMIN_USERNAME/SUPER_ADMIN_PASSWORD(_HASH)
    # are only read once, by that migration, to seed the first account.

    CORS_ORIGINS = _split_csv(os.environ.get("CORS_ORIGINS", "http://localhost:5173"))

    # Avatars are stored in the database, not on disk (see models/avatar.py).
    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH_MB", 5)) * 1024 * 1024
    ALLOWED_AVATAR_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}

    ITEMS_PER_PAGE = int(os.environ.get("ITEMS_PER_PAGE", 20))


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = _normalize_database_url(
        os.environ.get(
            "TEST_DATABASE_URL",
            "postgresql+psycopg2://postgres:postgres@localhost:5432/relationship_graph_test",
        )
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config(env_name: str | None = None) -> type[Config]:
    env_name = env_name or os.environ.get("FLASK_ENV", "development")
    return config_by_name.get(env_name, DevelopmentConfig)
