import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY              = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
    SQLALCHEMY_DATABASE_URI = os.environ.get("SQLALCHEMY_DATABASE_URI")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT — HttpOnly cookie auth
    JWT_SECRET_KEY              = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    JWT_TOKEN_LOCATION          = ["cookies"]
    JWT_COOKIE_HTTPONLY         = True
    JWT_COOKIE_SAMESITE         = "Lax"
    JWT_COOKIE_SECURE           = os.environ.get("JWT_COOKIE_SECURE", "false").lower() == "true"
    JWT_ACCESS_TOKEN_EXPIRES    = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES   = timedelta(days=30)
    JWT_COOKIE_CSRF_PROTECT     = False  # enable in production with HTTPS

    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")

    # Piston code execution engine — https://github.com/engineer-man/piston
    PISTON_URL = os.environ.get("PISTON_URL", "http://localhost:2000")

    # OpenAI — used for Underworld boss challenge generation & evaluation
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG                  = False
    JWT_COOKIE_SECURE      = True
    JWT_COOKIE_CSRF_PROTECT = True
