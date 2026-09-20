import os
from datetime import timedelta
from typing import ClassVar

from dotenv import load_dotenv

load_dotenv()

_INSECURE_DEFAULT_SECRET = "dev-secret-change-in-production"


class Config:
    DEBUG                   = False
    SECRET_KEY              = os.environ.get("SECRET_KEY", _INSECURE_DEFAULT_SECRET)
    SQLALCHEMY_DATABASE_URI = os.environ.get("SQLALCHEMY_DATABASE_URI")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT — HttpOnly cookie auth
    JWT_SECRET_KEY              = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    JWT_TOKEN_LOCATION: ClassVar[list[str]] = ["cookies"]
    JWT_COOKIE_HTTPONLY         = True
    JWT_COOKIE_SAMESITE         = "Lax"
    JWT_COOKIE_SECURE           = os.environ.get("JWT_COOKIE_SECURE", "false").lower() == "true"
    JWT_ACCESS_TOKEN_EXPIRES    = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES   = timedelta(days=30)
    JWT_COOKIE_CSRF_PROTECT     = False  # enable in production with HTTPS

    # Scope each JWT cookie to only the paths that actually need it, instead
    # of the default "/" — the refresh token in particular has a 30-day
    # lifetime and only ever needs to reach /api/auth/refresh (to mint a new
    # access token) and /api/auth/logout (to be blocklisted); there's no
    # reason for it to ride along on every other request. Both are HttpOnly,
    # so JS never needs to read them directly — only the browser needs to
    # attach them, which it does based on the *request's* path, not the
    # page's.
    JWT_ACCESS_COOKIE_PATH       = "/api"
    JWT_REFRESH_COOKIE_PATH      = "/api/auth"

    # The CSRF companion cookies are different: the double-submit pattern
    # requires frontend JS (api.js's getCookie()) to read them and echo the
    # value back in an X-CSRF-TOKEN header. A cookie is only visible to
    # document.cookie on pages whose own URL falls under the cookie's Path —
    # and the SPA's pages live at "/", "/admin", etc., never under "/api".
    # Scoping these to "/api" the same way as the JWT cookies above silently
    # makes them unreadable from every page of the app, so every CSRF-
    # protected request fails with a missing/mismatched token. They must
    # stay at the default "/".
    JWT_ACCESS_CSRF_COOKIE_PATH  = "/"
    JWT_REFRESH_CSRF_COOKIE_PATH = "/"

    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")

    # Flask-Limiter storage — defaults to per-process memory, which silently
    # stops enforcing limits (like login/register/forgot-password brute-force
    # protection) as soon as the app runs with more than one worker/instance.
    # Point this at a shared store (e.g. redis://host:6379) in any multi-process
    # deployment.
    RATELIMIT_STORAGE_URI = os.environ.get("RATELIMIT_STORAGE_URI", "memory://")

    # Piston code execution engine — https://github.com/engineer-man/piston
    PISTON_URL = os.environ.get("PISTON_URL", "http://localhost:2000")

    # OpenAI — used for Stack Trace process challenge generation & evaluation
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

    # Mail (SMTP via Namecheap Private Email) — welcome email on registration
    MAIL_SERVER    = os.environ.get("MAIL_SERVER", "mail.privateemail.com")
    MAIL_PORT      = int(os.environ.get("MAIL_PORT", "587"))
    MAIL_USERNAME  = os.environ.get("MAIL_USERNAME", "")
    MAIL_PASSWORD  = os.environ.get("MAIL_PASSWORD", "")
    MAIL_FROM      = os.environ.get("MAIL_FROM", MAIL_USERNAME)
    MAIL_FROM_NAME = os.environ.get("MAIL_FROM_NAME", "SkillForge")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG                   = False
    JWT_COOKIE_SECURE       = True
    JWT_COOKIE_CSRF_PROTECT = True


def get_config():
    """Select the config class from APP_ENV (development|production, default development)."""
    env = os.environ.get("APP_ENV", "development").strip().lower()
    return ProductionConfig if env == "production" else DevelopmentConfig


def validate_production_secrets(app):
    """Refuse to boot under ProductionConfig with unset/checked-in-default secrets."""
    insecure = [
        name for name in ("SECRET_KEY", "JWT_SECRET_KEY")
        if not app.config.get(name) or app.config[name] == _INSECURE_DEFAULT_SECRET
    ]
    if insecure:
        raise RuntimeError(
            "Refusing to start with APP_ENV=production: "
            f"{', '.join(insecure)} must be set via environment variables to a "
            "non-default value."
        )
