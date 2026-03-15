import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("SQLALCHEMY_DATABASE_URI")
    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

    # JWT Cookie-based token storage (best security approach)
    JWT_TOKEN_LOCATION = ["cookies"]
    # Set True in production (requires HTTPS). Use JWT_COOKIE_SECURE=true env var.
    JWT_COOKIE_SECURE = os.getenv("JWT_COOKIE_SECURE", "False").lower() == "true"
    JWT_COOKIE_HTTPONLY = True  # JS cannot access the cookie (prevents XSS theft)
    JWT_COOKIE_SAMESITE = "Lax"  # Protects against CSRF on cross-site navigations
    JWT_COOKIE_CSRF_PROTECT = True  # Double-submit cookie CSRF protection
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
