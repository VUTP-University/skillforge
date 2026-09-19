from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

from .config import Config, ProductionConfig, validate_production_secrets

db      = SQLAlchemy()
migrate = Migrate()
jwt     = JWTManager()
limiter = Limiter(key_func=get_remote_address)


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    if config_class is ProductionConfig:
        validate_production_secrets(app)

    # Extensions
    CORS(app, supports_credentials=True, origins=app.config["FRONTEND_ORIGIN"])
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)

    if config_class is ProductionConfig and app.config["RATELIMIT_STORAGE_URI"] == "memory://":
        app.logger.warning(
            "RATELIMIT_STORAGE_URI is unset in production — rate limits (login, "
            "register, forgot-password) are tracked per-process only and will "
            "not hold under multiple workers/instances. Set it to a shared "
            "store such as redis://host:6379."
        )

    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        return jsonify({"error": "Too many requests. Please try again later."}), 429

    from .models import TokenBlocklist, User

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        if db.session.query(TokenBlocklist.id).filter_by(jti=jti).first() is not None:
            return True
        user = db.session.get(User, int(jwt_payload["sub"]))
        return bool(user and user.is_banned)

    # Blueprints
    from .routes.admin import admin_bp
    from .routes.auth import auth_bp
    from .routes.health import health_bp
    from .routes.jobs import jobs_bp
    from .routes.processes import stack_trace_bp
    from .routes.profile import profile_bp
    from .routes.reports import reports_bp
    from .routes.test_suite import test_suite_bp
    from .routes.users import users_bp

    app.register_blueprint(health_bp,      url_prefix="/api")
    app.register_blueprint(users_bp,       url_prefix="/api/users")
    app.register_blueprint(auth_bp,        url_prefix="/api/auth")
    app.register_blueprint(admin_bp,       url_prefix="/api/admin")
    app.register_blueprint(jobs_bp,        url_prefix="/api/jobs")
    app.register_blueprint(profile_bp,     url_prefix="/api")
    app.register_blueprint(stack_trace_bp, url_prefix="/api/stack-trace")
    app.register_blueprint(test_suite_bp,  url_prefix="/api/test-suite")
    app.register_blueprint(reports_bp,     url_prefix="/api/reports")

    # Achievement catalog — seeded once at startup (evaluation depends on it
    # already existing, unlike Process's lazy per-request seed). Guarded on
    # the table actually existing yet, since `flask db migrate`/`upgrade`
    # themselves boot the app via create_app() before that first migration
    # has run.
    with app.app_context():
        from sqlalchemy import inspect
        if inspect(db.engine).has_table("achievements"):
            from .achievements import _seed_achievements
            _seed_achievements()

    return app
