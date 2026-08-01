from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from .config import Config

db      = SQLAlchemy()
migrate = Migrate()
jwt     = JWTManager()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Extensions
    CORS(app, supports_credentials=True, origins=app.config["FRONTEND_ORIGIN"])
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Blueprints
    from .routes.health      import health_bp
    from .routes.users       import users_bp
    from .routes.auth        import auth_bp
    from .routes.admin       import admin_bp
    from .routes.jobs        import jobs_bp
    from .routes.profile     import profile_bp
    from .routes.processes   import stack_trace_bp
    from .routes.test_suite  import test_suite_bp
    from .routes.reports     import reports_bp

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
